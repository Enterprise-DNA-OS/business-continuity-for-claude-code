#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const entities={
 services:['name','owner','site','criticality','rto_hours','rpo_hours','max_outage_hours','impact'],
 plans:['service_id','name','owner','activation','recovery_steps','communications','contact_role','review_due','exercise_due'],
 dependencies:['service_id','name','kind','owner','recovery_hours','workaround','evidence','verified_on'],
 actions:['plan_id','name','owner','due_date','severity'],exercises:[]
};
export const reads={
 services:'select id,name,owner,site,criticality,rto_hours,rpo_hours,max_outage_hours,impact from services order by name',
 plans:'select p.id,p.name,s.name service,p.owner,p.version,p.status,p.review_due,p.exercise_due from plans p join services s on s.id=p.service_id order by p.name',
 dependencies:'select d.id,s.name service,d.name,d.kind,d.owner,d.recovery_hours,d.workaround,d.verified_on from dependencies d join services s on s.id=d.service_id order by s.name,d.name',
 'recovery-priorities':'select service,owner,criticality,rto_hours,rpo_hours,max_outage_hours from readiness order by rto_hours,service',
 'dependency-gaps':'select service,dependency,kind,rto_hours,recovery_hours,gap_hours,verified_on from dependency_gaps order by gap_hours desc,service,dependency',
 'shared-dependencies':"select lower(name) dependency,count(distinct service_id)::int affected_services,string_agg(distinct owner,', ' order by owner) owners,max(recovery_hours) worst_recovery_hours from dependencies group by lower(name) having count(distinct service_id)>1 order by dependency",
 'plan-readiness':'select service,plan,version,status,review_due,exercise_due,dependency_gaps,open_actions,latest_exercise from readiness order by service',
 'exercise-calendar':'select name,owner,exercise_due,status from plans order by exercise_due nulls first,name',
 exercises:'select e.id,p.name plan,e.name,e.plan_version,e.exercised_on,e.target_rto,e.recovery_hours,e.target_rpo,e.data_loss_hours,e.outcome,e.lessons from exercises e join plans p on p.id=e.plan_id order by e.exercised_on desc,e.name',
 actions:'select a.id,p.name plan,a.name,a.owner,a.due_date,a.severity,a.status,a.evidence from actions a join plans p on p.id=a.plan_id order by a.due_date,a.name',
 'owner-workload':"select owner,count(*)::int open_actions,count(*) filter(where due_date<current_date)::int overdue from actions where status='open' group by owner order by overdue desc,owner",
 'review-due':'select name,owner,review_due,status from plans where review_due is null or review_due<=current_date+30 order by review_due nulls first,name',
 attention:'select * from attention_items order by due_date nulls first,kind,item',
 compliance:'select * from compliance_findings order by rule,item',
 history:'select actor,action,entity,record_id,created_at from audit_log order by created_at,id'
};
export const commands=[...Object.keys(reads),'show','add','update','log','approve-plan','record-exercise','raise-action','close-action','import','export','weekly-review','draft-recovery-pack','draft-exercise-report','help'];
export function format(v){return Array.isArray(v)?v.length?table(v,Object.keys(v[0]).map(key=>({key,label:key.replaceAll('_',' ')}))):'No records.':JSON.stringify(v,null,2);}
function options(args){const a=[],o={};for(const s of args){if(s.startsWith('--')){const i=s.indexOf('='),k=(i<0?s.slice(2):s.slice(2,i)).replaceAll('-','_');if(k in o)throw Error(`Duplicate option ${k}`);o[k]=i<0?true:s.slice(i+1);}else a.push(s);}return {a,o};}
function need(o,k){if(o[k]===undefined||o[k]===true||!String(o[k]).trim())throw Error(`Required --${k.replaceAll('_','-')}=<value>`);return String(o[k]).trim();}
function number(s){if(!/^\d+(\.\d+)?$/.test(String(s))||!Number.isFinite(Number(s)))throw Error('Expected a non-negative number');return Number(s);}
function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`Invalid ISO date ${s}`);return s;}
const today=()=>new Date().toISOString().slice(0,10);
const same=(a,b)=>String(a).trim().toLowerCase()===String(b).trim().toLowerCase();
function entity(t){if(!Object.hasOwn(entities,t))throw Error(`Unknown entity ${t}`);return t;}
export async function resolve(db,t,term){entity(t);if(!term)throw Error('Provide a record name or id');const rows=await db.query(`select * from ${t} where lower(name)=lower($1) or starts_with(id::text,lower($1)) order by id`,[term]);if(rows.length!==1)throw Error(`${rows.length?'Ambiguous':'No matching'} ${t}: ${term}\n${format(rows.map(r=>({id:r.id,name:r.name})))}`);return rows[0];}
async function locked(db,t,term){const r=await resolve(db,t,term);return (await db.query(`select * from ${t} where id=$1 for update`,[r.id]))[0];}
async function tx(db,fn,dry=false){await db.exec('begin');try{const r=await fn();await db.exec(dry?'rollback':'commit');return r;}catch(e){await db.exec('rollback');throw e;}}
async function insert(db,t,f){const keys=Object.keys(f);return (await db.query(`insert into ${t}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(f)))[0];}
async function audit(db,actor,action,t,before,after){await insert(db,'audit_log',{actor,action,entity:t,record_id:after?.id||before?.id||null,before_data:before?JSON.stringify(before):null,after_data:after?JSON.stringify(after):null});}
async function invalidate(db,serviceId,actor){const [p]=await db.query('select * from plans where service_id=$1 for update',[serviceId]);if(!p)return;const [next]=await db.query("update plans set status='draft',version=version+1,approved_by=null,approved_at=null where id=$1 returning *",[p.id]);await audit(db,actor,'invalidate-approval','plans',p,next);}
async function revokeForAction(db,planId,actor){const [p]=await db.query("select * from plans where id=$1 and status='approved' for update",[planId]);if(!p)return;const [after]=await db.query("update plans set status='draft',approved_by=null,approved_at=null where id=$1 returning *",[planId]);await audit(db,actor,'high-action-invalidates-approval','plans',p,after);}
async function fields(db,t,o){const f={};for(const [k,v] of Object.entries(o)){
 if(['actor','json'].includes(k))continue;
 if(k==='service'&&entities[t].includes('service_id')){f.service_id=(await resolve(db,'services',need(o,k))).id;continue;}
 if(k==='plan'&&entities[t].includes('plan_id')){f.plan_id=(await resolve(db,'plans',need(o,k))).id;continue;}
 if(!entities[t].includes(k)||k.endsWith('_id'))throw Error(`Unknown or protected field ${k}`);
 if(v===true)throw Error(`Missing value for ${k}`);
 f[k]=k.endsWith('_hours')?number(v):k.endsWith('_due')||k==='due_date'||k==='verified_on'?date(v):String(v).trim();
 if(k==='verified_on'&&f[k]>today())throw Error('Verification date cannot be in the future');
 }return f;}
async function writeEntity(db,t,o,term=null){entity(t);if(!entities[t].length)throw Error('Use record-exercise for exercise evidence');const actor=need(o,'actor'),f=await fields(db,t,o);let before=term?await locked(db,t,term):null;
 if(!Object.keys(f).length)throw Error('No fields supplied');
 if(before&&(('service_id' in f&&f.service_id!==before.service_id)||('plan_id' in f&&f.plan_id!==before.plan_id)))throw Error('A record cannot move to another parent');
 if(t==='actions'&&before?.status==='closed')throw Error('Closed actions cannot be edited');
 if(t==='dependencies'){if(before&&['recovery_hours','workaround'].some(k=>k in f&&String(f[k])!==String(before[k]))&&!('verified_on' in f&&'evidence' in f)){f.verified_on=null;f.evidence='';}if((f.verified_on===undefined?before?.verified_on:f.verified_on)&&!String(f.evidence??before?.evidence??'').trim())throw Error('Verification needs evidence');}
 if(t==='plans'&&before){f.version=before.version+1;f.status='draft';f.approved_by=null;f.approved_at=null;}
 let after;if(before){const keys=Object.keys(f);after=(await db.query(`update ${t} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(f),before.id]))[0];}else after=await insert(db,t,f);
 if(t==='services')await invalidate(db,after.id,actor);if(t==='dependencies')await invalidate(db,after.service_id,actor);
 if(t==='actions'&&after.severity==='high'&&after.status==='open')await revokeForAction(db,after.plan_id,actor);await audit(db,actor,before?'update':'add',t,before,after);return after;}
