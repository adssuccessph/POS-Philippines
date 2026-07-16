(function(){
  'use strict';

  const KEY = 'posPhilippinesDemoV1';

  const DEFAULT_DATA = {
    settings: {
      businessName: 'POS Philippines',
      tagline: 'Your Business. Our Solutions.',
      heroTitle: 'Complete POS Solutions for Every Business',
      heroSubtitle: 'POS Systems, CCTV, Biometrics, Solar and more. Quality products, affordable prices, and reliable after-sales support.',
      email: 'posphils@gmail.com',
      phone: '09363280696',
      facebook: 'POS Philippines',
      facebookUrl: 'https://www.facebook.com/',
      address: 'Serving businesses nationwide in the Philippines',
      logo: 'assets/logo-placeholder.svg',
      heroImage: 'assets/pos-system.svg'
    },
    categories: [
      {id:'cat-pos', name:'POS System', slug:'pos-system', image:'assets/pos-system.svg', active:true, order:1},
      {id:'cat-cctv', name:'CCTV', slug:'cctv', image:'assets/cctv.svg', active:true, order:2},
      {id:'cat-solar', name:'Solar System', slug:'solar-system', image:'assets/solar.svg', active:true, order:3},
      {id:'cat-bio', name:'Biometrics', slug:'biometrics', image:'assets/biometrics.svg', active:true, order:4},
      {id:'cat-paging', name:'Paging System', slug:'paging-system', image:'assets/paging.svg', active:true, order:5},
      {id:'cat-pabx', name:'PABX', slug:'pabx', image:'assets/pabx.svg', active:true, order:6}
    ],
    brands: [
      {id:'brand-custom', categoryId:'cat-pos', name:'POS Philippines', logo:'', active:true, order:1},
      {id:'brand-hik', categoryId:'cat-cctv', name:'Hikvision', logo:'', active:true, order:1},
      {id:'brand-dahua', categoryId:'cat-cctv', name:'Dahua', logo:'', active:true, order:2},
      {id:'brand-ezviz', categoryId:'cat-cctv', name:'EZVIZ', logo:'', active:true, order:3},
      {id:'brand-tapo', categoryId:'cat-cctv', name:'Tapo', logo:'', active:true, order:4},
      {id:'brand-deye', categoryId:'cat-solar', name:'Deye', logo:'', active:true, order:1},
      {id:'brand-huawei', categoryId:'cat-solar', name:'Huawei', logo:'', active:true, order:2},
      {id:'brand-zkteco', categoryId:'cat-bio', name:'ZKTeco', logo:'', active:true, order:1},
      {id:'brand-yeastar', categoryId:'cat-pabx', name:'Yeastar', logo:'', active:true, order:1}
    ],
    products: [
      {id:'prod-pos-1', categoryId:'cat-pos', brandId:'brand-custom', name:'15.6-inch All-in-One POS Terminal', short:'Touchscreen POS terminal with reliable daily performance.', description:'A compact all-in-one POS terminal designed for retail stores, restaurants, cafés, and service businesses.', price:24999, image:'assets/pos-system.svg', featured:true, available:true},
      {id:'prod-pos-2', categoryId:'cat-pos', brandId:'brand-custom', name:'80mm Thermal Receipt Printer', short:'Fast USB printing with auto cutter.', description:'Reliable thermal receipt printer suitable for busy counters and everyday transactions.', price:4350, image:'assets/pos-system.svg', featured:true, available:true},
      {id:'prod-pos-3', categoryId:'cat-pos', brandId:'brand-custom', name:'Heavy-Duty Cash Drawer', short:'Secure 5-bill and 8-coin cash drawer.', description:'Durable metal cash drawer with smooth rails and POS-trigger support.', price:2650, image:'assets/pos-system.svg', featured:false, available:true},
      {id:'prod-pos-4', categoryId:'cat-pos', brandId:'brand-custom', name:'Barcode Scanner', short:'Fast 1D barcode reading for retail counters.', description:'Plug-and-play barcode scanner for groceries, pharmacies, retail stores, and warehouses.', price:1899, image:'assets/pos-system.svg', featured:false, available:true},
      {id:'prod-cctv-1', categoryId:'cat-cctv', brandId:'brand-hik', name:'Hikvision 2MP 4CH CCTV Package', short:'4 cameras, 4-channel DVR, storage, cables and accessories.', description:'Complete four-camera CCTV package for small shops, offices, and homes.', price:7990, image:'assets/cctv.svg', featured:true, available:true},
      {id:'prod-cctv-2', categoryId:'cat-cctv', brandId:'brand-hik', name:'Hikvision 5MP 8CH CCTV Package', short:'8 high-definition cameras with DVR and storage.', description:'High-resolution eight-camera surveillance bundle for growing establishments.', price:18990, image:'assets/cctv.svg', featured:true, available:true},
      {id:'prod-cctv-3', categoryId:'cat-cctv', brandId:'brand-hik', name:'Hikvision 4MP PTZ Camera', short:'High-speed PTZ, optical zoom and night vision.', description:'Flexible camera coverage with pan, tilt, zoom, weather protection, and long-range infrared.', price:15990, image:'assets/cctv.svg', featured:false, available:true},
      {id:'prod-cctv-4', categoryId:'cat-cctv', brandId:'brand-dahua', name:'Dahua 2MP Bullet Camera', short:'Full-HD outdoor bullet camera with infrared.', description:'Weather-resistant fixed bullet camera for clear monitoring day and night.', price:1490, image:'assets/cctv.svg', featured:false, available:true},
      {id:'prod-cctv-5', categoryId:'cat-cctv', brandId:'brand-ezviz', name:'EZVIZ Wi-Fi Indoor Camera', short:'Mobile viewing, two-way audio and motion alerts.', description:'Easy-to-install smart indoor camera for homes, stores, and small offices.', price:2190, image:'assets/cctv.svg', featured:false, available:true},
      {id:'prod-cctv-6', categoryId:'cat-cctv', brandId:'brand-tapo', name:'Tapo Pan/Tilt Wi-Fi Camera', short:'Pan-and-tilt coverage with app monitoring.', description:'Affordable smart camera with motion detection, night vision, and mobile access.', price:1690, image:'assets/cctv.svg', featured:false, available:true},
      {id:'prod-solar-1', categoryId:'cat-solar', brandId:'brand-deye', name:'Deye Hybrid Solar Inverter Package', short:'Hybrid-ready inverter solution for homes and businesses.', description:'Expandable solar inverter setup with monitoring and battery-ready capabilities.', price:0, image:'assets/solar.svg', featured:true, available:true},
      {id:'prod-bio-1', categoryId:'cat-bio', brandId:'brand-zkteco', name:'ZKTeco Biometric Attendance Device', short:'Fingerprint timekeeping and access control.', description:'Reliable biometric attendance recorder with exportable reports.', price:0, image:'assets/biometrics.svg', featured:true, available:true},
      {id:'prod-paging-1', categoryId:'cat-paging', brandId:'', name:'Business Paging System', short:'Clear announcements for offices, schools and stores.', description:'Complete paging and public-address setup tailored to your site requirements.', price:0, image:'assets/paging.svg', featured:true, available:true},
      {id:'prod-pabx-1', categoryId:'cat-pabx', brandId:'brand-yeastar', name:'Yeastar PABX Solution', short:'Professional internal phone communication solution.', description:'Scalable PABX solution for offices, hotels, warehouses, and multi-department businesses.', price:0, image:'assets/pabx.svg', featured:true, available:true}
    ],
    packages: [
      {id:'pkg-basic', name:'Basic POS Package', subtitle:'Ideal for small shops', inclusions:['POS Terminal','Receipt Printer','Cash Drawer','POS Software'], price:19000, image:'assets/pos-system.svg', featured:false, active:true},
      {id:'pkg-standard', name:'Standard POS Package', subtitle:'Complete set for growing businesses', inclusions:['POS Terminal','Receipt Printer','Cash Drawer','Barcode Scanner','POS Software'], price:26000, image:'assets/pos-system.svg', featured:false, active:true},
      {id:'pkg-premium', name:'Premium POS Package', subtitle:'Advanced tools and training', inclusions:['Touchscreen POS','Receipt Printer','Cash Drawer','Barcode Scanner','POS Software','Setup & Training'], price:36000, image:'assets/pos-system.svg', featured:true, active:true},
      {id:'pkg-restaurant', name:'Restaurant POS Package', subtitle:'Designed for food businesses', inclusions:['Touchscreen POS','Kitchen Printer','Cash Drawer','Barcode Scanner','POS Software','Table Management'], price:42000, image:'assets/pos-system.svg', featured:false, active:true}
    ],
    inquiries: [
      {
        id:'inq-demo-1', tracking:'INQ-20260716-1001', name:'Juan Dela Cruz', business:'Sample Mini Mart', email:'juan@example.com', phone:'09171234567', categoryId:'cat-pos', brandId:'brand-custom', productId:'prod-pos-1', message:'Interested in a complete POS package for a mini grocery.', status:'Under Review', publicNote:'Our team is reviewing your requirements and will contact you shortly.', createdAt:'2026-07-16T09:30:00+08:00', updatedAt:'2026-07-16T10:15:00+08:00',
        history:[
          {status:'Inquiry Received', date:'2026-07-16T09:30:00+08:00', note:'Your inquiry has been received.'},
          {status:'Under Review', date:'2026-07-16T10:15:00+08:00', note:'Our team is reviewing your requirements.'}
        ]
      }
    ],
    reviews: [
      {id:'rev-1', name:'Maria L.', business:'Sari-Sari Store Owner', product:'POS System', rating:5, message:'The POS system is easy to use and their support is very responsive. Highly recommended!', status:'approved', verified:true, createdAt:'2026-07-10T10:00:00+08:00'},
      {id:'rev-2', name:'John D.', business:'Restaurant Owner', product:'CCTV', rating:5, message:'We got our CCTV system from them. The quality is great and the installation was smooth.', status:'approved', verified:true, createdAt:'2026-07-12T14:30:00+08:00'},
      {id:'rev-3', name:'Carla S.', business:'Coffee Shop Owner', product:'POS Package', rating:5, message:'One-time payment with no hidden fees. Highly recommended for small and growing businesses.', status:'approved', verified:true, createdAt:'2026-07-13T16:10:00+08:00'}
    ]
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw){
        const seeded = clone(DEFAULT_DATA);
        localStorage.setItem(KEY, JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(raw);
    }catch(err){
      console.warn('Unable to load demo data. Resetting.', err);
      const seeded = clone(DEFAULT_DATA);
      try{ localStorage.setItem(KEY, JSON.stringify(seeded)); }catch(_e){}
      return seeded;
    }
  }

  function save(data){
    localStorage.setItem(KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('pos-data-updated'));
  }

  function reset(){
    const seeded = clone(DEFAULT_DATA);
    save(seeded);
    return seeded;
  }

  function uid(prefix){
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  }

  function escapeHtml(value){
    return String(value ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function money(value){
    const n = Number(value || 0);
    return n > 0 ? new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(n) : 'Ask for Quote';
  }

  function formatDate(value){
    if(!value) return '—';
    try{
      return new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
    }catch(_e){ return value; }
  }

  function slugify(value){
    return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }

  function generateTracking(data){
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth()+1).padStart(2,'0');
    const d = String(now.getDate()).padStart(2,'0');
    let serial = 1001 + data.inquiries.length;
    let code = `INQ-${y}${m}${d}-${serial}`;
    while(data.inquiries.some(x => x.tracking === code)){
      serial += 1;
      code = `INQ-${y}${m}${d}-${serial}`;
    }
    return code;
  }

  function findCategory(data,id){ return data.categories.find(x=>x.id===id); }
  function findBrand(data,id){ return data.brands.find(x=>x.id===id); }
  function findProduct(data,id){ return data.products.find(x=>x.id===id); }

  window.POSDemo = {
    KEY, DEFAULT_DATA, load, save, reset, uid, escapeHtml, money, formatDate, slugify,
    generateTracking, findCategory, findBrand, findProduct
  };
})();
