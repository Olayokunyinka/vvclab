alter table public.ai_call_log
  add column if not exists prompt_tokens integer default 0,
  add column if not exists completion_tokens integer default 0,
  add column if not exists total_tokens integer default 0,
  add column if not exists upstream_cost_usd numeric(10,7) default 0,
  add column if not exists upstream_prompt_cost_usd numeric(10,7) default 0,
  add column if not exists upstream_completion_cost_usd numeric(10,7) default 0,
  add column if not exists model_used text,
  add column if not exists provider text,
  add column if not exists is_byok boolean default false,
  add column if not exists cached_tokens integer default 0,
  add column if not exists reasoning_tokens integer default 0,
  add column if not exists response_id text,
  add column if not exists finish_reason text,
  add column if not exists duration_ms integer default 0;

create index if not exists ai_call_log_user_created_idx
  on public.ai_call_log(user_id, created_at desc);
create index if not exists ai_call_log_call_type_idx
  on public.ai_call_log(call_type, created_at desc);
create index if not exists ai_call_log_upstream_cost_idx
  on public.ai_call_log(upstream_cost_usd desc);