// Types
export interface CreateThreadRequest {
  sessionId: string;
}
export interface CreateThreadResponse {
  threadId: string;
  message?: string;
}

export interface GetThreadByIdResponse {
  threadId: string;
  messages: IThreadMessage[];
}

export interface SendAIMessageRequest {
  threadId: string;
  message: string;
  userId: string;
  sessionId: string;
}
export interface SendAIMessageResponse {
  response: {
    messages: string[];
    emotion: string;
  };
}
// Envoyer un message à l'IA et obtenir une réponse
export async function sendAIMessage({
  threadId,
  message,
  userId,
  sessionId,
}: SendAIMessageRequest): Promise<SendAIMessageResponse> {
  const response = await fetch(
    `${IA_SERVICE_URL}/api/assistant/threads/${threadId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId, sessionId }),
    }
  );
  if (!response.ok) throw await response.json();
  const data = await response.json();
  return data;
}

import { IThreadMessage } from "@/types";
import { IA_SERVICE_URL } from "../config/service-urls";

// API Calls
export async function createThreadForSession(
  data: CreateThreadRequest
): Promise<CreateThreadResponse> {
  try {
    const response = await fetch(`${IA_SERVICE_URL}/api/assistant/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData || { message: "Erreur lors de la création du thread." };
    }
    return await response.json();
  } catch (error: any) {
    throw error;
  }
}

export async function getThreadById(
  threadId: string
): Promise<GetThreadByIdResponse> {
  try {
    const response = await fetch(
      `${IA_SERVICE_URL}/api/assistant/threads/${threadId}`
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw (
        errorData || { message: "Erreur lors de la récupération du thread." }
      );
    }
    return await response.json();
  } catch (error: any) {
    throw error;
  }
}
