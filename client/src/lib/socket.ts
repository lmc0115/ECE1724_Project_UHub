import { io, type Socket } from "socket.io-client";
import type { ChatMessage } from "@/types";

type JoinSuccessResponse = {
  ok: true;
  messages: ChatMessage[];
};

type MessageSuccessResponse = {
  ok: true;
  message: ChatMessage;
};

type ErrorResponse = {
  ok: false;
  error: string;
};

export type JoinChatResponse = JoinSuccessResponse | ErrorResponse;
export type SendChatResponse = MessageSuccessResponse | ErrorResponse;

function getSocketBaseUrl() {
  if (typeof window === "undefined") return "http://localhost:4000";

  if (window.location.hostname === "localhost") {
    return "http://localhost:4000";
  }

  return window.location.origin;
}

function getToken() {
  return localStorage.getItem("token");
}

export function createChatSocket(): Socket {
  const token = getToken();

  return io(getSocketBaseUrl(), {
    autoConnect: false,
    auth: token ? { token } : undefined,
  });
}