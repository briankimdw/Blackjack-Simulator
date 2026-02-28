from django.contrib import admin
from .models import Tournament, TournamentEntry


class TournamentEntryInline(admin.TabularInline):
    model = TournamentEntry
    extra = 0
    readonly_fields = ('user', 'joined_at', 'final_balance', 'hands_played', 'rank')


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('name', 'format', 'status', 'player_count', 'start_time')
    list_filter = ('format', 'status')
    inlines = [TournamentEntryInline]


@admin.register(TournamentEntry)
class TournamentEntryAdmin(admin.ModelAdmin):
    list_display = ('tournament', 'user', 'final_balance', 'rank', 'is_submitted')
    list_filter = ('is_submitted',)
