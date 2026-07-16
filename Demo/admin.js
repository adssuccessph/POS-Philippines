(function(){
  'use strict';
  const D=window.POSDemo;
  const PASSWORD='POSAdmin2026!';
  const STATUS_OPTIONS=['Inquiry Received','Under Review','Quotation Preparation','Quotation Sent','Waiting for Customer Response','Scheduled for Demo or Installation','Completed','On Hold','Additional Information Required','Cancelled','Not Proceeding'];
  let data=D.load();
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function toast(msg){const el=qs('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2500)}
  function save(){D.save(data);renderAll()}
  function fileToDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})}
  function statusBadge(status){
    const s=String(status||'');
    const cls=/completed|approved|responded/i.test(s)?'green':/review|preparation|pending|waiting|hold/i.test(s)?'orange':/cancel|reject|not proceeding/i.test(s)?'red':'blue';
    return `<span class="badge ${cls}">${D.escapeHtml(s)}</span>`;
  }
  function setSession(on){sessionStorage.setItem('posAdminDemo',on?'1':'0')}
  function showAdmin(){qs('#loginPage').classList.add('hidden');qs('#adminShell').classList.remove('hidden');renderAll()}
  function showLogin(){qs('#loginPage').classList.remove('hidden');qs('#adminShell').classList.add('hidden')}

  function switchView(view){
    qsa('.section-view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));
    qsa('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    const button=qs(`[data-view="${view}"]`);
    qs('#pageTitle').textContent=button?button.textContent.replace(/^[^A-Za-z]+/,'').trim():'Dashboard';
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderStats(){
    const pending=data.reviews.filter(x=>x.status==='pending').length;
    const newInq=data.inquiries.filter(x=>x.status==='Inquiry Received').length;
    qs('#stats').innerHTML=[
      ['Products',data.products.length],['Packages',data.packages.length],['Inquiries',data.inquiries.length],['New Inquiries',newInq],['Pending Reviews',pending]
    ].map(([label,val])=>`<div class="stat"><span>${label}</span><strong>${val}</strong></div>`).join('');
    const recent=data.inquiries.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
    qs('#recentInquiries').innerHTML=recent.length?recent.map(i=>`<div style="padding:10px 0;border-bottom:1px solid #e7ebf1"><strong>${D.escapeHtml(i.tracking)}</strong> ${statusBadge(i.status)}<div style="font-size:13px;margin-top:4px">${D.escapeHtml(i.name)} — ${D.escapeHtml(i.business||'No business name')}</div><small style="color:#687286">${D.formatDate(i.updatedAt)}</small></div>`).join(''):'No inquiries yet.';
    const pendingReviews=data.reviews.filter(x=>x.status==='pending').slice(0,5);
    qs('#pendingReviews').innerHTML=pendingReviews.length?pendingReviews.map(r=>`<div style="padding:10px 0;border-bottom:1px solid #e7ebf1"><strong>${D.escapeHtml(r.name)}</strong><div style="color:#ffb000">${'★'.repeat(r.rating)}</div><small>${D.escapeHtml(r.message)}</small></div>`).join(''):'No pending reviews.';
  }

  function renderSettings(){
    const s=data.settings;
    qs('#setBusinessName').value=s.businessName||'';qs('#setTagline').value=s.tagline||'';qs('#setHeroTitle').value=s.heroTitle||'';qs('#setHeroSubtitle').value=s.heroSubtitle||'';
    qs('#setEmail').value=s.email||'';qs('#setPhone').value=s.phone||'';qs('#setFacebook').value=s.facebook||'';qs('#setFacebookUrl').value=s.facebookUrl||'';qs('#setAddress').value=s.address||'';
    qs('#setLogo').value=s.logo||'';qs('#setHeroImage').value=s.heroImage||'';qs('#logoPreview').src=s.logo||'assets/logo-placeholder.svg';qs('#heroPreview').src=s.heroImage||'assets/pos-system.svg';qs('#sideLogo').src=s.logo||'assets/logo-placeholder.svg';
  }

  function categoryOptions(selected=''){return data.categories.slice().sort((a,b)=>(a.order||0)-(b.order||0)).map(c=>`<option value="${D.escapeHtml(c.id)}" ${c.id===selected?'selected':''}>${D.escapeHtml(c.name)}</option>`).join('')}
  function brandOptions(categoryId,selected=''){return `<option value="">No specific brand</option>`+data.brands.filter(b=>b.categoryId===categoryId).sort((a,b)=>(a.order||0)-(b.order||0)).map(b=>`<option value="${D.escapeHtml(b.id)}" ${b.id===selected?'selected':''}>${D.escapeHtml(b.name)}</option>`).join('')}

  function renderCategories(){
    qs('#categoryTable').innerHTML=data.categories.slice().sort((a,b)=>(a.order||0)-(b.order||0)).map(c=>`<tr><td><img class="thumb" src="${D.escapeHtml(c.image||'assets/pos-system.svg')}" alt=""></td><td><strong>${D.escapeHtml(c.name)}</strong><br><small>${D.escapeHtml(c.slug||'')}</small></td><td>${c.order||0}</td><td>${c.active?'<span class="badge green">Active</span>':'<span class="badge gray">Hidden</span>'}</td><td class="actions-row"><button class="btn btn-outline btn-sm" data-edit-category="${c.id}">Edit</button><button class="btn btn-red btn-sm" data-delete-category="${c.id}">Delete</button></td></tr>`).join('');
    qsa('[data-edit-category]').forEach(b=>b.onclick=()=>editCategory(b.dataset.editCategory));
    qsa('[data-delete-category]').forEach(b=>b.onclick=()=>deleteCategory(b.dataset.deleteCategory));
  }
  function clearCategory(){qs('#categoryForm').reset();qs('#categoryId').value='';qs('#categoryActive').checked=true;qs('#categoryOrder').value=data.categories.length+1;qs('#categoryImage').value=''}
  function editCategory(id){const c=data.categories.find(x=>x.id===id);if(!c)return;switchView('categories');qs('#categoryId').value=c.id;qs('#categoryName').value=c.name;qs('#categoryOrder').value=c.order||0;qs('#categoryImage').value=c.image||'';qs('#categoryActive').checked=!!c.active;window.scrollTo({top:0,behavior:'smooth'})}
  function deleteCategory(id){
    if(data.products.some(p=>p.categoryId===id)||data.brands.some(b=>b.categoryId===id)){alert('This category still has brands or products. Move or delete them first.');return}
    if(confirm('Delete this category?')){data.categories=data.categories.filter(x=>x.id!==id);save();toast('Category deleted.')}
  }

  function renderBrands(){
    qs('#brandCategory').innerHTML=categoryOptions(qs('#brandCategory').value||data.categories[0]?.id||'');
    qs('#brandTable').innerHTML=data.brands.slice().sort((a,b)=>{const ca=D.findCategory(data,a.categoryId)?.name||'';const cb=D.findCategory(data,b.categoryId)?.name||'';return ca.localeCompare(cb)||(a.order||0)-(b.order||0)}).map(b=>`<tr><td><strong>${D.escapeHtml(b.name)}</strong></td><td>${D.escapeHtml(D.findCategory(data,b.categoryId)?.name||'—')}</td><td>${b.order||0}</td><td>${b.active?'<span class="badge green">Active</span>':'<span class="badge gray">Hidden</span>'}</td><td class="actions-row"><button class="btn btn-outline btn-sm" data-edit-brand="${b.id}">Edit</button><button class="btn btn-red btn-sm" data-delete-brand="${b.id}">Delete</button></td></tr>`).join('');
    qsa('[data-edit-brand]').forEach(b=>b.onclick=()=>editBrand(b.dataset.editBrand));qsa('[data-delete-brand]').forEach(b=>b.onclick=()=>deleteBrand(b.dataset.deleteBrand));
  }
  function clearBrand(){qs('#brandForm').reset();qs('#brandId').value='';qs('#brandActive').checked=true;qs('#brandOrder').value=1;qs('#brandCategory').innerHTML=categoryOptions(data.categories[0]?.id||'')}
  function editBrand(id){const b=data.brands.find(x=>x.id===id);if(!b)return;switchView('brands');qs('#brandId').value=b.id;qs('#brandCategory').innerHTML=categoryOptions(b.categoryId);qs('#brandName').value=b.name;qs('#brandOrder').value=b.order||0;qs('#brandLogo').value=b.logo||'';qs('#brandActive').checked=!!b.active}
  function deleteBrand(id){if(data.products.some(p=>p.brandId===id)){alert('This brand is still assigned to products. Reassign those products first.');return}if(confirm('Delete this brand?')){data.brands=data.brands.filter(x=>x.id!==id);save();toast('Brand deleted.')}}

  function renderProductControls(){
    const pc=qs('#productCategory');const current=pc.value||data.categories[0]?.id||'';pc.innerHTML=categoryOptions(current);qs('#productBrand').innerHTML=brandOptions(pc.value,qs('#productBrand').value);
    qs('#productFilterCategory').innerHTML='<option value="all">All Categories</option>'+categoryOptions(qs('#productFilterCategory').value);
  }
  function renderProducts(){
    renderProductControls();
    const catFilter=qs('#productFilterCategory').value||'all';const search=(qs('#productSearch').value||'').toLowerCase();
    let list=data.products.slice();if(catFilter!=='all')list=list.filter(p=>p.categoryId===catFilter);if(search)list=list.filter(p=>`${p.name} ${p.short} ${D.findBrand(data,p.brandId)?.name||''}`.toLowerCase().includes(search));
    qs('#productTable').innerHTML=list.map(p=>`<tr><td><img class="thumb" src="${D.escapeHtml(p.image||'assets/pos-system.svg')}" alt=""></td><td><strong>${D.escapeHtml(p.name)}</strong><br><small>${D.escapeHtml(p.short||'')}</small></td><td>${D.escapeHtml(D.findCategory(data,p.categoryId)?.name||'—')}<br><small>${D.escapeHtml(D.findBrand(data,p.brandId)?.name||'No brand')}</small></td><td><strong>${D.money(p.price)}</strong></td><td>${p.available?'<span class="badge green">Visible</span>':'<span class="badge gray">Hidden</span>'} ${p.featured?'<span class="badge blue">Featured</span>':''}</td><td class="actions-row"><button class="btn btn-outline btn-sm" data-edit-product="${p.id}">Edit</button><button class="btn btn-red btn-sm" data-delete-product="${p.id}">Delete</button></td></tr>`).join('');
    qsa('[data-edit-product]').forEach(b=>b.onclick=()=>editProduct(b.dataset.editProduct));qsa('[data-delete-product]').forEach(b=>b.onclick=()=>{if(confirm('Delete this product?')){data.products=data.products.filter(x=>x.id!==b.dataset.deleteProduct);save();toast('Product deleted.')}})
  }
  function clearProduct(){qs('#productForm').reset();qs('#productId').value='';qs('#productAvailable').checked=true;qs('#productPrice').value=0;renderProductControls()}
  function editProduct(id){const p=data.products.find(x=>x.id===id);if(!p)return;switchView('products');qs('#productId').value=p.id;qs('#productCategory').innerHTML=categoryOptions(p.categoryId);qs('#productBrand').innerHTML=brandOptions(p.categoryId,p.brandId);qs('#productName').value=p.name;qs('#productPrice').value=p.price||0;qs('#productImage').value=p.image||'';qs('#productShort').value=p.short||'';qs('#productDescription').value=p.description||'';qs('#productFeatured').checked=!!p.featured;qs('#productAvailable').checked=!!p.available}

  function renderPackages(){
    qs('#packageTable').innerHTML=data.packages.map(p=>`<tr><td><strong>${D.escapeHtml(p.name)}</strong><br><small>${D.escapeHtml(p.subtitle||'')}</small></td><td>${(p.inclusions||[]).map(D.escapeHtml).join('<br>')}</td><td><strong>${D.money(p.price)}</strong></td><td>${p.active?'<span class="badge green">Active</span>':'<span class="badge gray">Hidden</span>'} ${p.featured?'<span class="badge blue">Popular</span>':''}</td><td class="actions-row"><button class="btn btn-outline btn-sm" data-edit-package="${p.id}">Edit</button><button class="btn btn-red btn-sm" data-delete-package="${p.id}">Delete</button></td></tr>`).join('');
    qsa('[data-edit-package]').forEach(b=>b.onclick=()=>editPackage(b.dataset.editPackage));qsa('[data-delete-package]').forEach(b=>b.onclick=()=>{if(confirm('Delete this package?')){data.packages=data.packages.filter(x=>x.id!==b.dataset.deletePackage);save();toast('Package deleted.')}})
  }
  function clearPackage(){qs('#packageForm').reset();qs('#packageId').value='';qs('#packageActive').checked=true;qs('#packagePrice').value=0}
  function editPackage(id){const p=data.packages.find(x=>x.id===id);if(!p)return;switchView('packages');qs('#packageId').value=p.id;qs('#packageName').value=p.name;qs('#packageSubtitle').value=p.subtitle||'';qs('#packagePrice').value=p.price||0;qs('#packageInclusions').value=(p.inclusions||[]).join('\n');qs('#packageImage').value=p.image||'';qs('#packageFeatured').checked=!!p.featured;qs('#packageActive').checked=!!p.active}

  function renderInquiryFilters(){qs('#inquiryStatusFilter').innerHTML='<option value="all">All Statuses</option>'+STATUS_OPTIONS.map(s=>`<option value="${D.escapeHtml(s)}">${D.escapeHtml(s)}</option>`).join('')}
  function renderInquiries(){
    const filter=qs('#inquiryStatusFilter').value||'all';const search=(qs('#inquirySearch').value||'').toLowerCase();let list=data.inquiries.slice().sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));if(filter!=='all')list=list.filter(i=>i.status===filter);if(search)list=list.filter(i=>`${i.tracking} ${i.name} ${i.business} ${i.email} ${i.phone}`.toLowerCase().includes(search));
    qs('#inquiryTable').innerHTML=list.map(i=>{const p=D.findProduct(data,i.productId);const c=D.findCategory(data,i.categoryId);return `<tr><td><strong>${D.escapeHtml(i.tracking)}</strong><br><small>${D.formatDate(i.createdAt)}</small></td><td>${D.escapeHtml(i.name)}<br><small>${D.escapeHtml(i.business||'')}<br>${D.escapeHtml(i.email)} • ${D.escapeHtml(i.phone)}</small></td><td>${D.escapeHtml(p?.name||c?.name||'General inquiry')}</td><td>${statusBadge(i.status)}</td><td>${D.formatDate(i.updatedAt)}</td><td><button class="btn btn-blue btn-sm" data-open-inquiry="${i.id}">Open / Update</button></td></tr>`}).join('');
    qsa('[data-open-inquiry]').forEach(b=>b.onclick=()=>openInquiry(b.dataset.openInquiry));
  }
  function openInquiry(id){
    const i=data.inquiries.find(x=>x.id===id);if(!i)return;
    const c=D.findCategory(data,i.categoryId);const b=D.findBrand(data,i.brandId);const p=D.findProduct(data,i.productId);
    qs('#editInquiryId').value=i.id;qs('#editInquiryStatus').innerHTML=STATUS_OPTIONS.map(s=>`<option value="${D.escapeHtml(s)}" ${s===i.status?'selected':''}>${D.escapeHtml(s)}</option>`).join('');qs('#editPublicNote').value=i.publicNote||'';qs('#editInternalNote').value=i.internalNote||'';qs('#editFollowup').value=i.followupDate||'';
    qs('#inquiryDetails').innerHTML=`<div class="panel" style="box-shadow:none;margin-bottom:18px"><div class="panel-body"><strong>${D.escapeHtml(i.tracking)}</strong> ${statusBadge(i.status)}<p><b>${D.escapeHtml(i.name)}</b>${i.business?` — ${D.escapeHtml(i.business)}`:''}<br>${D.escapeHtml(i.email)} • ${D.escapeHtml(i.phone)}</p><p><b>Interest:</b> ${D.escapeHtml(c?.name||'—')}${b?` / ${D.escapeHtml(b.name)}`:''}${p?` / ${D.escapeHtml(p.name)}`:''}</p><p><b>Message:</b> ${D.escapeHtml(i.message||'—')}</p></div></div>`;
    qs('#inquiryHistory').innerHTML=(i.history||[]).slice().reverse().map(h=>`<div class="history-item"><strong>${D.escapeHtml(h.status)}</strong><small>${D.formatDate(h.date)}</small><small>${D.escapeHtml(h.note||'')}</small></div>`).join('')||'No history.';
    qs('#inquiryModal').classList.add('open');
  }

  function renderReviews(){
    const filter=qs('#reviewFilter').value||'all';let list=data.reviews.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));if(filter!=='all')list=list.filter(r=>r.status===filter);
    qs('#reviewTable').innerHTML=list.map(r=>`<tr><td><strong>${D.escapeHtml(r.name)}</strong><br><small>${D.escapeHtml(r.business||'')}${r.verified?' • Verified':''}</small></td><td><span style="color:#ffb000">${'★'.repeat(Number(r.rating)||5)}</span></td><td>${D.escapeHtml(r.message)}<br><small>${D.escapeHtml(r.product||'')}</small></td><td>${statusBadge(r.status)}</td><td class="actions-row">${r.status!=='approved'?`<button class="btn btn-green btn-sm" data-review-action="approve" data-review-id="${r.id}">Approve</button>`:''}${r.status!=='rejected'?`<button class="btn btn-orange btn-sm" data-review-action="reject" data-review-id="${r.id}">Reject</button>`:''}<button class="btn btn-red btn-sm" data-review-action="delete" data-review-id="${r.id}">Delete</button></td></tr>`).join('');
    qsa('[data-review-action]').forEach(b=>b.onclick=()=>reviewAction(b.dataset.reviewId,b.dataset.reviewAction));
  }
  function reviewAction(id,action){if(action==='delete'){if(confirm('Delete this review?'))data.reviews=data.reviews.filter(x=>x.id!==id)}else{const r=data.reviews.find(x=>x.id===id);if(r)r.status=action==='approve'?'approved':'rejected'}save();toast(`Review ${action}d.`)}

  function renderAll(){data=D.load();renderStats();renderSettings();renderCategories();renderBrands();renderProducts();renderPackages();renderInquiryFilters();renderInquiries();renderReviews()}

  function bindForms(){
    qs('#loginForm').addEventListener('submit',e=>{e.preventDefault();if(qs('#adminPassword').value===PASSWORD){setSession(true);showAdmin();qs('#loginError').textContent=''}else{qs('#loginError').className='notice error';qs('#loginError').textContent='Incorrect password.'}});
    qs('#logoutBtn').onclick=()=>{setSession(false);showLogin()};
    qsa('[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));qsa('[data-open-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.openView));
    qs('#resetDemo').onclick=()=>{if(confirm('Reset all demo data to the original sample content?')){data=D.reset();clearCategory();clearBrand();clearProduct();clearPackage();renderAll();toast('Demo data reset.')}};

    qs('#settingsForm').addEventListener('submit',async e=>{e.preventDefault();let logo=qs('#setLogo').value.trim();let hero=qs('#setHeroImage').value.trim();if(qs('#logoUpload').files[0])logo=await fileToDataUrl(qs('#logoUpload').files[0]);if(qs('#heroUpload').files[0])hero=await fileToDataUrl(qs('#heroUpload').files[0]);data.settings={...data.settings,businessName:qs('#setBusinessName').value.trim(),tagline:qs('#setTagline').value.trim(),heroTitle:qs('#setHeroTitle').value.trim(),heroSubtitle:qs('#setHeroSubtitle').value.trim(),email:qs('#setEmail').value.trim(),phone:qs('#setPhone').value.trim(),facebook:qs('#setFacebook').value.trim(),facebookUrl:qs('#setFacebookUrl').value.trim(),address:qs('#setAddress').value.trim(),logo:logo||'assets/logo-placeholder.svg',heroImage:hero||'assets/pos-system.svg'};save();qs('#settingsNotice').className='notice';qs('#settingsNotice').textContent='Website settings saved.';toast('Settings saved.')});
    qs('#setLogo').oninput=()=>qs('#logoPreview').src=qs('#setLogo').value||'assets/logo-placeholder.svg';qs('#setHeroImage').oninput=()=>qs('#heroPreview').src=qs('#setHeroImage').value||'assets/pos-system.svg';

    qs('#categoryForm').addEventListener('submit',async e=>{e.preventDefault();let image=qs('#categoryImage').value.trim();if(qs('#categoryUpload').files[0])image=await fileToDataUrl(qs('#categoryUpload').files[0]);const id=qs('#categoryId').value;const item={id:id||D.uid('cat'),name:qs('#categoryName').value.trim(),slug:D.slugify(qs('#categoryName').value),image:image||'assets/pos-system.svg',active:qs('#categoryActive').checked,order:Number(qs('#categoryOrder').value||0)};if(id){Object.assign(data.categories.find(x=>x.id===id),item)}else data.categories.push(item);save();clearCategory();toast('Category saved.')});qs('#categoryClear').onclick=clearCategory;

    qs('#brandForm').addEventListener('submit',e=>{e.preventDefault();const id=qs('#brandId').value;const item={id:id||D.uid('brand'),categoryId:qs('#brandCategory').value,name:qs('#brandName').value.trim(),logo:qs('#brandLogo').value.trim(),active:qs('#brandActive').checked,order:Number(qs('#brandOrder').value||0)};if(id)Object.assign(data.brands.find(x=>x.id===id),item);else data.brands.push(item);save();clearBrand();toast('Brand saved.')});qs('#brandClear').onclick=clearBrand;

    qs('#productCategory').onchange=()=>{qs('#productBrand').innerHTML=brandOptions(qs('#productCategory').value,'')};qs('#productFilterCategory').onchange=renderProducts;qs('#productSearch').oninput=renderProducts;
    qs('#productForm').addEventListener('submit',async e=>{e.preventDefault();let image=qs('#productImage').value.trim();if(qs('#productUpload').files[0])image=await fileToDataUrl(qs('#productUpload').files[0]);const id=qs('#productId').value;const item={id:id||D.uid('prod'),categoryId:qs('#productCategory').value,brandId:qs('#productBrand').value,name:qs('#productName').value.trim(),short:qs('#productShort').value.trim(),description:qs('#productDescription').value.trim(),price:Number(qs('#productPrice').value||0),image:image||D.findCategory(data,qs('#productCategory').value)?.image||'assets/pos-system.svg',featured:qs('#productFeatured').checked,available:qs('#productAvailable').checked};if(id)Object.assign(data.products.find(x=>x.id===id),item);else data.products.push(item);save();clearProduct();toast('Product saved.')});qs('#productClear').onclick=clearProduct;

    qs('#packageForm').addEventListener('submit',e=>{e.preventDefault();const id=qs('#packageId').value;const item={id:id||D.uid('pkg'),name:qs('#packageName').value.trim(),subtitle:qs('#packageSubtitle').value.trim(),price:Number(qs('#packagePrice').value||0),inclusions:qs('#packageInclusions').value.split('\n').map(x=>x.trim()).filter(Boolean),image:qs('#packageImage').value.trim()||'assets/pos-system.svg',featured:qs('#packageFeatured').checked,active:qs('#packageActive').checked};if(id)Object.assign(data.packages.find(x=>x.id===id),item);else data.packages.push(item);save();clearPackage();toast('Package saved.')});qs('#packageClear').onclick=clearPackage;

    qs('#inquiryStatusFilter').onchange=renderInquiries;qs('#inquirySearch').oninput=renderInquiries;qs('#reviewFilter').onchange=renderReviews;
    qs('#inquiryUpdateForm').addEventListener('submit',e=>{e.preventDefault();const i=data.inquiries.find(x=>x.id===qs('#editInquiryId').value);if(!i)return;const old=i.status;const now=new Date().toISOString();i.status=qs('#editInquiryStatus').value;i.publicNote=qs('#editPublicNote').value.trim();i.internalNote=qs('#editInternalNote').value.trim();i.followupDate=qs('#editFollowup').value;i.updatedAt=now;if(old!==i.status){i.history=i.history||[];i.history.push({status:i.status,date:now,note:i.publicNote||`Status updated to ${i.status}.`})}save();qs('#inquiryModal').classList.remove('open');toast('Inquiry status updated.')});

    qsa('[data-close]').forEach(b=>b.onclick=()=>qs(`#${b.dataset.close}`).classList.remove('open'));qsa('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('open')});
  }

  document.addEventListener('DOMContentLoaded',()=>{bindForms();clearCategory();clearBrand();clearProduct();clearPackage();if(sessionStorage.getItem('posAdminDemo')==='1')showAdmin();else showLogin()});
})();
