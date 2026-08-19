// ============================================================
// Shibam Drugs India — App Logic (Supabase-backed, multi-device live sync)
// ============================================================

let products = [];
let priorityCustomers = [];
let storeSettings = { store_whatsapp: '919435776901', store_call: '917002323187' };
let cart = JSON.parse(localStorage.getItem('sdi_cart') || '{}');
let activeCategory = 'All';
let ownerUnlocked = false;
let editProductId = null;

document.getElementById('storeNameHeader').textContent = STORE_NAME;

// ---------------- Toast ----------------
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------------- View / Tab switching ----------------
function setView(v) {
  ['shop', 'checkout', 'orders'].forEach(id => {
    const el = document.getElementById('view-' + id);
    if (el) el.style.display = (id === v) ? 'block' : 'none';
  });
  document.getElementById('view-owner-login').style.display = 'none';
  document.getElementById('view-owner').style.display = 'none';

  if (v === 'owner') {
    document.getElementById(ownerUnlocked ? 'view-owner' : 'view-owner-login').style.display = 'block';
    if (ownerUnlocked) { renderAdminOrders(); }
  }

  ['tab-shop', 'tab-orders', 'tab-owner'].forEach(id => document.getElementById(id).classList.remove('active'));
  if (v === 'shop' || v === 'checkout') document.getElementById('tab-shop').classList.add('active');
  if (v === 'orders') document.getElementById('tab-orders').classList.add('active');
  if (v === 'owner') document.getElementById('tab-owner').classList.add('active');

  updateFab();
}

function setAdminTab(t) {
  ['orders', 'products', 'priority', 'settings'].forEach(id => {
    document.getElementById('admin-' + id).style.display = (id === t) ? 'block' : 'none';
    document.getElementById('atab-' + id).classList.toggle('active', id === t);
  });
  if (t === 'orders') renderAdminOrders();
  if (t === 'products') renderAdminProducts();
  if (t === 'priority') renderAdminPriority();
  if (t === 'settings') renderSettingsForm();
}

// ---------------- Products (public read, realtime) ----------------
async function loadProducts() {
  const { data, error } = await supabaseClient.from('products').select('*').order('sort_order');
  if (error) { console.error(error); toast('Products load nahi ho paye'); return; }
  products = data || [];
  renderCategoryBar();
  renderProductGrid();
  if (ownerUnlocked) renderAdminProducts();
}

function renderCategoryBar() {
  const cats = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  document.getElementById('catBar').innerHTML = cats.map(c =>
    `<button class="${c === activeCategory ? 'active' : ''}" onclick="setCategory('${c.replace(/'/g, "\\'")}')">${c}</button>`
  ).join('');
}
function setCategory(c) { activeCategory = c; renderCategoryBar(); renderProductGrid(); }

function renderProductGrid() {
  const wrap = document.getElementById('productGrid');
  const list = products.filter(p => activeCategory === 'All' || p.category === activeCategory);
  if (list.length === 0) { wrap.innerHTML = `<div class="empty">Koi products nahi mile</div>`; return; }
  wrap.innerHTML = list.map(p => {
    const qty = cart[p.id] || 0;
    const mrpLine = (p.mrp && p.mrp > p.price) ? `<s>₹${p.mrp}</s>` : '';
    return `<div class="card ${p.available ? '' : 'unavailable'}">
      <h3>${p.name}</h3>
      <p>${p.description || ''}</p>
      <div class="price">₹${p.price} <span style="font-weight:400;font-size:11px;color:var(--ink-soft);">/${p.unit || 'pc'}</span>${mrpLine}</div>
      ${p.available ? (qty > 0
        ? `<div class="qtybar"><button onclick="changeQty('${p.id}',-1)">−</button><b>${qty}</b><button onclick="changeQty('${p.id}',1)">+</button></div>`
        : `<button class="addbtn" onclick="changeQty('${p.id}',1)">Add to Order</button>`)
        : `<div class="sub" style="text-align:center;">Currently unavailable</div>`}
    </div>`;
  }).join('');
}

function changeQty(id, delta) {
  const q = (cart[id] || 0) + delta;
  if (q <= 0) delete cart[id]; else cart[id] = q;
  localStorage.setItem('sdi_cart', JSON.stringify(cart));
  renderProductGrid();
  updateFab();
}

function updateFab() {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const fab = document.getElementById('fabCheckout');
  const onShop = document.getElementById('view-shop').style.display !== 'none';
  if (count > 0 && onShop) { fab.classList.add('show'); document.getElementById('fabCount').textContent = count; }
  else fab.classList.remove('show');
}

function isPriorityPhone(phone) {
  return priorityCustomers.some(c => c.phone === phone);
}

