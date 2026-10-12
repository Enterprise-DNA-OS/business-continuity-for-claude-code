# Continuity checks and their sources

Checked 12 October 2026. This is a record completeness review, not legal certification, ISO accreditation or a substitute for a workplace emergency plan. The operator owns the plan, objectives and evidence. No command contacts staff, emergency services or regulators.

## Sources

- [MBIE continuity and contingency planning](https://www.business.govt.nz/operations/prepare-for-unexpected-events/continuity-and-contingency-planning): identify critical activities, prepare alternatives, test the plan, debrief and update it. This is guidance rather than a prescribed review interval.
- [WorkSafe workplace emergency plans](https://www.worksafe.govt.nz/managing-health-and-safety/businesses/general-requirements-for-workplaces/emergency-plans/): workplaces need emergency arrangements including procedures, testing, training and communication. This software supports recording roles and exercises; it does not assess evacuation, first aid, worker training or every applicable obligation.

## Implemented checks

`npm run continuity -- compliance --json` reads `compliance_findings`.

| Rule | What the check finds | Basis |
|---|---|---|
| BCP-01 | A service has no accountable owner or impact statement | MBIE planning guidance, local record policy |
| BCP-02 | A plan lacks activation, recovery, communication or contact-role instructions | MBIE planning guidance; WorkSafe communication context |
| BCP-03 | A plan has no review date or that date has passed | MBIE update guidance, operator chosen deadline |
| BCP-04 | The current plan version has no exercise record | MBIE test and debrief guidance |
| BCP-05 | The operator chosen exercise date is absent or overdue | MBIE testing guidance |
| BCP-06 | A high priority corrective action is open | Local follow-up policy supporting MBIE debrief guidance |
| BCP-07 | A dependency exceeds the recovery objective, has no verification date or was last verified over 180 days ago | Local six-month evidence policy; MBIE contingency planning |

The 180-day interval, independent approval and action verification are local controls, not statutory deadlines. Configure them with the operator through a migration and tests. The code does not claim those intervals are required in NZ or Australia.

Approval requires another named actor, complete instructions, future review and exercise dates, no dependency gaps, no high priority open actions and a passed exercise for the current version. Exercise pass requires both recovery time and data loss to meet the stored targets. Version changes retain historical targets but require new exercise evidence. Failure clears approval. A person other than the action owner closes an action with evidence.

The actor string records attribution, not authenticated identity. This base has no access control service, signatures or tamper-proof audit store. Use it with trusted operators and protected database access. Direct database writes bypass workflow gates. Limit personal data to business roles; keep controlled contact directories and secrets elsewhere.
