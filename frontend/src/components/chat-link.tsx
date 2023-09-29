import axios from "axios";
import { ArrowUpRight, Plus } from "lucide-react";
import { useEffect } from "react";
import { ChatProps } from "./chat";
import { ChatUserProps } from "./chat-user";
import { Button } from "./ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export type ChatLinkProps = {
  id: string;
  title: string;
  subtitle: string;
  time: number;
};

export const ChatLink: React.FC<ChatLinkProps & { onClick: () => void }> = (
  props: ChatLinkProps & { onClick: () => void }
) => {
  return (
    <Card
      className="flex flex-row justify-between px-3 py-4 group hover:cursor-pointer hover:shadow-ring hover:bg-popover transition-all duration-300"
      data-id={props.id}
      onClick={props.onClick}
    >
      <CardHeader className="p-0">
        <CardTitle className="text-sm truncate max-w-[150px]">
          {props.title}
        </CardTitle>
        <CardDescription className="text-xs truncate max-w-[150px]">
          {props.subtitle}
        </CardDescription>
      </CardHeader>
      <CardFooter className="p-0 flex items-center">
        <Button className="w-8 h-8 rounded-xl p-0">
          <ArrowUpRight className="w-5 h-5" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ChatLinkSkeleton: React.FC = () => {
  return (
    <div className="w-full h-16 flex border border-px rounded-xl px-3 py-4 justify-between">
      <div className="flex flex-col justify-between">
        <Skeleton className="w-[120px] h-3 rounded-full" />
        <Skeleton className="w-[100px] h-2 rounded-full" />
      </div>
      <Skeleton className="w-8 h-8 rounded-xl" />
    </div>
  );
};

export type ChatLinkListProps = {
  loading: boolean;
  links?: ChatLinkProps[];
};

export type ChatLinkListDataProps = {
  chatLinkData: ChatLinkListProps;
  setChatLinkData: React.Dispatch<React.SetStateAction<ChatLinkListProps>>;
  userData: ChatUserProps;
  setUserData: React.Dispatch<React.SetStateAction<ChatUserProps>>;
  chatData: ChatProps;
  setChatData: React.Dispatch<React.SetStateAction<ChatProps>>;
};

export const ChatLinkList: React.FC<ChatLinkListDataProps> = ({
  chatLinkData,
  setChatLinkData,
  userData,
  setUserData,
  chatData,
  setChatData,
}: ChatLinkListDataProps) => {
  const selectChat = (linkData: ChatLinkProps) => {
    setChatData({ loading: true });
    axios
      .get("api/messages/", {
        params: {
          chat: linkData.id,
        },
        headers: {
          Authorization: `Token ${userData.userdata?.token}`,
        },
      })
      .then((response) => {
        setChatData({
          loading: false,
          name: linkData.title,
          time: linkData.time,
          id: linkData.id,
          messages: response.data.map(
            (message: {
              id: string;
              timestamp: string;
              user_id: number | null;
              chat_display_text: string;
            }) => ({
              id: message.id,
              time: Date.parse(message.timestamp),
              from: message.user_id ? "user" : "bot",
              loading: message.chat_display_text ? false : true,
              text: message.chat_display_text,
            })
          ),
        });
      })
      .catch((error) => {
        console.error(error);
        setUserData({ loading: false, authorized: false });
      });
  };
  const createChat = () => {
    const linksPrev = chatLinkData.links ?? [];

    axios
      .post(
        "api/chat/",
        {},
        {
          headers: {
            Authorization: `Token ${userData.userdata?.token}`,
          },
        }
      )
      .then((response) => {
        const link: ChatLinkProps = {
          id: response.data.id,
          title: response.data.name,
          subtitle: response.data.id,
          time: Date.parse(response.data.created),
        };

        setChatLinkData({
          loading: false,
          links: [...linksPrev, link],
        });
        selectChat(link);
      })
      .catch(() => {
        setUserData({ loading: false, authorized: false });
      });
  };
  const fetchChatData = () => {
    setChatLinkData({ loading: true });
    axios
      .get("api/chat/", {
        headers: {
          Authorization: `Token ${userData.userdata?.token}`,
        },
      })
      .then((response) => {
        const data = {
          loading: false,
          links: response.data.map(
            (link: { name: string; id: string; created: string }) => ({
              title: link.name,
              subtitle: link.id,
              id: link.id,
              time: Date.parse(link.created),
            })
          ),
        };
        setChatLinkData(data);
      })
      .catch((error) => {
        console.error(error);
        setUserData({ loading: false, authorized: false });
      });
  };

  useEffect(() => {
    if (!userData.authorized || userData.loading) {
      return;
    }

    fetchChatData();
  }, [userData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!chatLinkData) {
      return;
    }
    if (chatData.loading && !chatData.id) {
      if (chatLinkData.links?.length) {
        selectChat(chatLinkData.links[chatLinkData.links?.length - 1]);
      }
    }
  }, [chatLinkData]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-1 flex-col h-full w-full py-4 px-3 gap-2 overflow-scroll">
      {chatLinkData.loading ? (
        <>
          <ChatLinkSkeleton />
          <ChatLinkSkeleton />
          <ChatLinkSkeleton />
        </>
      ) : (
        <>
          {chatLinkData.links?.map((linkData) => {
            return (
              <ChatLink
                {...linkData}
                key={linkData.id}
                onClick={() => {
                  selectChat(linkData);
                }}
              />
            );
          })}
          {!userData.userdata?.is_staff ? (
            <Card
              className="flex flex-row justify-between px-3 py-4 group hover:cursor-pointer hover:shadow-ring hover:bg-popover transition-all duration-300"
              onClick={() => {
                createChat();
              }}
            >
              <div className="flex justify-center items-center w-full h-[42px]">
                <Plus className="group-hover:text-primary transition-colors duration-300" />
              </div>
            </Card>
          ) : (
            <></>
          )}
        </>
      )}
    </div>
  );
};