function renderBillPreview() {
  const ids = Object.keys(cart);
  const wrap = document.getElementById('billItems');
  if (ids.length === 0) { wrap.innerHTML = `<div class="empty">No items added yet</div>`; document.getElementById('billTotal').textContent = '₹0'; return; }
  let subtotal = 0;
  wrap.innerHTML = ids.map(id => {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return '';
    const amt = p.price * cart[id];
    subtotal += amt;
    return `<div class="bill-line"><span>${p.name} × ${cart[id]}</span><span>₹${amt}</span></div>`;
  }).join('');
  const phone = document.getElementById('custPhone').value.trim();
  const priority = isPriorityPhone(phone);
  let total = subtotal;
  if (priority) {
    const discount = subtotal * 0.02;
    total = subtotal - discount;
    wrap.innerHTML += `<div class="bill-line" style="color:var(--accent);font-weight:600;"><span>★ Priority Discount (2%)</span><span>-₹${discount.toFixed(2)}</span></div>`;
  }
  document.getElementById('billTotal').textContent = '₹' + total.toFixed(2);
}
document.addEventListener('input', e => { if (e.target.id === 'custPhone') renderBillPreview(); });

// ---------------- Place order ----------------
async function placeOrder() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const area = document.getElementById('custArea').value.trim();
  const ids = Object.keys(cart);

  if (ids.length === 0) { toast('Pehle kuch items add karein'); return; }
  if (!name || !phone) { toast('Naam aur phone number bharna zaroori hai'); return; }

  const priority = isPriorityPhone(phone);
  let subtotal = 0;
  const items = ids.map(id => {
    const p = products.find(x => String(x.id) === String(id));
    const amt = p.price * cart[id];
    subtotal += amt;
    return { product_id: p.id, name: p.name, unit: p.unit, qty: cart[id], price: p.price };
  });
  const discount = priority ? subtotal * 0.02 : 0;
  const total = subtotal - discount;

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true; btn.textContent = 'Placing order…';

  const { data, error } = await supabaseClient.from('orders').insert([{
    customer_name: name, customer_phone: phone, customer_area: area,
    items, subtotal, discount, total, is_priority: priority
  }]).select();

  btn.disabled = false; btn.textContent = 'Place Order';

  if (error) { console.error(error); toast('Order place nahi ho paya, dubara try karein'); return; }

  // Send WhatsApp message to store with the order slip
  const waText = `Hello ${STORE_NAME}, I want to order:\n` +
    items.map(i => `- ${i.name} (${i.unit}) x ${i.qty}`).join('\n') +
    `\nTotal: ₹${total.toFixed(2)}\nName: ${name}\nPhone: ${phone}\nArea: ${area}`;
  window.open(`https://wa.me/${storeSettings.store_whatsapp}?text=` + encodeURIComponent(waText), '_blank');

  cart = {};
  localStorage.setItem('sdi_cart', '{}');
  localStorage.setItem('sdi_my_phone', phone);
  toast('✓ Order placed — opening WhatsApp');
  renderProductGrid();
  setView('shop');
}

// ---------------- My Orders (via RPC, scoped by phone) ----------------
async function loadMyOrders() {
  const phone = document.getElementById('myOrdersPhone').value.trim();
  if (!phone) { toast('Phone number daalein'); return; }
  localStorage.setItem('sdi_my_phone', phone);
  const { data, error } = await supabaseClient.rpc('get_orders_by_phone', { p_phone: phone });
  const wrap = document.getElementById('myOrdersList');
  if (error) { console.error(error); wrap.innerHTML = `<div class="empty">Kuch galat ho gaya</div>`; return; }
  if (!data || data.length === 0) { wrap.innerHTML = `<div class="empty">Is number se koi order nahi mila</div>`; return; }
  wrap.innerHTML = data.map(orderCardHtml).join('');
}

