from rest_framework import serializers
from .models import Tournament, TournamentEntry


class TournamentEntrySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.SerializerMethodField()
    profit = serializers.ReadOnlyField()

    class Meta:
        model = TournamentEntry
        fields = (
            'id', 'username', 'display_name', 'joined_at',
            'final_balance', 'hands_played', 'is_submitted', 'rank', 'profit',
        )

    def get_display_name(self, obj):
        return obj.user.display_name or obj.user.username


class TournamentSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    player_count = serializers.ReadOnlyField()
    entries = TournamentEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Tournament
        fields = (
            'id', 'name', 'creator_name', 'format', 'status',
            'starting_balance', 'hand_limit', 'time_limit_minutes',
            'num_decks', 'max_players', 'player_count',
            'start_time', 'created_at', 'entries',
        )
        read_only_fields = ('id', 'creator_name', 'status', 'created_at', 'player_count', 'entries')


class TournamentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = (
            'id', 'name', 'format', 'starting_balance',
            'hand_limit', 'time_limit_minutes', 'num_decks',
            'max_players', 'start_time',
        )
        read_only_fields = ('id',)


class SubmitResultSerializer(serializers.Serializer):
    final_balance = serializers.IntegerField()
    hands_played = serializers.IntegerField()
