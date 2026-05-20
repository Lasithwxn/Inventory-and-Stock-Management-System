/* ============================================
   STOCKR — stockerDashboardjs
============================================ */

'use strict';

const API_BASE = 'http://localhost:8080/api';

// ── AUTH GUARD ──
const userRole = sessionStorage.getItem('userRole');
const userName = sessionStorage.getItem('userName');
const userId = sessionStorage.getItem('userId');

const allowedRoles = ['ADMIN', 'MANAGER', 'STOCKER'];

if (!userRole || !allowedRoles.includes(userRole.toUpperCase())) {
    window.location.href = 'login.html';
}

var adminNameEl = document.getElementById('current-admin-name');
if (adminNameEl) {
    adminNameEl.textContent = 'Admin: ' + (userName || 'Unknown');
    adminNameEl.style.cursor = 'pointer';
    adminNameEl.title = 'Click to view profile';
    adminNameEl.addEventListener('click', function() {
        window.location.href = 'profile.html';
    });
}

/* ── CURSOR ── */
const cursor      = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursor-trail');
document.addEventListener('mousemove', e => {
    cursor.style.left      = e.clientX + 'px';
    cursor.style.top       = e.clientY + 'px';
    cursorTrail.style.left = e.clientX + 'px';
    cursorTrail.style.top  = e.clientY + 'px';
});
document.addEventListener('mousedown', () => { cursor.style.width = '8px';  cursor.style.height = '8px'; });
document.addEventListener('mouseup',   () => { cursor.style.width = '14px'; cursor.style.height = '14px'; });

/* ── TOAST ── */
let toastTimer = null;
function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = (type === 'success' ? '\u2713  ' : '\u2715  ') + msg;
    t.className   = 'show ' + (type || 'success');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { t.className = ''; }, 3500);
}

/* ── SIDEBAR ── */
const sidebar    = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
menuToggle.addEventListener('click', function() { sidebar.classList.toggle('collapsed'); });

/* ── TAB SWITCHING ── */
const navItems    = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle   = document.getElementById('page-title');
const pageSub     = document.getElementById('page-sub');

const TAB_TITLES = {
    'tab-user':     { title: 'User Management',  sub: '// VIEW AND MODIFY USER ACCESS ROLES' },
    'tab-product':  { title: 'Products',         sub: '// SYSTEM PRODUCT INVENTORY' },
    'tab-stock':    { title: 'Stock',            sub: '// MANAGE STOCK LEVELS' },
    'tab-order':    { title: 'Purchase Orders',  sub: '// SUPPLIER PURCHASE ORDERS' },
    'tab-supplier': { title: 'Suppliers',        sub: '// VENDOR RELATIONSHIP MANAGEMENT' },
    'tab-category': { title: 'Categories',       sub: '// SYSTEM TAXONOMIES' },
    'tab-report':   { title: 'Reports',          sub: '// ANALYTICS AND EXPORTS' },
    'tab-feedback': { title: 'Feedback',         sub: '// USER FEEDBACK AND RATINGS' }
};

navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        navItems.forEach(function(n) { n.classList.remove('active'); });
        tabContents.forEach(function(t) { t.classList.remove('active'); });
        item.classList.add('active');
        var targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
        var info = TAB_TITLES[targetId];
        if (info) { pageTitle.textContent = info.title; pageSub.textContent = info.sub; }
        if (targetId === 'tab-supplier') loadSuppliers();
        if (targetId === 'tab-product')  loadProducts();
        if (targetId === 'tab-stock')    loadStock();
        if (targetId === 'tab-order')    loadOrders();
        if (targetId === 'tab-category') loadCategories();
        if (targetId === 'tab-feedback') loadFeedback();
        if (targetId === 'tab-report')   loadReportData();
    });
});
// Profile navigation
var profileBtn = document.getElementById('profile-btn'); // or whatever ID your profile button has
if (profileBtn) {
    profileBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'profile.html';
    });
}

/* ── UTILITIES ── */
function escHtml(str) {
    if (!str) return '\u2014';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(dateStr) {
    if (!dateStr) return '\u2014';
    var d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

function fmtCurrency(val) {
    var n = parseFloat(val);
    if (isNaN(n)) return '\u2014';
    return 'LKR ' + n.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

function setBtnLoading(btn, loading) {
    btn.disabled = loading;
    if (loading) btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = loading ? 'Saving...' : (btn.dataset.origText || btn.innerHTML);
}

function markErr(inputId, errId) {
    var inp = document.getElementById(inputId);
    var err = document.getElementById(errId);
    if (inp) inp.classList.add('err-field');
    if (err) err.classList.add('show');
}
function clearErrs(inputIds, errIds) {
    (inputIds || []).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('err-field');
    });
    (errIds || []).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('show');
    });
}

function openConfirm(msg, onConfirm) {
    document.getElementById('confirm-message').textContent = msg;
    var overlay = document.getElementById('confirm-overlay');
    overlay.classList.add('open');
    document.getElementById('confirm-action-btn').onclick = function() {
        overlay.classList.remove('open');
        onConfirm();
    };
}

/* ── ESCAPE KEY ── */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(function(m) { m.classList.remove('open'); });
    }
});

/* ── LOGOUT ── */
function logout() {
    fetch(API_BASE + '/auth/logout', { method:'POST', credentials:'include' }).catch(function(){})
        .finally(function() { sessionStorage.clear(); window.location.href = 'login.html'; });
}


/* ════════════════════════════════════════
   SUPPLIER MANAGEMENT  (/api/suppliers)
════════════════════════════════════════ */
var allSuppliers = [];

