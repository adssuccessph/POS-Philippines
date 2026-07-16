(()=>{
'use strict';

const API=(window.POS_CONFIG?.API_BASE||'').replace(/\/$/,'');
const TOKEN_KEY='pos_ph_admin_token';

const STATUSES=[
  'New Inquiry',
  'Reviewing Requirements',
  'Quotation Prepared',
  'Waiting for Customer',
  'Approved / Scheduled',
  'Completed',
  'Cancelled'
];

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];

const esc=(value='')=>String(value??'').replace(
  /[&<>"']/g,
  character=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  })[character]
);

const peso=number=>Number(number)>0
  ?new Intl.NumberFormat('en-PH',{
      style:'currency',
      currency:'PHP',
      maximumFractionDigits:0
    }).format(Number(number))
  :'Ask for Quote';

const slug=value=>String(value||'')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g,'-')
  .replace(/^-|-$/g,'');

const fmt=value=>value
  ?new Date(value).toLocaleString('en-PH',{
      year:'numeric',
      month:'short',
      day:'numeric',
      hour:'numeric',
      minute:'2-digit'
    })
  :'—';

const plural=type=>type==='category'?'categories':`${type}s`;

let token=localStorage.getItem(TOKEN_KEY)||'';
let activeView='dashboard';

let store={
  settings:{},
  categories:[],
  brands:[],
  products:[],
  packages:[],
  inquiries:[],
  reviews:[],
  dashboard:{}
};

function notify(message,type=''){
  const toast=$('#toast');

  if(!toast){
    console.log(message);
    return;
  }

  toast.textContent=message;
  toast.className='toast show '+type;

  clearTimeout(notify.timer);

  notify.timer=setTimeout(()=>{
    toast.className='toast';
  },3000);
}

async function api(path,options={},auth=true){
  if(!API||API.includes('REPLACE-WITH')){
    throw new Error(
      'API is not configured. Add your Cloudflare Worker URL in config.js.'
    );
  }

  const headers={
    ...(options.body instanceof FormData
      ?{}
      :{'Content-Type':'application/json'}
    ),
    ...(options.headers||{})
  };

  if(auth&&token){
    headers.Authorization=`Bearer ${token}`;
  }

  const response=await fetch(API+path,{
    ...options,
    headers
  });

  let body={};

  try{
    body=await response.json();
  }catch(error){
    body={};
  }

  if(response.status===401&&auth){
    logout(false);
    throw new Error('Session expired. Please log in again.');
  }

  if(!response.ok){
    throw new Error(body.error||`Request failed (${response.status})`);
  }

  return body;
}

function openDialog(id){
  const dialog=$('#'+id);

  if(dialog&&!dialog.open){
    dialog.showModal();
  }
}

function closeDialog(id){
  const dialog=$('#'+id);

  if(dialog?.open){
    dialog.close();
  }
}

function imageCell(url,name){
  if(url){
    return `
      <img
        src="${esc(url)}"
        alt="${esc(name)}"
      >
    `;
  }

  return `
    <div style="
      width:48px;
      height:44px;
      border-radius:8px;
      background:#edf4ff;
      display:grid;
      place-items:center;
      color:#1764eb;
      font-weight:900;
    ">
      ${esc(name).slice(0,2).toUpperCase()}
    </div>
  `;
}

function loginView(error=''){
  $('#app').innerHTML=`
    <main class="admin-login">

      <section class="login-info">

        <div
          class="brand-fallback"
          style="
            width:78px;
            height:78px;
            font-size:20px;
            background:#fff;
            color:#071c48;
          "
        >
          POS
        </div>

        <h1>
          Website <span>Admin Dashboard</span>
        </h1>

        <p>
          Manage website branding, products, packages, inquiries,
          customer tracking, and reviews using the live Cloudflare database.
        </p>

        <div class="login-points">

          <article>
            <b>Live Database</b>
            <small>
              Changes are saved online and visible across devices.
            </small>
          </article>

          <article>
            <b>Secure Login</b>
            <small>
              Password hashing and expiring database sessions.
            </small>
          </article>

          <article>
            <b>Image Storage</b>
            <small>
              Product and package images are stored in Cloudflare R2.
            </small>
          </article>

          <article>
            <b>Mobile Ready</b>
            <small>
              Use the admin dashboard on phone, tablet, or desktop.
            </small>
          </article>

        </div>

      </section>

      <section class="login-box-wrap">

        <form
          id="loginForm"
          class="login-card panel"
        >

          <h2>Admin Login</h2>

          <p>Enter your administrator account.</p>

          ${
            API.includes('REPLACE-WITH')
              ?`
                <div class="api-warning">
                  Cloudflare API is not configured yet.
                  Edit <b>config.js</b> after deploying the Worker.
                </div>
              `
              :''
          }

          <label>Username</label>

          <input
            name="username"
            class="control"
            value="admin"
            required
          >

          <label style="margin-top:12px">
            Password
          </label>

          <input
            name="password"
            type="password"
            class="control"
            required
          >

          <button
            class="btn btn-blue btn-block"
            style="margin-top:13px"
          >
            Log In
          </button>

          <a
            href="./index.html"
            class="btn btn-outline btn-block"
            style="margin-top:8px"
          >
            Return to Website
          </a>

          <div
            id="loginError"
            class="small"
            style="color:#b52c2c;margin-top:9px"
          >
            ${esc(error)}
          </div>

        </form>

      </section>

    </main>
  `;

  $('#loginForm').onsubmit=login;
}

