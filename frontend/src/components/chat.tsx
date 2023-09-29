import { cn } from "@/lib/utils";
import axios from "axios";
import React, { useEffect, useRef } from "react";
import { ChatUserProps } from "./chat-user";
import { Separator } from "./ui/separator";

export type ChatProps = {
  loading: boolean;
  id?: string;
  time?: number;
  messages?: ChatMessageProps[];
  name?: string;
};

export type ChatDataProps = {
  chatData: ChatProps;
  setChatData: React.Dispatch<React.SetStateAction<ChatProps>>;
  userData: ChatUserProps;
  setUserData: React.Dispatch<React.SetStateAction<ChatUserProps>>;
};

export const Chat: React.FC<ChatDataProps> = ({
  chatData,
  setChatData,
  userData,
  setUserData,
}: ChatDataProps) => {
  const messagesEndRef: React.Ref<HTMLDivElement> | null = useRef(null);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getUpdates = () => {
    if (!chatData.messages?.length) {
      return;
    }

    if (!userData.authorized) {
      return;
    }

    const firstLoadingMessage: ChatMessageProps | undefined = chatData.messages
      .filter((value) => {
        return value.loading;
      })
      .sort((a, b) => a.time - b.time)
      .at(0);
    // const firstMessageTimestamp
    const firstLoadingMessageTimestamp = firstLoadingMessage
      ? firstLoadingMessage.time
      : 0;
    axios
      .get("api/updates/", {
        params: {
          chat: chatData.id,
          timestamp: new Date(firstLoadingMessageTimestamp).toISOString(),
        },
        headers: {
          Authorization: `Token ${userData.userdata?.token}`,
        },
      })
      .then((response) => {
        const newMessages: Map<
          string,
          {
            from: "user" | "bot";
            id: string;
            time: number;
            loading: boolean;
            chat_display_text: string;
          }
        > = new Map(
          response.data.map(
            (message: {
              user_id: string;
              id: string;
              timestamp: string;
              chat_display_text: string;
            }) => [
              message.id,
              {
                from: message.user_id ? "user" : "bot",
                id: message.id,
                time: Date.parse(message.timestamp),
                loading: message.chat_display_text ? false : true,
                text: message.chat_display_text,
              },
            ]
          )
        );

        const messages: ChatMessageProps[] = (chatData.messages ?? []).map(
          (message) => {
            if (newMessages.has(message.id)) {
              const newMessage = newMessages.get(message.id);
              newMessages.delete(message.id);
              return newMessage ?? message;
            } else {
              return message;
            }
          }
        );

        newMessages.forEach((value) => {
          messages.push(value);
        });

        setChatData({
          loading: false,
          id: chatData.id,
          name: chatData.name,
          time: chatData.time,
          messages: [...messages].sort((a, b) => a.time - b.time),
        });
      })
      .catch((error) => {
        console.error(error);
        setUserData({ loading: false, authorized: false });
      });
  };

  useEffect(() => {
    const getUpdatesLoop = setInterval(getUpdates, 2000);
    return () => clearInterval(getUpdatesLoop);
  });

  useEffect(() => {
    scrollToBottom();
  }, [chatData.messages?.length]);
  return (
    <div
      id="chat-wrapper"
      className="flex flex-1 overflow-y-auto overflow-x-hidden justify-center"
    >
      <div
        id="chat"
        className={cn(
          "relative flex flex-col w-full p-6 justify-end items-center whitespace-normal break-words gap-4 max-w-4xl",
          chatData.loading ? "h-full" : "h-max"
        )}
      >
        {chatData.loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex items-center animate-spin justify-center rounded-full w-12 h-12 bg-gradient-to-tr from-primary to-card">
              <div className="h-8 w-8 rounded-full bg-card"></div>
            </div>
          </div>
        ) : (
          <>
            {chatData.id ? (
              <>
                <div className="flex flex-col justify-center items-center mb-5">
                  <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl">
                    Чат создан
                  </h1>
                  <p className="leading-7 [&:not(:first-child)]:mt-2">
                    Вводите первичный промпт и сервис улучшит его!
                  </p>
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-normal">
                    {new Date(chatData?.time ?? 0).toISOString()}
                  </code>
                </div>

                {chatData.messages
                  ?.sort((a, b) => a.time - b.time)
                  .map((message, index) => {
                    return (
                      <div
                        className="flex w-full h-full flex-col gap-3"
                        key={message.id}
                      >
                        <ChatMessage {...message} />
                        {index + 1 != chatData.messages?.length ? (
                          <Separator />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"></div>
                        )}
                      </div>
                    );
                  })}

                <div ref={messagesEndRef}></div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl">
                  Создайте ваш первый чат
                </h1>
                <p className="leading-7 text-muted-foreground [&:not(:first-child)]:mt-2">
                  И начните улучшать ваши запросы ИИ.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export type ChatMessageProps = {
  id: string;
  time: number;
  loading: boolean;
  from: "user" | "bot";
  text?: string;
};

export const ChatMessage: React.FC<ChatMessageProps> = (
  props: ChatMessageProps
) => {
  return (
    <>
      {props.from == "user" ? (
        <div className="message-user">
          <p className="message-text">{props.text}</p>
        </div>
      ) : (
        <div className="flex flex-row w-full gap-3">
          <div className="rounded-full">
            <svg
              viewBox="0 0 198 196"
              className="w-10 h-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="198"
                height="196"
                rx="98"
                className="fill-foreground"
              />
              <path
                d="M102.296 139L84.08 81.36H93.408L102.12 111.368C103.117 114.712 103.997 117.88 104.76 120.872C105.523 123.805 106.403 126.944 107.4 130.288H107.752C108.808 126.944 109.717 123.805 110.48 120.872C111.301 117.88 112.181 114.712 113.12 111.368L121.744 81.36H130.72L112.592 139H102.296Z"
                className="fill-primary"
              />
              <path
                d="M70.304 111V53.36H84.912C90.6613 53.36 95.5307 54.4453 99.52 56.616C103.568 58.7867 106.648 62.0133 108.76 66.296C110.872 70.52 111.928 75.7413 111.928 81.96C111.928 88.1787 110.872 93.4587 108.76 97.8C106.648 102.141 103.627 105.427 99.696 107.656C95.7653 109.885 90.984 111 85.352 111H70.304ZM79.104 103.872H84.384C88.432 103.872 91.8053 103.051 94.504 101.408C97.2613 99.7067 99.344 97.2427 100.752 94.016C102.16 90.7893 102.864 86.7707 102.864 81.96C102.864 77.1493 102.16 73.16 100.752 69.992C99.344 66.824 97.2613 64.448 94.504 62.864C91.8053 61.28 88.432 60.488 84.384 60.488H79.104V103.872Z"
                className="fill-primary"
              />
            </svg>
          </div>
          <div className="message-bot">
            <div className="message-text">
              {props.loading ? (
                <div className="flex space-x-1 items-center w-full">
                  <div className="w-2 h-2 rounded-full animate-pulse delay-0 bg-foreground"></div>
                  <div className="w-2 h-2 rounded-full animate-pulse delay-100 bg-foreground"></div>
                  <div className="w-2 h-2 rounded-full animate-pulse delay-200 bg-foreground"></div>
                  <br></br>
                </div>
              ) : (
                props.text
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
