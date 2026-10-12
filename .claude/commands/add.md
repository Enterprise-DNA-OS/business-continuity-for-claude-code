---
description: Add a service, plan, dependency or corrective action
---

1. Read CLAUDE.md and docs/compliance.md. Use the operator's records and identity. Never invent evidence.
2. Read the affected record first, then run:

```bash
npm run continuity -- add services --name="Dispatch" --owner="Mere" --rto-hours=4 --rpo-hours=1 --max-outage-hours=8 --impact="Orders delayed" --actor="Mere" --json
```

3. Replace example names, dates and values with the operator supplied facts. Show the returned result and explain any failed check.
4. Never send, dispatch staff or notify emergency services. Drafts remain local.
