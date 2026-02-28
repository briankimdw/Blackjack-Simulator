from django.conf import settings
from django.db import models


class Tournament(models.Model):
    class Format(models.TextChoices):
        BANKROLL = 'bankroll_challenge', 'Bankroll Challenge'
        TIMED = 'timed_rounds', 'Timed Rounds'

    class Status(models.TextChoices):
        UPCOMING = 'upcoming', 'Upcoming'
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'

    name = models.CharField(max_length=100)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tournaments')
    format = models.CharField(max_length=20, choices=Format.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.UPCOMING)
    starting_balance = models.IntegerField(default=1000)
    hand_limit = models.IntegerField(null=True, blank=True, help_text='Max hands for bankroll challenge')
    time_limit_minutes = models.IntegerField(null=True, blank=True, help_text='Minutes for timed rounds')
    num_decks = models.IntegerField(default=6)
    max_players = models.IntegerField(default=20)
    start_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def player_count(self):
        return self.entries.count()

    def __str__(self):
        return self.name


class TournamentEntry(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='entries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tournament_entries')
    joined_at = models.DateTimeField(auto_now_add=True)
    final_balance = models.IntegerField(null=True, blank=True)
    hands_played = models.IntegerField(default=0)
    is_submitted = models.BooleanField(default=False)
    rank = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('tournament', 'user')
        ordering = ['rank', '-final_balance']

    @property
    def profit(self):
        if self.final_balance is None:
            return 0
        return self.final_balance - self.tournament.starting_balance

    def __str__(self):
        return f'{self.user} in {self.tournament}'
