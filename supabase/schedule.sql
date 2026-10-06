-- Run in the Supabase SQL editor AFTER deploying functions and creating Vault
-- secrets named misterio_function_url and misterio_mail_worker_secret.
-- URL example: https://PROJECT.supabase.co/functions/v1/process-emails
-- Enter real secret values through Supabase Vault, never in this tracked file.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Safe to rerun: replace only jobs owned by this application.
do $$
declare existing record;
begin
  for existing in select jobid from cron.job where jobname in ('misterio-mail', 'misterio-retention') loop
    perform cron.unschedule(existing.jobid);
  end loop;
end $$;

select cron.schedule('misterio-mail', '* * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'misterio_function_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'misterio_mail_worker_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 90000
  );
$job$);

select cron.schedule('misterio-retention', '15 3 * * *', 'select public.cleanup_personal_data();');