function loadSuppliers() {
    var tbody = document.getElementById('supplier-table-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:rgba(255,255,255,.4);padding:3rem;">Loading suppliers...</td></tr>';
    fetch(API_BASE + '/suppliers', { credentials:'include' })
        .then(function(r){return r.json();})
        .then(function(data){ allSuppliers = data; renderSupplierTable(allSuppliers); })
        .catch(function(){
            allSuppliers = [
                { id:1, name:'TechSupply Co.',   contactName:'Kamal Perera',   email:'kamal@techsupply.lk',  phone:'+94711234567', address:'123 Main St, Colombo 03', active:true  },
                { id:2, name:'OfficeWorld Ltd.', contactName:'Nimal Fernando', email:'nimal@officeworld.lk', phone:'+94722345678', address:'45 Galle Rd, Colombo 06',  active:true  },
                { id:3, name:'FastPack Inc.',    contactName:'Sunil Silva',    email:'sunil@fastpack.lk',    phone:'+94733456789', address:'78 Industrial Zone, Kandy', active:true  }
            ];
            renderSupplierTable(allSuppliers);
            showToast('[DEMO] Suppliers API offline','fail');
        });
}

function renderSupplierTable(suppliers) {
    document.getElementById('stat-sup-total').textContent    = suppliers.length;
    document.getElementById('stat-sup-active').textContent   = suppliers.filter(function(s){return s.active;}).length;
    document.getElementById('stat-sup-inactive').textContent = suppliers.filter(function(s){return !s.active;}).length;

    var tbody = document.getElementById('supplier-table-body');
    tbody.innerHTML = '';
    if (!suppliers.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;color:rgba(255,255,255,.4);">No suppliers found.</td></tr>'; return; }
    suppliers.forEach(function(s){
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>#' + s.id + '</td>' +
            '<td style="color:#fff;">' + escHtml(s.name) + '</td>' +
            '<td>' + escHtml(s.contactName) + '</td>' +
            '<td>' + escHtml(s.email) + '</td>' +
            '<td>' + escHtml(s.phone) + '</td>' +
            '<td><span class="badge-status ' + (s.active?'active':'inactive') + '" onclick="toggleSupplierStatus(' + s.id + ')" title="Click to toggle">' + (s.active?'ACTIVE':'INACTIVE') + '</span></td>' +
            '<td><div class="action-btns">' +
            '<button class="btn-edit" onclick="openSupplierModal(\'edit\',' + s.id + ')">Edit</button>' +
            '<button class="btn-delete" onclick="deleteSupplier(' + s.id + ')">Delete</button>' +
            '</div></td>';
        tbody.appendChild(tr);
    });
}

function filterSuppliers(q) {
    var query = (q || '').toLowerCase();
    renderSupplierTable(allSuppliers.filter(function(s){
        return !query || s.name.toLowerCase().indexOf(query) !== -1 ||
            (s.contactName||'').toLowerCase().indexOf(query) !== -1 ||
            (s.email||'').toLowerCase().indexOf(query) !== -1;
    }));
}

var supplierModalMode = 'add', editingSupplierId = null;

function openSupplierModal(mode, supplierId) {
    supplierModalMode = mode; editingSupplierId = supplierId || null;
    clearErrs(['s-modal-name'], ['s-modal-name-err']);
    if (mode === 'add') {
        document.getElementById('s-modal-title').textContent = 'Add Supplier';
        document.getElementById('s-modal-sub').textContent   = '// REGISTER A NEW SUPPLIER';
        document.getElementById('s-modal-name').value = '';
        document.getElementById('s-modal-contact').value = '';
        document.getElementById('s-modal-email').value = '';
        document.getElementById('s-modal-phone').value = '';
        document.getElementById('s-modal-address').value = '';
    } else {
        var s = allSuppliers.find(function(x){return x.id === supplierId;}); if (!s) return;
        document.getElementById('s-modal-title').textContent = 'Edit Supplier';
        document.getElementById('s-modal-sub').textContent   = '// UPDATE SUPPLIER DETAILS';
        document.getElementById('s-modal-name').value    = s.name        || '';
        document.getElementById('s-modal-contact').value = s.contactName || '';
        document.getElementById('s-modal-email').value   = s.email       || '';
        document.getElementById('s-modal-phone').value   = s.phone       || '';
        document.getElementById('s-modal-address').value = s.address     || '';
    }
    document.getElementById('supplier-modal-overlay').classList.add('open');
}
function closeSupplierModal() { document.getElementById('supplier-modal-overlay').classList.remove('open'); }

function saveSupplier() {
    clearErrs(['s-modal-name'], ['s-modal-name-err']);
    var name    = document.getElementById('s-modal-name').value.trim();
    var contact = document.getElementById('s-modal-contact').value.trim();
    var email   = document.getElementById('s-modal-email').value.trim();
    var phone   = document.getElementById('s-modal-phone').value.trim();
    var address = document.getElementById('s-modal-address').value.trim();
    if (name.length < 2) { markErr('s-modal-name','s-modal-name-err'); return; }

    var btn = document.getElementById('s-modal-save-btn');
    setBtnLoading(btn, true);
    var url = supplierModalMode === 'add' ? API_BASE + '/suppliers' : API_BASE + '/suppliers/' + editingSupplierId;
    var method = supplierModalMode === 'add' ? 'POST' : 'PUT';

    fetch(url, { method:method, credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:name, contactName:contact, email:email, phone:phone, address:address}) })
        .then(function(r){return r.json();})
        .then(function(data){ if(data.success){showToast(data.message,'success');closeSupplierModal();loadSuppliers();}else{showToast(data.message||'Failed','fail');} setBtnLoading(btn,false); })
        .catch(function(){
            if (supplierModalMode === 'add') {
                allSuppliers.push({ id: Math.max.apply(null, allSuppliers.map(function(s){return s.id;})) + 1, name:name, contactName:contact, email:email, phone:phone, address:address, active:true });
            } else {
                var s = allSuppliers.find(function(x){return x.id === editingSupplierId;});
                if (s) { s.name=name; s.contactName=contact; s.email=email; s.phone=phone; s.address=address; }
            }
            renderSupplierTable(allSuppliers); closeSupplierModal();
            showToast('[DEMO] Supplier saved locally','success'); setBtnLoading(btn,false);
        });
}

function toggleSupplierStatus(id) {
    fetch(API_BASE + '/suppliers/' + id + '/status/toggle', { method:'PUT', credentials:'include' })
        .then(function(r){return r.json();})
        .then(function(data){ if(data.success){showToast(data.message,'success');loadSuppliers();} })
        .catch(function(){
            var s = allSuppliers.find(function(x){return x.id === id;});
            if (s) { s.active = !s.active; renderSupplierTable(allSuppliers); }
            showToast('[DEMO] Status toggled locally','success');
        });
}

function deleteSupplier(id) {
    openConfirm('Delete this supplier? This cannot be undone.', function(){
        fetch(API_BASE + '/suppliers/' + id, { method:'DELETE', credentials:'include' })
            .then(function(r){return r.json();})
            .then(function(data){ if(data.success){showToast(data.message,'success');loadSuppliers();} })
            .catch(function(){ allSuppliers = allSuppliers.filter(function(s){return s.id !== id;}); renderSupplierTable(allSuppliers); showToast('[DEMO] Deleted locally','success'); });
    });
}


/* ════════════════════════════════════════
   PRODUCT MANAGEMENT  (/api/products)
════════════════════════════════════════ */
var allProducts = [];
var allCategories = [];