function reportRows(input){const columns=input.columns||input.Columns,rows=input.rows||input.Rows;if(!Array.isArray(columns)||!Array.isArray(rows)||columns.some(c=>typeof c!=='string'||!c.trim())||new Set(columns.map(c=>c.toLowerCase())).size!==columns.length)throw Error('Invalid Onspring report columns or rows');return rows.map(r=>{const cells=r.cells||r.Cells||r;if(!Array.isArray(cells)||cells.length!==columns.length)throw Error('Invalid Onspring report row width');const recordId=r.recordId??r.RecordId;return {...Object.fromEntries(columns.map((c,i)=>[c,cells[i]??''])),...(recordId!==undefined?{'Record ID':String(recordId)}:{})};});}
const imports={services:{source_id:'Record ID',name:'Name',owner:'Owner',site:'Site',criticality:'Criticality',rto_hours:'RTO Hours',rpo_hours:'RPO Hours',max_outage_hours:'Maximum Outage Hours',impact:'Impact'},plans:{source_id:'Record ID',service:'Service',name:'Name',owner:'Owner',activation:'Activation',recovery_steps:'Recovery Steps',communications:'Communications',contact_role:'Contact Role',review_due:'Review Due',exercise_due:'Exercise Due'},dependencies:{source_id:'Record ID',service:'Service',name:'Name',owner:'Owner',kind:'Kind',recovery_hours:'Recovery Hours',workaround:'Workaround',evidence:'Evidence',verified_on:'Verified On'},actions:{source_id:'Record ID',plan:'Plan',name:'Name',owner:'Owner',due_date:'Due Date',severity:'Severity'}};
async function importOnspring(db,o){const actor=need(o,'actor');if(Boolean(o.file)===Boolean(o.dir))throw Error('Use exactly one of --file or --dir');const map=o.map?JSON.parse(readFileSync(need(o,'map'),'utf8')):{};const jobs=o.dir?Object.keys(imports).filter(t=>existsSync(path.join(o.dir,`${t}.csv`))).map(t=>[t,path.join(o.dir,`${t}.csv`)]):[[need(o,'entity'),need(o,'file')]];if(!jobs.length)throw Error('No import files found');
 return tx(db,async()=>{await db.query('select pg_advisory_xact_lock(718329)');const results=[];for(const [t,file] of jobs){if(!Object.hasOwn(imports,t))throw Error('Unsupported import entity');const raw=readFileSync(file,'utf8');const rows=file.endsWith('.json')?reportRows(JSON.parse(raw)):parseCsv(raw);if(!rows.length)throw Error('Import file is empty');const mapping={...imports[t],...(map[t]||{})};for(const k of Object.keys(mapping))if(!Object.hasOwn(imports[t],k))throw Error(`Unknown mapping field ${k}`);let added=0,skipped=0;const ids=new Set();for(const row of rows){const source=String(pick(row,mapping.source_id)).trim();if(!source)throw Error('Every row needs Record ID');if(ids.has(source))throw Error(`Duplicate source id ${source}`);ids.add(source);const [old]=await db.query(`select id from ${t} where source_id=$1`,[source]);if(old){skipped++;continue;}const f={actor};for(const [k,h] of Object.entries(mapping)){if(k==='source_id')continue;const v=pick(row,h);if(v!==''&&v!==null&&v!==undefined){if(typeof v==='object')throw Error(`Column ${h} needs formatted text, not an object`);f[k]=String(v);}}const r=await writeEntity(db,t,f);await db.query(`update ${t} set source_id=$1 where id=$2`,[source,r.id]);added++;}results.push({entity:t,rows:rows.length,added,skipped});}return {dry_run:Boolean(o.dry_run),results,policy:'Existing source IDs are skipped; imported plans stay draft. Reconcile counts before cutover.'};},Boolean(o.dry_run));}
