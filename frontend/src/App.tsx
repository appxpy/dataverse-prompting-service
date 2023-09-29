import axios from "axios";
import { useState } from "react";
import useLocalStorageState from "use-local-storage-state";
import { Chat, ChatProps } from "./components/chat";
import { ChatInput } from "./components/chat-input";
import { ChatLinkList, ChatLinkListProps } from "./components/chat-link";
import { ChatUser, ChatUserProps } from "./components/chat-user";
import { ModeToggle } from "./components/mode-toggle";
import { Separator } from "./components/ui/separator";

axios.defaults.baseURL =
  import.meta.env.VITE_BACKEND_URL ?? "https://api.dataverse.appxpy.com/";
axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";

function App() {
  const [chatLinkData, setChatLinkData] = useState<ChatLinkListProps>({
    loading: true,
  });

  const [chatData, setChatData] = useState<ChatProps>({
    loading: true,
  });

  const [userData, setUserData] = useLocalStorageState<ChatUserProps>(
    "dataverse-authentication",
    {
      defaultValue: {
        loading: false,
        authorized: false,
      },
    }
  );

  return (
    <div className="relative h-screen w-screen bg-card">
      <div className="h-full flex-col flex ">
        <div className="container flex flex-row items-center justify-between space-y-2 py-4 h-16 bg-card">
          <h2 className="text-lg font-semibold w-full">DataVerse</h2>
          <div className="ml-auto flex w-full space-x-2 justify-end">
            {/* <div className="space-x-2 flex"></div> */}
            <ModeToggle />
          </div>
        </div>
        <Separator />
        <div className="flex flex-1 relative w-full h-full overflow-y-scroll bg-card">
          <div className="flex flex-col h-full w-72 border-r-[1px]">
            <ChatLinkList
              chatLinkData={chatLinkData}
              setChatLinkData={setChatLinkData}
              userData={userData}
              setUserData={setUserData}
              chatData={chatData}
              setChatData={setChatData}
            />
            <ChatUser
              userData={userData}
              setUserData={setUserData}
              setChatData={setChatData}
              setChatLinksData={setChatLinkData}
            />
          </div>
          <div
            id="container"
            className="relative flex flex-col w-full flex-grow overflow-hidden bg-card"
          >
            <Chat
              chatData={chatData}
              setChatData={setChatData}
              userData={userData}
              setUserData={setUserData}
            />
            <ChatInput
              chatData={chatData}
              setChatData={setChatData}
              userData={userData}
              setUserData={setChatData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