async function login(event){
  event.preventDefault();

  const form=event.currentTarget;

  try{
    const result=await api(
      '/api/auth/login',
      {
        method:'POST',
        body:JSON.stringify({
          username:form.username.value.trim(),
          password:form.password.value
        })
      },
      false
    );

    token=result.token;

    localStorage.setItem(TOKEN_KEY,token);

    if(result.must_change_password){
      passwordSetupView();
    }else{
      await startAdmin();
    }

  }catch(error){
    $('#loginError').textContent=error.message;
  }
}

function passwordSetupView(){
  $('#app').innerHTML=`
    <main class="admin-login">

      <section class="login-info">

        <div
          class="brand-fallback"
          style="
            width:78px;
            height:78px;
            font-size:20px;
            background:#fff;
            color:#071c48;
          "
        >
          POS
        </div>

        <h1>
          Create Your <span>New Password</span>
        </h1>

        <p>
          The temporary password must be replaced before
          the dashboard can be used.
        </p>

      </section>

      <section class="login-box-wrap">

        <form
          id="setupPasswordForm"
          class="login-card panel"
        >

          <h2>Set New Password</h2>

          <p>Use at least 8 characters.</p>

          <label>Current Temporary Password</label>

          <input
            name="current_password"
            type="password"
            class="control"
            required
          >

          <label style="margin-top:12px">
            New Password
          </label>

          <input
            name="new_password"
            type="password"
            minlength="8"
            class="control"
            required
          >

          <label style="margin-top:12px">
            Confirm Password
          </label>

          <input
            name="confirm_password"
            type="password"
            minlength="8"
            class="control"
            required
          >

          <button
            class="btn btn-blue btn-block"
            style="margin-top:13px"
          >
            Save New Password
          </button>

          <div
            id="passwordError"
            class="small"
            style="color:#b52c2c;margin-top:9px"
          ></div>

        </form>

      </section>

    </main>
  `;

  $('#setupPasswordForm').onsubmit=async event=>{
    event.preventDefault();

    const form=event.currentTarget;

    if(form.new_password.value!==form.confirm_password.value){
      $('#passwordError').textContent='New passwords do not match.';
      return;
    }

    try{
      await api('/api/auth/change-password',{
        method:'POST',
        body:JSON.stringify({
          current_password:form.current_password.value,
          new_password:form.new_password.value
        })
      });

      notify(
        'Password changed. Please log in again.',
        'success'
      );

      logout();

    }catch(error){
      $('#passwordError').textContent=error.message;
    }
  };
}

function logout(callApi=true){
  if(callApi&&token){
    api('/api/auth/logout',{
      method:'POST'
    }).catch(()=>{});
  }

  token='';

  localStorage.removeItem(TOKEN_KEY);

  loginView();
}

async function startAdmin(){
  try{
    const me=await api('/api/auth/me');

    if(me.must_change_password){
      passwordSetupView();
      return;
    }

    renderShell();

    await loadAll();

  }catch(error){
    loginView(error.message);
  }
}

function renderShell(){
  $('#app').innerHTML=`
    <div class="admin-shell">

      <aside class="sidebar">

        <div class="side-brand">

          <div class="fallback">
            POS
          </div>

          <div>
            <strong id="sideName">
              POS Philippines
            </strong>

            <small>
              Live Website Admin
            </small>
          </div>

        </div>

        <nav class="side-nav">

          <button
            class="active"
            data-view="dashboard"
          >
            ▦ Dashboard
          </button>

          <button data-view="settings">
            ⚙ Website Settings
          </button>

          <button data-view="categories">
            ▣ Categories
          </button>

          <button data-view="brands">
            ◆ Brands
          </button>

          <button data-view="products">
            ▤ Products
          </button>

          <button data-view="packages">
            ▥ Packages
          </button>

          <button data-view="inquiries">
            ✉ Inquiries
          </button>

          <button data-view="reviews">
            ★ Reviews
          </button>

          <button data-view="password">
            🔑 Change Password
          </button>

          <button
            class="danger"
            id="logout"
          >
            ↪ Log Out
          </button>

        </nav>

      </aside>

      <div class="admin-main">

        <header class="topbar">

          <h1 id="pageTitle">
            Dashboard
          </h1>

          <div class="top-actions">

            <a
              href="./index.html"
              target="_blank"
            >
              View Website ↗
            </a>

            <button
              id="refreshAll"
              class="btn btn-outline btn-sm"
            >
              Refresh
            </button>

          </div>

        </header>

        <main class="content">

          <div id="apiState"></div>

          <section
            id="view-dashboard"
            class="section-view active"
          ></section>

          <section
            id="view-settings"
            class="section-view"
          ></section>

          <section
            id="view-categories"
            class="section-view"
          ></section>

          <section
            id="view-brands"
            class="section-view"
          ></section>

          <section
            id="view-products"
            class="section-view"
          ></section>

          <section
            id="view-packages"
            class="section-view"
          ></section>

          <section
            id="view-inquiries"
            class="section-view"
          ></section>

          <section
            id="view-reviews"
            class="section-view"
          ></section>

          <section
            id="view-password"
            class="section-view"
          ></section>

        </main>

      </div>

    </div>
  `;

  $$('.side-nav [data-view]').forEach(button=>{
    button.onclick=()=>openView(button.dataset.view);
  });

  $('#logout').onclick=()=>logout();

  $('#refreshAll').onclick=loadAll;

  $$('[data-close]').forEach(button=>{
    button.onclick=()=>closeDialog(button.dataset.close);
  });

  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.addEventListener('click',event=>{
      if(event.target===dialog){
        dialog.close();
      }
    });
  });
}