export async function execute(db,args){const {a,o}=options(args),[cmd='help',t,term]=a;
 if(Object.hasOwn(reads,cmd))return db.query(reads[cmd]);
 if(cmd==='help')return {usage:'npm run continuity -- <command> [--field=value] [--json]',commands,entities,import:'import onspring --dir=exports --actor=Name --dry-run; or --entity=services --file=report.json',controls:'Writes require --actor. Dates YYYY-MM-DD. Actor is an audit label, not authentication.'};
 if(cmd==='show'){const r=await resolve(db,t,term);return {...r,history:await db.query('select * from audit_log where record_id=$1 order by created_at,id',[r.id]),...(t==='plans'?{notes:await db.query('select actor,body,created_at from notes where plan_id=$1 order by created_at,id',[r.id])}:{})};}
 if(cmd==='import'){if(t!=='onspring')throw Error('Use import onspring');return importOnspring(db,o);}
 if(cmd==='export'){const out={version:1,exported_at:new Date().toISOString()};for(const tableName of [...Object.keys(entities),'notes','audit_log'])out[tableName]=await db.query(`select * from ${tableName} order by id`);if(o.file){const file=path.resolve(need(o,'file'));mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,JSON.stringify(out,null,2)+'\n',{flag:'wx'});return {file,counts:Object.fromEntries(Object.entries(out).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length]))};}return out;}
 if(['weekly-review','draft-recovery-pack','draft-exercise-report'].includes(cmd)){const names=cmd==='draft-exercise-report'?['exercises','actions','owner-workload']:['recovery-priorities','plan-readiness','dependency-gaps','attention','compliance'];const sections=[];for(const n of names)sections.push(`## ${n}\n\n${format(await db.query(reads[n]))}`);const content=`# ${cmd.replaceAll('-',' ')}\n\nDraft for review. Demo records are fictional. Not an emergency notification or certification.\n\n${sections.join('\n\n')}\n`;const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');mkdirSync(dir,{recursive:true});const file=path.join(dir,`${cmd}-${Date.now()}.md`);writeFileSync(file,content,{flag:'wx'});return {file,content};}
 if(!commands.includes(cmd))throw Error(`Unknown command ${cmd}`);const actor=need(o,'actor');
 return tx(db,async()=>{
 // A single advisory transaction lock serializes workflow writes on a shared database.
 await db.query('select pg_advisory_xact_lock(718329)');
 if(cmd==='add'||cmd==='update')return writeEntity(db,t,o,cmd==='update'?term:null);
 if(cmd==='close-action'){const action=await locked(db,'actions',t);if(action.status==='closed')throw Error('Action already closed');if(same(action.owner,actor))throw Error('A different person must verify action completion');if(!action.owner.trim())throw Error('Assign an action owner first');const evidence=need(o,'evidence');const [after]=await db.query("update actions set status='closed',evidence=$1,closed_by=$2,closed_at=now() where id=$3 returning *",[evidence,actor,action.id]);await audit(db,actor,cmd,'actions',action,after);return after;}
 const p=await locked(db,'plans',t);const [s]=await db.query('select * from services where id=$1 for update',[p.service_id]);
 if(cmd==='log'){const r=await insert(db,'notes',{plan_id:p.id,actor,body:need(o,'body')});await audit(db,actor,cmd,'notes',null,r);return r;}
 if(cmd==='raise-action'){let exercise_id=null;if(o.exercise){const e=await resolve(db,'exercises',need(o,'exercise'));if(e.plan_id!==p.id)throw Error('Exercise belongs to another plan');exercise_id=e.id;}const r=await insert(db,'actions',{plan_id:p.id,exercise_id,name:need(o,'name'),owner:need(o,'owner'),due_date:date(need(o,'due')),severity:o.severity||'high'});if(r.severity==='high')await revokeForAction(db,p.id,actor);await audit(db,actor,cmd,'actions',null,r);return r;}
 if(cmd==='record-exercise'){const exercised=date(need(o,'date'));if(exercised>today())throw Error('Exercise date cannot be in the future');const recovery=number(need(o,'recovery')),loss=number(need(o,'data_loss'));const r=await insert(db,'exercises',{plan_id:p.id,name:need(o,'name'),scenario:need(o,'scenario'),plan_version:p.version,exercised_on:exercised,recovery_hours:recovery,data_loss_hours:loss,target_rto:s.rto_hours,target_rpo:s.rpo_hours,outcome:recovery<=Number(s.rto_hours)&&loss<=Number(s.rpo_hours)?'passed':'failed',evidence:need(o,'evidence'),lessons:need(o,'lessons'),actor});if(r.outcome==='failed'){await db.query("update plans set status='draft',approved_by=null,approved_at=null where id=$1",[p.id]);await audit(db,actor,'failed-exercise-invalidates-approval','plans',p,(await db.query('select * from plans where id=$1',[p.id]))[0]);}await audit(db,actor,cmd,'exercises',null,r);return r;}
 if(cmd==='approve-plan'){
 if(p.status==='approved')throw Error('Plan already approved');if(same(p.owner,actor))throw Error('A different person must approve the plan');
 if([p.owner,p.activation,p.recovery_steps,p.communications,p.contact_role,s.owner,s.impact].some(v=>!String(v).trim()))throw Error('Complete owners, impact and recovery instructions first');
 if(!p.review_due||!p.exercise_due||p.review_due<=today()||p.exercise_due<=today())throw Error('Set future review and exercise dates before approval');
 const [g]=await db.query('select count(*)::int n from dependency_gaps where service_id=$1',[s.id]);if(g.n)throw Error('Resolve dependency gaps before approval');
 const [high]=await db.query("select count(*)::int n from actions where plan_id=$1 and severity='high' and status='open'",[p.id]);if(high.n)throw Error('Close high priority actions before approval');
 const [last]=await db.query('select * from exercises where plan_id=$1 and plan_version=$2 order by exercised_on desc,created_at desc,id limit 1',[p.id,p.version]);if(!last||last.outcome!=='passed')throw Error('Latest exercise for this version must pass');
 const [after]=await db.query("update plans set status='approved',approved_by=$1,approved_at=now() where id=$2 returning *",[actor,p.id]);await audit(db,actor,cmd,'plans',p,after);return after;
 }
 throw Error(`Unsupported command ${cmd}`);
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const r=await execute(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(r,null,2):format(r));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
