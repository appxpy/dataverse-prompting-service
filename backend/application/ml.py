import json
from typing import TypedDict

import requests
from googletrans import Translator


class MyTranslator:
    def __init__(self):
        self.translator = Translator()

    def translate_text(self, text: str, dest_language: str = "en") -> str:
        translation = self.translator.translate(text, dest=dest_language)
        return translation.text


TRANSLATOR = MyTranslator()


# mypy: ignore-errors
# flake8: noqa
# # Готовим обращение
#

# # Указываем инструкцию для YandexGPT
SYSTEM_PROMT = """
Act as a bank assistant that finds out the necessary information about me to personalize the offers of bank's products. REMEMBER: you need to be polite, friendly and as brief as possible. Remember: you can ask only 1 question in 1 reply message and you can not recommend me product if you don't know all necessary information.
You task is to collect information about me step-by-step and then recommend me the best personalized product. Don't forget that you should ask me more than 3 questions (3 messages) but no more than 5 questions (5 messages).
REMEMBER: Don't let me get you off the track.
REMEMBER: If I am under 18, don't recommend anything.

Information which you need to collect from me: 
1. Age
2. Occupation
3. Monthly income.
4. Financial goals.
You must recommend me one of our several products.
Our bank has online banking and includes several products such as:
1. Debit card with no fees.
2. Credit card with 7 days grace period and 1000 dollars credit limit.
3. Saving account with 12% rate and account sum from 500 dollars.
"""


SERVICE_URL = "http://masked:8000"
MODEL_PARAMS = {
    "echo": True,
    "max_tokens": 1000,
    "stop": ["Assistant", "User"],
    "temperature": 0.7,
    "repeat_penalty": 1 / 0.85,
    "top_k": 40,
    "top_p": 0.1,
}


ASSISTANT = "assistant"
USER = "user"
SYSTEM = "system"


class Messageinstance(TypedDict):
    content: str
    role: str


def make_api_request(db_message_history: list[tuple[str, str]]) -> tuple[str, str]:
    """
    Возвращает ответ llm и переведенный на русский ответ llm.
    """
    message_history: list[Messageinstance] = []
    message_history.append({"content": SYSTEM_PROMT, "role": SYSTEM})
    for message, from_annotation in db_message_history:
        if from_annotation in (USER, ASSISTANT):
            message_history.append({"content": message, "role": from_annotation})
        else:
            raise NotImplementedError("System role is not expected!")

    req = {"messages": message_history}
    req.update(MODEL_PARAMS)

    llm_results = "Ошибка при создании промпта!"
    try:
        result = requests.post(
            f"{SERVICE_URL}/v1/chat/completions", data=json.dumps(req), timeout=None
        ).json()

        llm_results = result["choices"][0]["message"]["content"]
        print(llm_results)
    except Exception as e:
        print(e)
    translated_llm_results = TRANSLATOR.translate_text(llm_results, dest_language="ru")
    print(translated_llm_results)
    return llm_results, translated_llm_results
