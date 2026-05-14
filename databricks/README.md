# ACT Databricks

This folder holds the Databricks-side scaffold for ACT. The React app remains in `src/`; Databricks owns FusionLive ingestion, ACT transformations, alert computation, and dashboard/API serving tables.

## Current Direction

AIG's preferred direction is to create a sandbox catalog for development, then promote into shared medallion layers:

```text
sandbox_catalog.bronze        # reusable raw FusionLive / source captures
sandbox_catalog.silver        # reusable cleaned FusionLive / normalized project data
sandbox_catalog.gold_lummus_act # ACT-specific serving layer
```

Long term, ACT should reuse the same production `bronze` and `silver` layers as other FusionLive work. The ACT-specific `gold` layer should contain dashboard, alert, Teams queue, and API-serving objects.

```text
bronze.fusionlive_*        # reusable across projects/products
silver.fusionlive_*        # reusable across projects/products
silver.act_*               # ACT normalized business model, reusable across ACT projects
gold_lummus_act.*          # ACT app/API/Teams serving layer
```

`sql/ACT_Databricks_Medallion_v2.sql` reflects this direction.

`sql/ACT_Databricks_Schema_v1.sql` is the earlier single-schema sandbox draft. Keep it as reference, but prefer v2 if AIG creates a sandbox catalog with medallion schemas.

## Notebook Mapping

`sql/ACT_Databricks_Medallion_v2.sql` is intended to become the first Databricks setup notebook:

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

Ask a Databricks workspace owner to create or identify a sandbox catalog, then create/grant:

```text
<sandbox_catalog>.bronze
<sandbox_catalog>.silver
<sandbox_catalog>.gold_lummus_act
```

Then grant:

```text
USE CATALOG on <sandbox_catalog>
USE SCHEMA on bronze, silver, gold_lummus_act
CREATE TABLE, MODIFY, SELECT on those schemas
```

Run the setup SQL only after the catalog/schemas exist, unless you have permission to create schemas yourself.