function loadProducts() {
    // Load categories for dropdown reference
    fetch(API_BASE + '/categories', { credentials:'include' })
        .then(function(r){return r.ok ? r.json() : [];}).then(function(d){allCategories = d;}).catch(function(){allCategories = [];}).
    finally(function(){
        var tbody = document.getElementById('product-table-body');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:rgba(255,255,255,.4);padding:3rem;">Loading products...</td></tr>';
        fetch(API_BASE + '/products', { credentials:'include' })
            .then(function(r){return r.json();})
            .then(function(data){ allProducts = data; renderProductTable(allProducts); })
            .catch(function(){
                allProducts = [
                    { id:1, sku:'TECH-001', name:'Wireless Keyboard', categoryName:'Electronics',  unitPrice:4500.00, stockQty:145, stockStatus:'IN_STOCK', active:true },
                    { id:2, sku:'TECH-002', name:'USB-C Hub',         categoryName:'Electronics',  unitPrice:8900.00, stockQty:89,  stockStatus:'IN_STOCK', active:true },
                    { id:3, sku:'OFF-001',  name:'A4 Copy Paper (500)',categoryName:'Office Supplies',unitPrice:650.00, stockQty:320, stockStatus:'IN_STOCK', active:true },
                    { id:4, sku:'OFF-002',  name:'Ballpoint Pen Set', categoryName:'Office Supplies',unitPrice:350.00, stockQty:8,   stockStatus:'LOW_STOCK', active:true },
                    { id:5, sku:'FUR-001',  name:'Ergonomic Chair',   categoryName:'Furniture',    unitPrice:48500.00,stockQty:24,  stockStatus:'IN_STOCK', active:true },
                    { id:6, sku:'FUR-002',  name:'Standing Desk',     categoryName:'Furniture',    unitPrice:32000.00,stockQty:0,   stockStatus:'OUT_OF_STOCK', active:false }
                ];
                renderProductTable(allProducts);
                showToast('[DEMO] Products API offline','fail');
            });
    });
}

