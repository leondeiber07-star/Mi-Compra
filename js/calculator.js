/**
 * Mi Compra - Módulo de Cálculos y Formato de Monedas
 * Realiza conversiones cruzadas entre USD, EUR y Bs., subtotales y formato latinoamericano
 */

const Calculator = {
  /**
   * Formatea un número al estilo venezolano/latino (punto para miles, coma para decimales)
   * Ejemplo: 7389.75 -> "7.389,75"
   */
  formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
      value = 0;
    }
    const fixed = Number(value).toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimals > 0 ? `${formattedInt},${decPart}` : formattedInt;
  },

  /**
   * Formato para Bolívares: "Bs. 7.389,75"
   */
  formatBs(value) {
    return `Bs. ${this.formatNumber(value, 2)}`;
  },

  /**
   * Formato para Dólares: "$ 8,31" o "$8.31"
   */
  formatUSD(value, compact = false) {
    return compact 
      ? `$${this.formatNumber(value, 2)}` 
      : `$ ${this.formatNumber(value, 2)}`;
  },

  /**
   * Formato para Euros: "€ 8,17" o "€8.17"
   */
  formatEUR(value, compact = false) {
    return compact 
      ? `€${this.formatNumber(value, 2)}` 
      : `€ ${this.formatNumber(value, 2)}`;
  },

  /**
   * Obtiene la tasa USD y la tasa EUR a usar según la selección activa
   */
  resolveActiveRates(rates) {
    let usdRate = rates.usd_oficial;
    let eurRate = rates.eur_oficial;

    if (rates.selectedRate === 'usd_paralelo' || rates.selectedRate === 'eur_paralelo' || rates.selectedRate === 'paralelo') {
      usdRate = rates.usd_paralelo;
      eurRate = rates.eur_paralelo;
    } else if (rates.selectedRate === 'custom' || rates.selectedRate === 'usd_custom' || rates.selectedRate === 'propia') {
      usdRate = rates.usd_custom || rates.usd_oficial;
      eurRate = rates.eur_custom || rates.eur_oficial;
    } else {
      // oficial (bcv)
      usdRate = rates.usd_oficial;
      eurRate = rates.eur_oficial;
    }

    const spreadPercent = parseFloat(rates.spreadPercent) || 0;
    const spreadMultiplier = 1 + (spreadPercent / 100);

    return {
      usdRate: (usdRate || 889.26) * spreadMultiplier,
      eurRate: (eurRate || 903.12) * spreadMultiplier,
      baseUsdRate: usdRate || 889.26,
      baseEurRate: eurRate || 903.12,
      spreadPercent,
      activeKey: rates.selectedRate || 'usd_oficial',
      activeRateValue: rates[rates.selectedRate] || usdRate
    };
  },

  /**
   * Calcula los subtotales de un artículo individual
   * item = { name, quantity, price, currency: 'USD' | 'EUR' | 'VES' }
   */
  calculateItem(item, rates) {
    const qty = Math.max(1, parseFloat(item.quantity) || 1);
    const price = Math.max(0, parseFloat(item.price) || 0);
    const currency = item.currency || 'USD';
    const subtotalNative = qty * price;

    const { usdRate, eurRate } = this.resolveActiveRates(rates);

    let subtotalBs = 0;
    if (currency === 'USD') {
      subtotalBs = subtotalNative * usdRate;
    } else if (currency === 'EUR') {
      subtotalBs = subtotalNative * eurRate;
    } else {
      // VES (Bolívares)
      subtotalBs = subtotalNative;
    }

    const subtotalUSD = usdRate > 0 ? subtotalBs / usdRate : 0;
    const subtotalEUR = eurRate > 0 ? subtotalBs / eurRate : 0;

    return {
      ...item,
      quantity: qty,
      price: price,
      subtotalNative,
      subtotalBs,
      subtotalUSD,
      subtotalEUR
    };
  },

  /**
   * Calcula los totales globales de una lista de productos
   */
  calculateCart(items, rates) {
    const { usdRate, eurRate, activeKey, activeRateValue } = this.resolveActiveRates(rates);

    let totalItemsCount = 0;
    let totalBs = 0;
    let totalUSD = 0;
    let totalEUR = 0;

    const calculatedItems = items.map(rawItem => {
      const calc = this.calculateItem(rawItem, rates);
      totalItemsCount += calc.quantity;
      totalBs += calc.subtotalBs;
      return calc;
    });

    // Totales cruzados consolidados
    totalUSD = usdRate > 0 ? totalBs / usdRate : 0;
    totalEUR = eurRate > 0 ? totalBs / eurRate : 0;

    return {
      items: calculatedItems,
      totalItemsCount,
      totalBs,
      totalUSD,
      totalEUR,
      usdRate,
      eurRate,
      activeKey,
      activeRateValue,
      rateLabel: this.getRateLabel(activeKey, activeRateValue)
    };
  },

  /**
   * Etiqueta amigable de la tasa activa
   */
  getRateLabel(activeKey, rateValue) {
    const formatted = this.formatNumber(rateValue, 2);
    if (activeKey.startsWith('eur')) {
      return `${formatted} Bs/€`;
    }
    return `${formatted} Bs/$`;
  }
};