function orderCardHtml(o) {
  const date = new Date(o.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<div class="order-card">
    <div style="display:flex;justify-content:space-between;">
      <b>Order #${o.order_no}</b>
      <span class="badge ${o.status}">${o.status}</span>
    </div>
    <div class="sub" style="margin:4px 0;">${date}</div>
    ${o.items.map(i => `<div>${i.name} (${i.unit}) × ${i.qty}</div>`).join('')}
    <div style="font-weight:700;margin-top:6px;">Total: ₹${Number(o.total).toFixed(2)}</div>
  </div>`;
}

// ---------------- Owner login (Supabase Auth) ----------------
async function ownerLogin() {
  const pass = document.getElementById('ownerPasscodeInput').value;
  const errEl = document.getElementById('ownerLoginError');
  errEl.textContent = '';
  if (!pass) return;
  const { error } = await supabaseClient.auth.signInWithPassword({ email: OWNER_EMAIL, password: pass });
  if (error) { errEl.textContent = 'Galat passcode. Dubara try karein.'; return; }
  ownerUnlocked = true;
  document.getElementById('ownerPasscodeInput').value = '';
  setView('owner');
}

async function ownerLogout() {
  await supabaseClient.auth.signOut();
  ownerUnlocked = false;
  setView('shop');
}

// ---------------- Owner: Orders ----------------
let allOrdersCache = [];
async function renderAdminOrders() {
  const { data, error } = await supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
  const wrap = document.getElementById('adminOrdersList');
  if (error) { wrap.innerHTML = `<div class="empty">Orders load nahi ho paye</div>`; return; }
  allOrdersCache = data || [];
  filterAdminOrders();
}
function filterAdminOrders() {
  const q = (document.getElementById('orderSearch')?.value || '').toLowerCase();
  const wrap = document.getElementById('adminOrdersList');
  const list = allOrdersCache.filter(o =>
    !q || o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q) || (o.customer_area || '').toLowerCase().includes(q)
  );
  if (list.length === 0) { wrap.innerHTML = `<div class="empty">Koi order nahi mila</div>`; return; }
  wrap.innerHTML = list.map(o => `
    <div class="order-card">
      <div style="display:flex;justify-content:space-between;">
        <b>${o.customer_name}</b>
        <span class="badge ${o.status}">${o.status}</span>
      </div>
      <div class="sub">${o.customer_phone} · ${o.customer_area || '-'}</div>
      ${o.items.map(i => `<div>${i.name} × ${i.qty}</div>`).join('')}
      <div style="font-weight:700;margin:4px 0;">₹${Number(o.total).toFixed(2)}</div>
      <select onchange="updateOrderStatus('${o.id}', this.value)" style="width:100%;padding:6px;border-radius:6px;border:1px solid var(--border);">
        ${['new', 'confirmed', 'delivered', 'cancelled'].map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>`).join('');
}
document.addEventListener('input', e => { if (e.target.id === 'orderSearch') filterAdminOrders(); });

async function updateOrderStatus(id, status) {
  const { error } = await supabaseClient.from('orders').update({ status }).eq('id', id);
  if (error) toast('Status update nahi hua'); else toast('✓ Status updated');
}

// ---------------- Owner: Products CRUD ----------------
function renderAdminProducts() {
  const wrap = document.getElementById('adminProductList');
  wrap.innerHTML = products.map(p => `
    <div class="order-card">
      <div style="display:flex;justify-content:space-between;">
        <b>${p.name}</b>
        <span>${p.available ? '✅' : '🚫'}</span>
      </div>
      <div class="sub">${p.category || ''} · ₹${p.price}/${p.unit || 'pc'}</div>
      <div style="display:flex;gap:6px;margin-top:6px;">
        <button class="btn secondary" style="width:auto;padding:6px 12px;font-size:12px;" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn secondary" style="width:auto;padding:6px 12px;font-size:12px;" onclick="toggleAvailable('${p.id}')">${p.available ? 'Mark Unavailable' : 'Mark Available'}</button>
        <button class="btn secondary" style="width:auto;padding:6px 12px;font-size:12px;color:var(--danger);border-color:var(--danger);" onclick="deleteProduct('${p.id}')">Delete</button>
      </div>
    </div>`).join('');
}

function editProduct(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-category').value = p.category || '';
  document.getElementById('p-unit').value = p.unit || '';
  document.getElementById('p-price').value = p.price;
  document.getElementById('p-mrp').value = p.mrp || '';
  document.getElementById('p-desc').value = p.description || '';
  document.getElementById('p-photo').value = p.photo_url || '';
  setAdminTab('products');
  window.scrollTo(0, 0);
}
function clearProductForm() {
  ['p-id', 'p-name', 'p-category', 'p-unit', 'p-price', 'p-mrp', 'p-desc', 'p-photo'].forEach(id => document.getElementById(id).value = '');
}

async function saveProduct() {
  const id = document.getElementById('p-id').value || crypto.randomUUID();
  const row = {
    id,
    name: document.getElementById('p-name').value.trim(),
    category: document.getElementById('p-category').value.trim(),
    unit: document.getElementById('p-unit').value.trim() || 'pc',
    price: parseFloat(document.getElementById('p-price').value) || 0,
    mrp: parseFloat(document.getElementById('p-mrp').value) || null,
    description: document.getElementById('p-desc').value.trim(),
    photo_url: document.getElementById('p-photo').value.trim() || null,
    available: true,
    sort_order: products.length + 1
  };
  if (!row.name) { toast('Product name zaroori hai'); return; }
  const { error } = await supabaseClient.from('products').upsert(row);
  if (error) { console.error(error); toast('Save nahi hua'); return; }
  toast('✓ Product saved');
  clearProductForm();
}

async function toggleAvailable(id) {
  const p = products.find(x => String(x.id) === String(id));
  const { error } = await supabaseClient.from('products').update({ available: !p.available }).eq('id', id);
  if (error) toast('Update nahi hua');
}

async function deleteProduct(id) {
  if (!confirm('Yeh product delete karna hai?')) return;
  const { error } = await supabaseClient.from('products').delete().eq('id', id);
  if (error) toast('Delete nahi hua'); else toast('✓ Deleted');
}

// ---------------- Owner: Priority Customers ----------------
async function loadPriority() {
  const { data, error } = await supabaseClient.from('priority_customers').select('*').order('created_at', { ascending: false });
  if (!error) priorityCustomers = data || [];
  if (ownerUnlocked) renderAdminPriority();
}
function renderAdminPriority() {
  const wrap = document.getElementById('adminPriorityList');
  if (priorityCustomers.length === 0) { wrap.innerHTML = `<div class="empty">Abhi koi priority customer nahi</div>`; return; }
  wrap.innerHTML = priorityCustomers.map(c => `
    <div class="order-card" style="display:flex;justify-content:space-between;align-items:center;">
      <div><b>${c.name || 'Unnamed'}</b><div class="sub">${c.phone}</div></div>
      <button class="btn secondary" style="width:auto;padding:6px 12px;font-size:12px;color:var(--danger);border-color:var(--danger);" onclick="removePriority('${c.id}')">Remove</button>
    </div>`).join('');
}
async function addPriorityCustomer() {
  const phone = document.getElementById('pr-phone').value.trim();
  const name = document.getElementById('pr-name').value.trim();
  if (!phone) { toast('Phone number bharein'); return; }
  const { error } = await supabaseClient.from('priority_customers').insert([{ phone, name }]);
  if (error) { toast('Add nahi hua (shayad already exists)'); return; }
  document.getElementById('pr-phone').value = ''; document.getElementById('pr-name').value = '';
  toast('✓ Priority customer added');
}
async function removePriority(id) {
  const { error } = await supabaseClient.from('priority_customers').delete().eq('id', id);
  if (error) toast('Remove nahi hua'); else toast('✓ Removed');
}

// ---------------- Owner: Store Settings ----------------
async function loadStoreSettings() {
  const { data, error } = await supabaseClient.from('store_settings').select('*').eq('id', 1).single();
  if (!error && data) storeSettings = data;
}
function renderSettingsForm() {
  document.getElementById('s-whatsapp').value = storeSettings.store_whatsapp;
  document.getElementById('s-call').value = storeSettings.store_call;
}
async function saveStoreContact() {
  const wa = document.getElementById('s-whatsapp').value.trim().replace(/\D/g, '');
  const call = document.getElementById('s-call').value.trim().replace(/\D/g, '');
  if (!wa || !call) { toast('Dono number bharna zaroori hai'); return; }
  const { error } = await supabaseClient.from('store_settings').update({ store_whatsapp: wa, store_call: call }).eq('id', 1);
  if (error) toast('Save nahi hua'); else toast('✓ Contact numbers updated');
}
async function changeOwnerPasscode() {
  const next = document.getElementById('s-new-pass').value;
  const confirmNext = document.getElementById('s-confirm-pass').value;
  if (!next || next.length < 4) { toast('Passcode kam se kam 4 characters ka ho'); return; }
  if (next !== confirmNext) { toast('Passcode match nahi kar raha'); return; }
  const { error } = await supabaseClient.auth.updateUser({ password: next });
  if (error) { console.error(error); toast('Passcode update nahi hua'); return; }
  document.getElementById('s-new-pass').value = ''; document.getElementById('s-confirm-pass').value = '';
  toast('✓ Passcode updated');
}

// ---------------- Realtime subscriptions ----------------
function setupRealtime() {
  supabaseClient.channel('public:products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts)
    .subscribe();

  supabaseClient.channel('public:store_settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, loadStoreSettings)
    .subscribe();

  supabaseClient.channel('public:orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      if (ownerUnlocked) renderAdminOrders();
    })
    .subscribe((status) => {
      document.getElementById('connStatus').textContent = status === 'SUBSCRIBED' ? 'live' : status;
    });
}

// ---------------- Init ----------------
async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  ownerUnlocked = !!(session && session.user && session.user.email === OWNER_EMAIL);

  await Promise.all([loadProducts(), loadPriority(), loadStoreSettings()]);
  setupRealtime();

  const savedPhone = localStorage.getItem('sdi_my_phone');
  if (savedPhone) document.getElementById('myOrdersPhone').value = savedPhone;

  document.getElementById('placeOrderBtn');
  const origSetView = setView;
  setView = function (v) { origSetView(v); if (v === 'checkout') renderBillPreview(); };

  setView('shop');
}
init();
