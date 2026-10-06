import { CONFIRMATION_MESSAGE, CONFIRMATION_SUBJECT } from './domain.ts';

export type EmailJob = { id: string; intention_id: string; email: string; lease_token: string; attempts: number };
export type WorkerOptions = {
  from: string; apiKey: string;
  take: () => Promise<EmailJob | null>;
  finish: (job: EmailJob, providerId: string) => Promise<void>;
  retry: (job: EmailJob, reason: string) => Promise<void>;
  fetcher?: typeof fetch;
};

export async function processEmails(options: WorkerOptions, limit = 5) {
  let sent = 0; let failed = 0;
  for (let count = 0; count < limit; count++) {
    const job = await options.take();
    if (!job) break;
    try {
      const response = await (options.fetcher || fetch)('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `misterio-intention-${job.intention_id}` },
        body: JSON.stringify({ from: options.from, to: [job.email], subject: CONFIRMATION_SUBJECT, text: CONFIRMATION_MESSAGE }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`provider_http_${response.status}`);
      const result = await response.json();
      if (typeof result.id !== 'string') throw new Error('provider_invalid_response');
      await options.finish(job, result.id);
      sent++;
    } catch (error) {
      // Store only an operational code, never the provider body or recipient.
      const code = error instanceof Error && /^provider_/.test(error.message) ? error.message : 'delivery_or_ack_failed';
      await options.retry(job, code);
      failed++;
    }
  }
  return { sent, failed };
}
