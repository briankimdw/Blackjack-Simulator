from django.conf import settings
from django.db import models


class GameSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_sessions')
    tournament_entry = models.ForeignKey(
        'tournaments.TournamentEntry', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='game_sessions',
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    starting_balance = models.IntegerField(default=1000)
    final_balance = models.IntegerField(null=True, blank=True)
    hands_played = models.IntegerField(default=0)
    num_decks = models.IntegerField(default=6)
    is_complete = models.BooleanField(default=False)

    class Meta:
        ordering = ['-started_at']

    @property
    def profit(self):
        if self.final_balance is None:
            return 0
        return self.final_balance - self.starting_balance

    def __str__(self):
        return f'{self.user} – {self.started_at:%Y-%m-%d %H:%M}'


class HandResult(models.Model):
    class Outcome(models.TextChoices):
        WIN = 'win'
        LOSS = 'loss'
        PUSH = 'push'
        BLACKJACK = 'blackjack'

    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='hands')
    hand_number = models.PositiveIntegerField()
    player_cards = models.JSONField()
    dealer_cards = models.JSONField()
    bet = models.IntegerField()
    payout = models.IntegerField()
    outcome = models.CharField(max_length=10, choices=Outcome.choices)
    running_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['hand_number']
        unique_together = ('session', 'hand_number')

    def __str__(self):
        return f'Hand {self.hand_number}: {self.outcome} (${self.bet})'
