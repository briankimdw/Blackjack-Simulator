from django.urls import path
from .views import SessionCreateView, SessionUpdateView, HandCreateView, my_stats, leaderboard

urlpatterns = [
    path('sessions/', SessionCreateView.as_view(), name='session-create'),
    path('sessions/<int:pk>/', SessionUpdateView.as_view(), name='session-update'),
    path('sessions/<int:session_id>/hands/', HandCreateView.as_view(), name='hand-create'),
    path('stats/me/', my_stats, name='my-stats'),
    path('leaderboard/', leaderboard, name='leaderboard'),
]
