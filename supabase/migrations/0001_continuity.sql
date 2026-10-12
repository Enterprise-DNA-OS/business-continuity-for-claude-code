create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table services (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0), owner text not null default '', site text not null default '',
 criticality text not null default 'high' check(criticality in ('critical','high','normal')),
 rto_hours numeric not null check(rto_hours>0), rpo_hours numeric not null check(rpo_hours>=0), max_outage_hours numeric not null check(max_outage_hours>=rto_hours),
 impact text not null default '', source_id text unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table plans (
 id uuid primary key default gen_random_uuid(), service_id uuid not null unique references services(id), name text not null check(length(trim(name))>0), owner text not null default '',
 activation text not null default '', recovery_steps text not null default '', communications text not null default '', contact_role text not null default '',
 review_due date, exercise_due date, version integer not null default 1 check(version>0), status text not null default 'draft' check(status in ('draft','approved')),
 approved_by text, approved_at timestamptz, source_id text unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((status='draft' and approved_by is null and approved_at is null) or (status='approved' and length(trim(approved_by))>0 and approved_at is not null))
);
create table dependencies (
 id uuid primary key default gen_random_uuid(), service_id uuid not null references services(id), name text not null check(length(trim(name))>0),
 kind text not null default 'supplier' check(kind in ('supplier','system','site','person')), owner text not null default '', recovery_hours numeric not null check(recovery_hours>=0),
 workaround text not null default '', evidence text not null default '', verified_on date, source_id text unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(service_id,name)
);
create table exercises (
 id uuid primary key default gen_random_uuid(), plan_id uuid not null references plans(id), name text not null check(length(trim(name))>0), scenario text not null,
 plan_version integer not null, exercised_on date not null, recovery_hours numeric not null check(recovery_hours>=0), data_loss_hours numeric not null check(data_loss_hours>=0),
 target_rto numeric not null, target_rpo numeric not null, outcome text not null check(outcome in ('passed','failed')), evidence text not null check(length(trim(evidence))>0),
 lessons text not null, actor text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table actions (
 id uuid primary key default gen_random_uuid(), plan_id uuid not null references plans(id), exercise_id uuid references exercises(id), name text not null check(length(trim(name))>0),
 owner text not null default '', due_date date not null, severity text not null default 'high' check(severity in ('high','normal')),
 status text not null default 'open' check(status in ('open','closed')), evidence text not null default '', closed_by text, closed_at timestamptz, source_id text unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status='open' or (length(trim(evidence))>0 and length(trim(closed_by))>0 and closed_at is not null))
);
create table notes(id uuid primary key default gen_random_uuid(),plan_id uuid not null references plans(id),actor text not null,body text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table audit_log(id uuid primary key default gen_random_uuid(), actor text not null, action text not null, entity text not null, record_id uuid, before_data jsonb, after_data jsonb, created_at timestamptz not null default now(),updated_at timestamptz not null default now());
do $$ declare t text; begin foreach t in array array['services','plans','dependencies','exercises','actions','notes','audit_log'] loop execute format('create trigger touch before update on %I for each row execute function touch_updated()',t); end loop; end $$;
create view dependency_gaps as select d.id,d.service_id,s.name service,d.name dependency,d.kind,d.owner,s.rto_hours,d.recovery_hours,d.recovery_hours-s.rto_hours gap_hours,d.workaround,d.verified_on from dependencies d join services s on s.id=d.service_id where d.recovery_hours>s.rto_hours or d.verified_on is null or d.verified_on<current_date-180;
create view readiness as select s.id,s.name service,s.owner,s.site,s.criticality,s.rto_hours,s.rpo_hours,s.max_outage_hours,p.id plan_id,p.name plan,p.version,p.status,p.review_due,p.exercise_due,
 (select count(*)::int from dependency_gaps g where g.service_id=s.id) dependency_gaps,
 (select count(*)::int from actions a where a.plan_id=p.id and a.status='open') open_actions,
 (select e.outcome from exercises e where e.plan_id=p.id and e.plan_version=p.version order by e.exercised_on desc,e.created_at desc,e.id limit 1) latest_exercise
 from services s left join plans p on p.service_id=s.id;
create view attention_items as
 select 'Missing plan' kind,s.name item,s.owner,null::date due_date from services s where not exists(select 1 from plans p where p.service_id=s.id)
 union all select 'Plan review',name,owner,review_due from plans where review_due is null or review_due<current_date
 union all select 'Exercise due',name,owner,exercise_due from plans where exercise_due is null or exercise_due<current_date
 union all select 'Unapproved plan',name,owner,review_due from plans where status='draft'
 union all select 'Overdue action',name,owner,due_date from actions where status='open' and due_date<current_date
 union all select 'Unowned service',name,owner,null::date from services where trim(owner)='';
create view compliance_findings as
 select 'BCP-01' rule,name item,'Assign an accountable process owner and impact statement' finding from services where trim(owner)='' or trim(impact)=''
 union all select 'BCP-02',name,'Complete activation, recovery, contact and communication instructions' from plans where trim(activation)='' or trim(recovery_steps)='' or trim(communications)='' or trim(contact_role)=''
 union all select 'BCP-03',name,'Review is due or no review date is recorded' from plans where review_due is null or review_due<current_date
 union all select 'BCP-04',p.name,'No exercise evidence for the current plan version' from plans p where not exists(select 1 from exercises e where e.plan_id=p.id and e.plan_version=p.version)
 union all select 'BCP-05',name,'Exercise is due or no date is recorded' from plans where exercise_due is null or exercise_due<current_date
 union all select 'BCP-06',name,'High priority corrective action remains open' from actions where severity='high' and status='open'
 union all select 'BCP-07',service||': '||dependency,'Dependency recovery exceeds objective or verification needs review' from dependency_gaps;
