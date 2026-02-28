from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import GameSession, HandResult
from .serializers import (
    GameSessionSerializer,
    GameSessionCreateSerializer,
    HandResultSerializer,
    LeaderboardEntrySerializer,
)


class SessionCreateView(generics.CreateAPIView):
    serializer_class = GameSessionCreateSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SessionUpdateView(generics.UpdateAPIView):
    serializer_class = GameSessionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return GameSession.objects.filter(user=self.request.user)


class HandCreateView(generics.CreateAPIView):
    serializer_class = HandResultSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        session = GameSession.objects.get(
            pk=self.kwargs['session_id'], user=self.request.user
        )
        serializer.save(session=session)
        session.hands_played = session.hands.count()
        session.save(update_fields=['hands_played'])


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_stats(request):
    sessions = GameSession.objects.filter(user=request.user, is_complete=True)
    hands = HandResult.objects.filter(session__user=request.user)

    total_hands = hands.count()
    wins = hands.filter(outcome__in=['win', 'blackjack']).count()
    losses = hands.filter(outcome='loss').count()
    pushes = hands.filter(outcome='push').count()
    blackjacks = hands.filter(outcome='blackjack').count()
    total_profit = sessions.aggregate(
        total=Sum(F('final_balance') - F('starting_balance'))
    )['total'] or 0

    return Response({
        'total_hands': total_hands,
        'wins': wins,
        'losses': losses,
        'pushes': pushes,
        'blackjacks': blackjacks,
        'win_rate': round(wins / total_hands * 100, 1) if total_hands else 0,
        'total_profit': total_profit,
        'sessions_played': sessions.count(),
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def leaderboard(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    users = (
        User.objects
        .filter(game_sessions__is_complete=True)
        .annotate(
            total_profit=Sum(F('game_sessions__final_balance') - F('game_sessions__starting_balance')),
            total_hands=Sum('game_sessions__hands_played'),
            sessions_played=Count('game_sessions', filter=Q(game_sessions__is_complete=True)),
        )
        .order_by('-total_profit')[:50]
    )

    data = []
    for u in users:
        wins = HandResult.objects.filter(
            session__user=u, outcome__in=['win', 'blackjack']
        ).count()
        total = HandResult.objects.filter(session__user=u).count()
        data.append({
            'username': u.username,
            'display_name': u.display_name or u.username,
            'total_profit': u.total_profit or 0,
            'total_hands': u.total_hands or 0,
            'sessions_played': u.sessions_played or 0,
            'win_rate': round(wins / total * 100, 1) if total else 0,
        })

    serializer = LeaderboardEntrySerializer(data, many=True)
    return Response(serializer.data)
