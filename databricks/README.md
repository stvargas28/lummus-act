# ACT Databricks

This folder holds the Databricks-side scaffold for ACT. The React app remains in `src/`; Databricks owns FusionLive ingestion, ACT transformations, alert computation, and dashboard/API serving tables.

## Intended Workspace Layout

Start in a sandbox schema:

```sql
USE CATALOG lum_databricks_dev_es1_ws;
USE SCHEMA act_dev;
```

The setup SQL keeps medallion intent in table names so the model can later promote cleanly:

```text
act_dev.bronze_* -> bronze.act_*
act_dev.silver_* -> silver.act_*
act_dev.gold_*   -> gold.act_*
```

## Notebook Mapping

`sql/ACT_Databricks_Schema_v1.sql` is intended to become the first Databricks setup notebook:

```text
ACT_Setup_Schema
```

Proposed ACT notebook set:

```text
ACT_Setup_Schema
ACT_Config_FusionLive
ACT_Functions_FusionLive
ACT_Discovery_FusionLive
ACT_Automation_FusionLive
ACT_Silver_Transform
ACT_Gold_Dashboard
ACT_Alert_Engine
```

## Access Needed

Ask a Databricks workspace owner to create:

```text
lum_databricks_dev_es1_ws.act_dev
```

Then grant:

```text
USE SCHEMA
CREATE TABLE
MODIFY
SELECT
```

The schema should be run only after `act_dev` exists.
