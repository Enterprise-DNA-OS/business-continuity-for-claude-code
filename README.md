<h1 align="center">Business Continuity for Claude Code</h1>

<p align="center">
  <strong>The open-source business continuity register that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Onspring data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=onspring">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/onspring?utm_source=github&utm_medium=readme&utm_campaign=onspring">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-onspring">Instead of Onspring</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Business Continuity for Claude Code handles continuity planning records, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and you can add questions across your own records. Onspring also supports configurable analytics.

Onspring quotes its licence and platform price privately. The selection research found a reported five-figure annual buyer benchmark, but no verified NZ/AU invoice or continuity-only quote. We do not present a benchmark as your price. [Vendor pricing](https://onspring.com/platform/pricing/), checked 12 October 2026.

Want the same thing with a web front end, or built on a different stack? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=onspring).

This is a continuity planning and evidence register for a trusted operations coordinator. It links critical services to recovery plans, dependencies, exercises and corrective actions. It does not dispatch an emergency response, restore backups or replace the rest of the Onspring suite. Omni by Enterprise DNA adds your team access, screens and connections for a setup fee, then a retainer.

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Sixty seconds, no database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/business-continuity-for-claude-code.git
cd business-continuity-for-claude-code
npm install
npm run demo
```

Then open the folder in Claude Code and type a slash command. Start with `/attention`. For real work, set an empty DATA_DIR and run migrate without loading the demo seed.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

| Command | Job |
|---|---|
| `/services` | Read service owners, impacts and recovery objectives |
| `/plans` | Read plan versions, approvals and review dates |
| `/dependencies` | Read suppliers, systems and recovery workarounds |
| `/recovery-priorities` | Prioritise services by their recovery deadline |
| `/dependency-gaps` | Find dependencies slower than the service they support |
| `/shared-dependencies` | Find suppliers and systems shared by several services |
| `/plan-readiness` | Review approval, exercise evidence and open actions |
| `/exercise-calendar` | Plan the next continuity exercises |
| `/exercises` | Review measured recovery and data loss |
| `/actions` | Read corrective actions and completion evidence |
| `/owner-workload` | Compare open and overdue actions by owner |
| `/review-due` | Prepare the next month of plan reviews |
| `/attention` | Find late, unowned and unapproved work |
| `/compliance` | Check continuity record completeness against cited guidance |
| `/history` | Read attributed record changes |
| `/show` | Read one record and its full change history |
| `/add` | Add a service, plan, dependency or corrective action |
| `/update` | Revise a record and invalidate affected plan approval |
| `/log` | Record an attributed plan note |
| `/approve-plan` | Approve a tested plan after its high priority gaps close |
| `/record-exercise` | Record an exercise against versioned recovery objectives |
| `/raise-action` | Assign a corrective action from a plan or exercise |
| `/close-action` | Verify action evidence as someone other than its owner |
| `/import` | Rehearse and import saved Onspring records |
| `/export` | Export every record, note and change log |
| `/weekly-review` | Draft the weekly continuity review |
| `/draft-recovery-pack` | Draft recovery priorities and unresolved gaps |
| `/draft-exercise-report` | Draft exercise results and corrective action follow-up |
| `/help` | Read supported commands and editable fields |
| `/customise` | Change a field or policy with a tested migration |
| `/new-view` | Add a branded read-only report |

## Instead of onspring

Save the Onspring reports for your services, plans, dependencies and actions. Map the columns and run `npm run continuity -- import onspring --dir=exports --actor="Your name" --dry-run`. Compare counts, then remove `--dry-run`. Saved report JSON is also supported. [Switching guide](docs/replace-onspring.md).

## Architecture

```
business-continuity-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/                  the CLI the commands drive
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema
  supabase/seed.sql         demo data
  docs/                     the thesis and the migration guide
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Business Continuity for Claude Code for your business, migrates your Onspring data, connects it to the rest of your tools, and runs it for you as part of **Omni**, our managed Command Center. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=onspring)
- Read more: [enterprisedna.co/omni/instead-of/onspring](https://enterprisedna.co/omni/instead-of/onspring?utm_source=github&utm_medium=readme&utm_campaign=onspring)

## License

MIT. Copyright (c) 2026 Enterprise DNA.

## Record controls

All CLI commands accept `--json`. Writes require `--actor`, an audit label rather than authentication. Name matching is case insensitive and partial UUIDs work. Ambiguous matches list candidates and exit 1. Editing a plan, service or dependency changes the plan version and clears approval. Approval needs complete instructions, future review dates, no dependency gaps, no high priority open actions and a passed exercise for the current version. Exercise results retain the objectives used at the time. Direct database access can bypass CLI workflow controls.

`npm run view` renders two read-only reports. `npm run docs` produces a recovery plan per service and an exercise report per exercise from `brand.json`. No messages are sent. Store reviewed copies where staff can reach them during an outage.

## Ten questions to ask of your records

These queries work today. Onspring has configurable reporting too; no claim is made that its platform cannot produce equivalent analysis.

1. Which services must recover first? `recovery-priorities`
2. Which dependencies take longer to restore than their service allows? `dependency-gaps`
3. Which supplier or system supports more than one service? `shared-dependencies`
4. Which services have no plan? `attention`
5. Which plans have no exercise for their latest version? `compliance`
6. Which exercises missed the data loss target even if recovery was fast? `exercises`
7. Which high priority actions are still open? `actions`
8. Which owner carries the most overdue actions? `owner-workload`
9. Which plan reviews fall due in the next month? `review-due`
10. Who changed a recovery objective or approved a plan? `history`

## Your first hour: ten things to ask for

1. Put our business name and logo in brand.json.
2. Create our critical service register.
3. Record our recovery and data loss targets.
4. Rehearse our Onspring report import.
5. Compare source IDs and counts before importing.
6. Show dependencies slower than our recovery target.
7. Assign our overdue plan reviews.
8. Record an exercise with its measured results.
9. Draft our recovery plan and exercise report.
10. Add our alternate site field using /customise.

## Validation

`npm test` creates a temporary database, migrates and seeds twice, exercises every CLI command, checks failed approvals and import rollback, then renders reports. GitHub Actions runs the same suite on Windows and Linux plus disposable Postgres. Local tests never use DATABASE_URL from your working environment; TEST_DATABASE_URL must name an empty disposable database.