async function loadAll(){
  try{
    const [
      dashboard,
      settings,
      categories,
      brands,
      products,
      packages,
      inquiries,
      reviews
    ]=await Promise.all([
      api('/api/admin/dashboard'),
      api('/api/admin/settings'),
      api('/api/admin/categories'),
      api('/api/admin/brands'),
      api('/api/admin/products'),
      api('/api/admin/packages'),
      api('/api/admin/inquiries'),
      api('/api/admin/reviews')
    ]);

    store={
      dashboard,
      settings,
      categories,
      brands,
      products,
      packages,
      inquiries,
      reviews
    };

    $('#apiState').innerHTML='';

    $('#sideName').textContent=
      settings.business_name||'POS Philippines';

    renderAll();

    notify(
      'Live data refreshed.',
      'success'
    );

  }catch(error){
    $('#apiState').innerHTML=`
      <div class="api-warning">
        ${esc(error.message)}
      </div>
    `;

    notify(error.message,'error');
  }
}

function renderAll(){
  renderDashboard();
  renderSettings();
  renderCategories();
  renderBrands();
  renderProducts();
  renderPackages();
  renderInquiries();
  renderReviews();
  renderPassword();
}

function openView(view){
  activeView=view;

  $$('.section-view').forEach(section=>{
    section.classList.remove('active');
  });

  $('#view-'+view)?.classList.add('active');

  $$('.side-nav [data-view]').forEach(button=>{
    button.classList.toggle(
      'active',
      button.dataset.view===view
    );
  });

  $('#pageTitle').textContent=({
    dashboard:'Dashboard',
    settings:'Website Settings',
    categories:'Categories',
    brands:'Brands',
    products:'Products',
    packages:'Packages',
    inquiries:'Customer Inquiries',
    reviews:'Customer Reviews',
    password:'Change Password'
  })[view]||'Dashboard';
}

function renderDashboard(){
  const dashboard=store.dashboard;

  $('#view-dashboard').innerHTML=`
    <div class="dashboard-cards">

      <div class="stat-card panel">
        <small>Products</small>
        <strong>${dashboard.products||0}</strong>
      </div>

      <div class="stat-card panel">
        <small>Active Inquiries</small>
        <strong>${dashboard.active_inquiries||0}</strong>
      </div>

      <div class="stat-card panel">
        <small>Completed</small>
        <strong>${dashboard.completed_inquiries||0}</strong>
      </div>

      <div class="stat-card panel">
        <small>Pending Reviews</small>
        <strong>${dashboard.pending_reviews||0}</strong>
      </div>

    </div>

    <div class="grid-2">

      <div class="panel">

        <div class="panel-head">

          <h2>Recent Inquiries</h2>

          <button
            class="btn btn-outline btn-sm"
            data-open="inquiries"
          >
            View All
          </button>

        </div>

        <div class="panel-body">

          ${
            store.inquiries
              .slice(0,5)
              .map(inquiry=>`
                <div style="
                  padding:10px 0;
                  border-bottom:1px solid var(--line);
                ">
                  <b>${esc(inquiry.tracking)}</b>

                  <div class="small muted">
                    ${esc(inquiry.name)}
                    •
                    ${esc(inquiry.status)}
                  </div>
                </div>
              `)
              .join('')
            ||
            '<div class="empty">No inquiries yet.</div>'
          }

        </div>

      </div>

      <div class="panel">

        <div class="panel-head">

          <h2>Pending Reviews</h2>

          <button
            class="btn btn-outline btn-sm"
            data-open="reviews"
          >
            Manage
          </button>

        </div>

        <div class="panel-body">

          ${
            store.reviews
              .filter(review=>review.status==='pending')
              .slice(0,5)
              .map(review=>`
                <div style="
                  padding:10px 0;
                  border-bottom:1px solid var(--line);
                ">
                  <b>${esc(review.name)}</b>

                  <div class="small muted">
                    ${'★'.repeat(review.rating)}
                    •
                    ${esc(review.message).slice(0,65)}
                  </div>
                </div>
              `)
              .join('')
            ||
            '<div class="empty">No pending reviews.</div>'
          }

        </div>

      </div>

    </div>
  `;

  $$('#view-dashboard [data-open]').forEach(button=>{
    button.onclick=()=>openView(button.dataset.open);
  });
}

