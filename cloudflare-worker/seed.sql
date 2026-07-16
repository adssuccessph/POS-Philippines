INSERT OR IGNORE INTO settings (id) VALUES (1);

INSERT OR IGNORE INTO categories (id,name,image_url,display_order,is_active) VALUES
('cat-pos','POS System','',1,1),
('cat-cctv','CCTV','',2,1),
('cat-solar','Solar System','',3,1),
('cat-biometrics','Biometrics','',4,1),
('cat-paging','Paging System','',5,1),
('cat-pabx','PABX','',6,1);

INSERT OR IGNORE INTO brands (id,category_id,name,logo_url,display_order,is_active) VALUES
('brand-posph','cat-pos','POS Philippines','',1,1),
('brand-epson','cat-pos','Epson','',2,1),
('brand-hikvision','cat-cctv','Hikvision','',1,1),
('brand-dahua','cat-cctv','Dahua','',2,1),
('brand-deye','cat-solar','Deye','',1,1),
('brand-thinkpower','cat-solar','ThinkPower','',2,1),
('brand-zkteco','cat-biometrics','ZKTeco','',1,1),
('brand-bosch','cat-paging','Bosch','',1,1),
('brand-panasonic','cat-pabx','Panasonic','',1,1);

INSERT OR IGNORE INTO products (id,category_id,brand_id,name,price,image_url,short_description,description,is_featured,is_available) VALUES
('prod-pos-set','cat-pos','brand-posph','Complete POS Terminal Set',26999,'','Touchscreen-ready POS package for retail and food businesses.','Includes POS terminal, receipt printer, cash drawer, barcode scanner, and initial system setup.',1,1),
('prod-printer','cat-pos','brand-epson','Thermal Receipt Printer',7999,'','Fast and reliable thermal receipt printing.','Suitable for POS counters, restaurants, retail stores, and service businesses.',0,1),
('prod-cctv-4','cat-cctv','brand-hikvision','4-Camera CCTV Package',18999,'','Complete CCTV monitoring package.','Includes four cameras, recorder, storage, cabling allowance, and configuration.',1,1),
('prod-nvr-8','cat-cctv','brand-dahua','8-Channel CCTV Recorder',0,'','Expandable recorder for larger properties.','Request a quotation based on storage capacity, camera type, and installation requirements.',0,1),
('prod-hybrid','cat-solar','brand-deye','Hybrid Solar Inverter',0,'','Hybrid inverter solutions for homes and businesses.','Available in multiple capacities with optional battery and installation package.',1,1),
('prod-gridtie','cat-solar','brand-thinkpower','Grid-Tie Solar Package',0,'','Reduce daytime electricity consumption.','Customized package depending on roof area, load profile, and target savings.',0,1),
('prod-biometric','cat-biometrics','brand-zkteco','Fingerprint Attendance Device',8999,'','Employee attendance and timekeeping device.','Supports fingerprint attendance, user records, and data export.',1,1),
('prod-pabx','cat-pabx','brand-panasonic','Office PABX System',0,'','Internal telephone communication solution.','Configured according to extension count, trunk lines, and office layout.',0,1);

INSERT OR IGNORE INTO packages (id,name,subtitle,price,image_url,inclusions_json,display_order,is_featured,is_active) VALUES
('pkg-starter','Starter POS Package','For small retail and startup businesses',19999,'','["POS software","Receipt printer","Cash drawer","Basic setup and training"]',1,0,1),
('pkg-business','Business POS Package','Complete setup for growing businesses',29999,'','["Touchscreen POS terminal","Receipt printer","Cash drawer","Barcode scanner","System setup and training"]',2,1,1),
('pkg-enterprise','Custom Enterprise Package','Built around your exact requirements',0,'','["Multiple terminals","Customized products and modules","Installation planning","After-sales support"]',3,0,1);

-- Temporary admin login: username admin / password POSAdmin2026!
-- The dashboard will require a password change on first login.
INSERT OR IGNORE INTO admins (id,username,password_hash,password_salt,must_change_password) VALUES
('admin-primary','admin','rpNpRw1WR1yyuYgPCxwX4rd3kKCnA8yYeu2fs+0PsHE=','pbSUd7ZyaVs+9gToWELUGg==',1);
