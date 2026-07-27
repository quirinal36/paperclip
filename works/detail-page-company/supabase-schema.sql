-- 상세페이지 생성기 — Supabase 스키마 (v1, 로그인 없음)
-- 적용: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행
--
-- 접근 모델
--   · 브라우저는 Supabase 에 직접 붙지 않는다. 전부 Next.js BFF 경유.
--   · BFF 는 service_role 키를 쓰므로 RLS 를 우회한다.
--   · 따라서 jobs 는 RLS 를 켜고 정책을 두지 않는다(= anon 완전 차단).
--   · 로그인을 나중에 붙일 때 user_id 와 정책만 추가하면 된다.

-- ---------------------------------------------------------------------------
-- 1. jobs
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id                  uuid primary key default gen_random_uuid(),

  -- 나중에 Supabase Auth 를 붙일 때 채운다. v1 에서는 항상 null.
  user_id             uuid,

  status              text not null default 'queued'
                        check (status in ('queued','running','done','failed')),
  stage               text not null default 'analysis'
                        check (stage in ('analysis','strategy','design','build','qa','published')),

  -- 입력
  product_name        text not null,
  key_message         text not null,
  concept             text not null,
  image_urls          text[] not null default '{}',

  -- Paperclip 연결
  paperclip_issue_id  text,
  paperclip_issue_key text,

  -- 산출
  result_html         text,
  qa_verdict          text,
  error               text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists jobs_created_idx on public.jobs (created_at desc);
create index if not exists jobs_issue_idx   on public.jobs (paperclip_issue_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists jobs_touch_updated_at on public.jobs;
create trigger jobs_touch_updated_at
  before update on public.jobs
  for each row execute function public.touch_updated_at();

-- RLS 활성화, 정책 없음 → anon/authenticated 접근 불가, service_role 만 통과
alter table public.jobs enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Storage 버킷
-- ---------------------------------------------------------------------------
-- product-images 는 public read 다. Paperclip 에이전트(이 머신의 claude CLI)가
-- 평범한 HTTPS GET 으로 이미지를 읽어야 하기 때문이다.
-- 업로드는 BFF(service_role)만 하므로 insert 정책은 두지 않는다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 4194304,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('generated-pages', 'generated-pages', true, 10485760, array['text/html'])
on conflict (id) do nothing;

-- 주의: public 버킷이므로 URL 을 아는 사람은 누구나 이미지를 볼 수 있다.
-- 비공개가 필요하면 public=false 로 바꾸고, BFF 가 서명 URL(유효기간 6시간 이상)을
-- 만들어 Paperclip 이슈 설명에 넣도록 app/api/jobs/route.ts 를 수정한다.