function renderSettings(){
  const settings=store.settings;

  $('#view-settings').innerHTML=`
    <div class="panel">

      <div class="panel-head">
        <h2>Website Settings</h2>
      </div>

      <div class="panel-body">

        <form
          id="settingsForm"
          class="form-grid"
        >

          <div>
            <label>Business Name</label>

            <input
              name="business_name"
              class="control"
              value="${esc(settings.business_name||'')}"
              required
            >
          </div>

          <div>
            <label>Tagline</label>

            <input
              name="tagline"
              class="control"
              value="${esc(settings.tagline||'')}"
            >
          </div>

          <div class="full">
            <label>Hero Headline</label>

            <input
              name="hero_title"
              class="control"
              value="${esc(settings.hero_title||'')}"
            >
          </div>

          <div class="full">
            <label>Hero Description</label>

            <textarea
              name="hero_subtitle"
              class="control"
            >${esc(settings.hero_subtitle||'')}</textarea>
          </div>

          <div>
            <label>Email</label>

            <input
              name="email"
              type="email"
              class="control"
              value="${esc(settings.email||'')}"
            >
          </div>

          <div>
            <label>Contact Number</label>

            <input
              name="phone"
              class="control"
              value="${esc(settings.phone||'')}"
            >
          </div>

          <div>
            <label>Facebook Page Name</label>

            <input
              name="facebook_name"
              class="control"
              value="${esc(settings.facebook_name||'')}"
            >
          </div>

          <div>
            <label>Facebook Page Link</label>

            <input
              name="facebook_url"
              type="url"
              class="control"
              value="${esc(settings.facebook_url||'')}"
            >
          </div>

          <div class="full">
            <label>Address / Service Area</label>

            <input
              name="address"
              class="control"
              value="${esc(settings.address||'')}"
            >
          </div>

          <div>
            <label>Logo URL</label>

            <input
              name="logo_url"
              class="control"
              value="${esc(settings.logo_url||'')}"
            >
          </div>

          <div>
            <label>Upload Logo</label>

            <input
              id="settingsLogoUpload"
              type="file"
              accept="image/*"
              class="control"
            >
          </div>

          <div>
            <label>Hero Image URL</label>

            <input
              name="hero_image_url"
              class="control"
              value="${esc(settings.hero_image_url||'')}"
            >
          </div>

          <div>
            <label>Upload Hero Image</label>

            <input
              id="settingsHeroUpload"
              type="file"
              accept="image/*"
              class="control"
            >
          </div>

          <div class="full">
            <button class="btn btn-blue">
              Save Website Settings
            </button>
          </div>

        </form>

      </div>

    </div>
  `;

  $('#settingsForm').onsubmit=saveSettings;

  $('#settingsLogoUpload').onchange=event=>{
    uploadInto(
      event,
      $('#settingsForm').logo_url
    );
  };

  $('#settingsHeroUpload').onchange=event=>{
    uploadInto(
      event,
      $('#settingsForm').hero_image_url
    );
  };
}

async function saveSettings(event){
  event.preventDefault();

  try{
    store.settings=await api(
      '/api/admin/settings',
      {
        method:'PUT',
        body:JSON.stringify(
          Object.fromEntries(
            new FormData(event.currentTarget)
          )
        )
      }
    );

    renderSettings();

    $('#sideName').textContent=
      store.settings.business_name;

    notify(
      'Website settings saved.',
      'success'
    );

  }catch(error){
    notify(error.message,'error');
  }
}

function renderCategories(){
  const rows=store.categories.map(category=>`
    <tr>

      <td>
        ${imageCell(category.image_url,category.name)}
      </td>

      <td>
        <b>${esc(category.name)}</b>
      </td>

      <td>
        ${category.display_order}
      </td>

      <td>
        <span class="status">
          ${category.is_active?'Active':'Inactive'}
        </span>
      </td>

      <td>
        <div class="actions">

          <button
            class="btn btn-light btn-sm"
            data-edit-category="${category.id}"
          >
            Edit
          </button>

          <button
            class="btn btn-danger btn-sm"
            data-delete-category="${category.id}"
          >
            Delete
          </button>

        </div>
      </td>

    </tr>
  `).join('');

  $('#view-categories').innerHTML=tablePanel(
    'Categories',
    'Add Category',
    'category',
    `
      <th>Image</th>
      <th>Name</th>
      <th>Order</th>
      <th>Status</th>
      <th>Actions</th>
    `,
    rows
  );

  wireEntityButtons('category');
}

function renderBrands(){
  const rows=store.brands.map(brand=>`
    <tr>

      <td>
        ${imageCell(brand.logo_url,brand.name)}
      </td>

      <td>
        <b>${esc(brand.name)}</b>
      </td>

      <td>
        ${
          esc(
            store.categories.find(
              category=>category.id===brand.category_id
            )?.name||'—'
          )
        }
      </td>

      <td>
        ${brand.display_order}
      </td>

      <td>
        <span class="status">
          ${brand.is_active?'Active':'Inactive'}
        </span>
      </td>

      <td>
        <div class="actions">

          <button
            class="btn btn-light btn-sm"
            data-edit-brand="${brand.id}"
          >
            Edit
          </button>

          <button
            class="btn btn-danger btn-sm"
            data-delete-brand="${brand.id}"
          >
            Delete
          </button>

        </div>
      </td>

    </tr>
  `).join('');

  $('#view-brands').innerHTML=tablePanel(
    'Brands',
    'Add Brand',
    'brand',
    `
      <th>Logo</th>
      <th>Name</th>
      <th>Category</th>
      <th>Order</th>
      <th>Status</th>
      <th>Actions</th>
    `,
    rows
  );

  wireEntityButtons('brand');
}

