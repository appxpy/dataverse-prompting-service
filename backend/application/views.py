import time
from datetime import datetime
from threading import Thread

# from application.ml import get_completion_from_messages
from application.ml import ASSISTANT, TRANSLATOR, USER, make_api_request
from application.models import Conversation, Messages
from application.serializers import ConversationSerializer, MessagesSerializer
from django.db.models import Q
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


def get_or_none(classmodel, **kwargs):
    try:
        return classmodel.objects.get(**kwargs)
    except classmodel.DoesNotExist:
        return None


# AUTHENTICATION
class AuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user_id": user.pk,
                "email": user.email,
                "is_staff": user.is_staff,
            }
        )


class ChatAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not request.auth:
            return Response(status=403)
        user = request.auth.user
        if user.is_staff:
            qs = Conversation.objects.all().values()
            return Response(qs, content_type="application/json")

        qs = Conversation.objects.filter(user=user).values()
        if not qs:
            Conversation(user=user, name="Чат").save()
            qs = Conversation.objects.filter(user=user).values()
        return Response(qs, content_type="application/json")

    def post(self, request):
        if not request.auth:
            return Response(status=403)
        user = request.auth.user
        name = request.data.get("name", "Чат")
        conversation = Conversation(user=user, name=name)
        conversation.save()
        return Response(ConversationSerializer(conversation).data, status=200)


def get_annotated_message_history(chat_id: str) -> list[tuple[str, str]]:
    """
    Составляет список сообщений (все на английском!) для подачи их как историю
    сообщений в LLM. Возвращается список из (сообщение, роль). Роли описаны в
    файле `ml.py`
    """
    chat_messages = list(
        Messages.objects.filter(chat=chat_id)
        .order_by("timestamp")
        .filter(~Q(text=""))
        .values()
    )

    annotated_message_history: list[tuple[str, str]] = []
    for message_obj in chat_messages:
        user_id_opt = message_obj["user_id"]
        if user_id_opt is None:
            annotated_message_history.append((message_obj["text"], ASSISTANT))
        else:
            annotated_message_history.append((message_obj["text"], USER))

    return annotated_message_history


def produce_message(prompt: str, chat_id: str, response_id: str):
    """
    Принимает промпт пользователя (на английском!) для последующей генерации ответа.
    """
    annotated_message_history = get_annotated_message_history(chat_id)
    annotated_message_history.append((prompt, USER))

    llm_output, translated_llm_output = make_api_request(annotated_message_history)
    message = get_or_none(Messages, id=response_id)
    if not message:
        return
    message.text = llm_output
    message.chat_display_text = translated_llm_output

    message.save()


class MessagesAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not request.auth:
            return Response(status=403)
        chat = request.query_params.get("chat", "Чат")
        qs = Messages.objects.filter(chat=chat).values()
        return Response(qs, content_type="application/json")

    def post(self, request):
        if not request.auth:
            return Response(status=403)
        user = request.auth.user
        message = request.data.get("message")

        chat_id = request.data.get("chat")
        message_id = request.data.get("id")
        if not message or not chat_id or not message_id:
            return Response(status=400)
        chat_id = get_or_none(Conversation, id=chat_id)
        if not chat_id:
            return Response(status=400)

        if user.is_staff:
            response = Messages(
                id=message_id,
                user=None,
                chat=chat_id,
                text=message,
                chat_display_text=message,
            )
            response.save()
            return Response({"id": message_id}, status=200)

        english_message = TRANSLATOR.translate_text(message, dest_language="en")
        translated_message_db = Messages(
            user=user,
            chat=chat_id,
            text=english_message,
            chat_display_text=message,
            id=message_id,
        )
        response = Messages(chat=chat_id, text="", chat_display_text="")
        translated_message_db.save()
        response.save()
        # TODO: implement produce_message using ThreadPoolExecutor
        llm_message_generator = Thread(
            target=produce_message,
            name="produce LLM message",
            args=[english_message, chat_id, response.id],
            daemon=True,
        )
        llm_message_generator.run()
        return Response(MessagesSerializer(response).data, status=200)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_updates(request, format=None):
    if not request.auth:
        return Response(status=403)

    chat = request.query_params.get("chat")
    timestamp = request.query_params.get("timestamp")
    try:
        timestamp = datetime.fromisoformat(timestamp)
    except Exception:
        return Response(status=400)

    if not chat:
        return Response(status=400)

    qs = Messages.objects.filter(chat=chat, timestamp__gt=timestamp).values()
    return Response(qs, content_type="application/json")
