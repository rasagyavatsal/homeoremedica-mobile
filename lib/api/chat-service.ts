import type { ChatRequest, ChatResponse } from '@/types/chat';
import { chatRequestSchema } from '@/lib/validation/schemas';

/*
 * Owns the client-side call to the deployed RAG chat backend. The web app
 * fronts the same Cloud Run service with its same-origin /api/chat route;
 * native clients have no same-origin or App Check constraint, so they call
 * the service directly. The service URL, request contract, timeout, and
 * failure modes all live in this module and never leak into the UI.
 */
const DEFAULT_CHAT_API_BASE_URL =
  'https://homeoremedica-chat-619837289655.us-central1.run.app';
const CHAT_REQUEST_TIMEOUT_MS = 90_000;

function chatApiBaseUrl(): string {
  const configured =
    process.env.EXPO_PUBLIC_RAG_CHAT_BASE_URL ?? DEFAULT_CHAT_API_BASE_URL;
  return configured.replace(/\/+$/, '');
}

function chatUnavailableError() {
  return {
    code: 'UPSTREAM_UNAVAILABLE',
    message: 'The chat service could not answer right now. Please try again.',
  };
}

export async function sendChatMessage(
  request: ChatRequest,
): Promise<ChatResponse> {
  const validated = chatRequestSchema.parse(request);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${chatApiBaseUrl()}/v1/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: validated.message,
        history: validated.history ?? [],
        ...(validated.bookIds ? { bookIds: validated.bookIds } : {}),
      }),
      signal: controller.signal,
    });
  } catch {
    throw chatUnavailableError();
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw chatUnavailableError();
  }

  try {
    return (await response.json()) as ChatResponse;
  } catch {
    throw chatUnavailableError();
  }
}
