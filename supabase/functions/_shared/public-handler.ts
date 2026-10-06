import { HttpError, jsonResponse, parseSubmission, readBody, requireOrigin, type Submission } from './domain.ts';

export function publicHandler(options: {
  origin: string;
  access?: boolean;
  verify: (token: string, action: string) => Promise<void>;
  save: (submission: Submission) => Promise<unknown>;
}) {
  return async (request: Request): Promise<Response> => {
    let origin: string | undefined;
    try {
      origin = requireOrigin(request, options.origin);
      if (request.method === 'OPTIONS') return jsonResponse({}, 200, origin);
      if (request.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
      const submission = parseSubmission(await readBody(request), options.access);
      await options.verify(submission.token, options.access ? 'access' : 'intention');
      await options.save(submission);
      // No IDs or personal data are returned to the anonymous client.
      return jsonResponse({ ok: true }, 201, origin);
    } catch (error) {
      const known = error instanceof HttpError;
      return jsonResponse({ error: known ? error.message : 'No pudimos enviar el formulario. Inténtalo nuevamente.' }, known ? error.status : 500, origin);
    }
  };
}
