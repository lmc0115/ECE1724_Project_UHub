import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import type { Socket } from "socket.io-client";
import type { ChatMessage } from "@/types";
import { createChatSocket, type JoinChatResponse, type SendChatResponse } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LiveChatCardProps = {
  eventId: string;
  currentUserId?: string;
  enabled: boolean;
  disabledMessage?: string | null;
};

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LiveChatCard({
  eventId,
  currentUserId,
  enabled,
  disabledMessage,
}: LiveChatCardProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages]);

  useEffect(() => {
    if (!enabled) return;

    const socket = createChatSocket();
    socketRef.current = socket;

    const handleIncomingMessage = (message: ChatMessage) => {
      if (message.eventId !== eventId) return;

      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    socket.on("connect_error", (err) => {
      setLoadingHistory(false);
      setError(err.message || "Failed to connect to live chat.");
    });

    socket.on("chat:message", handleIncomingMessage);

    socket.connect();
    setLoadingHistory(true);
    setError(null);

    socket.on("connect", () => {
      socket.emit("chat:join", { eventId }, (response: JoinChatResponse) => {
        setLoadingHistory(false);

        if (!response.ok) {
          setError(response.error);
          return;
        }

        setMessages(response.messages);
      });
    });

    return () => {
      socket.emit("chat:leave", { eventId });
      socket.off("chat:message", handleIncomingMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, eventId]);

  const handleSend = async () => {
    const socket = socketRef.current;
    const content = input.trim();

    if (!socket || !content) return;

    setSending(true);
    setError(null);

    socket.emit(
      "chat:message",
      { eventId, content },
      (response: SendChatResponse) => {
        setSending(false);

        if (!response.ok) {
          setError(response.error);
          return;
        }

        setInput("");
      }
    );
  };

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Live Event Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {disabledMessage || "Live chat is not available for this event."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Live Event Chat
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="h-80 overflow-y-auto rounded-lg border bg-muted/20 p-3">
          {loadingHistory ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading chat history...
            </div>
          ) : sortedMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No messages yet. Start the conversation.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMessages.map((message) => {
                const isMine = currentUserId === message.userId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg border px-3 py-2 ${
                        isMine
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground"
                      }`}
                    >
                      <div
                        className={`mb-1 flex items-center gap-2 text-xs ${
                          isMine ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        <span className="font-medium">{message.userName}</span>
                        <span className="uppercase">{message.role}</span>
                        <span>{formatMessageTime(message.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[44px] flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            maxLength={500}
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Messages are delivered in real time.</span>
          <span>{input.length}/500</span>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}