insert into services(id,name,owner,site,criticality,rto_hours,rpo_hours,max_outage_hours,impact) values
('10000000-0000-4000-8000-000000000001','Customer dispatch','Mere','Auckland','critical',4,1,8,'Unshipped orders delay customers'),
('10000000-0000-4000-8000-000000000002','Client advice','Aroha','Wellington','high',8,4,24,'Missed client commitments'),
('10000000-0000-4000-8000-000000000003','Supplier ordering','','Auckland','normal',24,8,48,'Stock replenishment stops') on conflict do nothing;
insert into plans(id,service_id,name,owner,activation,recovery_steps,communications,contact_role,review_due,exercise_due) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Dispatch recovery','Mere','Warehouse unavailable for one hour','Confirm staff safety; divert orders to Hamilton; restore order list from backup','Operations lead briefs customers after impact assessment','Duty operations lead',current_date-5,current_date-12),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Advice recovery','Aroha','Office or file service unavailable','Confirm staff safety; use approved alternate workspace; restore reviewed case list','Practice principal prepares client update','Practice principal',current_date+45,current_date+30) on conflict do nothing;
insert into dependencies(id,service_id,name,kind,owner,recovery_hours,workaround,evidence,verified_on) values
('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Order archive','system','James',6,'Approved paper picking lists','Fictional restore rehearsal',current_date-200),
('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Freight partner','supplier','Mere',3,'Alternate carrier','','2025-01-01'),
('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Client archive','system','Aroha',4,'Approved encrypted copy','Fictional restore log',current_date-10) on conflict do nothing;
insert into exercises(id,plan_id,name,scenario,plan_version,exercised_on,recovery_hours,data_loss_hours,target_rto,target_rpo,outcome,evidence,lessons,actor) values
('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Warehouse outage rehearsal','Loss of warehouse access',1,current_date-40,6,2,4,1,'failed','Fictional exercise log','Archive restore exceeded target','James') on conflict do nothing;
insert into actions(id,plan_id,exercise_id,name,owner,due_date,severity) values
('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Prove faster archive restore','James',current_date-7,'high'),
('50000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002',null,'Confirm alternate workspace','Aroha',current_date+14,'normal') on conflict do nothing;
