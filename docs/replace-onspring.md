# Move continuity records from Onspring

This base imports continuity records, not an entire Onspring installation. Onspring applications and report columns are configurable. Confirm the mapping before cutover.

## Get the records out

Ask your Onspring administrator for saved, formatted report data for services, plans, dependencies and actions, including stable Record IDs. The vendor SDK documents `GetReportAsync`, `ReportData.Columns` and `ReportData.Rows`; each row carries a RecordId and Cells. It requires an authorised administrator to retrieve data. This importer reads a saved file and never connects to Onspring or asks for a credential.

Sources checked 12 October 2026: [vendor SDK](https://github.com/onspring-technologies/onspring-api-sdk), [report model](https://github.com/onspring-technologies/onspring-api-sdk/blob/master/Onspring.API.SDK/Models/ReportData.cs), [row model](https://github.com/onspring-technologies/onspring-api-sdk/blob/master/Onspring.API.SDK/Models/ReportDataRow.cs).

Use formatted names for owner and reference fields. Do not pass raw reference objects. Save a report as JSON for direct import or save its columns and cells as UTF-8 CSV. This is a documented report-data route, not a claimed universal CSV export button. The sample files are fictional fixtures with our chosen columns, not captured customer exports.

## One import for the mapped files

Place `services.csv`, `plans.csv`, `dependencies.csv` and `actions.csv` in an ignored `exports/` directory. Missing entity files are allowed. Services load before plans, then dependencies and actions. The import is one transaction across every file.

```bash
npm run continuity -- import onspring --dir=exports --actor="Mere" --dry-run
npm run continuity -- import onspring --dir=exports --actor="Mere"
```

For a saved report:

```bash
npm run continuity -- import onspring --entity=services --file=exports/services.json --actor="Mere" --dry-run
```

Both PascalCase and camelCase report keys are supported. Rows with Cells and RecordId, and legacy row arrays with a Record ID column, are supported. ISO dates are required. Hours are non-negative decimals, the recovery objective must be positive, and maximum outage cannot be below it.

## Mapping

The sample CSV files show the default columns. Use `--map=exports/mapping.json` to override them, following `examples/mapping.json`. Each mapping object is keyed by entity and maps our field name to your report column name. The default reference columns Service and Plan resolve against an exact name or partial UUID. Duplicate names must be reconciled first.

| File | Records carried across |
|---|---|
| services.csv | Source ID, name, owner, site, criticality, recovery and data loss targets, maximum outage, impact |
| plans.csv | Source ID, service, name, owner, activation, recovery steps, communication and contact roles, review and exercise dates |
| dependencies.csv | Source ID, service, name, kind, owner, recovery time, workaround and verification evidence |
| actions.csv | Source ID, plan, name, owner, due date and severity |

Every row needs a stable source ID. A repeated source ID is skipped, protecting local edits and approval evidence. Duplicate IDs in a single file are rejected. The summary shows added and skipped counts. Reimports are not a two-way sync and do not update changed source records.

## Reconcile before switching

Compare row counts, source IDs, all service objectives, owner assignments and parent links against Onspring. Unknown extra columns are not imported; list and map the ones you need. Imported plans remain draft. Historical approvals, exercises, attachments, messages, user permissions, rules and other Onspring modules need separate reconciliation. File names or evidence links do not copy attachment contents.

Retain the original exports and exercise documents in your controlled archive. Rehearse your critical plan with the responsible people, confirm the offline copy and agree cutover only after review. The mapped import takes one command; source export, mapping, evidence review and team transition are separate work.

Use `npm run continuity -- export --file=exports/backup.json` for a full logical snapshot, including notes and audit history. Export refuses to overwrite an existing file. Keep database backups too; the logical export is not an automated restore service.
