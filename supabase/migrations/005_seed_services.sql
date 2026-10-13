-- Starter services (prices are placeholders: edit them in Admin > Services). Runs only if the table is empty.
insert into services(name,description,price,duration_minutes) select * from (values
('Oil change','Engine oil and filter change',800,45),
('Brake inspection and repair','Pads, rotors and brake fluid check',1500,90),
('Engine diagnostics','Computer scan and fault finding',1200,60),
('Battery testing and replacement','Battery load test and replacement',600,30),
('Tire rotation','Tire rotation and wear check',500,30),
('Suspension inspection','Shocks, springs and steering check',900,60),
('Preventive maintenance','Multi-point preventive maintenance service',2500,120),
('General mechanical repair','Repairs quoted after inspection',1000,60)) v(name,description,price,duration_minutes) where not exists(select 1 from services);
-- Two placeholder mechanics so the calendar works. Rename or delete them in Admin > Mechanics.
insert into workers(full_name,specialties,qualified_service_ids) select m.n,array['General mechanic'],(select array_agg(id) from services) from (values('Mechanic 1'),('Mechanic 2')) m(n) where not exists(select 1 from workers);
