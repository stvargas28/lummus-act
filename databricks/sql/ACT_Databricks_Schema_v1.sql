-- ACT Databricks Schema v1
-- Target sandbox: lum_databricks_dev_es1_ws.act_dev
--
-- This schema is intentionally sandbox-first. It keeps bronze/silver/gold
-- intent in table names so the model can later promote cleanly to shared
-- medallion schemas:
--   act_dev.bronze_* -> bronze.act_*
--   act_dev.silver_* -> silver.act_*
--   act_dev.gold_*   -> gold.act_*
--
-- Before running:
--   1. Ask a workspace owner to create lum_databricks_dev_es1_ws.act_dev.
--   2. Ask for USE SCHEMA, CREATE TABLE, MODIFY, and SELECT on act_dev.
--
-- Optional admin-only setup:
-- CREATE SCHEMA IF NOT EXISTS lum_databricks_dev_es1_ws.act_dev;

USE CATALOG lum_databricks_dev_es1_ws;
USE SCHEMA act_dev;

-- ---------------------------------------------------------------------------
-- Core project configuration
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
  act_project_id STRING COMMENT 'ACT project key. Internal stable ID.',
  project_name STRING,
  fusion_workspace_id STRING COMMENT 'FusionLive workspace ID.',
  fusion_workspace_name STRING,
  fusion_subproject_id STRING COMMENT 'FusionLive Project Management sub-project ID, if available.',
  fusion_subproject_name STRING,
  fusion_root_folder_id STRING COMMENT 'Optional root folder for document search.',
  fusion_project_number STRING COMMENT 'Human project number such as 361325.',
  timezone STRING COMMENT 'Project local timezone, e.g. America/New_York.',
  lead_email STRING,
  pm_email STRING,
  service_account_user_id STRING COMMENT 'FusionLive service account user ID to exclude from reviewer counts.',
  contract_type STRING COMMENT 'Reserved for later templates: BASIC, ENGINEERING_ONLY, FULL_ENGINEERING, HEATER.',
  refresh_mode STRING COMMENT 'automatic, manual_only, or archived.',
  refresh_interval_minutes INT,
  work_hours_only BOOLEAN,
  active_auto_refresh BOOLEAN,
  hold_active BOOLEAN,
  hold_set_at TIMESTAMP,
  hold_set_by_user_id STRING,
  daily_digest_enabled BOOLEAN,
  daily_digest_time_local STRING COMMENT 'HH:MM project-local time.',
  last_successful_sync_at TIMESTAMP,
  last_manual_refresh_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'ACT project registry and per-project refresh/digest configuration.';

CREATE TABLE IF NOT EXISTS project_members (
  act_project_id STRING,
  user_id STRING COMMENT 'ACT internal user ID. May equal FusionLive user ID in MVP.',
  fusion_user_id STRING,
  email STRING COMMENT 'Canonical identity key across FusionLive, Entra SSO, and Teams.',
  teams_user_id STRING COMMENT 'Optional cached Teams/AAD user ID resolved by bot/Graph layer.',
  display_name STRING,
  company_name STRING,
  fusion_permit STRING COMMENT 'ADMINISTRATOR, CONTRIBUTOR, VIEWER.',
  act_role STRING COMMENT 'LEAD, PM, ENGINEER, OBSERVER.',
  active BOOLEAN,
  source STRING COMMENT 'listprojectparticipants or listusers.',
  synced_at TIMESTAMP
)
USING DELTA
COMMENT 'Normalized project members. FusionLive email is the durable join key.';

