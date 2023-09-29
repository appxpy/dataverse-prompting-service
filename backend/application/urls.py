from django.urls import path

from . import views

urlpatterns = [
    path("chat/", views.ChatAPI.as_view()),
    path("token/", views.AuthToken.as_view()),
    path("messages/", views.MessagesAPI.as_view()),
    path("updates/", views.get_updates),
]  # type: ignore
