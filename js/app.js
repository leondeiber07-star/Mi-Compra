/**
 * Mi Compra - Controlador Principal de la Aplicación
 * Conecta UI, APIs, eventos, cálculos y persistencia
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Inicialización de la base de datos nativa en el dispositivo móvil (IndexedDB)
  await StorageManager.init();

  // Inicialización de estado
  let rates = DolarAPI.getStoredRates();
  let preferences = StorageManager.getPreferences();

  // Elementos de la UI
  const els = {
    // Tasas
    ratesSubtitle: document.getElementById('rates-subtitle'),
    btnRefreshRates: document.getElementById('btn-refresh-rates'),
    rateCards: document.querySelectorAll('.rate-item-card'),
    valUsdOficial: document.getElementById('val-usd-oficial'),
    valUsdParalelo: document.getElementById('val-usd-paralelo'),
    valEurOficial: document.getElementById('val-eur-oficial'),
    valEurParalelo: document.getElementById('val-eur-paralelo'),

    // Resumen 3 columnas
    topTotalUSD: document.getElementById('top-total-usd'),
    topTotalBs: document.getElementById('top-total-bs'),
    topTotalEUR: document.getElementById('top-total-eur'),

    // Formulario de agregar
    productNameInput: document.getElementById('input-product-name'),
    productQtyInput: document.getElementById('input-product-qty'),
    btnQtyMinus: document.getElementById('btn-qty-minus'),
    btnQtyPlus: document.getElementById('btn-qty-plus'),
    productPriceInput: document.getElementById('input-product-price'),
    productCurrencySelect: document.getElementById('select-product-currency'),
    btnAddProduct: document.getElementById('btn-add-product'),
    quickPills: document.querySelectorAll('.tag-pill'),

    // Detalle del Ticket
    ticketCountBadge: document.getElementById('ticket-count-badge'),
    ticketItemsList: document.getElementById('ticket-items-list'),
    totalProductsMeta: document.getElementById('total-products-meta'),
    rateUsedMeta: document.getElementById('rate-used-meta'),
    darkTotalUSD: document.getElementById('dark-total-usd'),
    darkTotalEUR: document.getElementById('dark-total-eur'),
    darkTotalBs: document.getElementById('dark-total-bs'),
    btnClearTicket: document.getElementById('btn-clear-ticket'),
    btnCheckoutTicket: document.getElementById('btn-checkout-ticket'),
    btnShareTicket: document.getElementById('btn-share-ticket'),

    // Pestañas
    navTabs: document.querySelectorAll('.nav-tab-item'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Historial y Estadísticas
    historyList: document.getElementById('history-list'),
    emptyHistory: document.getElementById('empty-history'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    statTotalSpentUSD: document.getElementById('stat-total-spent-usd'),
    statTotalSpentBs: document.getElementById('stat-total-spent-bs'),
    statTotalPurchases: document.getElementById('stat-total-purchases'),
    statAverageTicket: document.getElementById('stat-average-ticket'),

    // Modales y Notificaciones
    modalRate: document.getElementById('modal-rate-edit'),
    modalRateTitle: document.getElementById('modal-rate-title'),
    modalRateInput: document.getElementById('modal-rate-input'),
    btnSaveModalRate: document.getElementById('btn-save-modal-rate'),
    btnCancelModalRate: document.getElementById('btn-cancel-modal-rate'),
    modalEditProduct: document.getElementById('modal-edit-product'),
    editProductName: document.getElementById('edit-product-name'),
    editProductQty: document.getElementById('edit-product-qty'),
    editQtyMinus: document.getElementById('edit-qty-minus'),
    editQtyPlus: document.getElementById('edit-qty-plus'),
    editProductPrice: document.getElementById('edit-product-price'),
    editProductCurrency: document.getElementById('edit-product-currency'),
    btnSaveEditProduct: document.getElementById('btn-save-edit-product'),
    btnCancelEditProduct: document.getElementById('btn-cancel-edit-product'),
    toast: document.getElementById('app-toast')
  };

  /**
   * Muestra un mensaje flotante tipo Toast
   */
  function showToast(message, icon = '✓') {
    if (!els.toast) return;
    els.toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    els.toast.classList.add('visible');
    setTimeout(() => {
      els.toast.classList.remove('visible');
    }, 2800);
  }

  /**
   * Muestra un diálogo de confirmación moderno y personalizado (reemplaza confirm nativo)
   * @param {Object} options
   * @param {string} options.title - Título del diálogo
   * @param {string} options.message - Mensaje explicativo
   * @param {string} [options.confirmText='Aceptar'] - Texto del botón de confirmación
   * @param {string} [options.cancelText='Cancelar'] - Texto del botón cancelar
   * @param {string} [options.type='danger'] - 'danger' | 'warning' | 'info'
   * @returns {Promise<boolean>}
   */
  function showConfirmDialog(options = {}) {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-app-confirm');
      const titleEl = document.getElementById('confirm-modal-title');
      const msgEl = document.getElementById('confirm-modal-message');
      const iconEl = document.getElementById('confirm-modal-icon');
      const btnCancel = document.getElementById('btn-confirm-cancel');
      const btnAccept = document.getElementById('btn-confirm-accept');

      if (!modal || !btnCancel || !btnAccept) {
        resolve(window.confirm(options.message || '¿Deseas continuar?'));
        return;
      }

      const {
        title = '¿Confirmar acción?',
        message = '¿Estás seguro de realizar esta acción?',
        confirmText = 'Aceptar',
        cancelText = 'Cancelar',
        type = 'danger'
      } = options;

      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
      btnCancel.textContent = cancelText;
      btnAccept.textContent = confirmText;

      if (iconEl) {
        iconEl.className = `confirm-modal-icon ${type}`;
        if (type === 'danger') {
          iconEl.innerHTML = `
            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          `;
          btnAccept.className = 'btn-confirm-accept is-danger';
        } else if (type === 'warning') {
          iconEl.innerHTML = `
            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          `;
          btnAccept.className = 'btn-confirm-accept is-warning';
        } else {
          iconEl.innerHTML = `
            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          `;
          btnAccept.className = 'btn-confirm-accept is-info';
        }
      }

      function cleanup(res) {
        modal.classList.remove('active');
        btnCancel.removeEventListener('click', handleCancel);
        btnAccept.removeEventListener('click', handleAccept);
        modal.removeEventListener('click', handleBackdrop);
        resolve(res);
      }

      function handleCancel() { cleanup(false); }
      function handleAccept() { cleanup(true); }
      function handleBackdrop(e) { if (e.target === modal) cleanup(false); }

      btnCancel.addEventListener('click', handleCancel);
      btnAccept.addEventListener('click', handleAccept);
      modal.addEventListener('click', handleBackdrop);

      modal.classList.add('active');
    });
  }

  window.showConfirmDialog = showConfirmDialog;

  /**
   * Renderiza las 4 tarjetas de tasas de cambio
   */
  function renderRatesUI() {
    if (els.valUsdOficial) els.valUsdOficial.textContent = `Bs. ${Calculator.formatNumber(rates.usd_oficial, 2)}`;
    if (els.valUsdParalelo) els.valUsdParalelo.textContent = `Bs. ${Calculator.formatNumber(rates.usd_paralelo, 2)}`;
    if (els.valEurOficial) els.valEurOficial.textContent = `Bs. ${Calculator.formatNumber(rates.eur_oficial, 2)}`;
    if (els.valEurParalelo) els.valEurParalelo.textContent = `Bs. ${Calculator.formatNumber(rates.eur_paralelo, 2)}`;

    // Fechas individuales que vienen dentro de la API para cada tasa
    const dateUsdOficial = document.getElementById('date-usd-oficial');
    const dateUsdParalelo = document.getElementById('date-usd-paralelo');
    const dateEurOficial = document.getElementById('date-eur-oficial');
    const dateEurParalelo = document.getElementById('date-eur-paralelo');

    if (rates.dates) {
      if (dateUsdOficial) dateUsdOficial.textContent = rates.dates.usd_oficial || '30/10/2026';
      if (dateUsdParalelo) dateUsdParalelo.textContent = rates.dates.usd_paralelo || '01/11/2026 - 02:01 PM';
      if (dateEurOficial) dateEurOficial.textContent = rates.dates.eur_oficial || '30/10/2026';
      if (dateEurParalelo) dateEurParalelo.textContent = rates.dates.eur_paralelo || '01/11/2026 - 02:01 PM';
    }

    // Subtítulo con la fecha exacta de la tasa que el usuario tiene activa
    if (els.ratesSubtitle) {
      const activeDate = DolarAPI.getActiveRateDate(rates);
      els.ratesSubtitle.textContent = `Actualizado: ${activeDate}`;
    }

    // Marca la tasa activa
    els.rateCards.forEach(card => {
      const rateType = card.dataset.rate;
      if (rateType === rates.selectedRate) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  /**
   * Renderiza todo el ticket y actualiza los cálculos globales
   */
  function renderCartAndTotals() {
    const rawItems = StorageManager.getCartItems();
    const cart = Calculator.calculateCart(rawItems, rates);

    // 1. Resumen superior de 3 columnas
    if (els.topTotalUSD) els.topTotalUSD.textContent = `$ ${Calculator.formatNumber(cart.totalUSD, 2)}`;
    if (els.topTotalBs) els.topTotalBs.textContent = `Bs. ${Calculator.formatNumber(cart.totalBs, 2)}`;
    if (els.topTotalEUR) els.topTotalEUR.textContent = `€ ${Calculator.formatNumber(cart.totalEUR, 2)}`;

    // 2. Insignia de conteo
    const productCount = rawItems.length;
    if (els.ticketCountBadge) {
      els.ticketCountBadge.textContent = `${productCount} producto${productCount === 1 ? '' : 's'}`;
    }

    // 3. Resumen en el banner azul oscuro del ticket
    if (els.totalProductsMeta) els.totalProductsMeta.textContent = cart.totalItemsCount;
    if (els.rateUsedMeta) els.rateUsedMeta.textContent = cart.rateLabel;
    if (els.darkTotalUSD) els.darkTotalUSD.textContent = `$${Calculator.formatNumber(cart.totalUSD, 2)}`;
    if (els.darkTotalEUR) els.darkTotalEUR.textContent = `€${Calculator.formatNumber(cart.totalEUR, 2)}`;
    if (els.darkTotalBs) els.darkTotalBs.textContent = `Bs. ${Calculator.formatNumber(cart.totalBs, 2)}`;

    // 4. Lista de productos del ticket
    if (els.ticketItemsList) {
      if (rawItems.length === 0) {
        els.ticketItemsList.innerHTML = `
          <div class="empty-ticket-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p>El ticket está vacío</p>
            <span style="font-size:0.75rem; color:#94a3b8;">Agrega productos arriba para ver el cálculo</span>
          </div>
        `;
      } else {
        els.ticketItemsList.innerHTML = cart.items.map(item => {
          let currSym = '$';
          if (item.currency === 'EUR') currSym = '€';
          if (item.currency === 'VES') currSym = 'Bs.';

          const formattedPrice = Calculator.formatNumber(item.price, 2);
          const formattedSubtotalNative = `${currSym}${Calculator.formatNumber(item.subtotalNative, 2)}`;
          const formattedSubtotalBs = `Bs. ${Calculator.formatNumber(item.subtotalBs, 2)}`;

          return `
            <div class="ticket-item-row" data-id="${item.id}">
              <div class="item-left-info">
                <div class="item-details">
                  <span class="item-name">${item.name}</span>
                  <span class="item-formula">${item.quantity} x ${currSym}${formattedPrice}</span>
                </div>
              </div>
              <div class="item-right-actions">
                <div class="item-subtotal-block">
                  <div class="item-subtotal-main">${formattedSubtotalNative}</div>
                  <div class="item-subtotal-bs">${formattedSubtotalBs}</div>
                </div>
                <button class="btn-edit-item" data-id="${item.id}" title="Editar unidades o producto">
                  <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button class="btn-remove-item" data-id="${item.id}" title="Eliminar producto">
                  <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          `;
        }).join('');

        // Eventos para editar producto / cantidad
        els.ticketItemsList.querySelectorAll('.btn-edit-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            openEditProductModal(id);
          });
        });

        // Eventos para eliminar productos
        els.ticketItemsList.querySelectorAll('.btn-remove-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            StorageManager.removeItem(id);
            renderCartAndTotals();
            showToast('Producto eliminado', '🗑');
          });
        });
      }
    }
  }

  /**
   * Actualiza las tasas desde DolarAPI en vivo
   */
  async function refreshRatesFromAPI() {
    if (els.btnRefreshRates) els.btnRefreshRates.classList.add('spinning');
    showToast('Consultando DolarAPI...', '🔄');

    const result = await DolarAPI.fetchLiveRates();
    rates = result.rates;
    rates.spreadPercent = preferences.spreadPercent !== undefined ? preferences.spreadPercent : 0.0;
    renderRatesUI();
    renderCartAndTotals();
    renderConfigUI();

    if (els.btnRefreshRates) els.btnRefreshRates.classList.remove('spinning');
    if (result.success) {
      showToast('Tasas actualizadas en vivo', '✓');
    } else {
      showToast('No se pudo conectar a la API (usando tasas guardadas)', '⚠️');
    }
  }

  // ==========================================================================
  // EVENTOS DE LAS TASAS
  // ==========================================================================

  // Botón refrescar tasas
  if (els.btnRefreshRates) {
    els.btnRefreshRates.addEventListener('click', () => {
      refreshRatesFromAPI();
    });
  }

  // Click en una tarjeta de tasa para seleccionarla como tasa activa
  els.rateCards.forEach(card => {
    card.addEventListener('click', () => {
      const rateKey = card.dataset.rate;
      rates = DolarAPI.setSelectedRate(rateKey);
      rates.spreadPercent = preferences.spreadPercent !== undefined ? preferences.spreadPercent : 0.0;
      renderRatesUI();
      renderCartAndTotals();
      renderConfigUI();
      const labels = {
        usd_oficial: 'USD Oficial (BCV)',
        usd_paralelo: 'USD Paralelo',
        eur_oficial: 'EUR Oficial (BCV)',
        eur_paralelo: 'EUR Paralelo'
      };
      showToast(`Tasa activa: ${labels[rateKey] || rateKey}`, '✓');
    });

    // Doble clic o pulsación larga para editar la tasa manualmente
    card.addEventListener('dblclick', () => {
      openRateModal(card.dataset.rate);
    });
  });

  // ==========================================================================
  // FORMULARIO AGREGAR PRODUCTO
  // ==========================================================================

  // Stepper de Cantidad
  if (els.btnQtyMinus && els.productQtyInput) {
    els.btnQtyMinus.addEventListener('click', () => {
      let val = parseInt(els.productQtyInput.value, 10) || 1;
      if (val > 1) {
        els.productQtyInput.value = val - 1;
      }
    });
  }

  if (els.btnQtyPlus && els.productQtyInput) {
    els.btnQtyPlus.addEventListener('click', () => {
      let val = parseInt(els.productQtyInput.value, 10) || 1;
      els.productQtyInput.value = val + 1;
    });
  }

  // Pastillas de sugerencia rápida (Arroz, Harina, etc.)
  els.quickPills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (els.productNameInput) {
        els.productNameInput.value = pill.textContent.trim();
        if (els.productPriceInput) els.productPriceInput.focus();
      }
    });
  });

  // Agregar producto al ticket
  function addProductFromForm() {
    const name = els.productNameInput.value.trim();
    const qty = parseFloat(els.productQtyInput.value) || 1;
    let priceStr = els.productPriceInput.value.replace(',', '.');
    const price = parseFloat(priceStr);
    const currency = els.productCurrencySelect.value;

    if (!name) {
      showToast('Ingresa el nombre del producto', '⚠️');
      if (els.productNameInput) els.productNameInput.focus();
      return;
    }

    if (isNaN(price) || price < 0) {
      showToast('Ingresa un precio válido', '⚠️');
      if (els.productPriceInput) els.productPriceInput.focus();
      return;
    }

    StorageManager.addItem({
      name,
      quantity: qty,
      price,
      currency
    });

    // Limpiar formulario para el próximo producto
    els.productNameInput.value = '';
    els.productPriceInput.value = '';
    els.productQtyInput.value = 1;

    renderCartAndTotals();
    showToast(`Agregado: ${name}`, '🛒');

    // Desplazar suavemente hacia el ticket
    if (els.ticketItemsList) {
      els.ticketItemsList.scrollTop = els.ticketItemsList.scrollHeight;
    }
  }

  if (els.btnAddProduct) {
    els.btnAddProduct.addEventListener('click', addProductFromForm);
  }

  // Permitir presionar Enter en el precio para agregar directo
  if (els.productPriceInput) {
    els.productPriceInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addProductFromForm();
      }
    });
  }

  // ==========================================================================
  // ACCIONES DEL TICKET (LIMPIAR, FINALIZAR, COMPARTIR)
  // ==========================================================================

  // Botón Limpiar Ticket
  if (els.btnClearTicket) {
    els.btnClearTicket.addEventListener('click', async () => {
      const items = StorageManager.getCartItems();
      if (items.length === 0) {
        showToast('El ticket ya está vacío', 'ℹ️');
        return;
      }
      const confirmed = await showConfirmDialog({
        title: '¿Vaciar ticket actual?',
        message: '¿Deseas vaciar todos los productos del ticket en curso?',
        confirmText: 'Sí, vaciar',
        cancelText: 'Cancelar',
        type: 'danger'
      });
      if (confirmed) {
        StorageManager.clearCart();
        renderCartAndTotals();
        showToast('Ticket limpiado', '🗑️');
      }
    });
  }

  // Botón para copiar el monto total en Bolívares al portapapeles
  const btnCopyTotalBs = document.getElementById('btn-copy-total-bs');
  if (btnCopyTotalBs) {
    btnCopyTotalBs.addEventListener('click', () => {
      const el = document.getElementById('dark-total-bs');
      if (!el) return;
      const text = el.textContent.trim();
      if (!text || text === 'Bs. 0,00' || text === 'Bs. 0.00') {
        showToast('El total está en 0 para copiar', '⚠️');
        return;
      }

      const iconNormal = btnCopyTotalBs.querySelector('.copy-icon-normal');
      const iconSuccess = btnCopyTotalBs.querySelector('.copy-icon-success');

      const triggerSuccess = () => {
        btnCopyTotalBs.classList.add('copied');
        if (iconNormal) iconNormal.style.display = 'none';
        if (iconSuccess) iconSuccess.style.display = 'inline-block';
        showToast(`¡Total copiado: ${text}!`, '📋');

        setTimeout(() => {
          btnCopyTotalBs.classList.remove('copied');
          if (iconNormal) iconNormal.style.display = 'inline-block';
          if (iconSuccess) iconSuccess.style.display = 'none';
        }, 1500);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(triggerSuccess).catch(() => {
          fallbackCopyText(text, triggerSuccess);
        });
      } else {
        fallbackCopyText(text, triggerSuccess);
      }
    });
  }

  function fallbackCopyText(text, onSuccess) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (onSuccess) onSuccess();
    } catch (e) {
      showToast('No se pudo copiar automáticamente', '⚠️');
    }
  }

  // Variables para gestionar el ticket pendiente y su número correlativo
  let lastFinishedReceipt = null;
  let lastFinishedTicketNum = 1;

  function showPurchaseReceiptModal(cart, ticketNum = 1, isAlreadySaved = false) {
    lastFinishedReceipt = cart;
    lastFinishedTicketNum = ticketNum;
    const modalReceipt = document.getElementById('modal-receipt');
    if (!modalReceipt) return;

    // Fecha y hora formateada (usar la fecha guardada si proviene del historial)
    const formattedDate = cart.date || (
      new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })
    );

    const elDate = document.getElementById('receipt-date');
    if (elDate) elDate.textContent = formattedDate;

    // Número de ticket correlativo
    const elId = document.getElementById('receipt-id');
    if (elId) elId.textContent = `#${ticketNum}`;

    const elBarcode = document.getElementById('receipt-barcode-num');
    if (elBarcode) elBarcode.textContent = `7 59835154${String(ticketNum).padStart(2, '0')}`;

    // Renderizar lista detallada de productos
    const receiptList = document.getElementById('receipt-items-list');
    if (receiptList) {
      receiptList.innerHTML = '';
      (cart.items || []).forEach(it => {
        let sym = it.currency === 'USD' ? '$' : (it.currency === 'EUR' ? '€' : 'Bs.');
        const subUSD = it.subtotalUSD !== undefined ? it.subtotalUSD : (it.price * it.quantity);
        const subBs = it.subtotalBs !== undefined ? it.subtotalBs : 0;
        const row = document.createElement('div');
        row.className = 'receipt-item-row';
        row.innerHTML = `
          <div class="receipt-item-main">
            <span class="receipt-item-name">${it.quantity}x ${it.name}</span>
            <span class="receipt-item-total">$ ${Calculator.formatNumber(subUSD, 2)}</span>
          </div>
          <div class="receipt-item-subdetail">
            ${sym} ${Calculator.formatNumber(it.price, 2)} c/u • Bs. ${Calculator.formatNumber(subBs, 2)}
          </div>
        `;
        receiptList.appendChild(row);
      });
    }

    // Encabezado: Si ya está guardado muestra el nombre de la tienda, sino "CALCULADORA DE COSTO"
    const elTagline = document.getElementById('receipt-store-tagline');
    if (elTagline) {
      if (isAlreadySaved && cart.storeName) {
        elTagline.textContent = cart.storeName.toUpperCase();
        elTagline.style.color = '#0d2c55';
        elTagline.style.fontWeight = '800';
        elTagline.style.letterSpacing = '0.5px';
      } else {
        elTagline.textContent = 'CALCULADORA DE COSTO';
        elTagline.style.color = '#64748b';
        elTagline.style.fontWeight = '600';
        elTagline.style.letterSpacing = '0.3px';
      }
    }

    // Pie de ticket: Si ya está guardado muestra mensaje de ticket guardado, sino "CONTROL Y ESTIMACIÓN DE COSTOS"
    const elFooterMsg = document.getElementById('receipt-footer-msg');
    if (elFooterMsg) {
      if (isAlreadySaved) {
        elFooterMsg.textContent = '📁 TICKET GUARDADO EN TU HISTORIAL';
        elFooterMsg.style.color = '#15803d';
        elFooterMsg.style.fontWeight = '700';
      } else {
        elFooterMsg.textContent = 'CONTROL Y ESTIMACIÓN DE COSTOS';
        elFooterMsg.style.color = '#64748b';
        elFooterMsg.style.fontWeight = '600';
      }
    }

    // Totales
    const elTotalItems = document.getElementById('receipt-total-items');
    if (elTotalItems) elTotalItems.textContent = cart.totalItemsCount || (cart.items ? cart.items.length : 0);

    const elRateUsed = document.getElementById('receipt-rate-used');
    if (elRateUsed) elRateUsed.textContent = cart.rateLabel || cart.rateUsed || '889,26 Bs/$';

    const elTotalUSD = document.getElementById('receipt-total-usd');
    if (elTotalUSD) elTotalUSD.textContent = `$ ${Calculator.formatNumber(cart.totalUSD, 2)}`;

    const elTotalEUR = document.getElementById('receipt-total-eur');
    if (elTotalEUR) elTotalEUR.textContent = `€ ${Calculator.formatNumber(cart.totalEUR, 2)}`;

    const elTotalBs = document.getElementById('receipt-total-bs');
    if (elTotalBs) elTotalBs.textContent = `Bs. ${Calculator.formatNumber(cart.totalBs, 2)}`;

    // Si ya está guardado en el historial, ocultamos el botón de guardar
    const btnReceiptSave = document.getElementById('btn-receipt-save');
    if (btnReceiptSave) {
      btnReceiptSave.style.display = isAlreadySaved ? 'none' : 'flex';
    }

    // Mostrar modal del ticket con animación
    modalReceipt.classList.add('active');
  }

  // Eventos de botones del ticket
  const btnReceiptDismiss = document.getElementById('btn-receipt-dismiss');
  if (btnReceiptDismiss) {
    btnReceiptDismiss.addEventListener('click', () => {
      document.getElementById('modal-receipt')?.classList.remove('active');
    });
  }

  const btnReceiptHistory = document.getElementById('btn-receipt-view-history');
  if (btnReceiptHistory) {
    btnReceiptHistory.addEventListener('click', () => {
      document.getElementById('modal-receipt')?.classList.remove('active');
      const tabHist = document.querySelector('[data-tab=tab-historial]');
      if (tabHist) tabHist.click();
    });
  }

  const btnReceiptShare = document.getElementById('btn-receipt-share');
  if (btnReceiptShare) {
    btnReceiptShare.addEventListener('click', () => {
      if (!lastFinishedReceipt) return;
      const cart = lastFinishedReceipt;
      let text = `🧾 *TICKET #${lastFinishedTicketNum} - MI COMPRA* 🇻🇪\n`;
      if (cart.storeName) {
        text += `🏪 Tienda: *${cart.storeName}* (${cart.storeType || 'Comercio'})\n`;
      }
      text += `📅 Fecha: ${new Date().toLocaleDateString('es-VE')}\n`;
      text += `--------------------------------\n`;
      cart.items.forEach(it => {
        let sym = it.currency === 'USD' ? '$' : (it.currency === 'EUR' ? '€' : 'Bs.');
        text += `• ${it.quantity}x ${it.name} = $${Calculator.formatNumber(it.subtotalUSD, 2)} (Bs. ${Calculator.formatNumber(it.subtotalBs, 2)})\n`;
      });
      text += `--------------------------------\n`;
      text += `📦 Total Productos: ${cart.totalItemsCount}\n`;
      text += `📈 Tasa: ${cart.rateLabel}\n`;
      text += `💵 Total USD: $${Calculator.formatNumber(cart.totalUSD, 2)}\n`;
      text += `💶 Total EUR: €${Calculator.formatNumber(cart.totalEUR, 2)}\n`;
      text += `🇻🇪 *TOTAL A PAGAR (BS):* Bs. ${Calculator.formatNumber(cart.totalBs, 2)}\n\n`;
      text += `_Calculado con la app Mi Compra_`;

      if (navigator.share) {
        navigator.share({ title: `Ticket #${lastFinishedTicketNum} - Mi Compra`, text: text }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('¡Ticket copiado al portapapeles!', '📋');
        });
      } else {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
      }
    });
  }

  // Al pulsar "Guardar" en el ticket: solicita Nombre y Tipo de Tienda
  const btnReceiptSave = document.getElementById('btn-receipt-save');
  const modalStoreInfo = document.getElementById('modal-store-info');
  const inputStoreName = document.getElementById('input-store-name');
  const selectStoreType = document.getElementById('select-store-type');
  const btnCancelStoreInfo = document.getElementById('btn-cancel-store-info');
  const btnConfirmSaveTicket = document.getElementById('btn-confirm-save-ticket');
  const storeTicketBadge = document.getElementById('store-ticket-badge');

  if (btnReceiptSave && modalStoreInfo) {
    btnReceiptSave.addEventListener('click', () => {
      if (!lastFinishedReceipt) return;

      // 1. Cerrar el modal del ticket para que no quede adelante
      document.getElementById('modal-receipt')?.classList.remove('active');

      // 2. Actualizar badge con el número de ticket
      if (storeTicketBadge) storeTicketBadge.textContent = `Ticket #${lastFinishedTicketNum}`;

      // 3. Mostrar modal de datos de la tienda
      modalStoreInfo.classList.add('active');
      setTimeout(() => {
        if (inputStoreName) inputStoreName.focus();
      }, 100);
    });
  }

  if (btnCancelStoreInfo && modalStoreInfo) {
    btnCancelStoreInfo.addEventListener('click', () => {
      modalStoreInfo.classList.remove('active');
      // Reabrir el ticket si se cancela la captura de datos
      document.getElementById('modal-receipt')?.classList.add('active');
    });
  }

  // Autodetectar categoría mientras se escribe el nombre de la tienda
  if (inputStoreName && selectStoreType) {
    inputStoreName.addEventListener('input', () => {
      const val = inputStoreName.value.toLowerCase().trim();
      if (!val) return;

      if (val.includes('farma') || val.includes('locatel') || val.includes('drogueria') || val.includes('botica') || val.includes('salud')) {
        selectStoreType.value = 'Medicinas & Cuidado';
      } else if (val.includes('ferre') || val.includes('epa')) {
        selectStoreType.value = 'Ferretería';
      } else if (val.includes('pan') || val.includes('bakery')) {
        selectStoreType.value = 'Panadería';
      } else if (val.includes('carne') || val.includes('carni') || val.includes('pollo') || val.includes('pesca')) {
        selectStoreType.value = 'Carnes y Proteínas';
      } else if (val.includes('limp') || val.includes('hogar') || val.includes('deterg')) {
        selectStoreType.value = 'Limpieza y Hogar';
      } else if (val.includes('abasto') || val.includes('bodega') || val.includes('chino') || val.includes('kiosco')) {
        selectStoreType.value = 'Tienda / Abasto';
      } else if (val.includes('gama') || val.includes('plaza') || val.includes('super') || val.includes('automercado') || val.includes('madeirense') || val.includes('luz') || val.includes('traki') || val.includes('unicasa') || val.includes('san diego') || val.includes('rio')) {
        selectStoreType.value = 'Alimentos y Despensa';
      }
    });
  }

  // Al confirmar en el modal de tienda: se guarda en el historial y se limpia el ticket activo
  if (btnConfirmSaveTicket && modalStoreInfo) {
    btnConfirmSaveTicket.addEventListener('click', () => {
      if (!lastFinishedReceipt) return;

      const storeName = (inputStoreName && inputStoreName.value.trim()) ? inputStoreName.value.trim() : 'Comercio';
      const storeType = (selectStoreType && selectStoreType.value) ? selectStoreType.value : 'Supermercado';

      // 1. Guardar formalmente en el Historial con los datos de tienda
      const savedEntry = StorageManager.savePurchaseTicket({
        ...lastFinishedReceipt,
        storeName,
        storeType
      });

      // 2. Limpiar el carrito activo ahora que ya se guardó
      StorageManager.clearCart();
      renderCartAndTotals();
      renderHistoryUI();
      renderStatsUI();

      // 3. Cerrar modal de captura de tienda
      modalStoreInfo.classList.remove('active');
      if (inputStoreName) inputStoreName.value = '';

      showToast(`¡Ticket #${savedEntry.ticketNumber} archivado en el Historial!`, '✓');

      // 4. Mostrar el ticket archivado con el nombre de la tienda y el mensaje de ticket guardado
      showPurchaseReceiptModal(savedEntry, savedEntry.ticketNumber, true);
    });
  }

  // Botón Finalizar Compra: Solo muestra el ticket (sin guardar aún)
  if (els.btnCheckoutTicket) {
    els.btnCheckoutTicket.addEventListener('click', () => {
      const items = StorageManager.getCartItems();
      if (items.length === 0) {
        showToast('Agrega productos antes de finalizar', '⚠️');
        return;
      }

      const cart = Calculator.calculateCart(items, rates);
      // Calcular el número correlativo que le corresponderá al guardarse
      const nextTicketNum = StorageManager.getHistory().length + 1;

      // Despliega el ticket en pantalla para revisión
      showPurchaseReceiptModal(cart, nextTicketNum);
    });
  }

  // Compartir Ticket (WhatsApp o Copiar al Portapapeles)
  if (els.btnShareTicket) {
    els.btnShareTicket.addEventListener('click', () => {
      const items = StorageManager.getCartItems();
      if (items.length === 0) {
        showToast('El ticket está vacío para compartir', '⚠️');
        return;
      }

      const cart = Calculator.calculateCart(items, rates);
      let text = `🛒 *MI COMPRA - TICKET DE COMPRA* 🇻🇪\n\n`;
      cart.items.forEach(it => {
        let sym = it.currency === 'USD' ? '$' : (it.currency === 'EUR' ? '€' : 'Bs.');
        text += `• ${it.name} (${it.quantity} x ${sym}${Calculator.formatNumber(it.price, 2)}) = ${sym}${Calculator.formatNumber(it.subtotalNative, 2)}\n`;
      });
      text += `\n----------------------------\n`;
      text += `📦 *Total Productos:* ${cart.totalItemsCount}\n`;
      text += `📈 *Tasa aplicada:* ${cart.rateLabel}\n`;
      text += `💵 *Total USD:* $${Calculator.formatNumber(cart.totalUSD, 2)}\n`;
      text += `💶 *Total EUR:* €${Calculator.formatNumber(cart.totalEUR, 2)}\n`;
      text += `🇻🇪 *TOTAL EN BOLÍVARES:* Bs. ${Calculator.formatNumber(cart.totalBs, 2)}\n\n`;
      text += `_Calculado con la app Mi Compra_`;

      if (navigator.share) {
        navigator.share({
          title: 'Ticket de Mi Compra',
          text: text
        }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('¡Ticket copiado al portapapeles!', '📋');
        });
      } else {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
      }
    });
  }

  // ==========================================================================
  // PESTAÑAS Y NAVEGACIÓN INFERIOR
  // ==========================================================================
  els.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      
      // Cerrar modal de editar tasa manual al navegar entre pestañas
      if (window.closeCustomRateModal) {
        window.closeCustomRateModal();
      } else {
        document.getElementById('modal-custom-rate')?.classList.remove('active');
      }
      
      // Actualizar botón activo
      els.navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Actualizar vista activa
      els.tabPanes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      // Renderizar vista según corresponda
      if (targetId === 'tab-historial') renderHistoryUI();
      if (targetId === 'tab-estadisticas') renderStatsUI();
      if (targetId === 'tab-configuracion') renderConfigUI();
    });
  });

  // ==========================================================================
  // HISTORIAL Y ESTADÍSTICAS
  // ==========================================================================
  function formatFriendlyHistoryDate(item) {
    const ts = item.timestamp || parseInt(item.id);
    if (ts && !isNaN(ts)) {
      const d = new Date(ts);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const timeStr = d.toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit', hour12: true });

      if (isToday) return `Hoy, ${timeStr}`;
      if (isYesterday) return `Ayer, ${timeStr}`;
      return `${d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' })}, ${timeStr}`;
    }
    return item.date || 'Reciente';
  }

  // Helper para obtener icono SVG y paleta de colores según la categoría de tienda / rubro
  function getCategoryVisuals(storeType, storeName = '') {
    let type = storeType;
    if (!type || type === 'Comercio') {
      const sName = (storeName || '').toLowerCase();
      if (sName.includes('farma') || sName.includes('locatel') || sName.includes('drogueria') || sName.includes('salud')) {
        type = 'Medicinas & Cuidado';
      } else if (sName.includes('ferre') || sName.includes('epa')) {
        type = 'Ferretería';
      } else if (sName.includes('pan') || sName.includes('bakery')) {
        type = 'Panadería';
      } else if (sName.includes('carne') || sName.includes('carni') || sName.includes('pollo') || sName.includes('pesca')) {
        type = 'Carnes y Proteínas';
      } else if (sName.includes('limp') || sName.includes('hogar') || sName.includes('deterg')) {
        type = 'Limpieza y Hogar';
      } else if (sName.includes('abasto') || sName.includes('bodega') || sName.includes('chino')) {
        type = 'Tienda / Abasto';
      } else {
        type = 'Alimentos y Despensa';
      }
    }

    if (type === 'Supermercado') type = 'Alimentos y Despensa';
    if (type === 'Farmacia') type = 'Medicinas & Cuidado';
    if (type === 'Carnicería') type = 'Carnes y Proteínas';

    switch (type) {
      case 'Alimentos y Despensa':
        return {
          bgColor: '#dcfce7',
          textColor: '#15803d',
          borderColor: '#86efac',
          sliceColor: '#059669',
          shortLabel: 'Alimentos',
          iconSvg: `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 2v8a3 3 0 0 1-3 3h-1"/>
              <path d="M14 13v9"/>
              <path d="M6 2v6a2 2 0 0 0 4 0V2"/>
              <path d="M8 8v14"/>
            </svg>
          `
        };

      case 'Medicinas & Cuidado':
        return {
          bgColor: '#e0f2fe',
          textColor: '#0284c7',
          borderColor: '#bae6fd',
          sliceColor: '#334155',
          shortLabel: 'Medicinas',
          iconSvg: `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="5"/>
              <path d="M12 7v10"/>
              <path d="M7 12h10"/>
            </svg>
          `
        };

      case 'Carnes y Proteínas':
        return {
          bgColor: '#ffedd5',
          textColor: '#ea580c',
          borderColor: '#fed7aa',
          sliceColor: '#d97706',
          shortLabel: 'Proteínas',
          iconSvg: `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 4c2.5 0 6 1.8 6 5.5 0 5-4.5 8.5-9 8.5-3.5 0-7-2.5-7-6.5 0-4 3.5-7.5 10-7.5z"/>
              <circle cx="10" cy="11.5" r="2.5"/>
            </svg>
          `
        };

      case 'Limpieza y Hogar':
        return {
          bgColor: '#ede9fe',
          textColor: '#7c3aed',
          borderColor: '#ddd6fe',
          sliceColor: '#1e293b',
          shortLabel: 'Limpieza',
          iconSvg: `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 3l3 3-10 10-4-1-1-4 10-10z"/>
              <path d="M3 21l6-2"/>
              <path d="M7 17l-4 4"/>
            </svg>
          `
        };

      case 'Panadería':
        return {
          bgColor: '#fef9c3',
          textColor: '#ca8a04',
          borderColor: '#fde047',
          sliceColor: '#ca8a04',
          shortLabel: 'Panadería',
          iconSvg: `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 13c0-3.5 3-6.5 9-6.5s9 3 9 6.5c0 3-2.5 5.5-9 5.5s-9-2.5-9-5.5z"/>
              <path d="M7 11c.8 1.2 1.8 2 3 2"/>
              <path d="M14 11c.8 1.2 1.8 2 3 2"/>
            </svg>
          `
        };

      case 'Ferretería':
        return {
          bgColor: '#ffe4e6',
          textColor: '#e11d48',
          borderColor: '#fecdd3',
          sliceColor: '#e11d48',
          shortLabel: 'Ferretería',
          iconSvg: `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          `
        };

      case 'Tienda / Abasto':
        return {
          bgColor: '#e0e7ff',
          textColor: '#4f46e5',
          borderColor: '#c7d2fe',
          sliceColor: '#4f46e5',
          shortLabel: 'Abasto',
          iconSvg: `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l1-6h16l1 6"/>
              <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>
              <path d="M4 14v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/>
              <path d="M9 22v-6h6v6"/>
            </svg>
          `
        };

      case 'Otro':
      default:
        return {
          bgColor: '#f3e8ff',
          textColor: '#9333ea',
          borderColor: '#e9d5ff',
          sliceColor: '#9333ea',
          shortLabel: 'Otros',
          iconSvg: `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          `
        };
    }
  }

  // Helper para asignar colores distintivos y visuales a comercios específicos
  const STORE_PALETTE = [
    { sliceColor: '#059669', bgColor: '#dcfce7', textColor: '#15803d' },
    { sliceColor: '#2563eb', bgColor: '#dbeafe', textColor: '#1d4ed8' },
    { sliceColor: '#d97706', bgColor: '#fef3c7', textColor: '#b45309' },
    { sliceColor: '#7c3aed', bgColor: '#ede9fe', textColor: '#6d28d9' },
    { sliceColor: '#e11d48', bgColor: '#ffe4e6', textColor: '#be123c' },
    { sliceColor: '#0891b2', bgColor: '#cffafe', textColor: '#0e7490' },
    { sliceColor: '#4f46e5', bgColor: '#e0e7ff', textColor: '#4338ca' },
    { sliceColor: '#ca8a04', bgColor: '#fef9c3', textColor: '#a16207' }
  ];

  function getStoreVisuals(storeName, index = 0) {
    const palette = STORE_PALETTE[index % STORE_PALETTE.length];
    const sName = (storeName || 'Comercio').trim();
    return {
      bgColor: palette.bgColor,
      textColor: palette.textColor,
      sliceColor: palette.sliceColor,
      shortLabel: sName.length > 10 ? sName.substring(0, 10) + '...' : sName,
      iconSvg: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      `
    };
  }

  function getStoreCardMeta(storeName, index = 0, isTop = false) {
    const s = (storeName || '').toLowerCase();
    
    // Tag descriptivo inferior izquierdo fiel al diseño
    let tag = '';
    if (index === 0 || isTop) {
      tag = 'Frecuencia más alta';
    } else if (s.includes('farma') || s.includes('locatel') || s.includes('drogueria') || s.includes('salud') || s.includes('botica')) {
      tag = 'Cuidado & Medicina';
    } else if (s.includes('madeirense') || s.includes('unicasa') || s.includes('san diego') || s.includes('abasto') || s.includes('bodega') || s.includes('viveres')) {
      tag = 'Víveres & Abarrotes';
    } else if (s.includes('gama') || s.includes('plaza') || s.includes('carne') || s.includes('carni') || s.includes('fresco') || s.includes('pesca')) {
      tag = 'Charcutería & Frescos';
    } else if (s.includes('pan') || s.includes('bakery')) {
      tag = 'Panadería & Repostería';
    } else if (s.includes('ferre') || s.includes('epa')) {
      tag = 'Hogar & Ferretería';
    } else if (s.includes('limp')) {
      tag = 'Hogar & Limpieza';
    } else {
      tag = 'Establecimiento Habitual';
    }

    // Temas visuales para barra, porcentaje e iconos
    const barThemes = [
      { barColor: '#0c2340', pctColor: '#0c2340', bg: '#eff6ff', iconColor: '#1d4ed8' },
      { barColor: '#059669', pctColor: '#059669', bg: '#e0f2fe', iconColor: '#0284c7' },
      { barColor: '#b45309', pctColor: '#b45309', bg: '#ffedd5', iconColor: '#c2410c' },
      { barColor: '#334155', pctColor: '#334155', bg: '#f1f5f9', iconColor: '#334155' },
      { barColor: '#7c3aed', pctColor: '#7c3aed', bg: '#ede9fe', iconColor: '#6d28d9' },
      { barColor: '#e11d48', pctColor: '#e11d48', bg: '#ffe4e6', iconColor: '#be123c' }
    ];

    const theme = barThemes[index % barThemes.length];

    let iconSvg = '';
    if (s.includes('farma') || s.includes('locatel') || s.includes('salud') || s.includes('drogueria')) {
      iconSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5"/>
          <path d="M12 7v10"/>
          <path d="M7 12h10"/>
        </svg>
      `;
    } else if (s.includes('madeirense') || s.includes('unicasa') || s.includes('san diego') || s.includes('super')) {
      iconSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1.5"/>
          <circle cx="20" cy="21" r="1.5"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      `;
    } else if (s.includes('gama') || s.includes('recibo') || s.includes('ticket')) {
      iconSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="10" x2="16" y2="10"/>
          <line x1="8" y1="14" x2="12" y2="14"/>
        </svg>
      `;
    } else {
      iconSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      `;
    }

    return {
      tag,
      barColor: theme.barColor,
      pctColor: theme.pctColor,
      bg: theme.bg,
      iconColor: theme.iconColor,
      iconSvg
    };
  }

  // Estado de visualización de estadísticas ('category' | 'store')
  let statsViewMode = 'category';

  window.setStatsViewMode = function(mode) {
    statsViewMode = mode;
    renderStatsUI();
  };

  let currentHistoryFilter = 'all';
  let selectedCalendarDate = null; // Formato "YYYY-MM-DD"

  const FILTER_DEFINITIONS = [
    { key: 'all', label: 'Todos' },
    { key: 'month', label: 'Este Mes' },
    { key: 'Alimentos y Despensa', label: 'Alimentos' },
    { key: 'Medicinas & Cuidado', label: 'Medicinas' },
    { key: 'Carnes y Proteínas', label: 'Carnes' },
    { key: 'Limpieza y Hogar', label: 'Limpieza' },
    { key: 'Panadería', label: 'Panadería' },
    { key: 'Ferretería', label: 'Ferretería' },
    { key: 'Tienda / Abasto', label: 'Abasto' },
    { key: 'Otro', label: 'Otro' }
  ];

  function getStoreTypeNormalized(item) {
    let type = item.storeType;
    if (!type || type === 'Comercio') {
      const sName = (item.storeName || '').toLowerCase();
      if (sName.includes('farma') || sName.includes('locatel') || sName.includes('drogueria') || sName.includes('salud')) {
        type = 'Medicinas & Cuidado';
      } else if (sName.includes('ferre') || sName.includes('epa')) {
        type = 'Ferretería';
      } else if (sName.includes('pan') || sName.includes('bakery')) {
        type = 'Panadería';
      } else if (sName.includes('carne') || sName.includes('carni') || sName.includes('pollo') || sName.includes('pesca')) {
        type = 'Carnes y Proteínas';
      } else if (sName.includes('limp') || sName.includes('hogar') || sName.includes('deterg')) {
        type = 'Limpieza y Hogar';
      } else if (sName.includes('abasto') || sName.includes('bodega') || sName.includes('chino')) {
        type = 'Tienda / Abasto';
      } else {
        type = 'Alimentos y Despensa';
      }
    }

    if (type === 'Supermercado') return 'Alimentos y Despensa';
    if (type === 'Farmacia') return 'Medicinas & Cuidado';
    if (type === 'Carnicería') return 'Carnes y Proteínas';
    return type;
  }

  function getFilterCount(key, history) {
    if (key === 'all') return history.length;
    if (key === 'month') {
      const now = new Date();
      return history.filter(item => {
        const ts = item.timestamp || parseInt(item.id);
        if (ts && !isNaN(ts)) {
          const d = new Date(ts);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return false;
      }).length;
    }
    return history.filter(item => getStoreTypeNormalized(item) === key).length;
  }

  function countTicketsByDate(dateStr, history) {
    if (!dateStr) return 0;
    const [y, m, d] = dateStr.split('-').map(Number);
    return history.filter(item => {
      const ts = item.timestamp || parseInt(item.id);
      if (ts && !isNaN(ts)) {
        const itemD = new Date(ts);
        return itemD.getFullYear() === y && (itemD.getMonth() + 1) === m && itemD.getDate() === d;
      }
      if (item.date) {
        const parts = item.date.split(/[\/\s,]+/);
        if (parts.length >= 3) {
          return parseInt(parts[0], 10) === d && parseInt(parts[1], 10) === m && parseInt(parts[2], 10) === y;
        }
      }
      return false;
    }).length;
  }

  window.handleCalendarInputClick = function(e) {
    try {
      if (e && e.target && typeof e.target.showPicker === 'function') {
        e.target.showPicker();
      }
    } catch (err) {
      // Ignorar con seguridad si el navegador ya activa el selector nativo
    }
  };

  window.handleCalendarDateSelected = function(val) {
    if (val) {
      selectedCalendarDate = val;
      currentHistoryFilter = 'calendar';
      renderHistoryUI();
    }
  };

  window.openCalendarDatePicker = function() {
    const input = document.getElementById('history-calendar-input');
    if (!input) return;
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
        return;
      }
    } catch (e) {}
    try {
      input.focus();
      input.click();
    } catch (e) {}
  };

  window.clearCalendarFilter = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    selectedCalendarDate = null;
    const input = document.getElementById('history-calendar-input');
    if (input) input.value = '';
    currentHistoryFilter = 'all';
    renderHistoryUI();
  };

  function renderHistoryFilters(history) {
    const container = document.getElementById('history-filters-container');
    if (!container) return;

    if (history.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }
    container.style.display = 'flex';

    // 1. Filtros estándar con compras reales
    const activeFilters = FILTER_DEFINITIONS.filter(def => {
      if (def.key === 'all') return true;
      const count = getFilterCount(def.key, history);
      return count > 0;
    });

    if (currentHistoryFilter !== 'calendar') {
      const exists = activeFilters.some(f => f.key === currentHistoryFilter);
      if (!exists) {
        currentHistoryFilter = 'all';
      }
    }

    // 2. Construir píldora del calendario
    const isCalendarActive = currentHistoryFilter === 'calendar' && !!selectedCalendarDate;
    let calendarLabel = '';
    let countBadge = '';
    let clearBtnHtml = '';

    if (selectedCalendarDate) {
      const [y, m, d] = selectedCalendarDate.split('-');
      const cCount = countTicketsByDate(selectedCalendarDate, history);
      calendarLabel = `<span>📅 ${d}/${m}/${y}</span>`;
      countBadge = `<span class="filter-badge">${cCount}</span>`;
      clearBtnHtml = `<button type="button" class="calendar-clear-btn" onclick="clearCalendarFilter(event)" title="Limpiar fecha" aria-label="Limpiar fecha">✕</button>`;
    } else {
      calendarLabel = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>Calendario</span>
      `;
    }

    const calendarBtnHtml = `
      <div class="history-calendar-btn ${isCalendarActive ? 'active' : ''}" title="Filtrar por fecha específica">
        <div class="calendar-btn-label">
          ${calendarLabel}
          ${countBadge}
        </div>
        <input type="date" 
               id="history-calendar-input" 
               class="calendar-embedded-input" 
               value="${selectedCalendarDate || ''}" 
               onclick="handleCalendarInputClick(event)" 
               onchange="handleCalendarDateSelected(this.value)" 
               aria-label="Filtrar por fecha">
        ${clearBtnHtml}
      </div>
    `;

    // Renderizar: Todos, Este Mes, Calendario, y luego las categorías de tienda
    let html = '';
    activeFilters.forEach((def, index) => {
      const count = getFilterCount(def.key, history);
      const isActive = currentHistoryFilter === def.key;
      const badgeHtml = `<span class="filter-badge">${count}</span>`;

      html += `
        <button type="button" 
                class="history-filter-pill ${isActive ? 'active' : ''}" 
                onclick="setHistoryFilter('${def.key}')">
          <span>${def.label}</span>
          ${badgeHtml}
        </button>
      `;

      // Insertar el botón de calendario justo después de "Este Mes" (o después de "Todos" si no hay compras este mes)
      if (def.key === 'month' || (index === 0 && !activeFilters.some(f => f.key === 'month'))) {
        html += calendarBtnHtml;
      }
    });

    container.innerHTML = html;

    // Desplazamiento horizontal con la rueda del ratón
    if (!container._hasWheel) {
      container.addEventListener('wheel', (evt) => {
        if (evt.deltaY !== 0) {
          evt.preventDefault();
          container.scrollLeft += evt.deltaY;
        }
      }, { passive: false });
      container._hasWheel = true;
    }
  }

  window.setHistoryFilter = function(filterKey) {
    currentHistoryFilter = filterKey;
    if (filterKey !== 'calendar') {
      selectedCalendarDate = null;
      const input = document.getElementById('history-calendar-input');
      if (input) input.value = '';
    }
    renderHistoryUI();
  };

  function renderHistoryUI() {
    const history = StorageManager.getHistory();
    const emptyEl = document.getElementById('empty-history');
    const emptyText = document.getElementById('empty-history-text');
    if (!els.historyList) return;

    renderHistoryFilters(history);

    if (history.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (emptyText) emptyText.textContent = 'No tienes compras finalizadas guardadas';
      els.historyList.innerHTML = '';
      return;
    }

    // Filtrar según el filtro seleccionado
    const filteredHistory = history.filter(item => {
      if (currentHistoryFilter === 'all') return true;

      // Filtro por fecha exacta de calendario
      if (currentHistoryFilter === 'calendar' && selectedCalendarDate) {
        const [y, m, d] = selectedCalendarDate.split('-').map(Number);
        const ts = item.timestamp || parseInt(item.id);
        if (ts && !isNaN(ts)) {
          const itemD = new Date(ts);
          return itemD.getFullYear() === y && (itemD.getMonth() + 1) === m && itemD.getDate() === d;
        }
        if (item.date) {
          const parts = item.date.split(/[\/\s,]+/);
          if (parts.length >= 3) {
            return parseInt(parts[0], 10) === d && parseInt(parts[1], 10) === m && parseInt(parts[2], 10) === y;
          }
        }
        return false;
      }

      // Filtro por este mes
      if (currentHistoryFilter === 'month') {
        const now = new Date();
        const ts = item.timestamp || parseInt(item.id);
        if (ts && !isNaN(ts)) {
          const d = new Date(ts);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return false;
      }

      // Filtro por categoría
      return getStoreTypeNormalized(item) === currentHistoryFilter;
    });

    if (filteredHistory.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      let label = currentHistoryFilter;
      if (currentHistoryFilter === 'calendar' && selectedCalendarDate) {
        const [y, m, d] = selectedCalendarDate.split('-');
        label = `la fecha ${d}/${m}/${y}`;
      } else {
        const activeDef = FILTER_DEFINITIONS.find(f => f.key === currentHistoryFilter);
        label = activeDef ? `"${activeDef.label}"` : `"${currentHistoryFilter}"`;
      }
      if (emptyText) emptyText.textContent = `No hay compras archivadas en ${label}`;
      els.historyList.innerHTML = '';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    els.historyList.innerHTML = filteredHistory.map((item, idx) => {
      const storeName = item.storeName || 'Comercio';
      const storeType = getStoreTypeNormalized(item);
      const visuals = getCategoryVisuals(storeType, storeName);
      const count = item.totalItemsCount || (item.items ? item.items.length : 0);
      const friendlyDate = `${formatFriendlyHistoryDate(item)} • ${count} ${count === 1 ? 'producto' : 'productos'}`;

      // Nombres de los productos en formato resumido
      const itemsNames = (item.items && item.items.length > 0)
        ? item.items.map(i => i.name).join(', ')
        : 'Productos varios';

      const rateLabel = item.rateUsed || '889,26 Bs/$';

      return `
      <div class="history-item-card">
        <!-- 1. Encabezado con Icono dinámico según categoría, Nombre de Tienda, Fecha y Badge "Completada" -->
        <div class="history-card-top">
          <div class="history-card-store-info">
            <div class="history-card-store-icon" style="background:${visuals.bgColor}; color:${visuals.textColor}; border: 1.5px solid ${visuals.borderColor};">
              ${visuals.iconSvg}
            </div>
            <div class="history-card-store-meta">
              <span class="history-card-store-title">${storeName}</span>
              <span class="history-card-store-sub">${friendlyDate}</span>
            </div>
          </div>
          <span class="history-badge-completed">Completada</span>
        </div>

        <!-- 2. Franja de resumen de productos y tasa aplicada -->
        <div class="history-card-strip">
          <div class="history-card-items-preview">
            <svg width="14" height="14" fill="none" stroke="#64748b" viewBox="0 0 24 24" style="flex-shrink:0;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <span class="history-card-items-text" title="${itemsNames}">${itemsNames}</span>
          </div>
          <span class="history-card-rate-text">Tasa: ${rateLabel}</span>
        </div>

        <!-- 3. Banner Oscuro de Monto USD y Equivalente BCV -->
        <div class="history-card-totals-banner">
          <div class="history-card-col">
            <span class="history-card-lbl">Monto USD</span>
            <span class="history-card-usd">$ ${Calculator.formatNumber(item.totalUSD, 2)}</span>
          </div>
          <div class="history-card-col" style="text-align: right;">
            <span class="history-card-lbl">Equivalente BCV</span>
            <span class="history-card-bs">Bs. ${Calculator.formatNumber(item.totalBs, 2)}</span>
          </div>
        </div>

        <!-- 4. Acciones: Ver Ticket, Cargar y Menú de Opciones (⋮) -->
        <div class="history-card-actions">
          <button type="button" class="btn-history-action" onclick="viewHistoryTicket('${item.id}')">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <span>Ver Ticket</span>
          </button>

          <button type="button" class="btn-history-action" onclick="loadHistoryTicketToCart('${item.id}')">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <span>Cargar</span>
          </button>

          <div class="history-menu-container">
            <button type="button" class="btn-history-more" onclick="toggleHistoryMenu(event, '${item.id}')" title="Más opciones" aria-label="Más opciones">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 5v.01M12 12v.01M12 19v.01"/>
              </svg>
            </button>
            <div class="history-dropdown-menu" id="menu-${item.id}">
              <button type="button" class="history-menu-item text-danger" onclick="deleteTicket('${item.id}')">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('');
  }

  // Ver ticket histórico en el modal de recibo
  window.viewHistoryTicket = function(id) {
    const history = StorageManager.getHistory();
    const item = history.find(h => h.id === id);
    if (!item) return;

    showPurchaseReceiptModal(item, item.ticketNumber, true);
  };

  // Cargar productos de una compra guardada a la compra activa
  window.loadHistoryTicketToCart = async function(id) {
    const history = StorageManager.getHistory();
    const item = history.find(h => h.id === id);
    if (!item || !item.items || item.items.length === 0) {
      showToast('Este ticket no contiene productos para cargar', '⚠️');
      return;
    }

    const currentCart = StorageManager.getCartItems();
    if (currentCart.length > 0) {
      const confirmed = await showConfirmDialog({
        title: '¿Reemplazar lista de compra?',
        message: '¿Deseas reemplazar tu lista de compra actual con los productos de este ticket guardado?',
        confirmText: 'Reemplazar',
        cancelText: 'Cancelar',
        type: 'warning'
      });
      if (!confirmed) {
        return;
      }
    }

    const newItems = item.items.map((it, idx) => ({
      ...it,
      id: Date.now().toString() + '_' + idx
    }));

    StorageManager.saveCartItems(newItems);
    renderCartAndTotals();

    // Redirigir a pestaña de Inicio
    const tabInicio = document.querySelector('[data-tab=tab-inicio]');
    if (tabInicio) tabInicio.click();

    showToast(`¡${newItems.length} productos cargados a tu compra!`, '🛒');
  };

  // Desplegar menú de 3 puntos (⋮)
  window.toggleHistoryMenu = function(event, id) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${id}`);
    const wasOpen = menu?.classList.contains('show');

    document.querySelectorAll('.history-dropdown-menu').forEach(m => m.classList.remove('show'));

    if (!wasOpen && menu) {
      menu.classList.add('show');
    }
  };

  // Cerrar menús al hacer click fuera
  document.addEventListener('click', () => {
    document.querySelectorAll('.history-dropdown-menu').forEach(m => m.classList.remove('show'));
  });

  window.deleteTicket = async function(id) {
    const confirmed = await showConfirmDialog({
      title: '¿Eliminar ticket?',
      message: '¿Estás seguro de que deseas eliminar este ticket del historial? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (confirmed) {
      StorageManager.deleteHistoryItem(id);
      renderHistoryUI();
      renderStatsUI();
      showToast('Ticket eliminado del historial', '🗑️');
    }
  };

  if (els.btnClearHistory) {
    els.btnClearHistory.addEventListener('click', async () => {
      const history = StorageManager.getHistory();
      if (!history || history.length === 0) {
        showToast('El historial ya está vacío', 'ℹ️');
        return;
      }
      const confirmed = await showConfirmDialog({
        title: '¿Vaciar historial?',
        message: '¿Deseas eliminar todo el historial de compras? Se borrarán todos los tickets y estadísticas acumuladas.',
        confirmText: 'Sí, vaciar todo',
        cancelText: 'Cancelar',
        type: 'danger'
      });
      if (confirmed) {
        StorageManager.clearHistory();
        renderHistoryUI();
        renderStatsUI();
        showToast('Historial de compras vaciado', '🗑️');
      }
    });
  }

  function renderStatsUI() {
    const history = StorageManager.getHistory();
    let totalUSD = 0;
    let totalBs = 0;
    let totalEUR = 0;

    const categoryBreakdown = {};
    const storeBreakdown = {};

    history.forEach(h => {
      const u = h.totalUSD || 0;
      const b = h.totalBs || 0;
      const e = h.totalEUR || (b / (rates.eur_oficial || 980));

      totalUSD += u;
      totalBs += b;
      totalEUR += e;

      // Desglose por Rubro / Categoría
      const catKey = getStoreTypeNormalized(h);
      if (!categoryBreakdown[catKey]) {
        categoryBreakdown[catKey] = { name: catKey, key: catKey, count: 0, usd: 0, bs: 0 };
      }
      categoryBreakdown[catKey].count += 1;
      categoryBreakdown[catKey].usd += u;
      categoryBreakdown[catKey].bs += b;

      // Desglose por Comercio
      const storeKey = (h.storeName && h.storeName.trim()) ? h.storeName.trim() : 'Comercio General';
      if (!storeBreakdown[storeKey]) {
        storeBreakdown[storeKey] = { name: storeKey, key: storeKey, count: 0, usd: 0, bs: 0 };
      }
      storeBreakdown[storeKey].count += 1;
      storeBreakdown[storeKey].usd += u;
      storeBreakdown[storeKey].bs += b;
    });

    const purchasesCount = history.length;
    const avgUSD = purchasesCount > 0 ? (totalUSD / purchasesCount) : 0;

    // 1. Banner Principal de Estadísticas (Gasto Total Acumulado)
    if (els.statTotalSpentBs) els.statTotalSpentBs.textContent = `Bs. ${Calculator.formatNumber(totalBs, 2)}`;
    if (els.statTotalSpentUSD) els.statTotalSpentUSD.textContent = `$ ${Calculator.formatNumber(totalUSD, 2)}`;
    const statTotalSpentEUR = document.getElementById('stat-total-spent-eur');
    if (statTotalSpentEUR) statTotalSpentEUR.textContent = `€ ${Calculator.formatNumber(totalEUR, 2)}`;

    // 2. Tarjetas resumen complementarias
    if (els.statTotalPurchases) els.statTotalPurchases.textContent = `${purchasesCount} ticket${purchasesCount === 1 ? '' : 's'}`;
    if (els.statAverageTicket) els.statAverageTicket.textContent = `$ ${Calculator.formatNumber(avgUSD, 2)}`;

    // 3. Control Segmentado (Por Comercio / Por Categoría)
    const btnByStore = document.getElementById('btn-stats-by-store');
    const btnByCategory = document.getElementById('btn-stats-by-category');
    if (btnByStore && btnByCategory) {
      if (statsViewMode === 'store') {
        btnByStore.classList.add('active');
        btnByCategory.classList.remove('active');
      } else {
        btnByCategory.classList.add('active');
        btnByStore.classList.remove('active');
      }
    }

    // 4. Elementos de la tarjeta de Distribución
    const titleEl = document.getElementById('stats-dist-title');
    const countBadgeEl = document.getElementById('stats-dist-count');
    const donutChartEl = document.getElementById('stats-donut-chart');
    const donutTopPctEl = document.getElementById('donut-top-pct');
    const donutTopLabelEl = document.getElementById('donut-top-label');
    const segmentedBarEl = document.getElementById('stats-segmented-bar');
    const auditHintEl = document.getElementById('stats-audit-hint');
    const cardsListEl = document.getElementById('stats-cards-list');

    const isStoreView = statsViewMode === 'store';
    const sourceDict = isStoreView ? storeBreakdown : categoryBreakdown;
    const activeKeys = Object.keys(sourceDict).filter(k => sourceDict[k].usd > 0);

    // Ordenar de mayor a menor gasto en USD
    const sortedItems = activeKeys.map((k, index) => {
      const it = sourceDict[k];
      const visuals = isStoreView ? getStoreVisuals(it.name, index) : getCategoryVisuals(it.name);
      return {
        ...it,
        ...visuals
      };
    }).sort((a, b) => b.usd - a.usd);

    const donutWrapper = document.querySelector('.stats-donut-wrapper');

    if (isStoreView) {
      // -------------------------------------------------------------
      // VISTA: POR COMERCIO (Top Establecimientos)
      // -------------------------------------------------------------
      if (titleEl) titleEl.textContent = 'Top Establecimientos';
      if (countBadgeEl) countBadgeEl.textContent = `${purchasesCount} Compra${purchasesCount === 1 ? '' : 's'} totales`;

      // Ocultar gráfico de dona, barra multicolor y leyenda en vista por comercio
      if (donutWrapper) donutWrapper.style.display = 'none';
      if (segmentedBarEl) segmentedBarEl.style.display = 'none';
      if (auditHintEl) auditHintEl.style.display = 'none';

      if (totalUSD === 0 || sortedItems.length === 0) {
        if (cardsListEl) {
          cardsListEl.innerHTML = `
            <div style="text-align:center; padding:24px 12px; color:#64748b; font-size:0.82rem;">
              Aún no hay compras registradas en el historial para mostrar establecimientos.
            </div>
          `;
        }
        return;
      }

      // Renderizar tarjetas de comercio fieles al mockup
      if (cardsListEl) {
        cardsListEl.innerHTML = sortedItems.map((it, idx) => {
          const pct = totalUSD > 0 ? Math.round((it.usd / totalUSD) * 100) : 0;
          const avgTicket = it.count > 0 ? (it.usd / it.count) : 0;
          const meta = getStoreCardMeta(it.name, idx, idx === 0);

          return `
            <div class="store-item-card" onclick="openAuditModal('store', '${it.key}')" title="Toca para auditar compras en ${it.name}">
              <div class="store-card-header">
                <div class="store-card-left">
                  <div class="store-card-icon-box" style="background:${meta.bg}; color:${meta.iconColor};">
                    ${meta.iconSvg}
                  </div>
                  <div>
                    <div class="store-card-name">${it.name}</div>
                    <div class="store-card-sub">${it.count} compra${it.count === 1 ? '' : 's'} • Ticket prom: $${Calculator.formatNumber(avgTicket, 2)}</div>
                  </div>
                </div>
                <div class="store-card-right">
                  <div class="store-card-usd">$${Calculator.formatNumber(it.usd, 2)}</div>
                  <div class="store-card-bs">Bs. ${Calculator.formatNumber(it.bs, 2)}</div>
                </div>
              </div>
              <div class="store-card-progress-track">
                <div class="store-card-progress-bar" style="width:${pct}%; background:${meta.barColor};"></div>
              </div>
              <div class="store-card-footer">
                <span class="store-card-tag">${meta.tag}</span>
                <span class="store-card-pct" style="color:${meta.pctColor};">${pct}% del total</span>
              </div>
            </div>
          `;
        }).join('');
      }

    } else {
      // -------------------------------------------------------------
      // VISTA: POR CATEGORÍA (Distribución por Rubro con Dona)
      // -------------------------------------------------------------
      if (titleEl) titleEl.textContent = 'Distribución por Rubro';
      if (countBadgeEl) countBadgeEl.textContent = `${sortedItems.length} Categoría${sortedItems.length === 1 ? '' : 's'}`;

      // Mostrar gráfico de dona, barra multicolor y leyenda
      if (donutWrapper) donutWrapper.style.display = 'flex';
      if (segmentedBarEl) segmentedBarEl.style.display = 'flex';
      if (auditHintEl) {
        auditHintEl.style.display = 'block';
        auditHintEl.textContent = 'Toca cualquier categoría para auditar compras';
      }

      if (totalUSD === 0 || sortedItems.length === 0) {
        if (donutChartEl) donutChartEl.style.background = 'conic-gradient(#e2e8f0 0% 100%)';
        if (donutTopPctEl) donutTopPctEl.textContent = '0%';
        if (donutTopLabelEl) {
          donutTopLabelEl.textContent = 'Sin datos';
          donutTopLabelEl.style.color = '#64748b';
        }
        if (segmentedBarEl) {
          segmentedBarEl.innerHTML = '<div style="width:100%; height:100%; background:#e2e8f0; border-radius:9999px;"></div>';
        }
        if (cardsListEl) {
          cardsListEl.innerHTML = `
            <div style="text-align:center; padding:24px 12px; color:#64748b; font-size:0.82rem;">
              Aún no hay compras registradas en el historial para mostrar estadísticas.
            </div>
          `;
        }
        return;
      }

      // 5. Configurar Gráfico de Dona y Mayor Peso
      const topItem = sortedItems[0];
      const topPct = Math.round((topItem.usd / totalUSD) * 100);

      if (donutTopPctEl) donutTopPctEl.textContent = `${topPct}%`;
      if (donutTopLabelEl) {
        donutTopLabelEl.textContent = topItem.shortLabel || topItem.name;
        donutTopLabelEl.style.color = topItem.sliceColor;
      }

      // Generar gradiente angular proporcional (conic-gradient)
      let currentPct = 0;
      const gradientStops = [];
      sortedItems.forEach((it, idx) => {
        const slicePct = (it.usd / totalUSD) * 100;
        const nextPct = (idx === sortedItems.length - 1) ? 100 : currentPct + slicePct;
        gradientStops.push(`${it.sliceColor} ${currentPct.toFixed(1)}% ${nextPct.toFixed(1)}%`);
        currentPct = nextPct;
      });

      if (donutChartEl) {
        donutChartEl.style.background = `conic-gradient(${gradientStops.join(', ')})`;
      }

      // 6. Barra Horizontal Segmentada
      if (segmentedBarEl) {
        segmentedBarEl.innerHTML = sortedItems.map(it => {
          const pct = ((it.usd / totalUSD) * 100).toFixed(1);
          return `<div style="width:${pct}%; height:100%; background:${it.sliceColor};" title="${it.name}: ${pct}%"></div>`;
        }).join('');
      }

      // 7. Lista de Tarjetas de Rubro
      if (cardsListEl) {
        cardsListEl.innerHTML = sortedItems.map(it => {
          const pct = Math.round((it.usd / totalUSD) * 100);
          return `
            <div class="stats-item-card" onclick="openAuditModal('category', '${it.key}')" title="Toca para auditar compras de ${it.name}">
              <div style="display:flex; align-items:center; gap:12px;">
                <div class="stats-card-icon-box" style="background:${it.bgColor}; color:${it.textColor};">
                  ${it.iconSvg}
                </div>
                <div>
                  <div class="stats-card-name">${it.name}</div>
                  <div class="stats-card-sub">${pct}% del presupuesto</div>
                </div>
              </div>
              <div style="text-align:right;">
                <div class="stats-card-usd">$${Calculator.formatNumber(it.usd, 2)}</div>
                <div class="stats-card-bs">Bs. ${Calculator.formatNumber(it.bs, 2)}</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // ==========================================================================
  // MODAL DE AUDITORÍA DE COMPRAS (AL TOCAR CATEGORÍA O COMERCIO)
  // ==========================================================================
  window.openAuditModal = function(mode, key) {
    const history = StorageManager.getHistory();
    const modal = document.getElementById('modal-audit-category');
    if (!modal) return;

    const isStoreMode = mode === 'store';
    let matchingTickets = [];

    if (isStoreMode) {
      matchingTickets = history.filter(h => (h.storeName && h.storeName.trim() === key) || (!h.storeName && key === 'Comercio General'));
    } else {
      matchingTickets = history.filter(h => getStoreTypeNormalized(h) === key);
    }

    let totalUSD = 0;
    let totalBs = 0;
    matchingTickets.forEach(t => {
      totalUSD += t.totalUSD || 0;
      totalBs += t.totalBs || 0;
    });

    const visuals = isStoreMode ? getStoreVisuals(key, 0) : getCategoryVisuals(key);

    const titleEl = document.getElementById('modal-audit-title');
    const subEl = document.getElementById('modal-audit-subtitle');
    const iconBox = document.getElementById('modal-audit-icon-box');
    const summaryPill = document.getElementById('modal-audit-summary-pill');
    const listEl = document.getElementById('modal-audit-tickets-list');
    const btnHistory = document.getElementById('btn-filter-history-from-audit');

    if (titleEl) titleEl.textContent = isStoreMode ? `Comercio: ${key}` : `Rubro: ${key}`;
    if (subEl) subEl.textContent = `${matchingTickets.length} compra${matchingTickets.length === 1 ? '' : 's'} registrada${matchingTickets.length === 1 ? '' : 's'}`;
    if (iconBox) {
      iconBox.style.background = visuals.bgColor;
      iconBox.style.color = visuals.textColor;
      iconBox.innerHTML = visuals.iconSvg;
    }

    if (summaryPill) {
      summaryPill.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:0.70rem; color:#64748b; font-weight:700; text-transform:uppercase;">Gasto Total Auditado</span>
            <div style="font-size:1.15rem; font-weight:900; color:#0f172a;">$${Calculator.formatNumber(totalUSD, 2)}</div>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.70rem; color:#64748b; font-weight:700; text-transform:uppercase;">En Bolívares</span>
            <div style="font-size:1.05rem; font-weight:800; color:#059669;">Bs. ${Calculator.formatNumber(totalBs, 2)}</div>
          </div>
        </div>
      `;
    }

    if (listEl) {
      if (matchingTickets.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:16px; color:#64748b; font-size:0.80rem;">No hay tickets disponibles para este grupo.</div>';
      } else {
        listEl.innerHTML = matchingTickets.map(t => {
          const itemsSummary = (t.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');
          return `
            <div class="audit-ticket-row" onclick="viewTicketReceiptById('${t.id}')" title="Toca para ver el ticket original">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <span style="font-weight:800; font-size:0.88rem; color:#0f172a;">Ticket #${t.ticketNumber || ''} • ${t.storeName || 'Comercio'}</span>
                  <div style="font-size:0.72rem; color:#64748b; margin-top:2px;">📅 ${t.date || ''}</div>
                </div>
                <div style="text-align:right;">
                  <span style="font-weight:800; font-size:0.95rem; color:#0f172a;">$${Calculator.formatNumber(t.totalUSD, 2)}</span>
                  <div style="font-size:0.72rem; font-weight:700; color:#059669;">Bs. ${Calculator.formatNumber(t.totalBs, 2)}</div>
                </div>
              </div>
              <div style="font-size:0.74rem; color:#475569; margin-top:6px; background:#f8fafc; padding:6px 8px; border-radius:6px; border:1px solid #f1f5f9;">
                📦 <strong>Items:</strong> ${itemsSummary || 'Sin detalle de items'}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (btnHistory) {
      btnHistory.onclick = function() {
        modal.classList.remove('active');
        if (!isStoreMode) {
          setHistoryFilter(key);
        } else {
          setHistoryFilter('all');
        }
        const tabHist = document.querySelector('[data-tab=tab-historial]');
        if (tabHist) tabHist.click();
      };
    }

    modal.classList.add('active');
  };

  window.viewTicketReceiptById = function(ticketId) {
    const history = StorageManager.getHistory();
    const ticket = history.find(t => t.id === ticketId);
    if (ticket) {
      document.getElementById('modal-audit-category')?.classList.remove('active');
      showPurchaseReceiptModal(ticket, ticket.ticketNumber, true);
    }
  };

  const btnCloseAuditModal = document.getElementById('btn-close-audit-modal');
  if (btnCloseAuditModal) {
    btnCloseAuditModal.addEventListener('click', () => {
      document.getElementById('modal-audit-category')?.classList.remove('active');
    });
  }

  const btnCloseAuditFooter = document.getElementById('btn-close-audit-modal-footer');
  if (btnCloseAuditFooter) {
    btnCloseAuditFooter.addEventListener('click', () => {
      document.getElementById('modal-audit-category')?.classList.remove('active');
    });
  }

  // ==========================================================================
  // MODAL PARA EDITAR TASAS MANUALMENTE
  // ==========================================================================
  let editingRateKey = null;

  function openRateModal(rateKey) {
    if (rateKey && rateKey.includes('eur')) {
      openCustomRateModal('EUR');
    } else {
      openCustomRateModal('USD');
    }
  }

  window.openEditRate = openRateModal;

  if (els.btnCancelModalRate && els.modalRate) {
    els.btnCancelModalRate.addEventListener('click', () => {
      els.modalRate.classList.remove('active');
    });
  }

  if (els.btnSaveModalRate && els.modalRate) {
    els.btnSaveModalRate.addEventListener('click', () => {
      const val = parseFloat(els.modalRateInput.value.replace(',', '.'));
      if (val > 0 && editingRateKey) {
        DolarAPI.setManualRate(editingRateKey, val);
        rates = DolarAPI.getStoredRates();
        rates.spreadPercent = preferences.spreadPercent !== undefined ? preferences.spreadPercent : 0.0;
        renderRatesUI();
        renderCartAndTotals();
        renderConfigUI();
        els.modalRate.classList.remove('active');
        showToast('Tasa actualizada correctamente', '✓');
      } else {
        showToast('Ingresa un valor numérico válido mayor a 0', '⚠️');
      }
    });
  }

  // ==========================================================================
  // MODAL PARA EDITAR PRODUCTO / CANTIDAD
  // ==========================================================================
  let editingProductId = null;

  function openEditProductModal(id) {
    const items = StorageManager.getCartItems();
    const item = items.find(it => it.id === id);
    if (!item) return;

    editingProductId = id;
    if (els.editProductName) els.editProductName.value = item.name;
    if (els.editProductQty) els.editProductQty.value = item.quantity;
    if (els.editProductPrice) els.editProductPrice.value = item.price;
    if (els.editProductCurrency) {
      els.editProductCurrency.value = item.currency || 'USD';
      els.editProductCurrency.dispatchEvent(new Event('change'));
    }

    if (els.modalEditProduct) els.modalEditProduct.classList.add('active');
  }

  // Stepper dentro del modal de edición
  if (els.editQtyMinus && els.editProductQty) {
    els.editQtyMinus.addEventListener('click', () => {
      let val = parseInt(els.editProductQty.value, 10) || 1;
      if (val > 1) {
        els.editProductQty.value = val - 1;
      }
    });
  }

  if (els.editQtyPlus && els.editProductQty) {
    els.editQtyPlus.addEventListener('click', () => {
      let val = parseInt(els.editProductQty.value, 10) || 1;
      els.editProductQty.value = val + 1;
    });
  }

  // Cancelar edición de producto
  if (els.btnCancelEditProduct && els.modalEditProduct) {
    els.btnCancelEditProduct.addEventListener('click', () => {
      els.modalEditProduct.classList.remove('active');
      editingProductId = null;
    });
  }

  // Guardar cambios de producto
  if (els.btnSaveEditProduct && els.modalEditProduct) {
    els.btnSaveEditProduct.addEventListener('click', () => {
      if (!editingProductId) return;

      const name = els.editProductName.value.trim();
      const qty = parseFloat(els.editProductQty.value) || 1;
      const priceStr = els.editProductPrice.value.replace(',', '.');
      const price = parseFloat(priceStr);
      const currency = els.editProductCurrency.value;

      if (!name) {
        showToast('Ingresa el nombre del producto', '⚠️');
        return;
      }

      if (isNaN(price) || price < 0) {
        showToast('Ingresa un precio válido', '⚠️');
        return;
      }

      StorageManager.updateItem(editingProductId, {
        name,
        quantity: qty,
        price,
        currency
      });

      renderCartAndTotals();
      els.modalEditProduct.classList.remove('active');
      editingProductId = null;
      showToast('Producto actualizado', '✓');
    });
  }

  // ==========================================================================
  // GESTIÓN DE TASAS Y CONFIGURACIONES
  // ==========================================================================

  // Inicializar spread en preferences si no existe o restablecer el 2.0 previo al cálculo exacto
  if (preferences.spreadPercent === undefined || preferences.spreadPercent === 2.0) {
    preferences.spreadPercent = 0.0;
    StorageManager.savePreferences(preferences);
  }
  rates.spreadPercent = preferences.spreadPercent;

  /**
   * Cambia la fuente principal de tasas (BCV Oficial, EnParaleloVzla, Tasa Propia)
   */
  // ==========================================================================
  // MODAL EDITAR TASA MANUAL (TASA PROPIA / LOCAL)
  // ==========================================================================
  let customRateActiveCurrency = 'USD';

  /**
   * Abre el modal de Editar Tasa Manual
   */
  window.openCustomRateModal = function(curr = 'USD') {
    customRateActiveCurrency = curr;
    const modal = document.getElementById('modal-custom-rate');
    if (!modal) return;

    setCustomRateCurrency(curr, false);
    modal.classList.add('active');
  };

  /**
   * Cierra el modal de Editar Tasa Manual
   */
  window.closeCustomRateModal = function() {
    const modal = document.getElementById('modal-custom-rate');
    if (modal) modal.classList.remove('active');
  };

  /**
   * Cambia la moneda en el modal (USD / EUR)
   */
  window.setCustomRateCurrency = function(curr, autoFocus = false) {
    customRateActiveCurrency = curr;
    const tabUsd = document.getElementById('tab-curr-usd');
    const tabEur = document.getElementById('tab-curr-eur');
    if (tabUsd) tabUsd.classList.toggle('active', curr === 'USD');
    if (tabEur) tabEur.classList.toggle('active', curr === 'EUR');

    const bcvVal = curr === 'USD' ? (rates.usd_oficial || 889.26) : (rates.eur_oficial || 903.12);
    const bcvRefElem = document.getElementById('custom-bcv-ref-val');
    if (bcvRefElem) bcvRefElem.textContent = `Bs. ${Calculator.formatNumber(bcvVal, 2)}`;

    let customVal = 0;
    if (curr === 'USD') {
      customVal = rates.usd_custom || 915.50;
    } else {
      customVal = rates.eur_custom || (Math.round((rates.eur_oficial || 903.12) * 1.0295 * 100) / 100);
    }

    const inputElem = document.getElementById('custom-rate-input');
    if (inputElem) {
      inputElem.value = Calculator.formatNumber(customVal, 2);
      if (autoFocus) inputElem.focus();
    }

    updateCustomRateModalDiff();
  };

  /**
   * Incrementa o decrementa la tasa personalizada con el stepper
   */
  window.stepCustomRate = function(delta) {
    const inputElem = document.getElementById('custom-rate-input');
    if (!inputElem) return;
    let currentVal = parseFloat(inputElem.value.replace(/\./g, '').replace(',', '.')) || 0;
    currentVal = Math.max(1, Math.round((currentVal + delta) * 100) / 100);
    inputElem.value = Calculator.formatNumber(currentVal, 2);
    updateCustomRateModalDiff();
  };

  /**
   * Aplica un porcentaje de margen predefinido (+1%, +2%, +2.95%, +5%) sobre el BCV
   */
  window.applyBcvMargin = function(marginPct) {
    const bcvVal = customRateActiveCurrency === 'USD' ? (rates.usd_oficial || 889.26) : (rates.eur_oficial || 903.12);
    const newRate = Math.round(bcvVal * (1 + marginPct / 100) * 100) / 100;
    const inputElem = document.getElementById('custom-rate-input');
    if (inputElem) {
      inputElem.value = Calculator.formatNumber(newRate, 2);
    }
    updateCustomRateModalDiff();
  };

  /**
   * Recalcula la diferencia en Bs. y porcentaje con respecto a la tasa oficial BCV
   */
  window.updateCustomRateModalDiff = function() {
    const inputElem = document.getElementById('custom-rate-input');
    if (!inputElem) return;
    const rawVal = parseFloat(inputElem.value.replace(/\./g, '').replace(',', '.')) || 0;
    const bcvVal = customRateActiveCurrency === 'USD' ? (rates.usd_oficial || 889.26) : (rates.eur_oficial || 903.12);

    const diff = rawVal - bcvVal;
    const pct = bcvVal > 0 ? (diff / bcvVal) * 100 : 0;

    const fixedTag = document.getElementById('custom-margin-fixed-display');
    const pctSign = pct >= 0 ? '+' : '';
    const formattedPct = `${pctSign}${Calculator.formatNumber(pct, 2)}%`;

    if (fixedTag) {
      fixedTag.textContent = `${formattedPct} fijado`;
      fixedTag.style.color = pct >= 0 ? '#16a34a' : '#dc2626';
    }

    // Pills de margen
    const pill1 = document.getElementById('margin-pill-1');
    const pill2 = document.getElementById('margin-pill-2');
    const pillCur = document.getElementById('margin-pill-current');
    const pill5 = document.getElementById('margin-pill-5');

    const roundedPct = Math.round(pct * 100) / 100;
    [pill1, pill2, pillCur, pill5].forEach(p => p && p.classList.remove('active'));

    if (Math.abs(roundedPct - 1.0) < 0.05 && pill1) {
      pill1.classList.add('active');
    } else if (Math.abs(roundedPct - 2.0) < 0.05 && pill2) {
      pill2.classList.add('active');
    } else if (Math.abs(roundedPct - 5.0) < 0.05 && pill5) {
      pill5.classList.add('active');
    } else if (pillCur) {
      pillCur.classList.add('active');
      pillCur.textContent = formattedPct;
    }

    // Badge de diferencia calculada
    const diffBadge = document.getElementById('custom-diff-badge');
    if (diffBadge) {
      const diffSign = diff >= 0 ? '+Bs. ' : '-Bs. ';
      diffBadge.textContent = `${diffSign}${Calculator.formatNumber(Math.abs(diff), 2)} (${formattedPct})`;
      if (diff >= 0) {
        diffBadge.style.background = '#86efac';
        diffBadge.style.color = '#064e3b';
      } else {
        diffBadge.style.background = '#fecaca';
        diffBadge.style.color = '#991b1b';
      }
    }
  };

  /**
   * Guarda y aplica la tasa configurada en el modal
   */
  window.saveAndApplyCustomRate = function() {
    const inputElem = document.getElementById('custom-rate-input');
    if (!inputElem) return;
    const customVal = parseFloat(inputElem.value.replace(/\./g, '').replace(',', '.'));
    if (isNaN(customVal) || customVal <= 0) {
      showToast('Ingresa un valor numérico válido mayor a 0', '⚠️');
      return;
    }

    const toggleAsActive = document.getElementById('toggle-custom-as-active');
    const setAsActive = toggleAsActive ? toggleAsActive.checked : true;

    if (customRateActiveCurrency === 'USD') {
      rates.usd_custom = customVal;
      DolarAPI.setManualRate('usd_custom', customVal);
    } else {
      rates.eur_custom = customVal;
      DolarAPI.setManualRate('eur_custom', customVal);
    }

    if (setAsActive) {
      rates = DolarAPI.setSelectedRate('usd_custom');
    }

    rates.spreadPercent = preferences.spreadPercent !== undefined ? preferences.spreadPercent : 0.0;
    renderRatesUI();
    renderCartAndTotals();
    renderConfigUI();
    closeCustomRateModal();
    showToast(`Tasa propia aplicada: Bs. ${Calculator.formatNumber(customVal, 2)}`, '✓');
  };

  // Evento al tipear directamente en el input de tasa personalizada
  const customRateInputField = document.getElementById('custom-rate-input');
  if (customRateInputField) {
    customRateInputField.addEventListener('input', () => {
      updateCustomRateModalDiff();
    });
  }

  /**
   * Cambia la fuente principal de tasas (BCV Oficial, EnParaleloVzla, Tasa Propia)
   */
  window.selectRateSource = function(sourceType) {
    if (sourceType === 'bcv') {
      rates = DolarAPI.setSelectedRate('usd_oficial');
      showToast('Fuente activa: BCV Oficial', '🛡️');
      renderRatesUI();
      renderCartAndTotals();
      renderConfigUI();
    } else if (sourceType === 'paralelo') {
      rates = DolarAPI.setSelectedRate('usd_paralelo');
      showToast('Fuente activa: EnParaleloVzla', '📈');
      renderRatesUI();
      renderCartAndTotals();
      renderConfigUI();
    } else if (sourceType === 'custom') {
      openCustomRateModal('USD');
    }
  };

  /**
   * Cambia la frecuencia de sincronización automática
   */
  window.setSyncFrequency = function(freq) {
    preferences.syncFrequency = freq;
    StorageManager.savePreferences(preferences);
    renderConfigUI();
    const freqLabels = {
      '1h': 'Cada hora',
      '2d': '2 veces al día',
      'open': 'Al abrir la app'
    };
    showToast(`Frecuencia: ${freqLabels[freq] || freq}`, '⏱️');
  };

  /**
   * Alterna el interruptor de sincronización automática
   */
  window.toggleAutoSyncSetting = function(enabled) {
    preferences.autoRefresh = enabled;
    StorageManager.savePreferences(preferences);
    renderConfigUI();
    showToast(`Sincronización automática ${enabled ? 'activada' : 'desactivada'}`, enabled ? '✓' : '⏸️');
  };

  /**
   * Ajusta el margen de amortiguación (spread) en pasos de +/- 0.5%
   */
  window.changeSpreadDelta = function(delta) {
    let cur = typeof preferences.spreadPercent === 'number' ? preferences.spreadPercent : 0.0;
    cur = Math.round((cur + delta) * 10) / 10;
    if (cur < 0) cur = 0;
    if (cur > 15) cur = 15;
    preferences.spreadPercent = cur;
    rates.spreadPercent = cur;
    StorageManager.savePreferences(preferences);
    renderConfigUI();
    renderCartAndTotals();
    showToast(`Spread ajustado a +${Calculator.formatNumber(cur, 1)}%`, '⚙️');
  };

  /**
   * Sincroniza tasas desde el botón dentro de la pestaña de configuración
   */
  window.syncRatesFromConfig = async function() {
    const btnSync = document.getElementById('btn-sync-rates-config');
    if (btnSync) btnSync.classList.add('spinning');
    await refreshRatesFromAPI();
    renderConfigUI();
    if (btnSync) btnSync.classList.remove('spinning');
  };

  /**
   * Abre el modal para editar la tasa activa de USD o EUR
   */
  window.handleEditActiveRate = function(currency) {
    openCustomRateModal(currency ? currency.toUpperCase() : 'USD');
  };

  /**
   * Renderiza el estado visual completo de la pestaña de Gestión de Tasas
   */
  function renderConfigUI() {
    const isParalelo = rates.selectedRate === 'usd_paralelo' || rates.selectedRate === 'eur_paralelo';
    const isCustom = rates.selectedRate === 'usd_custom' || rates.selectedRate === 'custom';
    const isBcv = !isParalelo && !isCustom;

    // 1. Selector de Fuente
    const itemBcv = document.getElementById('source-item-bcv');
    const itemParalelo = document.getElementById('source-item-paralelo');
    const itemCustom = document.getElementById('source-item-custom');
    const radioBcv = document.getElementById('radio-bcv');
    const radioParalelo = document.getElementById('radio-paralelo');
    const radioCustom = document.getElementById('radio-custom');

    if (itemBcv) itemBcv.classList.toggle('active', isBcv);
    if (itemParalelo) itemParalelo.classList.toggle('active', isParalelo);
    if (itemCustom) itemCustom.classList.toggle('active', isCustom);

    if (radioBcv) radioBcv.classList.toggle('inactive', !isBcv);
    if (radioParalelo) radioParalelo.classList.toggle('inactive', !isParalelo);
    if (radioCustom) radioCustom.classList.toggle('inactive', !isCustom);

    // 2. Subtarjeta Auto-sync y Frecuencia
    const toggleSync = document.getElementById('toggle-auto-sync');
    if (toggleSync) toggleSync.checked = preferences.autoRefresh !== false;

    const currentFreq = preferences.syncFrequency || '2d';
    ['1h', '2d', 'open'].forEach(f => {
      const pill = document.getElementById(`freq-pill-${f}`);
      if (pill) pill.classList.toggle('active', f === currentFreq);
    });

    // 3. Valores activos para cálculo
    const usdValElem = document.getElementById('config-active-usd');
    const eurValElem = document.getElementById('config-active-eur');
    const usdTagElem = document.getElementById('config-usd-source-tag');
    const eurTagElem = document.getElementById('config-eur-source-tag');

    let curUsd = rates.usd_oficial;
    let curEur = rates.eur_oficial;
    let usdTag = 'Oficial BCV';
    let eurTag = 'Cálculo cruzado';

    if (isParalelo) {
      curUsd = rates.usd_paralelo;
      curEur = rates.eur_paralelo;
      usdTag = 'EnParaleloVzla';
      eurTag = 'Mercado libre';
    } else if (isCustom) {
      curUsd = rates.usd_custom || rates.usd_oficial;
      curEur = rates.eur_custom || rates.eur_oficial;
      usdTag = 'Tasa Local';
      eurTag = 'Tasa Local';
    }

    if (usdValElem) usdValElem.textContent = Calculator.formatNumber(curUsd, 2);
    if (eurValElem) eurValElem.textContent = Calculator.formatNumber(curEur, 2);
    if (usdTagElem) usdTagElem.textContent = usdTag;
    if (eurTagElem) eurTagElem.textContent = eurTag;

    // 4. Spread Stepper
    const spreadValElem = document.getElementById('spread-value-display');
    const currentSpread = preferences.spreadPercent !== undefined ? preferences.spreadPercent : 0.0;
    if (spreadValElem) {
      spreadValElem.textContent = `+ ${Calculator.formatNumber(currentSpread, 1)} %`;
    }

    // 5. Pie de estado y fuente
    const footerTime = document.getElementById('config-footer-time');
    const footerSource = document.getElementById('config-footer-source');

    if (footerTime) {
      const activeDate = DolarAPI.getActiveRateDate(rates);
      if (activeDate && activeDate.includes('-')) {
        const parts = activeDate.split('-');
        footerTime.textContent = `Hoy, ${parts[1].trim()}`;
      } else if (activeDate) {
        footerTime.textContent = `Hoy, 09:40 AM`;
      }
    }

    if (footerSource) {
      if (isParalelo) {
        footerSource.textContent = 'Fuente: EnParaleloVzla (Mercado)';
      } else if (isCustom) {
        footerSource.textContent = 'Fuente: Tasa Fijada por Usuario';
      } else {
        footerSource.textContent = 'Fuente: Banco Central de Venezuela';
      }
    }

    // 6. Sincronizar moneda predeterminada
    const selDef = document.getElementById('setting-default-currency');
    if (selDef && preferences.defaultCurrency && selDef.value !== preferences.defaultCurrency) {
      selDef.value = preferences.defaultCurrency;
      selDef.dispatchEvent(new Event('change'));
    }
  }

  window.renderConfigUI = renderConfigUI;

  // ==========================================================================
  // CONFIGURACIONES GENERALES
  // ==========================================================================
  const selDefCurrency = document.getElementById('setting-default-currency');
  if (selDefCurrency) {
    selDefCurrency.value = preferences.defaultCurrency || 'USD';
    selDefCurrency.addEventListener('change', () => {
      preferences.defaultCurrency = selDefCurrency.value;
      StorageManager.savePreferences(preferences);
      if (els.productCurrencySelect) {
        els.productCurrencySelect.value = preferences.defaultCurrency;
        els.productCurrencySelect.dispatchEvent(new Event('change'));
      }
    });
  }

  // Guardar Cambios en Preferencias Generales (Botón Verde - Imagen 2)
  window.saveGeneralSettings = function() {
    if (selDefCurrency) {
      preferences.defaultCurrency = selDefCurrency.value;
    }
    const toggleSync = document.getElementById('toggle-auto-sync');
    if (toggleSync) {
      preferences.autoRefresh = toggleSync.checked;
    }
    StorageManager.savePreferences(preferences);
    DolarAPI.saveRates(rates);

    if (els.productCurrencySelect && preferences.defaultCurrency) {
      els.productCurrencySelect.value = preferences.defaultCurrency;
      els.productCurrencySelect.dispatchEvent(new Event('change'));
    }
    showToast('Preferencias guardadas correctamente', '💾');
  };

  // Restablecer Valores por Defecto (Botón Secundario - Imagen 2)
  window.resetDefaultSettings = function() {
    // 1. Fuente de Cambio Principal predeterminada: BCV Oficial
    rates = DolarAPI.setSelectedRate('usd_oficial');
    rates.selectedRate = 'usd_oficial';

    // 2. Preferencias del sistema:
    // - Actualización automática: activo (true)
    // - Frecuencia de sincronización: 2 veces/día ('2d')
    // - Margen de amortiguación (Spread): + 0,0 % (0.0)
    // - Moneda predeterminada al agregar productos: USD ('USD')
    preferences.defaultCurrency = 'USD';
    preferences.autoRefresh = true;
    preferences.syncFrequency = '2d';
    preferences.spreadPercent = 0.0;
    rates.spreadPercent = 0.0;
    StorageManager.savePreferences(preferences);

    const spreadValElem = document.getElementById('spread-value-display');
    if (spreadValElem) {
      spreadValElem.textContent = '+ 0,0 %';
    }

    // 3. Sincronizar selectores de moneda con banderas
    if (selDefCurrency) {
      selDefCurrency.value = 'USD';
      selDefCurrency.dispatchEvent(new Event('change'));
    }

    if (els.productCurrencySelect) {
      els.productCurrencySelect.value = 'USD';
      els.productCurrencySelect.dispatchEvent(new Event('change'));
    }

    // 4. Cerrar modal de tasa personalizada si estaba abierto
    if (window.closeCustomRateModal) {
      window.closeCustomRateModal();
    }

    // 5. Re-renderizar interfaces
    renderRatesUI();
    renderConfigUI();
    renderCartAndTotals();

    showToast('Valores por defecto restablecidos', '🔄');
  };

  // ==========================================================================
  // SELECTORES PERSONALIZADOS DE MONEDA CON BANDERAS REALES
  // ==========================================================================
  const currencyMeta = {
    USD: { code: 'USD', flag: 'icons/flag-us.svg', label: 'USD ($)' },
    VES: { code: 'Bs.', flag: 'icons/flag-ve.svg', label: 'Bs. (Bolívares)' },
    EUR: { code: 'EUR', flag: 'icons/flag-eu.svg', label: 'EUR (€)' }
  };

  function setupCurrencyPicker(pickerId, displayBtnId, flagImgId, codeLabelId, optionsMenuId, nativeSelect) {
    const wrapper = document.getElementById(pickerId);
    const displayBtn = document.getElementById(displayBtnId);
    const flagImg = document.getElementById(flagImgId);
    const codeLabel = document.getElementById(codeLabelId);
    const menu = document.getElementById(optionsMenuId);

    if (!wrapper || !displayBtn || !nativeSelect) return;

    function updateDisplay(val) {
      const meta = currencyMeta[val] || currencyMeta.USD;
      if (flagImg) {
        flagImg.src = meta.flag;
        flagImg.alt = val;
      }
      if (codeLabel) {
        codeLabel.textContent = meta.code;
      }
      if (menu) {
        menu.querySelectorAll('.currency-option').forEach(opt => {
          if (opt.dataset.value === val) {
            opt.classList.add('active');
          } else {
            opt.classList.remove('active');
          }
        });
      }
    }

    displayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('open');
      document.querySelectorAll('.currency-custom-select').forEach(el => el.classList.remove('open'));
      if (!isOpen) {
        wrapper.classList.add('open');
      }
    });

    displayBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        displayBtn.click();
      }
    });

    if (menu) {
      menu.querySelectorAll('.currency-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = opt.dataset.value;
          nativeSelect.value = val;
          updateDisplay(val);
          wrapper.classList.remove('open');
          nativeSelect.dispatchEvent(new Event('change'));
        });
      });
    }

    nativeSelect.addEventListener('change', () => {
      updateDisplay(nativeSelect.value);
    });

    // Estado inicial
    updateDisplay(nativeSelect.value || 'USD');
  }

  // Sincronizar moneda predeterminada inicial en el formulario principal
  if (els.productCurrencySelect) {
    els.productCurrencySelect.value = preferences.defaultCurrency || 'USD';
  }

  // Inicializar en formulario principal
  setupCurrencyPicker(
    'custom-currency-picker',
    'currency-display-btn',
    'currency-active-flag',
    'currency-active-code',
    'currency-options-menu',
    els.productCurrencySelect
  );

  // Inicializar en modal de edición
  setupCurrencyPicker(
    'edit-custom-currency-picker',
    'edit-currency-display-btn',
    'edit-currency-active-flag',
    'edit-currency-active-code',
    'edit-currency-options-menu',
    els.editProductCurrency
  );

  // Inicializar en Preferencias Generales (Configuración)
  setupCurrencyPicker(
    'setting-custom-currency-picker',
    'setting-currency-display-btn',
    'setting-currency-active-flag',
    'setting-currency-active-code',
    'setting-currency-options-menu',
    selDefCurrency
  );

  // Cerrar menús al hacer clic en cualquier parte fuera
  document.addEventListener('click', () => {
    document.querySelectorAll('.currency-custom-select').forEach(el => el.classList.remove('open'));
  });

  // Cerrar modal de tasa personalizada al hacer clic en el fondo oscuro
  const modalCustomRateEl = document.getElementById('modal-custom-rate');
  if (modalCustomRateEl) {
    modalCustomRateEl.addEventListener('click', (e) => {
      if (e.target === modalCustomRateEl) {
        closeCustomRateModal();
      }
    });
  }

  // ==========================================================================
  // SINCRONIZACIÓN DE BASE DE DATOS LOCAL (INDEXEDDB)
  // ==========================================================================
  window.addEventListener('micompra:db-ready', () => {
    renderHistory();
    renderStats();
  });

  // Carga inicial de datos
  renderRatesUI();
  renderCartAndTotals();
  renderConfigUI();

  // Actualizar tasas en vivo en segundo plano al iniciar si está activada la auto-sincronización
  if (preferences.autoRefresh !== false) {
    setTimeout(() => {
      refreshRatesFromAPI();
    }, 1500);
  }
});
