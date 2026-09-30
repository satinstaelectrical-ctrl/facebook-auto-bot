-- Facebook Auto Bot — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- Safe to run again at any time. Every statement only creates what is missing,
-- so re-running this file is also how an existing install is upgraded after
-- pulling a newer version of the app — see the "Upgrades" section at the end.

create extension if not exists "pgcrypto";

-- Singleton settings row (id is always 1). Holds the Facebook tokens, the
-- selected Page, and generation preferences. Single-user app, so one row.
create table if not exists app_settings (
  id smallint primary key default 1,
  -- Meta app credentials. Kept here rather than in env vars so that installing
  -- this app is a paste into Settings, not a redeploy. Never leaves the server.
  facebook_app_id text,
  facebook_app_secret text,
  -- Facebook Login for Business configuration id, when the Meta app uses it.
  facebook_config_id text,
  -- Long-lived user token (~60 days), used only to list Pages and to mint
  -- Page tokens. Posting never uses it directly.
  facebook_user_token text,
  facebook_token_expires_at timestamptz,
  facebook_user_name text,
  -- Page tokens derived from a long-lived user token do not expire, so this is
  -- what the app actually posts with.
  default_page_id text,
  default_page_name text,
  default_page_token text,
  image_source text not null default 'ai',        -- 'ai' | 'stock' | 'mixed'
  utm_suffix text default '',
  auto_post_enabled boolean not null default false,
  posts_per_day smallint not null default 3,
  posting_hours int[] not null default '{9,13,18}', -- local hours (0-23) the queue is allowed to fire
  timezone text not null default 'Asia/Karachi',
  last_auto_post_at timestamptz, -- prevents the autopilot firing twice in one posting-hour slot
  topic_source text not null default 'mine',       -- 'mine' | 'trending' | 'mixed'
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

-- One row per generated/queued/published post. Facebook takes a single
-- `message`, but title/description/hashtags stay separate here so the editor
-- can keep them apart; they are composed at publish time.
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  title text not null,
  description text not null,
  hashtags text[] not null default '{}',
  image_url text not null,          -- final image used (Supabase Storage URL)
  image_source text not null,       -- 'ai' | 'stock'
  link_url text,                    -- optional link included in the post
  page_id text,
  page_name text,
  status text not null default 'draft', -- 'draft' | 'scheduled' | 'posted' | 'failed'
  scheduled_at timestamptz,
  posted_at timestamptz,
  facebook_post_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists posts_status_scheduled_idx on posts (status, scheduled_at);
create index if not exists posts_created_idx on posts (created_at desc);

-- Cached list of the Pages this account can post to (refreshed on demand).
create table if not exists pages_cache (
  page_id text primary key,
  name text not null,
  category text,
  access_token text,
  avatar_url text,
  fetched_at timestamptz not null default now()
);

-- The owner's own topics and keywords. Autopilot writes about these, taking
-- the least recently used enabled one each time, so the whole list is covered
-- before anything repeats.
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  enabled boolean not null default true,
  use_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness, so pasting the same list twice adds nothing.
create unique index if not exists topics_text_lower_idx on topics (lower(text));
create index if not exists topics_rotation_idx on topics (enabled, last_used_at nulls first);

-- Public bucket every generated/sourced image is re-hosted into, so a post's
-- image keeps working even if the free provider it came from goes down later.
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Upgrades
--
-- `create table if not exists` leaves an existing table exactly as it was, so
-- columns added to app_settings after the first public release have to be
-- added explicitly for installs that already have the table. Each line is a
-- no-op when the column is already there.
-- ---------------------------------------------------------------------------

alter table app_settings add column if not exists facebook_app_id text;
alter table app_settings add column if not exists facebook_app_secret text;
alter table app_settings add column if not exists facebook_config_id text;
alter table app_settings add column if not exists topic_source text not null default 'mine';
alter table pages_cache add column if not exists access_token text;
alter table pages_cache add column if not exists avatar_url text;
alter table posts add column if not exists media_urls text[] default '{}';

-- BYOK AI Keys & Model configuration (AES-256 encrypted)
alter table app_settings add column if not exists openai_api_key_encrypted text;
alter table app_settings add column if not exists anthropic_api_key_encrypted text;
alter table app_settings add column if not exists gemini_api_key_encrypted text;
alter table app_settings add column if not exists openrouter_api_key_encrypted text;
alter table app_settings add column if not exists preferred_ai_provider text not null default 'free';
alter table app_settings add column if not exists ai_model_name text;

-- Webhook & Automation Settings
alter table app_settings add column if not exists webhook_secret text;
alter table app_settings add column if not exists rss_feeds jsonb not null default '[]'::jsonb;

-- Meta Ads integration
alter table app_settings add column if not exists meta_ad_account_id text;

-- Meta Campaigns & Boost tracking
create table if not exists meta_campaigns (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete set null,
  facebook_post_id text,
  page_id text,
  campaign_id text not null,
  adset_id text,
  ad_id text,
  name text not null,
  objective text not null,
  budget_cents integer not null,
  budget_type text not null default 'daily',
  duration_days integer not null,
  status text not null default 'ACTIVE',
  meta_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists meta_campaigns_created_idx on meta_campaigns (created_at desc);

-- Real Meta Ads targeting columns
alter table meta_campaigns add column if not exists target_countries text[] default '{}';
alter table meta_campaigns add column if not exists target_cities text[] default '{}';
alter table meta_campaigns add column if not exists age_min integer default 18;
alter table meta_campaigns add column if not exists age_max integer default 65;
alter table meta_campaigns add column if not exists genders integer[] default '{0}';

-- Multi-user isolation table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table posts add column if not exists user_id uuid references users(id) on delete cascade;
alter table topics add column if not exists user_id uuid references users(id) on delete cascade;
alter table app_settings add column if not exists user_id uuid references users(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- SaaS Multiformat, Multi-Pages & Media Buyer Analytics Upgrades
-- ---------------------------------------------------------------------------

-- Page Groups for 1-click multi-page broadcasting
create table if not exists page_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  page_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Connected Websites (WordPress, Shopify, RSS, Custom)
create table if not exists connected_websites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  platform text not null default 'custom',
  rss_url text,
  webhook_secret text not null,
  auto_publish boolean not null default false,
  target_page_id text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now()
);

-- Posts multiformat (Feed, Reel 9:16, Story, Video, Carousel) and Media Buyer metrics
alter table posts add column if not exists post_format text not null default 'feed';
alter table posts add column if not exists video_url text;
alter table posts add column if not exists target_page_ids text[] default '{}';
alter table posts add column if not exists published_page_ids text[] default '{}';
alter table posts add column if not exists metrics jsonb default '{}'::jsonb;

-- App settings page groups & connected websites JSON fallbacks
alter table app_settings add column if not exists page_groups jsonb default '[]'::jsonb;
alter table app_settings add column if not exists connected_websites jsonb default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- Cross-Channel WhatsApp Gateway & B.AI / Custom OpenAI Schema
-- ---------------------------------------------------------------------------

-- WhatsApp Gateway configuration (Evolution API / WhatsApp Web compatible)
alter table app_settings add column if not exists whatsapp_enabled boolean not null default false;
alter table app_settings add column if not exists whatsapp_api_url text;
alter table app_settings add column if not exists whatsapp_api_key_encrypted text;
alter table app_settings add column if not exists whatsapp_instance_name text default 'yamoura-bot';
alter table app_settings add column if not exists whatsapp_target_groups jsonb default '[]'::jsonb;

-- Custom OpenAI & B.AI Base URL endpoint configuration
alter table app_settings add column if not exists openai_base_url text default 'https://api.openai.com/v1';

-- WhatsApp broadcast distribution history & log tracking
create table if not exists whatsapp_broadcast_logs (
  id uuid primary key default gen_random_uuid(),
  listing_title text,
  listing_url text,
  target_group_id text not null,
  target_group_name text,
  status text not null default 'pending', -- 'sent' | 'failed'
  response_data jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_broadcast_logs_created_idx on whatsapp_broadcast_logs (created_at desc);
create index if not exists whatsapp_broadcast_logs_status_idx on whatsapp_broadcast_logs (status);



