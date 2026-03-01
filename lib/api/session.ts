// End a session
export async function endSession(sessionId: string): Promise<any> {
  const response = await fetch(`${BDD_SERVICE_URL}/api/sessions/${sessionId}/end`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await response.json();
  return response.json();
}
// Types
export interface CreatePracticeSessionRequest {
  userId: string;
  [key: string]: any;
}
export interface CreatePracticeSessionResponse {
  _id: string;
  [key: string]: any;
}

export interface GetUserSessionPerformancesResponse {
  [section: string]: any[];
}

import { BDD_SERVICE_URL } from '../config/service-urls';

// Créer une session de pratique
export async function createPracticeSession(data: CreatePracticeSessionRequest): Promise<CreatePracticeSessionResponse> {
  const defaultData: CreatePracticeSessionRequest = {...data, reference:"69a44898492876501288e815" };
  const response = await fetch(`${BDD_SERVICE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(defaultData),
  });
  if (!response.ok) throw await response.json();
  return response.json();
}

// Récupérer toutes les performances d'un utilisateur pour une session
export async function getUserSessionPerformances(sessionId: string, userId: string): Promise<GetUserSessionPerformancesResponse> {
  const response = await fetch(`${BDD_SERVICE_URL}/api/sessions/${sessionId}/user/${userId}/performances`);
  if (!response.ok) throw await response.json();
  return response.json();
}

// Get all sessions for a user
export async function getSessionsByUserId(userId: string): Promise<any[]> {
  const response = await fetch(`${BDD_SERVICE_URL}/api/users/${userId}/sessions`);
  if (!response.ok) throw await response.json();
  const data = await response.json();
  return data.data || [];
}