function renderProducts(){
  const rows=store.products.map(product=>`
    <tr>

      <td>
        ${imageCell(product.image_url,product.name)}
      </td>

      <td>
        <b>${esc(product.name)}</b>

        <div class="small muted">
          ${esc(product.short_description||'')}
        </div>
      </td>

      <td>
        ${
          esc(
            store.categories.find(
              category=>category.id===product.category_id
            )?.name||'—'
          )
        }

        <div class="small muted">
          ${
            esc(
              store.brands.find(
                brand=>brand.id===product.brand_id
              )?.name||'—'
            )
          }
        </div>
      </td>

      <td>
        ${peso(product.price)}
      </td>

      <td>
        <span class="status">
          ${product.is_available?'Visible':'Hidden'}
        </span>
      </td>

      <td>
        <div class="actions">

          <button
            class="btn btn-light btn-sm"
            data-edit-product="${product.id}"
          >
            Edit
          </button>

          <button
            class="btn btn-danger btn-sm"
            data-delete-product="${product.id}"
          >
            Delete
          </button>

        </div>
      </td>

    </tr>
  `).join('');

  $('#view-products').innerHTML=tablePanel(
    'Products',
    'Add Product',
    'product',
    `
      <th>Image</th>
      <th>Product</th>
      <th>Category / Brand</th>
      <th>Price</th>
      <th>Status</th>
      <th>Actions</th>
    `,
    rows
  );

  wireEntityButtons('product');
}

function renderPackages(){
  const rows=store.packages.map(packageItem=>`
    <tr>

      <td>
        ${imageCell(packageItem.image_url,packageItem.name)}
      </td>

      <td>
        <b>${esc(packageItem.name)}</b>

        <div class="small muted">
          ${esc(packageItem.subtitle||'')}
        </div>
      </td>

      <td>
        ${(packageItem.inclusions||[]).length} item(s)
      </td>

      <td>
        ${peso(packageItem.price)}
      </td>

      <td>
        <span class="status">
          ${packageItem.is_active?'Active':'Inactive'}
        </span>
      </td>

      <td>
        <div class="actions">

          <button
            class="btn btn-light btn-sm"
            data-edit-package="${packageItem.id}"
          >
            Edit
          </button>

          <button
            class="btn btn-danger btn-sm"
            data-delete-package="${packageItem.id}"
          >
            Delete
          </button>

        </div>
      </td>

    </tr>
  `).join('');

  $('#view-packages').innerHTML=tablePanel(
    'Packages',
    'Add Package',
    'package',
    `
      <th>Image</th>
      <th>Name</th>
      <th>Inclusions</th>
      <th>Price</th>
      <th>Status</th>
      <th>Actions</th>
    `,
    rows
  );

  wireEntityButtons('package');
}

function tablePanel(title,buttonText,type,headings,rows){
  return `
    <div class="panel">

      <div class="panel-head">

        <h2>${title}</h2>

        <button
          class="btn btn-blue btn-sm"
          data-add-${type}
        >
          + ${buttonText}
        </button>

      </div>

      <div class="panel-body table-wrap">

        <table class="data-table">

          <thead>
            <tr>
              ${headings}
            </tr>
          </thead>

          <tbody>
            ${
              rows
              ||
              `
                <tr>
                  <td colspan="8">
                    <div class="empty">
                      No records yet.
                    </div>
                  </td>
                </tr>
              `
            }
          </tbody>

        </table>

      </div>

    </div>
  `;
}

function wireEntityButtons(type){
  const root=$('#view-'+plural(type));

  if(!root){
    return;
  }

  const addButton=root.querySelector(
    `[data-add-${type}]`
  );

  if(addButton){
    addButton.onclick=()=>entityForm(type);
  }

  root.querySelectorAll(
    `[data-edit-${type}]`
  ).forEach(button=>{
    button.onclick=()=>entityForm(
      type,
      button.dataset[
        `edit${type[0].toUpperCase()+type.slice(1)}`
      ]
      ||
      button.getAttribute(`data-edit-${type}`)
    );
  });

  root.querySelectorAll(
    `[data-delete-${type}]`
  ).forEach(button=>{
    button.onclick=()=>deleteEntity(
      type,
      button.getAttribute(`data-delete-${type}`)
    );
  });
}

function categoryOptions(selected=''){
  return `
    <option value="">
      Select category
    </option>
  `
  +
  store.categories.map(category=>`
    <option
      value="${category.id}"
      ${category.id===selected?'selected':''}
    >
      ${esc(category.name)}
    </option>
  `).join('');
}

function brandOptions(categoryId,selected=''){
  return `
    <option value="">
      Select brand
    </option>
  `
  +
  store.brands
    .filter(brand=>{
      return !categoryId||brand.category_id===categoryId;
    })
    .map(brand=>`
      <option
        value="${brand.id}"
        ${brand.id===selected?'selected':''}
      >
        ${esc(brand.name)}
      </option>
    `)
    .join('');
}

