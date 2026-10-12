# Business Continuity for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR BUSINESS]
- **Operator:** [YOUR NAME], [your role]
- **What matters most:** [the one or two outcomes you care about]

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
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

If an ask fits nothing here, run the CLI directly (`npm run continuity -- help`) and then propose a new command for it.

## Hard rules

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or archived.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis and the guide for moving off Onspring.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/onspring

## Continuity boundaries

This is a planning and evidence system for a trusted coordinator. Never treat an approval label as a safety certification. Read docs/compliance.md before changing a rule. Recoveries and data loss are measured in hours. An exercise belongs to one plan version. Changes need fresh evidence and another person approves the plan. Do not store credentials or personal emergency contact details here. Draft communications only.
