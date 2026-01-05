// Простая логика корзины и интеграция с Telegram WebApp API
// При запуске внутри Telegram объект window.Telegram.WebApp доступен.
(function(){
  const pricePerKg = 120;
  let qty = 1;

  const elQty = document.getElementById('qty');
  const elTotal = document.getElementById('total');
  const btnInc = document.getElementById('inc');
  const btnDec = document.getElementById('dec');
  const btnSend = document.getElementById('sendOrder');
  const btnOpen = document.getElementById('openPay');

  function updateUI(){
    elQty.textContent = qty;
    elTotal.textContent = (qty * pricePerKg).toString();
  }

  btnInc.addEventListener('click', ()=>{ qty++; updateUI(); });
  btnDec.addEventListener('click', ()=>{ if(qty>1) qty--; updateUI(); });
  updateUI();

  // Telegram WebApp
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if(tg){
    try {
      tg.expand(); // разворачивает окно приложения в Telegram (если поддерживается)
    } catch(e){}
  }

  btnSend.addEventListener('click', ()=>{
    const order = {
      product: "Огурцы",
      qty,
      unit_price: pricePerKg,
      total: qty * pricePerKg,
      timestamp: Date.now()
    };

    if(tg && tg.sendData){
      // Отправляем данные боту — он получит web_app_data
      tg.sendData(JSON.stringify(order));
    } else {
      // Если запущено в браузере — покажем JSON в новом окне
      window.alert("Данные заказа:\n" + JSON.stringify(order, null, 2));
    }
  });

  btnOpen.addEventListener('click', ()=>{
    // Для отладки — открыть текущую страницу в новой вкладке
    window.open(window.location.href, '_blank');
  });
})();