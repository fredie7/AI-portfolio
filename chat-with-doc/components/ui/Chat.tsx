"use client";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Loader2, Loader2Icon } from "lucide-react";
import { useCollection } from "react-firebase-hooks/firestore";
import { useUser } from "@clerk/nextjs";
import { collection, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase";
import { askQuestion } from "@/actions/askQuestion";
import ChatMessage from "./ChatMessage";
import { useToast } from "./use-toast";

export type Message = {
  id?: string;
  role: "human" | "ai" | "placeholder";
  message: string;
  createdAt: Date;
};

function Chat({ id }: { id: string }) {
  const { user } = useUser();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [ispending, startTransition] = useTransition();
  const bottomOfChatRef = useRef<HTMLDivElement>(null);

  console.log("STATE MESSAGES====>>>", messages);

  const [snapshot, loading, error] = useCollection(
    user &&
      query(
        collection(db, "users", user?.id, "files", id, "chats"),
        orderBy("createdAt", "asc")
      )
  );

  useEffect(() => {
    bottomOfChatRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, messages);

  useEffect(() => {
    if (!snapshot) return;
    console.log("updated snapshot", snapshot?.docs);
    // get second last message to check if AI is thinking
    const lastMessage = messages.pop();

    if (lastMessage?.role === "ai" && lastMessage.message === "thinking....") {
      // retrieve this as a dummy placeholder message
      return;
    }

    const newMessages = snapshot.docs.map((doc) => {
      const { role, message, createdAt } = doc.data();
      return {
        id: doc.id,
        role,
        message,
        createdAt: createdAt.toDate(),
      };
    });
    setMessages(newMessages);
    // Ignore messages dependency warning here to avoid an infinite loop
    console.log("NEW MESSAGES====>>>", newMessages);
  }, [snapshot]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const q = input;
    setInput("");

    // optimistic UI update
    setMessages((prev) => [
      ...prev,
      {
        role: "human",
        message: q,
        createdAt: new Date(),
      },
      {
        role: "ai",
        message: "thinking....",
        createdAt: new Date(),
      },
    ]);

    startTransition(async () => {
      const { success, message } = await askQuestion(id, q);

      console.log("DEBUG", success, message);

      if (!success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: message,
        });

        setMessages((prev) =>
          prev.slice(0, prev.length - 1).concat([
            {
              role: "ai",
              message: `Whoops... ${message}`,
              createdAt: new Date(),
            },
          ])
        );
      }
    });
  };

  console.log(
    "MESSAGESSSSSSSSSSSSSSSSSSSSSSSS===>>>>>>>>>>>>>>>>>>>>>>",
    messages
  );
  return (
    <div className="flex flex-col h-full overflow-scroll">
      {/* chat content */}
      <div className="flex-1 w-full">
        {/* chat messgae */}

        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2Icon className="animate-spin h-20 w20 text-indigo-600" />
          </div>
        ) : (
          <div className="p-5">
            {messages.length === 0 && (
              <ChatMessage
                key={"placeholder"}
                message={{
                  role: "ai",
                  message: "Ask me anything about the document",
                  createdAt: new Date(),
                }}
              />
            )}
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {/* {messages.map((message) => (
              <div key={message.id}>
                <p>{message.message}</p>
              </div>
            ))} */}
          </div>
        )}
      </div>

      <form
        className="flex sticky bottom-0 space-x-2 bg-indigo-600/75"
        onSubmit={handleSubmit}
      >
        <Input
          placeholder="Ask a question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <Button type="submit" disabled={!input || ispending}>
          {ispending ? (
            <Loader2Icon className="animate-spin text-indigo-600" />
          ) : (
            "Ask"
          )}
        </Button>
      </form>
    </div>
  );
}

export default Chat;
