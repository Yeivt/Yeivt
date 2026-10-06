export const CONFIRMATION_MESSAGE = 'Tu intención fue presentada a la Virgen en oración. Gracias por confiar tu petición a nuestra comunidad.';
export const CONFIRMATION_SUBJECT = 'Tu intención fue presentada en oración';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export type Submission = {
  submissionId: string; name: string; email: string; message: string;
  kind: 'petition' | 'gratitude'; community: string; token: string;
};

export function parseSubmission(value: unknown, access = false): Submission {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Formulario inválido.');
  const body = value as Record<string, unknown>;
  const str = (key: string) => typeof body[key] === 'string' ? (body[key] as string).trim() : '';
  const submission = { submissionId: str('submissionId'), name: str('name'), email: str('email').toLowerCase(), message: str('message'), kind: str('kind') || 'petition', community: str('community'), token: str('token') };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submission.submissionId)) throw new HttpError(400, 'Identificador inválido.');
  if (body.consent !== true) throw new HttpError(400, 'Debes aceptar la política de privacidad.');
  if (str('website')) throw new HttpError(400, 'Formulario inválido.');
  if (submission.name.length < 2 || submission.name.length > 100 || submission.message.length < 10 || submission.message.length > 2000) throw new HttpError(400, 'Revisa la longitud del nombre y de la intención.');
  if (submission.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) throw new HttpError(400, 'Revisa tu correo electrónico.');
  if (!['petition', 'gratitude'].includes(submission.kind)) throw new HttpError(400, 'Tipo de intención inválido.');
  if (access && (submission.community.length < 3 || submission.community.length > 200)) throw new HttpError(400, 'Indica tu parroquia o comunidad.');
  if (!submission.token || submission.token.length > 2048) throw new HttpError(400, 'Completa la verificación de seguridad.');
  return submission as Submission;
}

export function requireOrigin(request: Request, allowed: string): string {
  const origin = request.headers.get('origin');
  if (!allowed || origin !== allowed) throw new HttpError(403, 'Origen no permitido.');
  return origin;
}

export function jsonResponse(body: unknown, status = 200, origin?: string) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    ...(origin ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : {}),
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  } });
}

export async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'Se requiere JSON.');
  // Read a bounded stream: Content-Length is not trusted and may be absent.
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Formulario vacío.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) { await reader.cancel(); throw new HttpError(413, 'Formulario demasiado grande.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new HttpError(400, 'JSON inválido.'); }
}
