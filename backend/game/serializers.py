from rest_framework import serializers
from .models import GameSession, HandResult


class HandResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = HandResult
        fields = (
            'id', 'hand_number', 'player_cards', 'dealer_cards',
            'bet', 'payout', 'outcome', 'running_count', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class GameSessionSerializer(serializers.ModelSerializer):
    profit = serializers.ReadOnlyField()
    hands = HandResultSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = GameSession
        fields = (
            'id', 'username', 'started_at', 'ended_at',
            'starting_balance', 'final_balance', 'hands_played',
            'num_decks', 'is_complete', 'profit', 'hands',
        )
        read_only_fields = ('id', 'started_at', 'profit', 'hands')


class GameSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameSession
        fields = ('id', 'starting_balance', 'num_decks', 'tournament_entry')
        read_only_fields = ('id',)


class LeaderboardEntrySerializer(serializers.Serializer):
    username = serializers.CharField()
    display_name = serializers.CharField()
    total_profit = serializers.IntegerField()
    total_hands = serializers.IntegerField()
    sessions_played = serializers.IntegerField()
    win_rate = serializers.FloatField()
