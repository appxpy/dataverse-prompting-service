import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Crown, LogOut } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChatProps } from "./chat";
import { ChatLinkListProps } from "./chat-link";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "./ui/use-toast";

export type ChatUserDataProps = {
  userData: ChatUserProps;
  setUserData: React.Dispatch<React.SetStateAction<ChatUserProps>>;
  setChatData: React.Dispatch<React.SetStateAction<ChatProps>>;
  setChatLinksData: React.Dispatch<React.SetStateAction<ChatLinkListProps>>;
};

export type ChatUserProps = {
  loading: boolean;
  authorized?: boolean;
  userdata?: {
    username: string;
    token: string;
    is_staff: boolean;
  };
};

const FormSchema = z.object({
  username: z
    .string()
    .min(1, {
      message: "Имя пользователя слишком короткое.",
    })
    .max(256, {
      message: "Имя пользователя слишком длинное.",
    }),
  password: z
    .string()
    .min(1, "Пароль должен быть более 1 символа.")
    .max(256, "Пароль слишком большой."),
});

export const ChatUser = ({
  userData,
  setUserData,
  setChatData,
}: ChatUserDataProps) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const { toast } = useToast();

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setUserData({ ...userData, loading: true });
    setChatData({ loading: true });
    axios
      .post("/api/token/", {
        ...data,
      })
      .then((response) => {
        // toast({
        //   title: "Данные получены от бэка:",
        //   description: (
        //     <pre className="mt-2 w-full rounded-md bg-secondary text-secondary-foreground p-4">
        //       <code className="text-white w-full break-all whitespace-normal">
        //         {JSON.stringify(response.data, null, 2)}
        //       </code>
        //     </pre>
        //   ),
        // });
        setUserData({
          loading: false,
          authorized: true,
          userdata: {
            is_staff: response.data.is_staff,
            username: response.data.email,
            token: response.data.token,
          },
        });
      })
      .catch(() => {
        toast({
          title: "Ошибка авторизации",
          description: "Неверное имя пользователя или пароль",
          variant: "destructive",
        });
        setUserData({ loading: false, authorized: false });
      });
  }

  return (
    <div className="w-full h-20 py-3 px-4 border-t-[1px] flex items-center gap-4 justify-end">
      {userData.loading && userData.authorized ? (
        <>
          <div className="flex flex-col h-full justify-center gap-2 items-end">
            <Skeleton className="w-[120px] h-3 rounded-full" />
            <Skeleton className="w-[150px] h-3 rounded-full" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl"></Skeleton>
        </>
      ) : (
        <>
          {userData.authorized ? (
            <>
              <div className="flex flex-col h-full justify-center gap-2 items-end">
                <div className="h-6 flex flex-row gap-2 items-center">
                  {userData.userdata?.is_staff ? (
                    <Crown className="w-5 h-5 bg-primary text-primary-foreground p-1 rounded-md" />
                  ) : (
                    <></>
                  )}
                  <div className="text-sm font-medium leading-none truncate max-w-[120px]">
                    {userData.userdata?.username}
                  </div>
                </div>

                <div className="flex flex-row gap-2">
                  <Button
                    onClick={(e) => {
                      navigator.clipboard.writeText(
                        e.currentTarget.textContent ?? ""
                      );
                    }}
                    className="relative h-4 p-0 text-muted-foreground hover:text-primary-foreground max-w-[140px] w-full group after:content-['API_ключ_скопирован'] active:after:opacity-100 after:opacity-0 after:absolute after:bg-muted after:text-muted-foreground after:rounded after:w-full after:h-4 after:text-xs after:transition-opacity after:delay-1000 after:ease-out active:after:delay-0"
                    variant={"ghost"}
                  >
                    <code className="group-hover:text-foreground relative rounded bg-muted px-[0.2rem] py-[0.1rem] font-mono text-xs text-muted-foreground truncate transition-all duration-100">
                      {userData.userdata?.token}
                    </code>
                  </Button>
                </div>
              </div>
              <Button className="w-10 h-10 rounded-xl p-0">
                <LogOut
                  className="h-4 w-4"
                  onClick={() => {
                    setUserData({
                      loading: false,
                      authorized: false,
                    });
                  }}
                />
              </Button>
            </>
          ) : (
            <>
              <Dialog
                open={(!userData.authorized || userData.loading) ?? false}
                onOpenChange={() => {}}
              >
                <DialogContent className="sm:max-w-[425px]" about="no_close">
                  <DialogHeader>
                    <DialogTitle>Вход в аккаунт.</DialogTitle>
                    <DialogDescription>
                      Сервис в данный момент находится на этапе MVP, регистрация
                      закрыта.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      autoFocus
                      className="grid gap-4 py-4"
                    >
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Имя пользователя</FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="username"
                                id="username"
                                className="col-span-3"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="current-password"
                                id="password"
                                type="password"
                                className="col-span-3"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={!form.formState.isValid ?? false}
                      >
                        Войти в аккаунт
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </>
      )}
    </div>
  );
};
