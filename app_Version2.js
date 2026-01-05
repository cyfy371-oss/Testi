// app.js — каталог, корзина, Telegram WebApp интеграция
// Работает standalone в браузере и в Telegram WebApp (window.Telegram.WebApp)
(() => {
  /* ==== Данные товаров (пример) ==== */
  const PRODUCTS = [
    // Фрукты
    { id: 'p1', name: 'Яблоки Красное Сияние', price: 180, unit: 'кг', cat: 'fruits', img: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=7d9b1b9e7d8b2a3a6b1b3d7f9c6f2c3e' },
    { id: 'p2', name: 'Апельсины Новорічні', price: 140, unit: 'кг', cat: 'fruits', img: 'https://images.unsplash.com/photo-1547516508-0a99f9f1f7f9?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=9a3c4b2f1f0e7a2b4c1d8b7a6e5f2d4c' },
    { id: 'p3', name: 'Груши', price: 200, unit: 'кг', cat: 'fruits', img: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=44b0a9b1c8c7d3a1d7e5f3b2c1a0e9d2' },
    { id: 'p4', name: 'Виноград (500г)', price: 220, unit: 'упак', cat: 'fruits', img: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=1a8b9e8f7c6d5b4a3c2f1e0d9b8a7c6f' },
    { id: 'p5', name: 'Гранат', price: 250, unit: 'шт', cat: 'fruits', img: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=0f1f2c3b4a5d6e7f8g9h0a1b2c3d4e5f' },

    // Овощи
    { id: 'p6', name: 'Огурцы Хрустящие', price: 120, unit: 'кг', cat: 'veggies', img: 'https://images.unsplash.com/photo-1542834369-f10ebf06d3cb?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=7bdf0c6a9adf6a5ccc2b5e6a9f7c4b3a' },
    { id: 'p7', name: 'Помидоры', price: 160, unit: 'кг', cat: 'veggies', img: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=b3a2f9e7d5c6b1a0c9d8e7f6a5b4c3d2' },
    { id: 'p8', name: 'Морковь', price: 90, unit: 'кг', cat: 'veggies', img: 'https://images.unsplash.com/photo-1543352634-18ba2b6b7d5f?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=7ac9d2e3b1a0c8d9f6e5b4a3c2d1e0f9' },
    { id: 'p9', name: 'Перец сладкий', price: 220, unit: 'кг', cat: 'veggies', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=2d8c9a7b6f5e4d3c2b1a0f9e8d7c6b5a' },
    { id: 'p10', name: 'Капуста', price: 70, unit: 'кг', cat: 'veggies', img: 'https://images.unsplash.com/photo-1502741126161-b048400d6b2c?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=3b9a1f7d6e5c4b3a2d1f0e9c8b7a6d5c' },

    // Подарочные наборы
    { id: 'g1', name: 'Новогодний набор “Праздник”', price: 1200, unit: 'шт', cat: 'gifts', img: 'https://images.unsplash.com/photo-1606851091680-4b1d0c3e6b9d?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=0c7a6e5b4d3f9a1b2c3d4e5f6a7b8c9d' }
  ];

  /* ==== DOM === */
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
  const continueBtn = document.getElementById('continueBtn');
  const orderNote = document.getElementById('orderNote');
  const openFruits = document.getElementById('openFruits');
  const openVeg = document.getElementById('openVeg');

  /* ==== Cart state ==== */
  let cart = JSON.parse(localStorage.getItem('holiday_cart') || '{}'); // {productId: qty}
  const saveCart = () => localStorage.setItem('holiday_cart', JSON.stringify(cart));

  /* ==== Telegram WebApp ==== */
  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  if (tg) {
    try { tg.expand(); } catch(e){}
  }

  /* ==== Helpers ==== */
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

  /* ==== Render products ==== */
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
        <img src="${p.img}" alt="${p.name}">
        <div>
          <div class="title">${p.name}</div>
          <div class="desc">${p.unit}</div>
        </div>
        <div class="meta">
          <div class="price">${currency(p.price)}</div>
          <div class="actions">
            <button class="btn" data-id="${p.id}" data-action="minus">−</button>
            <button class="btn primary" data-id="${p.id}" data-action="add">Добавить</button>
          </div>
        </div>
      `;
      productsGrid.appendChild(card);
    });
  }

  /* ==== Cart UI ==== */
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

  /* ==== Events ==== */
  // category buttons
  categories.forEach(btn => {
    btn.addEventListener('click', () => {
      categories.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      renderProducts(cat, searchInput.value.trim());
    });
  });

  // search
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    const active = document.querySelector('.cat.active');
    const cat = active ? active.dataset.cat : 'all';
    renderProducts(cat, q);
  });

  // delegate product buttons
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
      // добавить 1 товара в корзину и открыть корзину
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      renderCart();
    }
  });

  // open cart
  cartBtn.addEventListener('click', ()=> {
    renderCart();
    cartModal.classList.add('open');
  });
  closeCart.addEventListener('click', ()=> cartModal.classList.remove('open'));
  continueBtn.addEventListener('click', ()=> cartModal.classList.remove('open'));

  // cart item actions
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

  // checkout
  checkoutBtn.addEventListener('click', () => {
    const items = Object.keys(cart).map(id => {
      const p = PRODUCTS.find(x=>x.id===id);
      return { id, name: p.name, price: p.price, qty: cart[id], subtotal: p.price * cart[id], unit: p.unit };
    });
    if (items.length === 0) {
      alert('Корзина пуста');
      return;
    }
    const order = {
      created_at: new Date().toISOString(),
      items,
      total: calcCartTotal(),
      note: orderNote.value || '',
      source: 'telegram_web_app'
    };

    // Если внутри Telegram WebApp — отправляем через tg.sendData
    if (tg && tg.sendData) {
      try {
        tg.sendData(JSON.stringify(order));
        // Внутри WebApp обычно бот присылает подтверждение в чате. Можно закрыть WebApp:
        try { tg.close(); } catch(e){}
      } catch (e){
        alert('Ошибка отправки в Telegram: ' + e.message);
      }
    } else {
      // локально — показываем JSON и копируем в буфер
      const text = `Данные заказа:\n${JSON.stringify(order, null, 2)}`;
      alert(text);
      try { navigator.clipboard.writeText(JSON.stringify(order)); } catch(e){}
    }
  });

  // quick hero buttons
  openFruits.addEventListener('click', ()=> {
    document.querySelector('.cat[data-cat="fruits"]').click();
    window.scrollTo({ top: 350, behavior: 'smooth' });
  });
  openVeg.addEventListener('click', ()=> {
    document.querySelector('.cat[data-cat="veggies"]').click();
    window.scrollTo({ top: 350, behavior: 'smooth' });
  });

  // initial render
  renderProducts('all','');
  updateCartBadge();

  // expose for debug
  window._holidayApp = {
    PRODUCTS, cart, renderCart, renderProducts
  };
})();