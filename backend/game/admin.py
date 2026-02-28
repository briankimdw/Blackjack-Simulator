from django.contrib import admin
from .models import GameSession, HandResult


class HandResultInline(admin.TabularInline):
    model = HandResult
    extra = 0
    readonly_fields = ('hand_number', 'outcome', 'bet', 'payout')


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'started_at', 'hands_played', 'profit', 'is_complete')
    list_filter = ('is_complete',)
    inlines = [HandResultInline]


@admin.register(HandResult)
class HandResultAdmin(admin.ModelAdmin):
    list_display = ('session', 'hand_number', 'outcome', 'bet', 'payout')
    list_filter = ('outcome',)
