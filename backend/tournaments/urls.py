from django.urls import path
from .views import (
    TournamentListView,
    TournamentCreateView,
    TournamentDetailView,
    join_tournament,
    submit_result,
    tournament_leaderboard,
)

urlpatterns = [
    path('', TournamentListView.as_view(), name='tournament-list'),
    path('create/', TournamentCreateView.as_view(), name='tournament-create'),
    path('<int:pk>/', TournamentDetailView.as_view(), name='tournament-detail'),
    path('<int:pk>/join/', join_tournament, name='tournament-join'),
    path('<int:pk>/submit/', submit_result, name='tournament-submit'),
    path('<int:pk>/leaderboard/', tournament_leaderboard, name='tournament-leaderboard'),
]