CREATE TABLE IF NOT EXISTS name_aliases (
  alias_id STRING,
  act_project_id STRING COMMENT 'Nullable for global aliases.',
  alias STRING COMMENT 'Owner text as written in Excel.',
  user_id STRING,
  fusion_user_id STRING,
  email STRING,
  confirmed_by_user_id STRING,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'Resolved owner aliases from Excel deliverable lists.';

CREATE TABLE IF NOT EXISTS sync_runs (
  run_id STRING,
  act_project_id STRING,
  trigger_type STRING COMMENT 'scheduled, manual, backfill, or test.',
  requested_by_email STRING,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status STRING COMMENT 'running, success, partial, failed.',
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  documents_seen_count BIGINT,
  reviews_seen_count BIGINT,
  participants_seen_count BIGINT,
  error_message STRING
)
USING DELTA
COMMENT 'One row per ACT sync run.';

CREATE TABLE IF NOT EXISTS sync_watermarks (
  act_project_id STRING,
  source STRING COMMENT 'documents, reviews, participants, excel.',
  last_successful_run_id STRING,
  last_successful_sync_at TIMESTAMP,
  last_source_updated_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'Per-project source watermarks for incremental sync.';

-- ---------------------------------------------------------------------------
-- Bronze: raw/near-raw source captures
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bronze_excel_deliverables_raw (
  run_id STRING,
  act_project_id STRING,
  import_id STRING,
  source_file_name STRING,
  source_sheet_name STRING,
  source_row_number INT,
  document_reference_raw STRING,
  title_raw STRING,
  discipline_raw STRING,
  owner_raw STRING,
  internal_due_raw STRING,
  client_due_raw STRING,
  raw_row_json STRING,
  parsed_at TIMESTAMP
)
USING DELTA
COMMENT 'Raw Excel deliverable rows uploaded by Lead.';

CREATE TABLE IF NOT EXISTS bronze_fusionlive_documents_raw (
  run_id STRING,
  act_project_id STRING,
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  source_endpoint STRING COMMENT 'searchdocuments',
  request_mode STRING COMMENT 'list or detail.',
  request_xml STRING,
  response_xml STRING,
  document_id STRING,
  first_version_id STRING,
  folder_id STRING,
  folder_path STRING,
  reference STRING,
  title STRING,
  status STRING,
  pm_status STRING COMMENT 'Project Management/lifecycle status if exposed.',
  version STRING,
  islatest STRING,
  uploaded_date TIMESTAMP,
  last_updated_by STRING,
  last_updated_time TIMESTAMP,
  latest_rendition_id STRING,
  uri STRING,
  company STRING,
  file_type STRING,
  mime_type STRING,
  file_size BIGINT,
  ingestion_timestamp TIMESTAMP
)
USING DELTA
COMMENT 'Raw FusionLive document search captures plus parsed metadata fields.';

CREATE TABLE IF NOT EXISTS bronze_fusionlive_reviews_raw (
  run_id STRING,
  act_project_id STRING,
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  source_endpoint STRING COMMENT 'listreviews',
  request_type STRING COMMENT 'created_by_me, created_by_my_company, participated_by_me.',
  request_mode STRING COMMENT 'detail required for ACT.',
  request_xml STRING,
  response_xml STRING,
  review_id STRING,
  document_id STRING,
  document_reference STRING,
  document_title STRING,
  status STRING COMMENT 'OPEN, CLOSED, or FusionLive raw status.',
  originator_user_id STRING,
  originator_name STRING,
  sent_date TIMESTAMP,
  due_date TIMESTAMP,
  closed_date TIMESTAMP,
  last_audit_date TIMESTAMP,
  decision_codes_available BOOLEAN,
  raw_review_xml STRING,
  ingestion_timestamp TIMESTAMP
)
USING DELTA
COMMENT 'Raw FusionLive review detail captures.';

CREATE TABLE IF NOT EXISTS bronze_fusionlive_review_recipients_raw (
  run_id STRING,
  act_project_id STRING,
  review_id STRING,
  document_id STRING,
  recipient_user_id STRING,
  recipient_name STRING,
  recipient_email STRING,
  recipient_company STRING,
  recipient_role_raw STRING,
  is_for_information BOOLEAN COMMENT 'Nullable until FusionLive FI flag is confirmed.',
  is_read BOOLEAN,
  responded BOOLEAN,
  decision_code STRING,
  last_action_date TIMESTAMP,
  raw_recipient_xml STRING,
  ingestion_timestamp TIMESTAMP
)
USING DELTA
COMMENT 'Raw reviewer/recipient rows parsed from listreviews detail mode.';

CREATE TABLE IF NOT EXISTS bronze_fusionlive_review_comments_raw (
  run_id STRING,
  act_project_id STRING,
  review_id STRING,
  document_id STRING,
  comment_id STRING,
  comment_by_user_id STRING,
  comment_by_name STRING,
  comment_by_email STRING,
  comment_date TIMESTAMP,
  comment_text STRING,
  raw_comment_xml STRING,
  ingestion_timestamp TIMESTAMP
)
USING DELTA
COMMENT 'Raw review comments. Used to determine reviewer response.';

CREATE TABLE IF NOT EXISTS bronze_fusionlive_review_audits_raw (
  run_id STRING,
  act_project_id STRING,
  review_id STRING,
  document_id STRING,
  audit_id STRING,
  audit_type STRING,
  audit_by_user_id STRING,
  audit_by_name STRING,
  audit_by_email STRING,
  audit_date TIMESTAMP,
  raw_audit_xml STRING,
  ingestion_timestamp TIMESTAMP
)
USING DELTA
COMMENT 'Raw review audit events. Used for idle-time calculations.';

CREATE TABLE IF NOT EXISTS bronze_project_participants_raw (
  run_id STRING,
  act_project_id STRING,
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  source_endpoint STRING COMMENT 'listprojectparticipants or listusers.',
  response_xml STRING,
  fusion_user_id STRING,
  display_name STRING,
  email STRING,
  company_name STRING,
  permit STRING,
  active STRING,
  raw_user_xml STRING,
  ingestion_timestamp TIMESTAMP
)
USING DELTA
COMMENT 'Raw FusionLive project participants/users for membership and SSO mapping.';

-- ---------------------------------------------------------------------------
-- Silver: normalized ACT model
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS silver_project_members (
  act_project_id STRING,
  user_id STRING,
  fusion_user_id STRING,
  email STRING,
  teams_user_id STRING,
  display_name STRING,
  company_name STRING,
  fusion_permit STRING,
  act_role STRING,
  is_pm BOOLEAN,
  is_lead BOOLEAN,
  active BOOLEAN,
  synced_run_id STRING,
  synced_at TIMESTAMP
)
USING DELTA
COMMENT 'Clean project membership and role mapping.';

CREATE TABLE IF NOT EXISTS silver_documents_latest (
  act_project_id STRING,
  fusion_document_id STRING,
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  folder_id STRING,
  folder_path STRING,
  reference STRING,
  normalized_reference STRING,
  title STRING,
  discipline STRING,
  revision STRING,
  fusion_status STRING,
  fusion_pm_status STRING,
  uploaded_date TIMESTAMP,
  last_updated_by STRING,
  last_updated_time TIMESTAMP,
  latest_rendition_id STRING,
  view_url STRING,
  viewer_kind STRING COMMENT 'rendition, native, detail, or none.',
  is_latest BOOLEAN,
  synced_run_id STRING,
  synced_at TIMESTAMP
)
USING DELTA
COMMENT 'Latest FusionLive document snapshot by ACT project/document.';

CREATE TABLE IF NOT EXISTS silver_deliverables (
  deliverable_id STRING,
  act_project_id STRING,
  source_import_id STRING,
  document_reference STRING,
  normalized_reference STRING,
  title STRING,
  discipline STRING,
  owner_user_id STRING,
  owner_email STRING,
  owner_source STRING COMMENT 'excel, alias, manual, fusionlive, unresolved.',
  previous_owner_user_id STRING,
  engineer_progress_percent INT,
  lead_private_note STRING,
  internal_due DATE,
  client_due DATE,
  client_reply_due DATE,
  fusion_document_id STRING,
  fusion_pm_status STRING,
  ready_for_issue_confirmed BOOLEAN,
  document_type STRING,
  is_3d_model BOOLEAN,
  hold_active BOOLEAN,
  hold_set_at TIMESTAMP,
  hold_set_by_user_id STRING,
  review_created_by_act BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'ACT deliverable master after Excel parsing and owner alias resolution.';

CREATE TABLE IF NOT EXISTS silver_deliverable_matches (
  match_id STRING,
  act_project_id STRING,
  deliverable_id STRING,
  document_reference STRING,
  fusion_document_id STRING,
  fusion_reference STRING,
  match_status STRING COMMENT 'matched, fuzzy, unmatched, manual_confirmed, rejected.',
  match_confidence DOUBLE,
  match_reason STRING,
  needs_lead_review BOOLEAN,
  confirmed_by_user_id STRING,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'Excel deliverable to FusionLive document matching results.';

CREATE TABLE IF NOT EXISTS silver_reviews_latest (
  review_id STRING,
  act_project_id STRING,
  deliverable_id STRING,
  fusion_review_id STRING,
  fusion_document_id STRING,
  document_reference STRING,
  status STRING COMMENT 'OPEN or CLOSED after normalization.',
  originator_user_id STRING,
  originator_email STRING,
  originator_name STRING,
  sent_date TIMESTAMP,
  due_date TIMESTAMP,
  closed_date TIMESTAMP,
  last_audit_date TIMESTAMP,
  latest_activity_at TIMESTAMP,
  decision_codes_available BOOLEAN,
  review_url STRING,
  synced_run_id STRING,
  synced_at TIMESTAMP
)
USING DELTA
COMMENT 'Latest normalized FusionLive reviews.';

CREATE TABLE IF NOT EXISTS silver_review_recipients_latest (
  review_id STRING,
  act_project_id STRING,
  deliverable_id STRING,
  fusion_review_id STRING,
  fusion_document_id STRING,
  recipient_user_id STRING,
  recipient_email STRING,
  recipient_display_name STRING,
  is_for_information BOOLEAN,
  is_read BOOLEAN,
  responded BOOLEAN,
  decision_code STRING,
  last_action_date TIMESTAMP,
  pending BOOLEAN,
  synced_run_id STRING,
  synced_at TIMESTAMP
)
USING DELTA
COMMENT 'Normalized review recipients. Pending reviewers drive Alert 4.';

CREATE TABLE IF NOT EXISTS silver_deliverable_phases (
  deliverable_id STRING,
  act_project_id STRING,
  act_phase STRING COMMENT 'NOT_STARTED, DRAFT, UNDER_REVIEW, REVISING, READY_FOR_ISSUE, ISSUED.',
  phase_reason STRING,
  internal_overdue BOOLEAN,
  client_overdue BOOLEAN,
  risk_level STRING COMMENT 'none, low, medium, high.',
  risk_flags ARRAY<STRING>,
  completeness_phase_proxy INT,
  review_cycle_count INT,
  open_review_id STRING,
  latest_review_id STRING,
  latest_review_status STRING,
  pending_count INT,
  last_activity_at TIMESTAMP,
  idle_business_days DOUBLE,
  computed_run_id STRING,
  computed_at TIMESTAMP
)
USING DELTA
COMMENT 'Computed phase and risk state per deliverable.';

CREATE TABLE IF NOT EXISTS deliverable_history (
  history_id STRING,
  deliverable_id STRING,
  act_project_id STRING,
  changed_by_user_id STRING,
  changed_by_email STRING,
  field_changed STRING,
  old_value STRING,
  new_value STRING,
  change_reason STRING,
  changed_at TIMESTAMP
)
USING DELTA
COMMENT 'Audit trail for ACT-side Lead/PM edits.';

-- ---------------------------------------------------------------------------
-- Gold: dashboard/API/notification serving layer
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gold_dashboard_deliverables (
  deliverable_id STRING,
  act_project_id STRING,
  document_reference STRING,
  title STRING,
  discipline STRING,
  owner_user_id STRING,
  owner_email STRING,
  owner_display_name STRING,
  owner_missing BOOLEAN,
  internal_due DATE,
  client_due DATE,
  act_phase STRING,
  phase_label STRING,
  phase_reason STRING,
  risk_level STRING,
  risk_flags ARRAY<STRING>,
  internal_overdue BOOLEAN,
  client_overdue BOOLEAN,
  fusion_document_id STRING,
  fusion_reference STRING,
  fusion_revision STRING,
  fusion_pm_status STRING,
  view_url STRING,
  viewer_kind STRING,
  open_review_id STRING,
  latest_review_id STRING,
  latest_review_status STRING,
  open_review_url STRING,
  pending_count INT,
  pending_reviewers_json STRING COMMENT 'Compact JSON array for API response.',
  last_activity_at TIMESTAMP,
  idle_business_days DOUBLE,
  hold_active BOOLEAN,
  is_3d_model BOOLEAN,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'Dashboard/API-ready deliverable rows.';

CREATE TABLE IF NOT EXISTS gold_project_summary (
  act_project_id STRING,
  generated_at TIMESTAMP,
  data_as_of DATE,
  deliverable_count BIGINT,
  phase_counts_json STRING,
  risk_counts_json STRING,
  alert_counts_json STRING,
  needs_attention_count BIGINT,
  active_alert_count BIGINT,
  last_successful_sync_at TIMESTAMP
)
USING DELTA
COMMENT 'Dashboard/API-ready project summary.';

CREATE TABLE IF NOT EXISTS gold_active_alerts (
  alert_id STRING,
  act_project_id STRING,
  deliverable_id STRING,
  alert_type STRING,
  status STRING COMMENT 'active, silenced, failed.',
  priority STRING,
  intervention_level STRING,
  recipient_user_id STRING,
  recipient_email STRING,
  recipient_display_name STRING,
  message STRING,
  delivery_surface STRING COMMENT 'teams_bot_dm or dashboard.',
  triggered_at TIMESTAMP,
  cap_expires_at TIMESTAMP,
  silenced_at TIMESTAMP,
  silence_reason STRING,
  teams_card_activity_id STRING,
  acknowledged_at TIMESTAMP,
  acknowledged_by_user_id STRING,
  view_url STRING,
  review_url STRING,
  act_url STRING,
  viewer_kind STRING,
  computed_run_id STRING
)
USING DELTA
COMMENT 'Current alert state. Enforces 24h caps and active/silenced state.';

CREATE TABLE IF NOT EXISTS gold_alert_history (
  history_id STRING,
  alert_id STRING,
  act_project_id STRING,
  deliverable_id STRING,
  alert_type STRING,
  event_type STRING COMMENT 'created, sent, acknowledged, action_clicked, silenced, failed.',
  recipient_user_id STRING,
  recipient_email STRING,
  recipient_display_name STRING,
  event_at TIMESTAMP,
  delivery_surface STRING,
  teams_card_activity_id STRING,
  event_payload_json STRING,
  resolution_reason STRING
)
USING DELTA
COMMENT 'Immutable alert and Teams card interaction log.';

CREATE TABLE IF NOT EXISTS gold_teams_delivery_queue (
  delivery_id STRING,
  act_project_id STRING,
  alert_id STRING,
  digest_id STRING,
  recipient_email STRING,
  recipient_teams_user_id STRING,
  delivery_kind STRING COMMENT 'alert_card, manual_nudge, daily_digest.',
  card_payload_json STRING,
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  status STRING COMMENT 'pending, sent, failed, skipped.',
  attempt_count INT,
  last_error STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'Queue for Azure/Teams bot delivery. Databricks computes; bot sends.';

CREATE TABLE IF NOT EXISTS gold_daily_digest_queue (
  digest_id STRING,
  act_project_id STRING,
  recipient_user_id STRING,
  recipient_email STRING,
  scheduled_for_local_date DATE,
  scheduled_for TIMESTAMP,
  digest_time_local STRING,
  summary_json STRING,
  card_payload_json STRING,
  status STRING COMMENT 'pending, sent, failed, skipped.',
  sent_at TIMESTAMP,
  teams_card_activity_id STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'Once-daily direct Teams bot digest for Lead/PM users.';

CREATE TABLE IF NOT EXISTS gold_sync_status (
  act_project_id STRING,
  sync_state STRING COMMENT 'synced, syncing, stale, error.',
  last_successful_sync_at TIMESTAMP,
  last_attempted_sync_at TIMESTAMP,
  last_error_at TIMESTAMP,
  last_error_message STRING,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'API-ready sync status for the ACT topbar.';

-- ---------------------------------------------------------------------------
-- Helpful starter views
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW vw_active_projects AS
SELECT *
FROM projects
WHERE active_auto_refresh = true
  AND refresh_mode = 'automatic';

CREATE OR REPLACE VIEW vw_pending_reviewers AS
SELECT
  r.act_project_id,
  r.deliverable_id,
  r.review_id,
  r.fusion_review_id,
  rr.recipient_user_id,
  rr.recipient_email,
  rr.recipient_display_name,
  rr.is_read,
  rr.responded,
  r.latest_activity_at,
  r.status
FROM silver_reviews_latest r
JOIN silver_review_recipients_latest rr
  ON r.review_id = rr.review_id
WHERE r.status = 'OPEN'
  AND coalesce(rr.is_for_information, false) = false
  AND coalesce(rr.responded, false) = false;