function entityForm(type,id=''){
  const list=store[plural(type)]||[];

  const object=list.find(item=>item.id===id)||{};

  $('#entityDialogTitle').textContent=
    (id?'Edit ':'Add ')
    +
    type[0].toUpperCase()
    +
    type.slice(1);

  let fields='';

  if(type==='category'){
    fields=`
      <div>
        <label>Category Name</label>

        <input
          name="name"
          class="control"
          value="${esc(object.name||'')}"
          required
        >
      </div>

      <div>
        <label>Display Order</label>

        <input
          name="display_order"
          type="number"
          class="control"
          value="${object.display_order??1}"
        >
      </div>

      <div class="full">
        <label>Image URL</label>

        <input
          name="image_url"
          class="control"
          value="${esc(object.image_url||'')}"
        >
      </div>

      <div>
        <label>Upload Image</label>

        <input
          id="entityUpload"
          type="file"
          accept="image/*"
          class="control"
        >
      </div>

      <div>
        <label class="check-row">
          <input
            name="is_active"
            type="checkbox"
            ${object.is_active!==0?'checked':''}
          >
          Active
        </label>
      </div>
    `;
  }

  if(type==='brand'){
    fields=`
      <div>
        <label>Category</label>

        <select
          name="category_id"
          class="control"
          required
        >
          ${categoryOptions(object.category_id)}
        </select>
      </div>

      <div>
        <label>Brand Name</label>

        <input
          name="name"
          class="control"
          value="${esc(object.name||'')}"
          required
        >
      </div>

      <div>
        <label>Display Order</label>

        <input
          name="display_order"
          type="number"
          class="control"
          value="${object.display_order??1}"
        >
      </div>

      <div>
        <label>Logo URL</label>

        <input
          name="logo_url"
          class="control"
          value="${esc(object.logo_url||'')}"
        >
      </div>

      <div>
        <label>Upload Logo</label>

        <input
          id="entityUpload"
          type="file"
          accept="image/*"
          class="control"
        >
      </div>

      <div>
        <label class="check-row">
          <input
            name="is_active"
            type="checkbox"
            ${object.is_active!==0?'checked':''}
          >
          Active
        </label>
      </div>
    `;
  }

  if(type==='product'){
    fields=`
      <div>
        <label>Category</label>

        <select
          name="category_id"
          id="productCategory"
          class="control"
          required
        >
          ${categoryOptions(object.category_id)}
        </select>
      </div>

      <div>
        <label>Brand</label>

        <select
          name="brand_id"
          id="productBrand"
          class="control"
        >
          ${
            brandOptions(
              object.category_id,
              object.brand_id
            )
          }
        </select>
      </div>

      <div class="full">
        <label>Product Name</label>

        <input
          name="name"
          class="control"
          value="${esc(object.name||'')}"
          required
        >
      </div>

      <div>
        <label>Price (0 = Ask for Quote)</label>

        <input
          name="price"
          type="number"
          min="0"
          class="control"
          value="${object.price??0}"
        >
      </div>

      <div>
        <label>Image URL</label>

        <input
          name="image_url"
          class="control"
          value="${esc(object.image_url||'')}"
        >
      </div>

      <div>
        <label>Upload Product Image</label>

        <input
          id="entityUpload"
          type="file"
          accept="image/*"
          class="control"
        >
      </div>

      <div class="full">
        <label>Short Description</label>

        <input
          name="short_description"
          class="control"
          value="${esc(object.short_description||'')}"
        >
      </div>

      <div class="full">
        <label>Full Description</label>

        <textarea
          name="description"
          class="control"
        >${esc(object.description||'')}</textarea>
      </div>

      <div>
        <label class="check-row">
          <input
            name="is_featured"
            type="checkbox"
            ${object.is_featured?'checked':''}
          >
          Featured
        </label>
      </div>

      <div>
        <label class="check-row">
          <input
            name="is_available"
            type="checkbox"
            ${object.is_available!==0?'checked':''}
          >
          Visible / Available
        </label>
      </div>
    `;
  }

  if(type==='package'){
    fields=`
      <div class="full">
        <label>Package Name</label>

        <input
          name="name"
          class="control"
          value="${esc(object.name||'')}"
          required
        >
      </div>

      <div>
        <label>Subtitle</label>

        <input
          name="subtitle"
          class="control"
          value="${esc(object.subtitle||'')}"
        >
      </div>

      <div>
        <label>Price</label>

        <input
          name="price"
          type="number"
          min="0"
          class="control"
          value="${object.price??0}"
        >
      </div>

      <div class="full">
        <label>Image URL</label>

        <input
          name="image_url"
          class="control"
          value="${esc(object.image_url||'')}"
        >
      </div>

      <div>
        <label>Upload Package Image</label>

        <input
          id="entityUpload"
          type="file"
          accept="image/*"
          class="control"
        >
      </div>

      <div>
        <label>Display Order</label>

        <input
          name="display_order"
          type="number"
          class="control"
          value="${object.display_order??1}"
        >
      </div>

      <div class="full">
        <label>Inclusions (one per line)</label>

        <textarea
          name="inclusions"
          class="control"
        >${esc((object.inclusions||[]).join('\n'))}</textarea>
      </div>

      <div>
        <label class="check-row">
          <input
            name="is_featured"
            type="checkbox"
            ${object.is_featured?'checked':''}
          >
          Most popular
        </label>
      </div>

      <div>
        <label class="check-row">
          <input
            name="is_active"
            type="checkbox"
            ${object.is_active!==0?'checked':''}
          >
          Active
        </label>
      </div>
    `;
  }

  $('#entityDialogBody').innerHTML=`
    <form
      id="entityForm"
      class="form-grid"
    >

      ${fields}

      <div class="full">
        <button class="btn btn-blue btn-block">
          Save ${type}
        </button>
      </div>

    </form>
  `;

  openDialog('entityDialog');

  const form=$('#entityForm');

  if(type==='product'){
    $('#productCategory').onchange=()=>{
      $('#productBrand').innerHTML=brandOptions(
        $('#productCategory').value
      );
    };
  }

  const fileInput=$('#entityUpload');

  if(fileInput){
    const target=
      form.elements.image_url
      ||
      form.elements.logo_url;

    fileInput.onchange=event=>{
      uploadInto(event,target);
    };
  }

  form.onsubmit=event=>{
    saveEntity(event,type,id);
  };
}

async function uploadInto(event,target){
  const file=event.target.files[0];

  if(!file){
    return;
  }

  try{
    const formData=new FormData();

    formData.append('file',file);

    const result=await api(
      '/api/admin/upload',
      {
        method:'POST',
        body:formData
      }
    );

    target.value=result.url;

    notify(
      'Image uploaded.',
      'success'
    );

  }catch(error){
    notify(error.message,'error');
  }
}

