/*
 * The RAG backend prepends a fixed safety notice to every answer. The chat UI
 * shows that notice once, persistently under the composer, so the per-message
 * copy is separated here for display and for the history sent back upstream.
 * Kept in sync with apps/web/lib/chat-answer.ts.
 */
export const CHAT_SAFETY_NOTICE =
  'Historical materia medica reference only—not medical advice. For health decisions, consult a qualified clinician.';

export function chatAnswerBody(answer: string): string {
  if (!answer.startsWith(CHAT_SAFETY_NOTICE)) {
    return answer.trim();
  }

  return answer.slice(CHAT_SAFETY_NOTICE.length).trim();
}
