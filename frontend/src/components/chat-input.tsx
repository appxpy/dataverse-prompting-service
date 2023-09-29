import { zodResolver } from "@hookform/resolvers/zod";
import autosize from "autosize";
import axios from "axios";
import { Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { ChatProps } from "./chat";
import { ChatUserProps } from "./chat-user";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";

type ChatInputProps = {
  chatData: ChatProps;
  setChatData: React.Dispatch<React.SetStateAction<ChatProps>>;
  userData: ChatUserProps;
  setUserData: React.Dispatch<React.SetStateAction<ChatUserProps>>;
};

export const FormSchema = z.object({
  prompt: z
    .string()
    .min(1, {
      message: "Промпт слишком маленький, напишите более 10 символов",
    })
    .max(3000, {
      message: "Промпт слишком большой, напишите менее 3000 символов",
    }),
});

export const ChatInput = ({
  chatData,
  setChatData,
  userData,
  setUserData,
}: ChatInputProps) => {
  const textarea: React.Ref<HTMLTextAreaElement> | undefined = useRef(null);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  // const { toast } = useToast();
  useEffect(() => {
    if (textarea && textarea.current) {
      textarea.current.addEventListener("keydown", handleEnter);
      autosize(textarea.current);
    }
    return () => {
      if (textarea && textarea.current) {
        autosize.destroy(textarea.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        textarea.current.removeEventListener("keydown", handleEnter);
      }
    };
  }, [textarea]);

  const handleEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (textarea && textarea.current) {
        textarea.current.form?.requestSubmit();
      }
    }
  };

  function onSubmit(data: z.infer<typeof FormSchema>) {
    form.setValue("prompt", "");
    // toast({
    //   title: "Отправлены следующие данные:",
    //   description: (
    //     <pre className="mt-2 w-[340px] rounded-md bg-secondary text-secondary-foreground p-4">
    //       <code className="text-white">{JSON.stringify(data, null, 2)}</code>
    //     </pre>
    //   ),
    // });
    if (!chatData.messages) {
      chatData.messages = [];
    }
    const messageId = v4();

    setChatData({
      ...chatData,
      id: chatData.id,
      messages: [
        ...(chatData.messages ?? []),
        {
          id: messageId,
          time: Date.now(),
          loading: false,
          text: data.prompt,
          from: userData.userdata?.is_staff ? "bot" : "user",
        },
      ],
    });

    axios
      .post(
        "/api/messages/",
        {
          message: data.prompt,
          chat: chatData.id,
          id: messageId,
        },
        {
          headers: {
            Authorization: `Token ${userData.userdata?.token}`,
          },
        }
      )
      .then((response) => {
        chatData.messages?.forEach((message) => {
          if (message.id === messageId) {
            if (response.data.timestamp) {
              message.time = Date.parse(response.data.timestamp);
            }
          }
          return message;
        });
      })
      .catch((error) => {
        console.log(error);
        setUserData({ loading: false, authorized: false });
      });
    // const messages: ChatMessageProps[] = [
    //   ...chatData.messages,
    //   {
    //     id: uuidv4(),
    //     loading: false,
    //     from: "user",
    //     time: Date.now(),
    //     text: data.prompt,
    //   },
    // ];
    // chatData.messages = messages;
    // setChatData({ ...chatData });
  }

  return (
    <div
      id="input"
      className="flex relative w-full px-6 pb-2 pt-2 items-center min-h-[64px]"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          autoFocus
          className="flex flex-row w-full justify-between items-center gap-5"
        >
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem className="m-0 w-full my-auto space-y-0">
                <FormMessage className="absolute -top-8 w-full bg-card flex justify-center py-2" />
                <FormControl className="h-auto">
                  <Textarea
                    placeholder={
                      userData.userdata?.is_staff
                        ? "Вы отвечаете вместо LLM..."
                        : "Начните вводить ваш промпт..."
                    }
                    className="resize-vertical overflow-y-scroll w-full min-h-10 max-h-72 placeholder:align-middle text-base"
                    {...field}
                    ref={textarea}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            className="h-[58px] w-20 flex justify-center items-center"
            type="submit"
            disabled={!form.formState.isValid || !chatData.id}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </Form>
    </div>
  );
};
