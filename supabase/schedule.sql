-- Run AFTER applying migrations. No mail provider, Vault secret or HTTP job.
create extension if not exists pg_cron;
do $$ declare job record; begin
  for job in select jobid from cron.job where jobname in ('misterio-mail','misterio-retention') loop
    perform cron.unschedule(job.jobid);
  end loop;
end $$;
-- Read messages expire exactly 48h after first opening in all queries.
-- Physical deletion follows on the next five-minute sweep (at most 5m later).
select cron.schedule('misterio-retention','*/5 * * * *','select public.cleanup_personal_data();');
select public.cleanup_personal_data();
