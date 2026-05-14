-- ACT Databricks Medallion Schema v2
--
-- Direction from AIG:
--   - develop in a sandbox catalog
--   - keep bronze and silver reusable across FusionLive projects/products
--   - keep ACT-specific app/API/Teams serving objects in a gold layer
--
-- Replace this catalog name before running.
-- Example: USE CATALOG lum_databricks_dev_es1_ws_sandbox;
USE CATALOG <sandbox_catalog_name>;

-- If you do not have schema-create permission, ask AIG to create these.
CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold_lummus_act;

-- ===========================================================================
-- BRONZE: reusable raw source captures
-- ===========================================================================

CREATE TABLE IF NOT EXISTS bronze.fusionlive_sync_runs (
  run_id STRING,
  source_system STRING COMMENT 'fusionlive',
  trigger_type STRING COMMENT 'scheduled, manual, backfill, test',
  requested_by_email STRING,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status STRING COMMENT 'running, success, partial, failed',
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  documents_seen_count BIGINT,
  reviews_seen_count BIGINT,
  participants_seen_count BIGINT,
  error_message STRING
)
USING DELTA
COMMENT 'Reusable FusionLive ingestion run log.';

CREATE TABLE IF NOT EXISTS bronze.fusionlive_sync_watermarks (
  source_key STRING COMMENT 'workspace/subproject/source identifier',
  source STRING COMMENT 'documents, reviews, participants',
  last_successful_run_id STRING,
  last_successful_sync_at TIMESTAMP,
  last_source_updated_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'Reusable FusionLive source watermarks.';

CREATE TABLE IF NOT EXISTS bronze.fusionlive_documents_raw (
  run_id STRING,
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  source_endpoint STRING COMMENT 'searchdocuments',
  request_mode STRING COMMENT 'list or detail',
  request_xml STRING,
  response_xml STRING,
  document_id STRING,
  first_version_id STRING,
  folder_id STRING,
  folder_path STRING,
  reference STRING,
  title STRING,
  status STRING,
  pm_status STRING COMMENT 'Project Management/lifecycle status if exposed',
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
  raw_document_xml STRING,
  ingestion_timestamp TIMESTAMP
)
USING DELTA
COMMENT 'Reusable raw FusionLive document search captures.';

CREATE TABLE IF NOT EXISTS bronze.fusionlive_reviews_raw (
  run_id STRING,
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  source_endpoint STRING COMMENT 'listreviews',
  request_type STRING COMMENT 'created_by_me, created_by_my_company, participated_by_me',
  request_mode STRING COMMENT 'detail required for ACT',
  request_xml STRING,
  response_xml STRING,
  review_id STRING,
  document_id STRING,
  document_reference STRING,
  document_title STRING,
  status STRING,
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
COMMENT 'Reusable raw FusionLive review captures from listreviews detail mode.';

CREATE TABLE IF NOT EXISTS bronze.fusionlive_review_recipients_raw (
  run_id STRING,
  review_id STRING,
  document_id STRING,
  recipient_user_id STRING,
  recipient_name STRING,
  recipient_email STRING,
  recipient_company STRING,
  recipient_role_raw STRING,
  is_for_information BOOLEAN COMMENT 'Null until FI flag is confirmed from API',
  is_read BOOLEAN,
  responded BOOLEAN,
  decision_code STRING,
  last_action_date TIMESTAMP,
  raw_recipient_xml STRING,
  ingestion_timestamp TIMESTAMP
)
USING DELTA
COMMENT 'Reusable raw FusionLive review recipient rows.';

CREATE TABLE IF NOT EXISTS bronze.fusionlive_review_comments_raw (
  run_id STRING,
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
COMMENT 'Reusable raw FusionLive review comments.';

CREATE TABLE IF NOT EXISTS bronze.fusionlive_review_audits_raw (
  run_id STRING,
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
COMMENT 'Reusable raw FusionLive review audit events.';

CREATE TABLE IF NOT EXISTS bronze.fusionlive_project_participants_raw (
  run_id STRING,
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  source_endpoint STRING COMMENT 'listprojectparticipants or listusers',
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
COMMENT 'Reusable raw FusionLive workspace/sub-project participants.';

-- ACT-specific source, but still bronze because the Excel file is raw input.
CREATE TABLE IF NOT EXISTS bronze.act_excel_deliverables_raw (
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
COMMENT 'Raw ACT Excel deliverable imports.';

-- ===========================================================================
-- SILVER: reusable clean FusionLive and ACT business model
-- ===========================================================================

CREATE TABLE IF NOT EXISTS silver.fusionlive_documents_latest (
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  fusion_document_id STRING,
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
  viewer_kind STRING COMMENT 'rendition, native, detail, none',
  is_latest BOOLEAN,
  synced_run_id STRING,
  synced_at TIMESTAMP
)
USING DELTA
COMMENT 'Reusable latest FusionLive document snapshot.';

CREATE TABLE IF NOT EXISTS silver.fusionlive_project_members (
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  fusion_user_id STRING,
  email STRING,
  display_name STRING,
  company_name STRING,
  fusion_permit STRING COMMENT 'ADMINISTRATOR, CONTRIBUTOR, VIEWER',
  active BOOLEAN,
  source STRING COMMENT 'listprojectparticipants or listusers',
  synced_run_id STRING,
  synced_at TIMESTAMP
)
USING DELTA
COMMENT 'Reusable normalized FusionLive workspace/sub-project members.';

CREATE TABLE IF NOT EXISTS silver.fusionlive_reviews_latest (
  fusion_workspace_id STRING,
  fusion_subproject_id STRING,
  fusion_review_id STRING,
  fusion_document_id STRING,
  document_reference STRING,
  status STRING COMMENT 'OPEN or CLOSED after normalization',
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
COMMENT 'Reusable latest FusionLive review snapshot.';

CREATE TABLE IF NOT EXISTS silver.fusionlive_review_recipients_latest (
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
COMMENT 'Reusable normalized review recipient state.';

CREATE TABLE IF NOT EXISTS silver.act_projects (
  act_project_id STRING,
  project_name STRING,
  fusion_workspace_id STRING,
  fusion_workspace_name STRING,
  fusion_subproject_id STRING,
  fusion_subproject_name STRING,
  fusion_root_folder_id STRING,
  fusion_project_number STRING,
  timezone STRING,
  lead_email STRING,
  pm_email STRING,
  service_account_user_id STRING,
  contract_type STRING,
  refresh_mode STRING COMMENT 'automatic, manual_only, archived',
  refresh_interval_minutes INT,
  work_hours_only BOOLEAN,
  active_auto_refresh BOOLEAN,
  hold_active BOOLEAN,
  hold_set_at TIMESTAMP,
  hold_set_by_user_id STRING,
  daily_digest_enabled BOOLEAN,
  daily_digest_time_local STRING,
  last_successful_sync_at TIMESTAMP,
  last_manual_refresh_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'ACT dynamic project registry.';

CREATE TABLE IF NOT EXISTS silver.act_project_members (
  act_project_id STRING,
  user_id STRING,
  fusion_user_id STRING,
  email STRING COMMENT 'Canonical identity key across FusionLive, Entra, and Teams',
  teams_user_id STRING,
  display_name STRING,
  company_name STRING,
  fusion_permit STRING,
  act_role STRING COMMENT 'LEAD, PM, ENGINEER, OBSERVER',
  is_pm BOOLEAN,
  is_lead BOOLEAN,
  active BOOLEAN,
  synced_run_id STRING,
  synced_at TIMESTAMP
)
USING DELTA
COMMENT 'ACT project members and role mapping.';

CREATE TABLE IF NOT EXISTS silver.act_deliverables (
  deliverable_id STRING,
  act_project_id STRING,
  source_import_id STRING,
  document_reference STRING,
  normalized_reference STRING,
  title STRING,
  discipline STRING,
  owner_user_id STRING,
  owner_email STRING,
  owner_source STRING COMMENT 'excel, alias, manual, fusionlive, unresolved',
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
COMMENT 'ACT deliverable master after Excel parsing and owner resolution.';

CREATE TABLE IF NOT EXISTS silver.act_deliverable_matches (
  match_id STRING,
  act_project_id STRING,
  deliverable_id STRING,
  document_reference STRING,
  fusion_document_id STRING,
  fusion_reference STRING,
  match_status STRING COMMENT 'matched, fuzzy, unmatched, manual_confirmed, rejected',
  match_confidence DOUBLE,
  match_reason STRING,
  needs_lead_review BOOLEAN,
  confirmed_by_user_id STRING,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'ACT deliverable to FusionLive document matching results.';

CREATE TABLE IF NOT EXISTS silver.act_deliverable_phases (
  deliverable_id STRING,
  act_project_id STRING,
  act_phase STRING COMMENT 'NOT_STARTED, DRAFT, UNDER_REVIEW, REVISING, READY_FOR_ISSUE, ISSUED',
  phase_reason STRING,
  internal_overdue BOOLEAN,
  client_overdue BOOLEAN,
  risk_level STRING,
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
COMMENT 'ACT computed phase and risk state per deliverable.';

-- ===========================================================================
-- GOLD: ACT-specific app/API/Teams serving layer
-- ===========================================================================

CREATE TABLE IF NOT EXISTS gold_lummus_act.dashboard_deliverables (
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
  pending_reviewers_json STRING,
  last_activity_at TIMESTAMP,
  idle_business_days DOUBLE,
  hold_active BOOLEAN,
  is_3d_model BOOLEAN,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'ACT dashboard/API-ready deliverable rows.';

CREATE TABLE IF NOT EXISTS gold_lummus_act.active_alerts (
  alert_id STRING,
  act_project_id STRING,
  deliverable_id STRING,
  alert_type STRING,
  status STRING COMMENT 'active, silenced, failed',
  priority STRING,
  intervention_level STRING,
  recipient_user_id STRING,
  recipient_email STRING,
  recipient_display_name STRING,
  message STRING,
  delivery_surface STRING COMMENT 'teams_bot_dm or dashboard',
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
COMMENT 'ACT current alert state and 24h cap basis.';

CREATE TABLE IF NOT EXISTS gold_lummus_act.alert_history (
  history_id STRING,
  alert_id STRING,
  act_project_id STRING,
  deliverable_id STRING,
  alert_type STRING,
  event_type STRING COMMENT 'created, sent, acknowledged, action_clicked, silenced, failed',
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
COMMENT 'Immutable ACT alert and Teams card interaction log.';

CREATE TABLE IF NOT EXISTS gold_lummus_act.teams_delivery_queue (
  delivery_id STRING,
  act_project_id STRING,
  alert_id STRING,
  digest_id STRING,
  recipient_email STRING,
  recipient_teams_user_id STRING,
  delivery_kind STRING COMMENT 'alert_card, manual_nudge, daily_digest',
  card_payload_json STRING,
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  status STRING COMMENT 'pending, sent, failed, skipped',
  attempt_count INT,
  last_error STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'ACT queue for Azure/Teams bot delivery.';

CREATE TABLE IF NOT EXISTS gold_lummus_act.daily_digest_queue (
  digest_id STRING,
  act_project_id STRING,
  recipient_user_id STRING,
  recipient_email STRING,
  scheduled_for_local_date DATE,
  scheduled_for TIMESTAMP,
  digest_time_local STRING,
  summary_json STRING,
  card_payload_json STRING,
  status STRING COMMENT 'pending, sent, failed, skipped',
  sent_at TIMESTAMP,
  teams_card_activity_id STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'Once-daily direct Teams bot digest for ACT Lead/PM users.';

CREATE OR REPLACE VIEW gold_lummus_act.vw_active_projects AS
SELECT *
FROM silver.act_projects
WHERE active_auto_refresh = true
  AND refresh_mode = 'automatic';

CREATE OR REPLACE VIEW gold_lummus_act.vw_pending_reviewers AS
SELECT
  r.fusion_review_id,
  r.fusion_document_id,
  r.document_reference,
  rr.recipient_user_id,
  rr.recipient_email,
  rr.recipient_display_name,
  rr.is_read,
  rr.responded,
  r.latest_activity_at,
  r.status
FROM silver.fusionlive_reviews_latest r
JOIN silver.fusionlive_review_recipients_latest rr
  ON r.fusion_review_id = rr.fusion_review_id
WHERE r.status = 'OPEN'
  AND coalesce(rr.is_for_information, false) = false
  AND coalesce(rr.responded, false) = false;

