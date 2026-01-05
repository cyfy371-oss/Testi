// app.js — улучшенный каталог, корзина, профиль, фейковая оплата, Telegram WebApp интеграция
(() => {
  // ==== Данные товаров ====
  const PRODUCTS = [
    // Фрукты
    { id: 'p1', name: 'Яблоки "Красное Сияние"', price: 180, unit: 'кг', cat: 'fruits', img: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=7d9b1b9e7d8b2a3a6b1b3d7f9c6f2c3e' },
    { id: 'p2', name: 'Апельсины', price: 140, unit: 'кг', cat: 'fruits', img: 'https://images.unsplash.com/photo-1547516508-0a99f9f1f7f9?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=9a3c4b2f1f0e7a2b4c1d8b7a6e5f2d4c' },
    { id: 'p3', name: 'Груши', price: 200, unit: 'кг', cat: 'fruits', img: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=44b0a9b1c8c7d3a1d7e5f3b2c1a0e9d2' },
    { id: 'p4', name: 'Гранат', price: 250, unit: 'шт', cat: 'fruits', img: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=0f1f2c3b4a5d6e7f8g9h0a1b2c3d4e5f' },

    // Овощи
    { id: 'p6', name: 'Огурцы Хрустящие', price: 120, unit: 'кг', cat: 'veggies', img: 'https://images.unsplash.com/photo-1542834369-f10ebf06d3cb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=7bdf0c6a9adf6a5ccc2b5e6a9f7c4b3a' },
    { id: 'p7', name: 'Помидоры Черри', price: 160, unit: 'кг', cat: 'veggies', img: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=b3a2f9e7d5c6b1a0c9d8e7f6a5b4c3d2' },
    { id: 'p8', name: 'Морковь', price: 90, unit: 'кг', cat: 'veggies', img: 'https://images.unsplash.com/photo-1543352634-18ba2b6b7d5f?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=7ac9d2e3b1a0c8d9f6e5b4a3c2d1e0f9' },
    { id: 'p9', name: 'Перец сладкий', price: 220, unit: 'кг', cat: 'veggies', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=2d8c9a7b6f5e4d3c2b1a0f9e8d7c6b5a' },

    // Подарочные наборы
    { id: 'g1', name: 'Новогодний набор "Праздник"', price: 1200, unit: 'шт', cat: 'gifts', img: 'https://images.unsplash.com/photo-1606851091680-4b1d0c3e6b9d?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=0c7a6e5b4d3f9a1b2c3d4e5f6a7b8c9d' }
  ];

  // ==== DOM ====
  const productsGrid = document.getElementById('productsGrid');
  const categories = document.querySelectorAll('.cat');
  const searchInput = document.getElementById('searchInput');
  const cartBtn = document.getElementById('cartBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartModal = document.getElementById('cartModal');
  const cartItemsEl = document.getElementById('cartItems');
  const closeCart = document.getElementById('closeCart');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const payLaterBtn = document.getElementById('payLaterBtn');
  const orderNote = document.getElementById('orderNote');

  const profileBtn = document.getElementById('profileBtn');
  const profileModal = document.getElementById('profileModal');
  const closeProfile = document.getElementById('closeProfile');
  const profileNameEl = document.getElementById('profileName');
  const profileIdEl = document.getElementById('profileId');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileBalanceEl = document.getElementById('profileBalance');
  const purchaseHistoryEl = document.getElementById('purchaseHistory');
  const topUpBtn = document.getElementById('topUpBtn');
  const withdrawBtn = document.getElementById('withdrawBtn');

  const paymentModal = document.getElementById('paymentModal');
  const closePayment = document.getElementById('closePayment');
  const paymentSummary = document.getElementById('paymentSummary');
  const confirmPayBtn = document.getElementById('confirmPayBtn');
  const cancelPayBtn = document.getElementById('cancelPayBtn');
  const payLaterButton = payLaterBtn;

  const openFruits = document.getElementById('openFruits');
  const openVeg = document.getElementById('openVeg');
  const openGifts = document.getElementById('openGifts');
  const balanceDisplay = document.getElementById('balanceAmount');

  // Telegram WebApp
  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  if (tg) {
    try { tg.expand(); } catch(e){}
    // If available, use Telegram user info for profile
    const initData = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;
    if (initData) {
      // store basic user info
      const profile = getProfile();
      profile.name = initData.first_name || profile.name;
      profile.avatar = initData.photo_url || profile.avatar;
      profile.tgId = initData.id || profile.tgId;
      saveProfile(profile);
    }
  }

  // ==== State: cart + profile ====
  let cart = JSON.parse(localStorage.getItem('holiday_cart') || '{}'); // {productId: qty}
  const saveCart = () => localStorage.setItem('holiday_cart', JSON.stringify(cart));

  const DEFAULT_PROFILE = {
    name: 'Гость',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop&ixlib=rb-4.0.3&s=3e7c5a2ca5b8b2b0c6f3d9e8a1c2b3d4',
    balance: 500, // стартовый фейковый баланс для удобства
    purchases: [],
    tgId: null
  };
  function getProfile() {
    try { return JSON.parse(localStorage.getItem('holiday_profile')) || DEFAULT_PROFILE; } catch(e){ return DEFAULT_PROFILE; }
  }
  function saveProfile(p){ localStorage.setItem('holiday_profile', JSON.stringify(p)); updateProfileUI(); }

  // ==== Helpers ====
  function currency(val){ return `${val} ₽`; }
  function calcCartTotal(){
    let total = 0;
    for (const id in cart){
      const p = PRODUCTS.find(x=>x.id===id);
      if (p) total += p.price * cart[id];
    }
    return total;
  }
  function updateCartBadge(){
    const count = Object.values(cart).reduce((s,n)=>s+n,0);
    cartBadge.textContent = count;
    cartBadge.style.display = count ? 'inline-block' : 'none';
  }

  // ==== Render products ====
  function renderProducts(filter = 'all', query = ''){
    productsGrid.innerHTML = '';
    let items = PRODUCTS.filter(p => filter==='all' || p.cat===filter);
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || (p.desc && p.desc.toLowerCase().includes(q)));
    }
    if (items.length === 0){
      productsGrid.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--muted)">Ничего не найдено</div>`;
      return;
    }
    items.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div style="position:relative">
          <img src="${p.img}" alt="${p.name}">
          <div style="position:absolute;left:12px;top:12px;background:linear-gradient(90deg,rgba(0,0,0,0.4),rgba(0,0,0,0.2));padding:6px 8px;border-radius:8px;color:white;font-weight:700">${p.unit}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="title">${p.name}</div>
            <div class="desc" style="margin-top:6px;color:var(--muted)">Свежий товар от фермы</div>
          </div>
          <div style="text-align:right">
            <div class="price">${currency(p.price)}</div>
            <div style="margin-top:8px" class="actions">
              <button class="btn" data-id="${p.id}" data-action="minus">−</button>
              <button class="btn primary" data-id="${p.id}" data-action="add">Добавить</button>
            </div>
          </div>
        </div>
      `;
      productsGrid.appendChild(card);
    });
  }

  // ==== Cart UI ====
  function renderCart(){
    cartItemsEl.innerHTML = '';
    const ids = Object.keys(cart);
    if (ids.length === 0){
      cartItemsEl.innerHTML = `<div style="padding:24px;color:var(--muted)">Корзина пуста. Добавьте товары.</div>`;
      cartTotalEl.textContent = currency(0);
      updateCartBadge();
      return;
    }
    ids.forEach(id => {
      const qty = cart[id];
      const p = PRODUCTS.find(x=>x.id===id);
      if (!p) return;
      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <img src="${p.img}" alt="${p.name}">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:700">${p.name}</div>
              <div style="color:var(--muted);font-size:13px">${p.unit}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800">${currency(p.price * qty)}</div>
              <div style="color:var(--muted);font-size:13px">${p.price} ₽ × ${qty}</div>
            </div>
          </div>
          <div style="margin-top:8px;display:flex;justify-content:flex-end;gap:8px">
            <div class="qty-controls">
              <button data-id="${id}" class="qty-btn" data-op="dec">−</button>
              <span style="padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.02)">${qty}</span>
              <button data-id="${id}" class="qty-btn" data-op="inc">+</button>
            </div>
            <button data-id="${id}" class="btn" style="margin-left:8px" data-op="remove">Удалить</button>
          </div>
        </div>
      `;
      cartItemsEl.appendChild(item);
    });
    cartTotalEl.textContent = currency(calcCartTotal());
    updateCartBadge();
  }

  // ==== Profile UI ====
  function updateProfileUI(){
    const prof = getProfile();
    profileNameEl.textContent = prof.name || 'Гость';
    profileIdEl.textContent = prof.tgId ? `ID: ${prof.tgId}` : 'ID: —';
    profileAvatar.src = prof.avatar;
    document.getElementById('avatarImg').src = prof.avatar;
    profileBalanceEl.textContent = currency(prof.balance || 0);
    balanceDisplay.textContent = currency(prof.balance || 0);
    // purchases
    const arr = prof.purchases || [];
    if (arr.length === 0) {
      purchaseHistoryEl.innerHTML = `<div style="color:var(--muted);padding:12px">Пока нет покупок</div>`;
    } else {
      purchaseHistoryEl.innerHTML = '';
      arr.slice().reverse().forEach(o => {
        const el = document.createElement('div');
        el.style.padding = '10px';
        el.style.borderBottom = '1px dashed rgba(255,255,255,0.03)';
        el.innerHTML = `<div style="font-weight:700">${o.created_at}</div><div style="color:var(--muted);font-size:13px">Итого: ${currency(o.total)}</div>`;
        purchaseHistoryEl.appendChild(el);
      });
    }
  }

  // ==== Events ====
  categories.forEach(btn => {
    btn.addEventListener('click', () => {
      categories.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      renderProducts(cat, searchInput.value.trim());
      window.scrollTo({ top: 320, behavior: 'smooth' });
    });
  });

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    const active = document.querySelector('.cat.active');
    const cat = active ? active.dataset.cat : 'all';
    renderProducts(cat, q);
  });

  productsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (!id || !action) return;
    if (action === 'add'){
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      renderCart();
      cartModal.classList.add('open');
    } else if (action === 'minus'){
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      renderCart();
    }
  });

  cartBtn.addEventListener('click', ()=> {
    renderCart();
    cartModal.classList.add('open');
  });
  closeCart.addEventListener('click', ()=> cartModal.classList.remove('open'));

  cartItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const op = btn.dataset.op;
    if (!id || !op) return;
    if (op === 'inc') {
      cart[id] = (cart[id] || 0) + 1;
    } else if (op === 'dec') {
      cart[id] = Math.max(0, (cart[id] || 0) - 1);
      if (cart[id] === 0) delete cart[id];
    } else if (op === 'remove') {
      delete cart[id];
    }
    saveCart();
    renderCart();
  });

  // checkout -> open payment modal
  checkoutBtn.addEventListener('click', () => {
    const total = calcCartTotal();
    if (total === 0) { alert('Корзина пуста'); return; }
    // show summary
    paymentSummary.innerHTML = `<div style="font-weight:700">Сумма: ${currency(total)}</div><div style="color:var(--muted);margin-top:6px">Комментарий: ${orderNote.value || '—'}</div>`;
    paymentModal.classList.add('open');
  });

  payLaterButton.addEventListener('click', () => {
    // create order with status "pay_on_delivery"
    processOrder({ method: 'pay_on_delivery', paid: false });
  });

  // payment modal controls
  closePayment.addEventListener('click', ()=> paymentModal.classList.remove('open'));
  cancelPayBtn.addEventListener('click', ()=> paymentModal.classList.remove('open'));

  // toggle card form by radio
  document.addEventListener('change', (e) => {
    if (e.target && e.target.name === 'payMethod') {
      const cardForm = document.getElementById('cardForm');
      if (e.target.value === 'card') cardForm.setAttribute('aria-hidden','false'), cardForm.style.display='block';
      else cardForm.setAttribute('aria-hidden','true'), cardForm.style.display='none';
    }
  });

  // confirm payment (fake)
  confirmPayBtn.addEventListener('click', () => {
    const prof = getProfile();
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const total = calcCartTotal();
    if (method === 'balance') {
      if (prof.balance >= total) {
        prof.balance -= total;
        // save purchase
        const order = buildOrder(true, 'balance');
        prof.purchases = prof.purchases || [];
        prof.purchases.push(order);
        saveProfile(prof);
        // finalize
        finalizeAfterPayment(order, true);
      } else {
        alert('Недостаточно средств на балансе. Пополните или выберите оплату картой.');
      }
    } else {
      // fake card payment: validate simple fields
      const number = document.getElementById('cardNumber').value.trim();
      const mm = document.getElementById('cardMM').value.trim();
      const yy = document.getElementById('cardYY').value.trim();
      const cvv = document.getElementById('cardCVV').value.trim();
      if (number.length < 12 || !mm || !yy || cvv.length < 3) {
        alert('Заполните корректные данные карты (фейк).');
        return;
      }
      // simulate payment delay
      confirmPayBtn.disabled = true;
      confirmPayBtn.textContent = 'Проверка...';
      setTimeout(() => {
        confirmPayBtn.disabled = false;
        confirmPayBtn.textContent = 'Подтвердить оплату';
        const order = buildOrder(true, 'card');
        const prof = getProfile();
        prof.purchases = prof.purchases || [];
        prof.purchases.push(order);
        saveProfile(prof);
        finalizeAfterPayment(order, true);
      }, 900);
    }
  });

  // helper to build order
  function buildOrder(paid = true, method = 'balance') {
    const items = Object.keys(cart).map(id => {
      const p = PRODUCTS.find(x=>x.id===id);
      return { id, name: p.name, price: p.price, qty: cart[id], subtotal: p.price * cart[id], unit: p.unit };
    });
    return {
      created_at: new Date().toLocaleString(),
      items,
      total: calcCartTotal(),
      note: orderNote.value || '',
      paid: !!paid,
      method
    };
  }

  // finalize: clear cart, send to Telegram, show success
  function finalizeAfterPayment(order, showAlert=true) {
    // clear cart
    cart = {};
    saveCart();
    renderCart();
    paymentModal.classList.remove('open');
    cartModal.classList.remove('open');
    // send to Telegram bot via tg.sendData if available
    if (tg && tg.sendData) {
      try {
        tg.sendData(JSON.stringify(order));
        try { tg.close(); } catch(e){}
      } catch (e) {
        console.warn('tg.sendData failed', e);
      }
    } else {
      // not in Telegram — show confirmation
      if (showAlert) alert('Оплата прошла успешно! Заказ оформлен.\n' + JSON.stringify(order, null, 2));
    }
    // update profile UI
    updateProfileUI();
  }

  // Top-up (fake) flow
  topUpBtn.addEventListener('click', () => {
    const amountStr = prompt('Сумма для пополнения (₽)', '500');
    const amount = parseInt(amountStr || '0', 10);
    if (isNaN(amount) || amount <= 0) return alert('Некорректная сумма');
    const prof = getProfile();
    prof.balance = (prof.balance || 0) + amount;
    saveProfile(prof);
    alert('Баланс пополнен на ' + currency(amount));
  });

  withdrawBtn.addEventListener('click', () => {
    alert('Функция вывода в демо недоступна. Попробуйте пополнить баланс для теста.');
  });

  // profile open/close
  profileBtn.addEventListener('click', ()=> {
    updateProfileUI();
    profileModal.classList.add('open');
  });
  closeProfile.addEventListener('click', ()=> profileModal.classList.remove('open'));

  // pay on delivery handling when user chooses pay later
  function processOrder(opts = { method: 'pay_on_delivery', paid: false }) {
    const order = buildOrder(false, opts.method);
    // add to profile purchases
    const prof = getProfile();
    prof.purchases = prof.purchases || [];
    prof.purchases.push(order);
    saveProfile(prof);
    // send to telegram
    if (tg && tg.sendData) {
      try { tg.sendData(JSON.stringify(order)); try { tg.close(); } catch(e){} } catch(e){ console.warn(e); }
    } else {
      alert('Заказ создан. Оплата при получении.\n' + JSON.stringify(order, null, 2));
    }
    // clear cart
    cart = {}; saveCart(); renderCart(); cartModal.classList.remove('open');
    updateProfileUI();
  }

  // quick hero buttons
  openFruits.addEventListener('click', ()=> document.querySelector('.cat[data-cat="fruits"]').click());
  openVeg.addEventListener('click', ()=> document.querySelector('.cat[data-cat="veggies"]').click());
  openGifts.addEventListener('click', ()=> document.querySelector('.cat[data-cat="gifts"]').click());

  // init
  renderProducts('all','');
  updateCartBadge();
  updateProfileUI();
  renderCart();

  // expose for debug
  window._holidayApp = { PRODUCTS, cart, renderCart, renderProducts, getProfile, saveProfile };

  // ==== Snowflakes canvas ====
  (function initSnow(){
    const canvas = document.getElementById('snowCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, flakes = [];
    function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();
    function createFlakes(n = 120){
      flakes = [];
      for (let i=0;i<n;i++){
        flakes.push({
          x: Math.random()*w,
          y: Math.random()*h,
          r: 1 + Math.random()*4,
          d: Math.random()*1,
          vx: -0.5 + Math.random(),
          vy: 0.5 + Math.random()*1.5,
          swing: Math.random()*0.02
        });
      }
    }
    createFlakes(140);
    function draw(){
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let f of flakes){
        ctx.beginPath();
        ctx.globalAlpha = 0.8 * (0.5 + Math.sin(f.d)*0.5);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + f.r/8) + ')';
        ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
        ctx.fill();
      }
      update();
      requestAnimationFrame(draw);
    }
    function update(){
      for (let f of flakes){
        f.x += f.vx + Math.sin(f.y * f.swing) * 0.6;
        f.y += f.vy;
        if (f.y > h + 10) { f.y = -10; f.x = Math.random()*w; }
        if (f.x > w + 10) { f.x = -10; }
        if (f.x < -10) { f.x = w + 10; }
      }
    }
    draw();
  })();

})();