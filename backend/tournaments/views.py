from django.db.models import F
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Tournament, TournamentEntry
from .serializers import (
    TournamentSerializer,
    TournamentCreateSerializer,
    TournamentEntrySerializer,
    SubmitResultSerializer,
)


class TournamentListView(generics.ListAPIView):
    serializer_class = TournamentSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        qs = Tournament.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class TournamentCreateView(generics.CreateAPIView):
    serializer_class = TournamentCreateSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class TournamentDetailView(generics.RetrieveAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = (permissions.AllowAny,)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_tournament(request, pk):
    try:
        tournament = Tournament.objects.get(pk=pk)
    except Tournament.DoesNotExist:
        return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)

    if tournament.status != Tournament.Status.UPCOMING and tournament.status != Tournament.Status.ACTIVE:
        return Response({'error': 'Tournament is not open for joining'}, status=status.HTTP_400_BAD_REQUEST)

    if tournament.entries.count() >= tournament.max_players:
        return Response({'error': 'Tournament is full'}, status=status.HTTP_400_BAD_REQUEST)

    entry, created = TournamentEntry.objects.get_or_create(
        tournament=tournament, user=request.user
    )
    if not created:
        return Response({'error': 'Already joined'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(TournamentEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_result(request, pk):
    try:
        entry = TournamentEntry.objects.get(tournament_id=pk, user=request.user)
    except TournamentEntry.DoesNotExist:
        return Response({'error': 'Not in this tournament'}, status=status.HTTP_404_NOT_FOUND)

    if entry.is_submitted:
        return Response({'error': 'Already submitted'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = SubmitResultSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    entry.final_balance = serializer.validated_data['final_balance']
    entry.hands_played = serializer.validated_data['hands_played']
    entry.is_submitted = True
    entry.save()

    _recalculate_ranks(entry.tournament)

    return Response(TournamentEntrySerializer(entry).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def tournament_leaderboard(request, pk):
    entries = (
        TournamentEntry.objects
        .filter(tournament_id=pk, is_submitted=True)
        .order_by('-final_balance')
    )
    return Response(TournamentEntrySerializer(entries, many=True).data)


def _recalculate_ranks(tournament):
    entries = (
        TournamentEntry.objects
        .filter(tournament=tournament, is_submitted=True)
        .order_by('-final_balance')
    )
    for i, entry in enumerate(entries, start=1):
        entry.rank = i
        entry.save(update_fields=['rank'])

    all_submitted = not tournament.entries.filter(is_submitted=False).exists()
    if all_submitted and tournament.entries.exists():
        tournament.status = Tournament.Status.COMPLETED
        tournament.save(update_fields=['status'])