async function saveEntity(event,type,id){
  event.preventDefault();

  const form=event.currentTarget;

  const payload=Object.fromEntries(
    new FormData(form)
  );

  [
    'is_active',
    'is_featured',
    'is_available'
  ].forEach(field=>{
    if(form.elements[field]){
      payload[field]=form.elements[field].checked;
    }
  });

  if(type==='package'){
    payload.inclusions=String(
      payload.inclusions||''
    )
    .split('\n')
    .map(item=>item.trim())
    .filter(Boolean);
  }

  try{
    const collection=plural(type);

    const saved=await api(
      `/api/admin/${collection}${id?'/'+id:''}`,
      {
        method:id?'PUT':'POST',
        body:JSON.stringify(payload)
      }
    );

    const list=store[collection];

    const index=list.findIndex(
      item=>item.id===saved.id
    );

    if(index>=0){
      list[index]=saved;
    }else{
      list.push(saved);
    }

    closeDialog('entityDialog');

    renderAll();

    notify(
      `${type[0].toUpperCase()+type.slice(1)} saved.`,
      'success'
    );

  }catch(error){
    notify(error.message,'error');
  }
}

async function deleteEntity(type,id){
  if(!confirm(`Delete this ${type}?`)){
    return;
  }

  try{
    const collection=plural(type);

    await api(
      `/api/admin/${collection}/${id}`,
      {
        method:'DELETE'
      }
    );

    store[collection]=store[collection].filter(
      item=>item.id!==id
    );

    renderAll();

    notify(
      'Item deleted.',
      'success'
    );

  }catch(error){
    notify(error.message,'error');
  }
}

function renderInquiries(){
  const rows=store.inquiries.map(inquiry=>`
    <tr>

      <td>
        <b>${esc(inquiry.tracking)}</b>
      </td>

      <td>
        ${esc(inquiry.name)}

        <div class="small muted">
          ${esc(inquiry.email)}
          •
          ${esc(inquiry.phone)}
        </div>
      </td>

      <td>
        ${
          esc(
            store.categories.find(
              category=>category.id===inquiry.category_id
            )?.name||'—'
          )
        }

        <div class="small muted">
          ${
            esc(
              store.products.find(
                product=>product.id===inquiry.product_id
              )?.name
              ||
              store.brands.find(
                brand=>brand.id===inquiry.brand_id
              )?.name
              ||
              'General inquiry'
            )
          }
        </div>
      </td>

      <td>
        <span class="status ${slug(inquiry.status)}">
          ${esc(inquiry.status)}
        </span>
      </td>

      <td>
        ${fmt(inquiry.updated_at)}
      </td>

      <td>
        <button
          class="btn btn-blue btn-sm"
          data-manage-inquiry="${inquiry.id}"
        >
          Manage
        </button>
      </td>

    </tr>
  `).join('');

  $('#view-inquiries').innerHTML=`
    <div class="panel">

      <div class="panel-head">
        <h2>Customer Inquiries</h2>
      </div>

      <div class="panel-body table-wrap">

        <table class="data-table">

          <thead>
            <tr>
              <th>Tracking</th>
              <th>Customer</th>
              <th>Interest</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${
              rows
              ||
              `
                <tr>
                  <td colspan="6">
                    <div class="empty">
                      No inquiries yet.
                    </div>
                  </td>
                </tr>
              `
            }
          </tbody>

        </table>

      </div>

    </div>
  `;

  $$('[data-manage-inquiry]').forEach(button=>{
    button.onclick=()=>{
      manageInquiry(button.dataset.manageInquiry);
    };
  });
}

async function manageInquiry(id){
  try{
    const inquiry=await api(
      '/api/admin/inquiries/'+id
    );

    const form=$('#inquiryUpdateForm');

    form.id.value=inquiry.id;

    form.status.innerHTML=STATUSES.map(status=>`
      <option
        ${status===inquiry.status?'selected':''}
      >
        ${status}
      </option>
    `).join('');

    form.followup_date.value=
      inquiry.followup_date||'';

    form.public_note.value=
      inquiry.public_note||'';

    form.internal_note.value=
      inquiry.internal_note||'';

    $('#inquiryDetails').innerHTML=`
      <div class="result-box">

        <b>
          ${esc(inquiry.tracking)}
          —
          ${esc(inquiry.name)}
        </b>

        <p class="small">
          ${esc(inquiry.business||'No business name')}
          •
          ${esc(inquiry.email)}
          •
          ${esc(inquiry.phone)}
        </p>

        <p>
          <b>Sales:</b>
          ${esc(inquiry.sales_representative||'Not specified')}
        </p>

        <p>
          ${esc(inquiry.message)}
        </p>

      </div>
    `;

    $('#inquiryHistory').innerHTML=
      (inquiry.history||[])
      .map(history=>`
        <div class="timeline-item">

          <span class="timeline-dot"></span>

          <div>

            <b>
              ${esc(history.status)}
            </b>

            <small>
              ${esc(history.note||'')}
              •
              ${fmt(history.created_at)}
            </small>

          </div>

        </div>
      `)
      .join('');

    openDialog('inquiryDialog');

    $('#inquiryUpdateForm').onsubmit=saveInquiry;

  }catch(error){
    notify(error.message,'error');
  }
}