function renderProductTable(products) {
    var stats = document.getElementById('tab-product').querySelectorAll('.stat-value');
    if (stats.length >= 4) {
        stats[0].textContent = products.length;
        stats[1].textContent = products.filter(function(p){return p.stockStatus==='IN_STOCK';}).length;
        stats[2].textContent = products.filter(function(p){return p.stockStatus==='LOW_STOCK';}).length;
        stats[3].textContent = products.filter(function(p){return p.stockStatus==='OUT_OF_STOCK';}).length;
    }
    var tbody = document.getElementById('product-table-body');
    tbody.innerHTML = '';
    if (!products.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;color:rgba(255,255,255,.4);">No products found.</td></tr>'; return; }
    products.forEach(function(p){
        var stCls = p.stockStatus === 'IN_STOCK' ? 'active' : p.stockStatus === 'LOW_STOCK' ? 'pending' : 'suspended';
        var stLbl = p.stockStatus === 'IN_STOCK' ? 'IN STOCK' : p.stockStatus === 'LOW_STOCK' ? 'LOW STOCK' : 'OUT OF STOCK';
        var tr = document.createElement('tr');
        tr.innerHTML = '<td style="font-family:Space Mono,monospace;color:var(--neon);font-size:0.68rem;">' + escHtml(p.sku) + '</td>' +
            '<td style="color:#fff;">' + escHtml(p.name) + '</td>' +
            '<td>' + escHtml(p.categoryName) + '</td>' +
            '<td style="color:var(--acid);">' + fmtCurrency(p.unitPrice) + '</td>' +
            '<td>' + (p.stockQty || 0) + '</td>' +
            '<td><span class="badge-status ' + stCls + '">' + stLbl + '</span></td>' +
            '<td><div class="action-btns">' +
            '<button class="btn-edit" onclick="openProductModal(\'edit\',' + p.id + ')">Edit</button>' +
            '<button class="btn-delete" onclick="deleteProduct(' + p.id + ')">Delete</button>' +
            '</div></td>';
        tbody.appendChild(tr);
    });
}

function filterTable(tableId, query) {
    var q = (query || '').toLowerCase();
    var tbody = document.getElementById(tableId);
    if (!tbody) return;
    Array.from(tbody.querySelectorAll('tr')).forEach(function(row){
        row.style.display = row.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
    });
}

var productModalMode = 'add', editingProductId = null;

function openProductModal(mode, productId) {
    productModalMode = mode; editingProductId = productId || null;
    var overlay = document.getElementById('generic-modal-overlay');
    var title   = document.getElementById('generic-modal-title');
    var sub     = document.getElementById('generic-modal-sub');
    var body    = document.getElementById('generic-modal-body');
    var catOpts = allCategories.length ? allCategories.map(function(c){return '<option value="' + c.id + '">' + escHtml(c.name) + '</option>';}).join('') : '<option value="">-- No Categories --</option>';
    var supOpts = allSuppliers.length ? allSuppliers.map(function(s){return '<option value="' + s.id + '">' + escHtml(s.name) + '</option>';}).join('') : '<option value="">-- No Suppliers --</option>';

    if (mode === 'add') {
        title.textContent = 'Add Product';
        sub.textContent   = '// ADD NEW PRODUCT TO INVENTORY';
        body.innerHTML = buildProductForm(catOpts, supOpts, null);
    } else {
        var p = allProducts.find(function(x){return x.id === productId;}); if (!p) return;
        title.textContent = 'Edit Product';
        sub.textContent   = '// UPDATE PRODUCT DETAILS';
        body.innerHTML = buildProductForm(catOpts, supOpts, p);
    }
    window._genericSaveTarget = 'product';
    overlay.classList.add('open');
}

function buildProductForm(catOpts, supOpts, p) {
    return '<div class="modal-row">' +
        '<div class="modal-field"><label class="modal-label">Product Name *</label><input type="text" class="modal-input" id="prod-name" placeholder="e.g. Wireless Keyboard" value="' + (p ? escHtml(p.name) : '') + '"></div>' +
        '<div class="modal-field"><label class="modal-label">SKU *</label><input type="text" class="modal-input" id="prod-sku" placeholder="e.g. TECH-001" value="' + (p ? escHtml(p.sku || '') : '') + '"></div>' +
        '</div>' +
        '<div class="modal-row">' +
        '<div class="modal-field"><label class="modal-label">Category</label><select class="modal-select" id="prod-cat">' + catOpts + '</select></div>' +
        '<div class="modal-field"><label class="modal-label">Supplier</label><select class="modal-select" id="prod-sup">' + supOpts + '</select></div>' +
        '</div>' +
        '<div class="modal-row">' +
        '<div class="modal-field"><label class="modal-label">Unit Price (LKR) *</label><input type="number" class="modal-input" id="prod-price" placeholder="0.00" step="0.01" min="0" value="' + (p ? p.unitPrice : '') + '"></div>' +
        '<div class="modal-field"><label class="modal-label">Unit</label><input type="text" class="modal-input" id="prod-unit" placeholder="e.g. pcs, kg, box" value="' + (p ? escHtml(p.unit || 'pcs') : 'pcs') + '"></div>' +
        '</div>' +
        '<div class="modal-field"><label class="modal-label">Description</label><textarea class="modal-input" id="prod-desc" placeholder="Product description..." style="min-height:60px;resize:vertical;">' + (p ? escHtml(p.description || '') : '') + '</textarea></div>' +
        (p ? '<div class="modal-field"><label class="modal-label">Stock Status</label><span class="badge-status ' + (p.stockStatus==='IN_STOCK'?'active':p.stockStatus==='LOW_STOCK'?'pending':'suspended') + '">' + p.stockStatus + '</span> (auto-calculated)</div>' : '');
}

function openGenericModal(type) {
    if (type === 'product') openProductModal('add');
    else if (type === 'stock') openStockModal();
    else if (type === 'order') openOrderModal();
    else if (type === 'category') openCategoryModal('add');
}
function closeGenericModal() { document.getElementById('generic-modal-overlay').classList.remove('open'); }

function saveGeneric() {
    var target = window._genericSaveTarget;
    if (target === 'product') saveProduct();
    else if (target === 'stock') saveStock();
    else if (target === 'order') saveOrder();
    else if (target === 'category') saveCategory();
}

function saveProduct() {
    var name = document.getElementById('prod-name').value.trim();
    var sku  = document.getElementById('prod-sku').value.trim();
    var cat  = document.getElementById('prod-cat').value;
    var sup  = document.getElementById('prod-sup').value;
    var price = parseFloat(document.getElementById('prod-price').value);
    var unit = document.getElementById('prod-unit').value.trim() || 'pcs';
    var desc = document.getElementById('prod-desc').value.trim();
    if (!name || !sku || isNaN(price) || price < 0) { showToast('Name, SKU and Unit Price are required.','fail'); return; }

    var url = productModalMode === 'add' ? API_BASE + '/products' : API_BASE + '/products/' + editingProductId;
    var method = productModalMode === 'add' ? 'POST' : 'PUT';
    var body = { name:name, sku:sku, description:desc, unit:unit };
    if (cat) body.categoryId = parseInt(cat);
    if (sup) body.supplierId = parseInt(sup);
    if (!isNaN(price)) body.unitPrice = price;

    fetch(url, { method:method, credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
        .then(function(r){return r.json();})
        .then(function(data){ if(data.success){showToast(data.message,'success');closeGenericModal();loadProducts();}else{showToast(data.message||'Failed','fail');} })
        .catch(function(){
            if (productModalMode === 'add') {
                var newId = allProducts.length ? Math.max.apply(null, allProducts.map(function(p){return p.id;})) + 1 : 1;
                var catName = allCategories.find(function(c){return String(c.id)===String(cat);})?.name || '\u2014';
                allProducts.push({ id:newId, sku:sku, name:name, categoryName:catName, unitPrice:price, stockQty:0, stockStatus:'OUT_OF_STOCK', active:true, unit:unit });
            } else {
                var p = allProducts.find(function(x){return x.id === editingProductId;});
                if (p) { p.name=name; p.sku=sku; p.unitPrice=price; p.unit=unit; }
            }
            renderProductTable(allProducts); closeGenericModal();
            showToast('[DEMO] Product saved locally','success');
        });
}

function deleteProduct(id) {
    openConfirm('Delete this product?', function(){
        fetch(API_BASE + '/products/' + id, { method:'DELETE', credentials:'include' })
            .then(function(r){return r.json();})
            .then(function(data){ if(data.success){showToast(data.message,'success');loadProducts();} })
            .catch(function(){ allProducts = allProducts.filter(function(p){return p.id !== id;}); renderProductTable(allProducts); showToast('[DEMO] Deleted locally','success'); });
    });
}

/* ════════════════════════════════════════
   STOCK MANAGEMENT  (/api/stock)
════════════════════════════════════════ */
var allStock = [];

function loadStock() {
    var tbody = document.getElementById('stock-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:rgba(255,255,255,.4);padding:3rem;">Loading stock...</td></tr>';
    // Load summary first
    fetch(API_BASE + '/stock/summary', { credentials:'include' })
        .then(function(r){return r.ok ? r.json() : null;}).then(function(sum){ if(sum) updateStockStats(sum); })
        .catch(function(){}).finally(function(){
        fetch(API_BASE + '/stock', { credentials:'include' })
            .then(function(r){return r.json();})
            .then(function(data){ allStock = data; renderStockTable(allStock); })
            .catch(function(){
                allStock = [
                    { productId:1, productName:'Wireless Keyboard', sku:'TECH-001', categoryName:'Electronics',     quantity:145, lowStockThreshold:10, status:'IN_STOCK' },
                    { productId:2, productName:'USB-C Hub',         sku:'TECH-002', categoryName:'Electronics',     quantity:89,  lowStockThreshold:10, status:'IN_STOCK' },
                    { productId:3, productName:'A4 Copy Paper (500)',sku:'OFF-001', categoryName:'Office Supplies', quantity:320, lowStockThreshold:50, status:'IN_STOCK' },
                    { productId:4, productName:'Ballpoint Pen Set', sku:'OFF-002', categoryName:'Office Supplies', quantity:8,   lowStockThreshold:10, status:'LOW_STOCK' },
                    { productId:5, productName:'Ergonomic Chair',   sku:'FUR-001', categoryName:'Furniture',       quantity:24,  lowStockThreshold:5,  status:'IN_STOCK' },
                    { productId:6, productName:'Standing Desk',     sku:'FUR-002', categoryName:'Furniture',       quantity:0,   lowStockThreshold:3,  status:'OUT_OF_STOCK' }
                ];
                renderStockTable(allStock);
                showToast('[DEMO] Stock API offline','fail');
            });
    });
}

function updateStockStats(sum) {
    var stats = document.getElementById('tab-stock').querySelectorAll('.stat-value');
    if (stats.length >= 4) {
        stats[0].textContent = (sum.totalUnits || 0).toLocaleString();
        stats[1].textContent = (sum.skuCount || 0).toLocaleString();
        stats[2].textContent = (sum.lowStock || 0).toLocaleString();
        stats[3].textContent = (sum.outOfStock || 0).toLocaleString();
    }
}

function renderStockTable(items) {
    var tbody = document.getElementById('stock-table-body');
    tbody.innerHTML = '';
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:rgba(255,255,255,.4);">No stock records found.</td></tr>'; return; }
    items.forEach(function(s){
        var levelCls = s.status === 'IN_STOCK' ? 'active' : s.status === 'LOW_STOCK' ? 'pending' : 'suspended';
        var tr = document.createElement('tr');
        tr.innerHTML = '<td style="color:#fff;">' + escHtml(s.productName) + '</td>' +
            '<td style="font-family:Space Mono,monospace;color:var(--neon);font-size:0.68rem;">' + escHtml(s.sku) + '</td>' +
            '<td>' + escHtml(s.categoryName) + '</td>' +
            '<td style="color:var(--acid);font-weight:700;">' + (s.quantity || 0) + '</td>' +
            '<td>' + (s.lowStockThreshold || 10) + '</td>' +
            '<td><span class="badge-status ' + levelCls + '">' + s.status + '</span></td>' +
            '<td><div class="action-btns"><button class="btn-edit" onclick="openStockAdjustModal(' + s.productId + ')">Adjust</button></div></td>';
        tbody.appendChild(tr);
    });
}

function openStockModal() { openStockAdjustModal(null); }

var adjustingProductId = null;
function openStockAdjustModal(productId) {
    adjustingProductId = productId;
    var overlay = document.getElementById('generic-modal-overlay');
    var title   = document.getElementById('generic-modal-title');
    var sub     = document.getElementById('generic-modal-sub');
    var body    = document.getElementById('generic-modal-body');
    var prodOpts = '<option value="">Select product...</option>' + allProducts.map(function(p){return '<option value="' + p.id + '">' + escHtml(p.name) + ' (' + (p.stockQty || 0) + ' in stock)</option>';}).join('');

    title.textContent = 'Adjust Stock';
    sub.textContent   = '// UPDATE STOCK QUANTITY';
    body.innerHTML = '<div class="modal-field"><label class="modal-label">Product</label><select class="modal-select" id="stock-prod">' + prodOpts + '</select></div>' +
        '<div class="modal-field"><label class="modal-label">New Quantity *</label><input type="number" class="modal-input" id="stock-qty" placeholder="0" min="0"></div>';
    if (productId) document.getElementById('stock-prod').value = productId;
    window._genericSaveTarget = 'stock';
    overlay.classList.add('open');
}

function saveStock() {
    var prodId = document.getElementById('stock-prod').value;
    var qty = parseInt(document.getElementById('stock-qty').value);
    if (!prodId || isNaN(qty) || qty < 0) { showToast('Please select a product and enter a valid quantity.','fail'); return; }

    fetch(API_BASE + '/stock/' + prodId + '/adjust', { method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({quantity:qty}) })
        .then(function(r){return r.json();})
        .then(function(data){ if(data.success){showToast(data.message,'success');closeGenericModal();loadStock();}else{showToast(data.message||'Failed','fail');} })
        .catch(function(){
            var item = allStock.find(function(s){return s.productId === parseInt(prodId);});
            if (item) { item.quantity = qty; item.status = qty === 0 ? 'OUT_OF_STOCK' : qty <= item.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK'; }
            renderStockTable(allStock); closeGenericModal();
            showToast('[DEMO] Stock adjusted locally','success');
        });
}


/* ════════════════════════════════════════
   CATEGORY MANAGEMENT  (/api/categories)
════════════════════════════════════════ */
var allCategoriesData = [];

function loadCategories() {
    var tbody = document.getElementById('category-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,.4);padding:3rem;">Loading categories...</td></tr>';
    fetch(API_BASE + '/categories', { credentials:'include' })
        .then(function(r){return r.json();})
        .then(function(data){ allCategoriesData = data; renderCategoryTable(allCategoriesData); })
        .catch(function(){
            allCategoriesData = [
                { id:1, name:'Electronics',     description:'Electronic devices and accessories', lowStockThreshold:10 },
                { id:2, name:'Office Supplies', description:'General office consumables',         lowStockThreshold:50 },
                { id:3, name:'Furniture',       description:'Office furniture and fixtures',      lowStockThreshold:5  }
            ];
            renderCategoryTable(allCategoriesData);
            showToast('[DEMO] Categories API offline','fail');
        });
}

function getCategoryName(catId) {
    var map = {1:'System Performance', 2:'UI / UX', 3:'Feature Request', 4:'Bug Report', 5:'General'};
    return map[catId] || 'General';
}

function renderCategoryTable(categories) {
    var stats = document.getElementById('tab-category').querySelectorAll('.stat-value');
    if (stats.length >= 4) {
        stats[0].textContent = categories.length;
        var avgThr = categories.length ? Math.round(categories.reduce(function(s,c){return s+(c.lowStockThreshold||10);},0) / categories.length) : 0;
        stats[1].textContent = avgThr;
        stats[2].textContent = categories.length;
        stats[3].textContent = '0';
    }
    var tbody = document.getElementById('category-table-body');
    tbody.innerHTML = '';
    if (!categories.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:3rem;color:rgba(255,255,255,.4);">No categories found.</td></tr>'; return; }
    categories.forEach(function(c){
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>#' + c.id + '</td>' +
            '<td style="color:#fff;">' + escHtml(c.name) + '</td>' +
            '<td>' + escHtml(c.description || '\u2014') + '</td>' +
            '<td>' + (c.lowStockThreshold || '\u2014') + '</td>' +
            '<td><div class="action-btns">' +
            '<button class="btn-edit" onclick="openCategoryModal(\'edit\',' + c.id + ')">Edit</button>' +
            '<button class="btn-delete" onclick="deleteCategory(' + c.id + ')">Delete</button>' +
            '</div></td>';
        tbody.appendChild(tr);
    });
}

var categoryModalMode = 'add', editingCategoryId = null;

function openCategoryModal(mode, catId) {
    categoryModalMode = mode; editingCategoryId = catId || null;
    var overlay = document.getElementById('generic-modal-overlay');
    var title   = document.getElementById('generic-modal-title');
    var sub     = document.getElementById('generic-modal-sub');
    var body    = document.getElementById('generic-modal-body');

    if (mode === 'add') {
        title.textContent = 'Add Category';
        sub.textContent   = '// CREATE NEW CATEGORY';
        body.innerHTML = '<div class="modal-field"><label class="modal-label">Category Name *</label><input type="text" class="modal-input" id="cat-name" placeholder="e.g. Electronics"></div>' +
            '<div class="modal-field"><label class="modal-label">Description</label><input type="text" class="modal-input" id="cat-desc" placeholder="Short description..."></div>' +
            '<div class="modal-field"><label class="modal-label">Low Stock Threshold</label><input type="number" class="modal-input" id="cat-threshold" placeholder="10" value="10" min="1"></div>';
    } else {
        var c = allCategoriesData.find(function(x){return x.id === catId;}); if (!c) return;
        title.textContent = 'Edit Category';
        sub.textContent   = '// UPDATE CATEGORY';
        body.innerHTML = '<div class="modal-field"><label class="modal-label">Category Name *</label><input type="text" class="modal-input" id="cat-name" value="' + escHtml(c.name) + '"></div>' +
            '<div class="modal-field"><label class="modal-label">Description</label><input type="text" class="modal-input" id="cat-desc" value="' + escHtml(c.description || '') + '"></div>' +
            '<div class="modal-field"><label class="modal-label">Low Stock Threshold</label><input type="number" class="modal-input" id="cat-threshold" value="' + (c.lowStockThreshold || 10) + '" min="1"></div>';
    }
    window._genericSaveTarget = 'category';
    overlay.classList.add('open');
}

function saveCategory() {
    var name = document.getElementById('cat-name').value.trim();
    var desc = document.getElementById('cat-desc').value.trim();
    var thr = parseInt(document.getElementById('cat-threshold').value);
    if (!name) { showToast('Category name is required.','fail'); return; }

    var url = categoryModalMode === 'add' ? API_BASE + '/categories' : API_BASE + '/categories/' + editingCategoryId;
    var method = categoryModalMode === 'add' ? 'POST' : 'PUT';
    var body = { name: name, description: desc };
    if (!isNaN(thr) && thr > 0) body.lowStockThreshold = thr;

    fetch(url, { method: method, credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
        .then(function(r){return r.json();})
        .then(function(data){ if(data.success){showToast(data.message,'success');closeGenericModal();loadCategories();}else{showToast(data.message||'Failed','fail');} })
        .catch(function(){
            if (categoryModalMode === 'add') {
                var newId = allCategoriesData.length ? Math.max.apply(null, allCategoriesData.map(function(c){return c.id;})) + 1 : 1;
                allCategoriesData.push({ id: newId, name: name, description: desc, lowStockThreshold: isNaN(thr) ? 10 : thr });
            } else {
                var c = allCategoriesData.find(function(x){return x.id === editingCategoryId;});
                if (c) { c.name = name; c.description = desc; c.lowStockThreshold = isNaN(thr) ? 10 : thr; }
            }
            renderCategoryTable(allCategoriesData); closeGenericModal();
            showToast('[DEMO] Category saved locally','success');
        });
}

function deleteCategory(id) {
    openConfirm('Delete this category?', function(){
        fetch(API_BASE + '/categories/' + id, { method:'DELETE', credentials:'include' })
            .then(function(r){return r.json();})
            .then(function(data){ if(data.success){showToast(data.message,'success');loadCategories();} })
            .catch(function(){ allCategoriesData = allCategoriesData.filter(function(c){return c.id !== id;}); renderCategoryTable(allCategoriesData); showToast('[DEMO] Deleted locally','success'); });
    });
}

/* ════════════════════════════════════════
   REPORTS — Real data + CSV downloads
════════════════════════════════════════ */
var allReports = [];
var chartInitialized = false;

function loadReportData() {
    if (!chartInitialized) {
        chartInitialized = true;
        setupPeriodButtons();
    }
    loadReports();
    renderChart('7D');
}

function loadReports() {
    var grid = document.querySelector('#tab-report .reports-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.4);padding:3rem;">Loading reports...</div>';

    fetch(API_BASE + '/reports', { credentials:'include' })
        .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
        .then(function(data){
            allReports = data || [];
            renderReportsGrid(allReports);
        })
        .catch(function(){
            allReports = [
                { id:1, reportName:'Sales Report', description:'Complete breakdown of sales performance...', category:'SALES', status:'LIVE', exportFormat:'CSV' },
                { id:2, reportName:'Inventory Report', description:'Full inventory audit...', category:'INVENTORY', status:'LIVE', exportFormat:'CSV' },
                { id:3, reportName:'User Activity', description:'Track login history...', category:'USER', status:'SCHEDULED', exportFormat:'PDF' },
                { id:4, reportName:'Order Analytics', description:'Order fulfilment rates...', category:'ORDER', status:'LIVE', exportFormat:'CSV' },
                { id:5, reportName:'Supplier Report', description:'Vendor performance...', category:'SUPPLIER', status:'SCHEDULED', exportFormat:'PDF' },
                { id:6, reportName:'Feedback Summary', description:'Aggregated ratings...', category:'FEEDBACK', status:'LIVE', exportFormat:'CSV' }
            ];
            renderReportsGrid(allReports);
            showToast('[DEMO] Reports API offline','fail');
        });
}

function renderReportsGrid(reports) {
    var grid = document.querySelector('#tab-report .reports-grid');
    if (!grid) return;
    if (!reports.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.4);padding:3rem;">No reports available.</div>';
        return;
    }

    var iconMap = {
        'SALES': '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
        'INVENTORY': '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
        'USER': '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
        'ORDER': '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
        'SUPPLIER': '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
        'FEEDBACK': '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>'
    };

    var colorMap = {
        'SALES': 'neon-bg', 'INVENTORY': 'acid-bg', 'USER': 'plasma-bg',
        'ORDER': 'warn-bg', 'SUPPLIER': 'purple-bg', 'FEEDBACK': 'neon-bg'
    };
    var colorVarMap = {
        'SALES': 'var(--neon)', 'INVENTORY': 'var(--acid)', 'USER': 'var(--plasma)',
        'ORDER': 'var(--warn)', 'SUPPLIER': '#b97aff', 'FEEDBACK': 'var(--neon)'
    };

    grid.innerHTML = reports.map(function(r){
        var tagClass = (r.status || 'LIVE').toLowerCase();
        var iconCls = colorMap[r.category] || 'neon-bg';
        var strokeColor = colorVarMap[r.category] || 'var(--neon)';
        var iconSvg = (iconMap[r.category] || iconMap['SALES']).replace('stroke="currentColor"', 'stroke="' + strokeColor + '"');
        var exportLabel = 'Export ' + (r.exportFormat || 'CSV');
        var downloadUrl = API_BASE + '/reports/' + r.id + '/download';

        return '<div class="report-card">' +
            '<span class="report-tag ' + tagClass + '">' + escHtml(r.status || 'LIVE') + '</span>' +
            '<div class="report-card-icon ' + iconCls + '">' + iconSvg + '</div>' +
            '<h3>' + escHtml(r.reportName) + '</h3>' +
            '<p>' + escHtml(r.description) + '</p>' +
            '<button class="btn-report" onclick="downloadReport(' + r.id + ',\'' + escHtml(r.reportName).replace(/'/g,"\\'") + '\')">' +
            '<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>' +
            escHtml(exportLabel) + '</button></div>';
    }).join('');
}

function downloadReport(id, name) {
    var url = API_BASE + '/reports/' + id + '/download';
    var link = document.createElement('a');
    link.href = url;
    link.download = name.replace(/\s+/g, '_') + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloading ' + name + '...', 'success');
}

function setupPeriodButtons() {
    document.querySelectorAll('.chart-period-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
            document.querySelectorAll('.chart-period-btn').forEach(function(b){b.classList.remove('active');});
            btn.classList.add('active');
            renderChart(btn.textContent);
        });
    });
}

function renderChart(period) {
    var container = document.getElementById('revenue-chart');
    if (!container) return;

    // Fetch real data
    fetch(API_BASE + '/reports/revenue?period=' + period, { credentials:'include' })
        .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
        .then(function(apiData){
            drawChart(container, apiData, period);
        })
        .catch(function(){
            // Fallback demo data
            var days = period === '7D' ? 7 : period === '30D' ? 30 : 90;
            var data = [], labels = [];
            var now = new Date();
            var base = period === '7D' ? 5 : period === '30D' ? 4 : 3;
            for (var i = days - 1; i >= 0; i--) {
                var d = new Date(now); d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('en-US', { month:'short', day:'numeric' }));
                base += (Math.random() - 0.45) * 3;
                base = Math.max(0, base);
                data.push({ date: labels[labels.length-1], value: Math.round(base) });
            }
            drawChart(container, data, period);
            showToast('[DEMO] Using random chart data','fail');
        });
}

function drawChart(container, data, period) {
    var values = data.map(function(d){ return d.value; });
    var labels = data.map(function(d){ return d.date; });
    if (!values.length) {
        container.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,.4);padding:3rem;">No data for this period</div>';
        return;
    }

    var maxVal = Math.max.apply(null, values) * 1.2;
    var minVal = Math.min.apply(null, values) * 0.8;
    if (minVal < 0) minVal = 0;
    var range = maxVal - minVal || 1;
    var w = container.clientWidth || 600;
    var h = 240;
    var pad = { top:20, right:20, bottom:40, left:60 };
    var chartW = w - pad.left - pad.right;
    var chartH = h - pad.top - pad.bottom;

    var points = values.map(function(v, i){
        return (pad.left + (i / (values.length - 1)) * chartW) + ',' + (pad.top + chartH - ((v - minVal) / range) * chartH);
    }).join(' ');
    var areaPoints = pad.left + ',' + (pad.top + chartH) + ' ' + points + ' ' + (pad.left + chartW) + ',' + (pad.top + chartH);

    var gridLines = [];
    for (var gi = 0; gi <= 4; gi++) {
        var gy = pad.top + (chartH / 4) * gi;
        var gval = Math.round(maxVal - ((maxVal - minVal) / 4) * gi);
        gridLines.push('<line x1="' + pad.left + '" y1="' + gy + '" x2="' + (pad.left + chartW) + '" y2="' + gy + '" stroke="rgba(0,255,224,.1)" stroke-dasharray="3,3"/>');
        gridLines.push('<text x="' + (pad.left - 10) + '" y="' + (gy + 3) + '" text-anchor="end" fill="rgba(255,255,255,.35)" font-size="10" font-family="Space Mono,monospace">' + gval + '</text>');
    }

    var step = values.length > 30 ? Math.ceil(values.length / 8) : 1;
    var xLabels = labels.map(function(l, i){
        if (i % step !== 0 && i !== values.length - 1) return '';
        var x = pad.left + (i / (values.length - 1)) * chartW;
        return '<text x="' + x + '" y="' + (h - 12) + '" text-anchor="middle" fill="rgba(255,255,255,.35)" font-size="9" font-family="Space Mono,monospace">' + l + '</text>';
    }).join('');

    var dots = values.map(function(v, i){
        var x = pad.left + (i / (values.length - 1)) * chartW;
        var y = pad.top + chartH - ((v - minVal) / range) * chartH;
        return '<circle cx="' + x + '" cy="' + y + '" r="3" fill="var(--void)" stroke="var(--neon)" stroke-width="1.5"/>';
    }).join('');

    container.innerHTML = '<svg width="100%" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
        '<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,255,224,.25)"/><stop offset="100%" stop-color="rgba(0,255,224,0)"/></linearGradient></defs>' +
        gridLines.join('') +
        '<polygon points="' + areaPoints + '" fill="url(#areaGrad)"/>' +
        '<polyline points="' + points + '" fill="none" stroke="var(--neon)" stroke-width="2" stroke-linejoin="round"/>' +
        dots + xLabels + '</svg>';
}

/* ════════════════════════════════════════
   FEEDBACK —
════════════════════════════════════════ */
var allFeedback = [];
var selectedRating = 0;

function loadFeedback() {
    var list = document.getElementById('feedback-list');
    if (list) list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,.4);padding:2rem;">Loading feedback...</div>';

    fetch(API_BASE + '/feedback', { credentials:'include' })
        .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
        .then(function(data){
            allFeedback = data || [];
            renderFeedback();
        })
        .catch(function(err){
            console.error('Feedback load error:', err);
            allFeedback = [
                { id:1, submitterName:'Lakmal Perera',    categoryId:1, rating:4, message:'System is fast and responsive. Great work!',              isBugReport:false, createdAt:'2025-05-08T10:30:00' },
                { id:2, submitterName:'Sunil Fernando',   categoryId:2, rating:5, message:'Love the dark theme. Very professional looking dashboard.', isBugReport:false, createdAt:'2025-05-07T14:15:00' },
                { id:3, submitterName:'Kamal Silva',      categoryId:3, rating:3, message:'Would be great to have barcode scanning support.',          isBugReport:false, createdAt:'2025-05-06T09:45:00' },
                { id:4, submitterName:'Nimal Jayawardena',categoryId:5, rating:4, message:'Overall very satisfied with the inventory management.',     isBugReport:false, createdAt:'2025-05-05T16:20:00' },
                { id:5, submitterName:'Ruwan Ekanayake',  categoryId:4, rating:2, message:'Found a small glitch when filtering users by role.',        isBugReport:true,  createdAt:'2025-05-04T11:10:00' }
            ];
            renderFeedback();
        });
}

function renderFeedback() {
    var stats = document.getElementById('tab-feedback').querySelectorAll('.stat-value');
    if (stats.length >= 4) {
        stats[0].textContent = allFeedback.length;
        var avg = allFeedback.length ? (allFeedback.reduce(function(s,f){return s + (f.rating || 0);}, 0) / allFeedback.length).toFixed(1) : '0.0';
        stats[1].textContent = avg + ' \u2605';
        var oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        stats[2].textContent = allFeedback.filter(function(f){ return new Date(f.createdAt) > oneWeekAgo; }).length;
        stats[3].textContent = allFeedback.filter(function(f){ return f.isBugReport; }).length;
    }

    var list = document.getElementById('feedback-list');
    if (list) {
        if (!allFeedback.length) {
            list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,.4);padding:2rem;">No feedback yet.</div>';
        } else {
            var recent = allFeedback.slice(0, 4);
            list.innerHTML = recent.map(function(f){
                return '<div class="feedback-item"><div class="feedback-item-header"><span class="feedback-item-from">' + escHtml(f.submitterName || f.fromName || 'Anonymous') + '</span><span class="feedback-item-date">' + fmtDate(f.createdAt) + '</span></div>' +
                    '<div class="feedback-item-rating">' + '\u2605'.repeat(f.rating || 0) + '\u2606'.repeat(5 - (f.rating || 0)) + '</div>' +
                    '<div class="feedback-item-msg">' + escHtml(f.message) + '</div><span class="feedback-item-cat">' + escHtml(getCategoryName(f.categoryId)) + '</span></div>';
            }).join('');
        }
    }

    var tbody = document.getElementById('feedback-table-body');
    if (tbody) {
        tbody.innerHTML = '';
        if (!allFeedback.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;color:rgba(255,255,255,.4);">No feedback found.</td></tr>';
            return;
        }
        allFeedback.forEach(function(f){
            var tr = document.createElement('tr');
            tr.innerHTML = '<td>#' + f.id + '</td><td style="color:#fff;">' + escHtml(f.submitterName || f.fromName || 'Anonymous') + '</td>' +
                '<td><span class="feedback-item-cat">' + escHtml(getCategoryName(f.categoryId)) + '</span></td>' +
                '<td style="color:var(--warn);">' + '\u2605'.repeat(f.rating || 0) + '\u2606'.repeat(5 - (f.rating || 0)) + '</td>' +
                '<td>' + escHtml(f.message.substring(0,60)) + (f.message.length > 60 ? '...' : '') + '</td>' +
                '<td>' + fmtDate(f.createdAt) + '</td>' +
                '<td><div class="action-btns"><button class="btn-delete" onclick="deleteFeedback(' + f.id + ')">Delete</button></div></td>';
            tbody.appendChild(tr);
        });
    }
}

function initStarRating() {
    var container = document.getElementById('star-rating');
    var label = document.getElementById('rating-label');
    if (!container) return;
    var stars = container.querySelectorAll('.star-btn');
    var labels = ['Select a rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    container.addEventListener('mouseleave', function(){
        stars.forEach(function(s, i){ s.classList.remove('hovered'); s.classList.toggle('active', i < selectedRating); });
    });
    stars.forEach(function(star, idx){
        var val = parseInt(star.dataset.val);
        star.addEventListener('mouseenter', function(){
            stars.forEach(function(s, i){ s.classList.toggle('hovered', i < val); s.classList.toggle('active', i < selectedRating); });
        });
        star.addEventListener('click', function(){
            selectedRating = val;
            stars.forEach(function(s, i){ s.classList.toggle('active', i < val); });
            if (label) label.textContent = labels[val];
        });
    });
}

function submitFeedback() {
    var category = document.getElementById('feedback-category').value;
    var message = document.getElementById('feedback-message').value.trim();
    if (selectedRating === 0) { showToast('Please select a rating.','fail'); return; }
    if (!category) { showToast('Please select a category.','fail'); return; }
    if (!message) { showToast('Please enter a message.','fail'); return; }

    var fromName = userName || 'Anonymous';

    // Map category string to ID
    var catMap = {'System Performance':1, 'UI / UX':2, 'Feature Request':3, 'Bug Report':4, 'General':5};
    var catId = catMap[category] || 5;
    var isBug = category === 'Bug Report';

    fetch(API_BASE + '/feedback', {
        method:'POST',
        credentials:'include',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            submitterName: fromName,
            rating: selectedRating,
            categoryId: catId,
            message: message,
            isBugReport: isBug
        })
    })
        .then(function(r){return r.json();})
        .then(function(data){
            if (data.success) {
                showToast(data.message, 'success');
                selectedRating = 0;
                document.getElementById('feedback-category').value = '';
                document.getElementById('feedback-message').value = '';
                document.querySelectorAll('.star-btn').forEach(function(s){s.classList.remove('active');});
                document.getElementById('rating-label').textContent = 'Select a rating';
                loadFeedback();
            } else { showToast(data.message || 'Failed.', 'fail'); }
        })
        .catch(function(){
            var newId = allFeedback.length ? Math.max.apply(null, allFeedback.map(function(f){return f.id;})) + 1 : 1;
            allFeedback.unshift({
                id: newId,
                submitterName: fromName,
                fromName: fromName,
                rating: selectedRating,
                categoryId: catId,
                category: category,
                message: message,
                isBugReport: isBug,
                createdAt: new Date().toISOString()
            });
            selectedRating = 0;
            document.getElementById('feedback-category').value = '';
            document.getElementById('feedback-message').value = '';
            document.querySelectorAll('.star-btn').forEach(function(s){s.classList.remove('active');});
            document.getElementById('rating-label').textContent = 'Select a rating';
            renderFeedback();
            showToast('[DEMO] Feedback submitted locally.', 'success');
        });
}
function deleteFeedback(id) {
    openConfirm('Delete this feedback entry?', function(){
        fetch(API_BASE + '/feedback/' + id, { method:'DELETE', credentials:'include' })
            .then(function(r){return r.json();})
            .then(function(data){ if(data.success){showToast(data.message,'success');loadFeedback();} })
            .catch(function(){ allFeedback = allFeedback.filter(function(f){return f.id !== id;}); renderFeedback(); showToast('[DEMO] Deleted locally','success'); });
    });
}

/* ════════════════════════════════════════
   INITIALIZATION
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function(){
    loadUsers();
    initStarRating();
});