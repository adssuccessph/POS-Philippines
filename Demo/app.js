(function(){
  'use strict';

  const D = window.POSDemo;
  let data = D.load();
  let selectedCategory = 'cat-cctv';
  let selectedBrand = 'all';
  let selectedProduct = '';

  const qs = (s,root=document)=>root.querySelector(s);
  const qsa = (s,root=document)=>Array.from(root.querySelectorAll(s));

  function toast(message){
    const el = qs('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(()=>el.classList.remove('show'),2600);
  }

  function applySettings(){
    const s = data.settings;
    qsa('[data-business-name]').forEach(el=>el.textContent=s.businessName);
    qsa('[data-email]').forEach(el=>el.textContent=s.email);
    qsa('[data-phone]').forEach(el=>el.textContent=s.phone);
    qsa('[data-facebook]').forEach(el=>el.textContent=s.facebook);
    qs('#brandLogo').src = s.logo || 'assets/logo-placeholder.svg';
    qs('#footerLogo').src = s.logo || 'assets/logo-placeholder.svg';
    qs('#heroImage').src = s.heroImage || 'assets/pos-system.svg';
    qs('#heroTitle').innerHTML = titleWithAccent(s.heroTitle);
    qs('#heroSubtitle').textContent = s.heroSubtitle;
    qs('#footerTagline').textContent = s.tagline;
    qs('#contactEmail').href = `mailto:${s.email}`;
    qs('#contactPhone').href = `tel:${s.phone}`;
    qs('#contactFacebook').href = s.facebookUrl || '#';
  }

  function titleWithAccent(text){
    const safe = D.escapeHtml(text);
    return safe
      .replace(/Complete POS Solutions/i,'<span class="red">Complete POS Solutions</span>')
      .replace(/Every Business/i,'<span class="blue">Every Business</span>');
  }

  function renderCategories(){
    const cats = data.categories.filter(x=>x.active).sort((a,b)=>(a.order||0)-(b.order||0));
    const container = qs('#categoryGrid');
    container.innerHTML = cats.map(cat=>`
      <button class="category-card ${cat.id===selectedCategory?'active':''}" data-category-id="${D.escapeHtml(cat.id)}" type="button">
        <img src="${D.escapeHtml(cat.image || 'assets/pos-system.svg')}" alt="${D.escapeHtml(cat.name)}">
        <strong>${D.escapeHtml(cat.name)}</strong>
      </button>
    `).join('');
    qsa('[data-category-id]',container).forEach(btn=>btn.addEventListener('click',()=>{
      selectedCategory=btn.dataset.categoryId;
      selectedBrand='all';
      renderCatalog();
    }));
  }

  function renderBrands(){
    const category = D.findCategory(data,selectedCategory);
    qs('#brandContext').textContent = category ? `${category.name} Brands` : 'Brands';
    const brands = data.brands.filter(x=>x.active && x.categoryId===selectedCategory).sort((a,b)=>(a.order||0)-(b.order||0));
    const bar = qs('#brandBar');
    bar.innerHTML = `<span class="brand-label">Filter:</span>
      <button type="button" class="brand-chip ${selectedBrand==='all'?'active':''}" data-brand-id="all">All Brands</button>
      ${brands.map(b=>`<button type="button" class="brand-chip ${selectedBrand===b.id?'active':''}" data-brand-id="${D.escapeHtml(b.id)}">${D.escapeHtml(b.name)}</button>`).join('')}`;
    qsa('[data-brand-id]',bar).forEach(btn=>btn.addEventListener('click',()=>{
      selectedBrand=btn.dataset.brandId;
      renderBrands();
      renderProducts();
    }));
  }

  function renderProducts(){
    const category = D.findCategory(data,selectedCategory);
    qs('#productsTitle').innerHTML = `${D.escapeHtml(category?.name || 'Featured')} <span>Products</span>`;
    let products = data.products.filter(x=>x.available && x.categoryId===selectedCategory);
    if(selectedBrand!=='all') products=products.filter(x=>x.brandId===selectedBrand);
    const grid=qs('#productGrid');
    if(!products.length){
      grid.innerHTML='<div class="empty-state">No products are available under this filter yet. Please send an inquiry for a custom quotation.</div>';
      return;
    }
    grid.innerHTML=products.map(p=>{
      const brand=D.findBrand(data,p.brandId);
      return `<article class="product-card">
        <div class="product-image">
          ${p.featured?'<span class="product-badge">FEATURED</span>':''}
          <img src="${D.escapeHtml(p.image || category?.image || 'assets/pos-system.svg')}" alt="${D.escapeHtml(p.name)}">
        </div>
        <div class="product-body">
          <div class="product-meta">${D.escapeHtml(brand?.name || category?.name || '')}</div>
          <h3>${D.escapeHtml(p.name)}</h3>
          <p>${D.escapeHtml(p.short || '')}</p>
          <div class="price">${D.money(p.price)}</div>
          <div class="product-actions">
            <button class="btn btn-blue btn-sm" data-view-product="${D.escapeHtml(p.id)}" type="button">View Details</button>
            <button class="btn btn-outline btn-sm" data-inquire-product="${D.escapeHtml(p.id)}" type="button">Inquire</button>
          </div>
        </div>
      </article>`;
    }).join('');
    qsa('[data-view-product]',grid).forEach(btn=>btn.addEventListener('click',()=>openProduct(btn.dataset.viewProduct)));
    qsa('[data-inquire-product]',grid).forEach(btn=>btn.addEventListener('click',()=>prefillInquiry(btn.dataset.inquireProduct)));
  }

  function renderCatalog(){
    renderCategories();
    renderBrands();
    renderProducts();
    updateInquirySelects();
  }

  function renderPackages(){
    const active=data.packages.filter(x=>x.active);
    const grid=qs('#packageGrid');
    grid.innerHTML=active.map(pkg=>`
      <article class="package-card ${pkg.featured?'featured':''}">
        ${pkg.featured?'<span class="package-ribbon">POPULAR</span>':''}
        <h3>${D.escapeHtml(pkg.name)}</h3>
        <small>${D.escapeHtml(pkg.subtitle || '')}</small>
        <ul>${(pkg.inclusions||[]).map(i=>`<li>${D.escapeHtml(i)}</li>`).join('')}</ul>
        <div class="price">${D.money(pkg.price)}</div>
        <button class="btn btn-blue btn-block" data-inquire-package="${D.escapeHtml(pkg.id)}" type="button">Inquire About Package</button>
      </article>
    `).join('');
    qsa('[data-inquire-package]',grid).forEach(btn=>btn.addEventListener('click',()=>{
      const pkg=data.packages.find(x=>x.id===btn.dataset.inquirePackage);
      selectedProduct='';
      qs('#inquiryMessage').value=`I am interested in the ${pkg?.name || 'POS package'}. Please send me more details and a quotation.`;
      qs('#inquiry').scrollIntoView({behavior:'smooth'});
      toast('Package added to the inquiry form.');
    }));
  }

  function renderReviews(){
    const approved=data.reviews.filter(x=>x.status==='approved').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);
    const list=qs('#reviewList');
    list.innerHTML=approved.length?approved.map(r=>`
      <article class="review-card">
        ${r.verified?'<span class="verified">✓ Verified</span>':''}
        <div class="review-stars">${'★'.repeat(Math.max(1,Math.min(5,Number(r.rating)||5)))}</div>
        <p>“${D.escapeHtml(r.message)}”</p>
        <strong>${D.escapeHtml(r.name)}</strong>
        <div class="review-meta">${D.escapeHtml(r.business || '')}${r.product?` • ${D.escapeHtml(r.product)}`:''}</div>
      </article>
    `).join(''):'<div class="empty-state">No approved reviews yet.</div>';
  }

  function updateInquirySelects(){
    const cat=qs('#inquiryCategory');
    const brand=qs('#inquiryBrand');
    const prod=qs('#inquiryProduct');
    const activeCats=data.categories.filter(x=>x.active).sort((a,b)=>(a.order||0)-(b.order||0));
    cat.innerHTML='<option value="">Select category</option>'+activeCats.map(x=>`<option value="${D.escapeHtml(x.id)}">${D.escapeHtml(x.name)}</option>`).join('');
    if(selectedCategory) cat.value=selectedCategory;
    const catId=cat.value;
    const brands=data.brands.filter(x=>x.active && x.categoryId===catId).sort((a,b)=>(a.order||0)-(b.order||0));
    brand.innerHTML='<option value="">Any brand</option>'+brands.map(x=>`<option value="${D.escapeHtml(x.id)}">${D.escapeHtml(x.name)}</option>`).join('');
    const prods=data.products.filter(x=>x.available && x.categoryId===catId);
    prod.innerHTML='<option value="">Select product or service</option>'+prods.map(x=>`<option value="${D.escapeHtml(x.id)}">${D.escapeHtml(x.name)}</option>`).join('');
    if(selectedProduct && prods.some(x=>x.id===selectedProduct)) prod.value=selectedProduct;
  }

  function onInquiryCategoryChange(){
    selectedCategory=qs('#inquiryCategory').value || selectedCategory;
    selectedBrand='all';
    selectedProduct='';
    updateInquirySelects();
  }

  function prefillInquiry(productId){
    const p=D.findProduct(data,productId);
    if(!p) return;
    selectedCategory=p.categoryId;
    selectedBrand=p.brandId || 'all';
    selectedProduct=p.id;
    updateInquirySelects();
    qs('#inquiryBrand').value=p.brandId || '';
    qs('#inquiryProduct').value=p.id;
    qs('#inquiryMessage').value=`I am interested in ${p.name}. Please send complete details and a quotation.`;
    qs('#inquiry').scrollIntoView({behavior:'smooth'});
    toast('Product added to the inquiry form.');
  }

  function openProduct(productId){
    const p=D.findProduct(data,productId);
    if(!p) return;
    const cat=D.findCategory(data,p.categoryId);
    const brand=D.findBrand(data,p.brandId);
    qs('#productModalTitle').textContent=p.name;
    qs('#productModalBody').innerHTML=`
      <div class="detail-image"><img src="${D.escapeHtml(p.image || cat?.image || 'assets/pos-system.svg')}" alt="${D.escapeHtml(p.name)}"></div>
      <div class="product-meta">${D.escapeHtml(cat?.name || '')}${brand?` • ${D.escapeHtml(brand.name)}`:''}</div>
      <h2>${D.escapeHtml(p.name)}</h2>
      <p>${D.escapeHtml(p.description || p.short || '')}</p>
      <div class="price">${D.money(p.price)}</div>
      <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
        <button type="button" class="btn btn-primary" id="modalInquireBtn">Inquire About This Product</button>
        <button type="button" class="btn btn-outline" id="modalCloseBtn">Close</button>
      </div>`;
    qs('#productModal').classList.add('open');
    qs('#modalInquireBtn').addEventListener('click',()=>{closeModal('productModal');prefillInquiry(p.id);});
    qs('#modalCloseBtn').addEventListener('click',()=>closeModal('productModal'));
  }

  function closeModal(id){ qs(`#${id}`).classList.remove('open'); }

  function submitInquiry(event){
    event.preventDefault();
    data=D.load();
    const form=new FormData(event.currentTarget);
    const now=new Date().toISOString();
    const tracking=D.generateTracking(data);
    const inquiry={
      id:D.uid('inq'), tracking,
      name:String(form.get('name')||'').trim(),
      business:String(form.get('business')||'').trim(),
      email:String(form.get('email')||'').trim(),
      phone:String(form.get('phone')||'').trim(),
      categoryId:String(form.get('categoryId')||''),
      brandId:String(form.get('brandId')||''),
      productId:String(form.get('productId')||''),
      message:String(form.get('message')||'').trim(),
      status:'Inquiry Received',
      publicNote:'Thank you! Your inquiry has been received. Our team will review it shortly.',
      createdAt:now,updatedAt:now,
      history:[{status:'Inquiry Received',date:now,note:'Your inquiry has been received.'}]
    };
    data.inquiries.unshift(inquiry);
    D.save(data);
    event.currentTarget.reset();
    selectedProduct='';
    updateInquirySelects();
    qs('#inquiryResult').className='notice';
    qs('#inquiryResult').innerHTML=`Inquiry submitted successfully. Your tracking number is <strong>${D.escapeHtml(tracking)}</strong>. Please save it together with your email or mobile number.`;
    qs('#trackingNumber').value=tracking;
    qs('#trackingContact').value=inquiry.email;
    renderTracking(inquiry);
    toast('Inquiry submitted successfully.');
  }

  function trackInquiry(event){
    if(event) event.preventDefault();
    data=D.load();
    const code=qs('#trackingNumber').value.trim().toUpperCase();
    const contact=qs('#trackingContact').value.trim().toLowerCase();
    const inquiry=data.inquiries.find(x=>x.tracking.toUpperCase()===code && (!contact || x.email.toLowerCase()===contact || x.phone.toLowerCase()===contact));
    if(!inquiry){
      qs('#trackingResult').innerHTML='<div class="notice error-notice">No matching inquiry was found. Check the tracking number and the email or mobile number used.</div>';
      return;
    }
    renderTracking(inquiry);
  }

  function renderTracking(inquiry){
    const history=inquiry.history||[];
    const stageOrder=['Inquiry Received','Under Review','Quotation Preparation','Quotation Sent','Waiting for Customer Response','Scheduled for Demo or Installation','Completed'];
    const currentIndex=Math.max(0,stageOrder.indexOf(inquiry.status));
    const historyByStatus=Object.fromEntries(history.map(h=>[h.status,h]));
    qs('#trackingResult').innerHTML=`
      <div class="status-box">
        <strong>${D.escapeHtml(inquiry.status)}</strong>
        <span>${D.escapeHtml(inquiry.publicNote || 'Your inquiry is being processed.')}</span>
      </div>
      <div class="timeline">
        ${stageOrder.map((stage,index)=>{
          const h=historyByStatus[stage];
          const cls=index<currentIndex?'done':index===currentIndex?'current':'';
          return `<div class="timeline-item ${cls}">
            <div class="timeline-dot"></div>
            <div class="timeline-copy"><strong>${D.escapeHtml(stage)}</strong><span>${h?D.formatDate(h.date):(index<=currentIndex?'Status updated':'Pending')}</span>${h?.note?`<span>${D.escapeHtml(h.note)}</span>`:''}</div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function openReviewModal(){
    qs('#reviewForm').reset();
    qs('#reviewResult').className='';
    qs('#reviewResult').textContent='';
    qs('#reviewModal').classList.add('open');
  }

  function submitReview(event){
    event.preventDefault();
    data=D.load();
    const form=new FormData(event.currentTarget);
    const tracking=String(form.get('tracking')||'').trim().toUpperCase();
    const contact=String(form.get('contact')||'').trim().toLowerCase();
    const inquiry=data.inquiries.find(x=>x.tracking.toUpperCase()===tracking && (x.email.toLowerCase()===contact || x.phone.toLowerCase()===contact));
    if(!inquiry || inquiry.status!=='Completed'){
      qs('#reviewResult').className='notice error-notice';
      qs('#reviewResult').textContent='A completed inquiry with matching contact details is required before submitting a verified review.';
      return;
    }
    const product=D.findProduct(data,inquiry.productId);
    data.reviews.unshift({
      id:D.uid('rev'),
      name:String(form.get('name')||'').trim(),
      business:String(form.get('business')||'').trim(),
      product:product?.name || D.findCategory(data,inquiry.categoryId)?.name || '',
      rating:Number(form.get('rating')||5),
      message:String(form.get('message')||'').trim(),
      status:'pending',verified:true,createdAt:new Date().toISOString()
    });
    D.save(data);
    qs('#reviewResult').className='notice';
    qs('#reviewResult').textContent='Review submitted. It will appear after admin approval.';
    event.currentTarget.reset();
  }

  function bindEvents(){
    qs('#menuToggle').addEventListener('click',()=>qs('#navLinks').classList.toggle('open'));
    qsa('#navLinks a').forEach(a=>a.addEventListener('click',()=>qs('#navLinks').classList.remove('open')));
    qs('#inquiryCategory').addEventListener('change',onInquiryCategoryChange);
    qs('#inquiryBrand').addEventListener('change',()=>{selectedBrand=qs('#inquiryBrand').value || 'all';});
    qs('#inquiryProduct').addEventListener('change',()=>{selectedProduct=qs('#inquiryProduct').value;});
    qs('#inquiryForm').addEventListener('submit',submitInquiry);
    qs('#trackingForm').addEventListener('submit',trackInquiry);
    qs('#openReviewModal').addEventListener('click',openReviewModal);
    qs('#reviewForm').addEventListener('submit',submitReview);
    qsa('[data-close-modal]').forEach(btn=>btn.addEventListener('click',()=>closeModal(btn.dataset.closeModal)));
    qsa('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));
    window.addEventListener('pos-data-updated',()=>{data=D.load();initRender();});
  }

  function initRender(){
    applySettings();
    renderCatalog();
    renderPackages();
    renderReviews();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    bindEvents();
    initRender();
    const demo=data.inquiries[0];
    if(demo){
      qs('#trackingNumber').placeholder=`Try: ${demo.tracking}`;
      qs('#trackingContact').placeholder=`Try: ${demo.email}`;
    }
  });
})();