async function saveInquiry(event){
  event.preventDefault();

  const payload=Object.fromEntries(
    new FormData(event.currentTarget)
  );

  const id=payload.id;

  delete payload.id;

  try{
    const inquiry=await api(
      '/api/admin/inquiries/'+id,
      {
        method:'PUT',
        body:JSON.stringify(payload)
      }
    );

    const index=store.inquiries.findIndex(
      item=>item.id===id
    );

    if(index>=0){
      store.inquiries[index]=inquiry;
    }

    closeDialog('inquiryDialog');

    renderAll();

    notify(
      'Inquiry updated.',
      'success'
    );

  }catch(error){
    notify(error.message,'error');
  }
}

function renderReviews(){
  const rows=store.reviews.map(review=>`
    <tr>

      <td>
        <b>${esc(review.name)}</b>

        <div class="small muted">
          ${esc(review.tracking)}
        </div>
      </td>

      <td>
        <span class="stars">
          ${'★'.repeat(review.rating)}
          ${'☆'.repeat(5-review.rating)}
        </span>
      </td>

      <td>
        ${
          review.image_url
            ?`
              <img
                src="${esc(review.image_url)}"
                style="
                  width:54px;
                  height:45px;
                  object-fit:cover;
                  float:left;
                  margin-right:8px;
                "
              >
            `
            :''
        }

        ${esc(review.message)}
      </td>

      <td>
        <span class="status ${slug(review.status)}">
          ${esc(review.status)}
        </span>
      </td>

      <td>
        <div class="actions">

          ${
            review.status!=='approved'
              ?`
                <button
                  class="btn btn-success btn-sm"
                  data-review-status="approved"
                  data-id="${review.id}"
                >
                  Approve
                </button>
              `
              :''
          }

          ${
            review.status!=='rejected'
              ?`
                <button
                  class="btn btn-outline btn-sm"
                  data-review-status="rejected"
                  data-id="${review.id}"
                >
                  Reject
                </button>
              `
              :''
          }

          <button
            class="btn btn-danger btn-sm"
            data-delete-review="${review.id}"
          >
            Delete
          </button>

        </div>
      </td>

    </tr>
  `).join('');

  $('#view-reviews').innerHTML=`
    <div class="panel">

      <div class="panel-head">
        <h2>Customer Reviews</h2>
      </div>

      <div class="panel-body table-wrap">

        <table class="data-table">

          <thead>
            <tr>
              <th>Customer</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${
              rows
              ||
              `
                <tr>
                  <td colspan="5">
                    <div class="empty">
                      No reviews yet.
                    </div>
                  </td>
                </tr>
              `
            }
          </tbody>

        </table>

      </div>

    </div>
  `;

  $$('[data-review-status]').forEach(button=>{
    button.onclick=()=>{
      reviewStatus(
        button.dataset.id,
        button.dataset.reviewStatus
      );
    };
  });

  $$('[data-delete-review]').forEach(button=>{
    button.onclick=()=>{
      deleteReview(button.dataset.deleteReview);
    };
  });
}

async function reviewStatus(id,status){
  try{
    const review=await api(
      `/api/admin/reviews/${id}/status`,
      {
        method:'PUT',
        body:JSON.stringify({status})
      }
    );

    const index=store.reviews.findIndex(
      item=>item.id===id
    );

    if(index>=0){
      store.reviews[index]=review;
    }

    renderAll();

    notify(
      'Review updated.',
      'success'
    );

  }catch(error){
    notify(error.message,'error');
  }
}

async function deleteReview(id){
  if(!confirm('Delete this review?')){
    return;
  }

  try{
    await api(
      '/api/admin/reviews/'+id,
      {
        method:'DELETE'
      }
    );

    store.reviews=store.reviews.filter(
      review=>review.id!==id
    );

    renderAll();

    notify(
      'Review deleted.',
      'success'
    );

  }catch(error){
    notify(error.message,'error');
  }
}

function renderPassword(){
  $('#view-password').innerHTML=`
    <div
      class="panel"
      style="max-width:650px"
    >

      <div class="panel-head">
        <h2>Change Admin Password</h2>
      </div>

      <div class="panel-body">

        <form
          id="changePasswordForm"
          class="form-grid"
        >

          <div class="full">
            <label>Current Password</label>

            <input
              name="current_password"
              type="password"
              class="control"
              required
            >
          </div>

          <div>
            <label>New Password</label>

            <input
              name="new_password"
              type="password"
              minlength="8"
              class="control"
              required
            >
          </div>

          <div>
            <label>Confirm New Password</label>

            <input
              name="confirm_password"
              type="password"
              minlength="8"
              class="control"
              required
            >
          </div>

          <div class="full">
            <button class="btn btn-blue">
              Change Password
            </button>
          </div>

        </form>

      </div>

    </div>
  `;

  $('#changePasswordForm').onsubmit=async event=>{
    event.preventDefault();

    const form=event.currentTarget;

    if(form.new_password.value!==form.confirm_password.value){
      notify(
        'New passwords do not match.',
        'error'
      );
      return;
    }

    try{
      await api(
        '/api/auth/change-password',
        {
          method:'POST',
          body:JSON.stringify({
            current_password:form.current_password.value,
            new_password:form.new_password.value
          })
        }
      );

      notify(
        'Password changed. Please log in again.',
        'success'
      );

      logout();

    }catch(error){
      notify(error.message,'error');
    }
  };
}

if(token){
  startAdmin();
}else{
  loginView();
}

})();
