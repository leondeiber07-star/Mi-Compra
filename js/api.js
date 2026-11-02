/**
 * Mi Compra - Módulo de Tasas de Cambio y DolarAPI
 * Conexión en vivo con https://ve.dolarapi.com/v1/dolares y https://ve.dolarapi.com/v1/euros
 * Extrae y asocia la fecha y hora exacta de actualización que viene dentro de cada tasa en la API
 */

const DolarAPI = {
  // Tasas por defecto y fechas extraídas de las APIs
  DEFAULT_RATES: {
    usd_oficial: 889.26,
    usd_paralelo: 1025.45,
    usd_custom: 889.26,
    eur_oficial: 903.12,
    eur_paralelo: 1041.28,
    eur_custom: 903.12,
    dates: {
      usd_oficial: '30/10/2026',
      usd_paralelo: '30/10/2026 - 09:40 AM',
      usd_custom: 'Manual / Local',
      eur_oficial: '30/10/2026',
      eur_paralelo: '30/10/2026 - 09:40 AM',
      eur_custom: 'Manual / Local'
    },
    selectedRate: 'usd_oficial' // Tasa activa por defecto
  },

  STORAGE_KEY: 'micompra_rates_v1',

  /**
   * Obtiene las tasas almacenadas en localStorage o los valores por defecto
   */
  getStoredRates() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...this.DEFAULT_RATES,
          ...parsed,
          dates: { ...this.DEFAULT_RATES.dates, ...(parsed.dates || {}) }
        };
      }
    } catch (e) {
      console.warn('Error al leer tasas locales:', e);
    }
    return { ...this.DEFAULT_RATES };
  },

  /**
   * Guarda las tasas actualizadas en localStorage
   */
  saveRates(rates) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rates));
    } catch (e) {
      console.error('Error al guardar tasas:', e);
    }
  },

  /**
   * Formatea la fecha y hora exacta que viene dentro del JSON de la API
   * Respeta si es solo fecha diaria (BCV oficial) o con hora exacta (Paralelo)
   */
  formatApiDate(isoDateStr) {
    if (!isoDateStr) return '';
    try {
      const d = new Date(isoDateStr);
      if (isNaN(d.getTime())) return isoDateStr;

      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      // Si la fecha en la API viene con hora 00:00 (como el BCV que es fijado por día)
      if (isoDateStr.includes('T00:00:00') || (d.getHours() === 0 && d.getMinutes() === 0)) {
        return `${day}/${month}/${year}`;
      }

      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, '0');

      return `${day}/${month}/${year} - ${formattedHours}:${minutes} ${ampm}`;
    } catch (e) {
      return isoDateStr;
    }
  },

  /**
   * Obtiene la fecha exacta de la tasa seleccionada actualmente
   */
  getActiveRateDate(rates) {
    const selected = rates.selectedRate || 'usd_oficial';
    if (rates.dates && rates.dates[selected]) {
      return rates.dates[selected];
    }
    return '30/10/2026';
  },

  /**
   * Consulta las APIs de DolarAPI en tiempo real
   */
  async fetchLiveRates() {
    const current = this.getStoredRates();
    if (!current.dates) {
      current.dates = { ...this.DEFAULT_RATES.dates };
    }

    // Si el dispositivo está sin conexión a internet, usar tasas locales sin intentar fetch
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { rates: current, success: false };
    }

    let updatedAny = false;

    try {
      // 1. Obtener Dólares (Oficial y Paralelo) con margen de 12 segundos
      let signalDolar;
      let timeoutIdDolar;
      if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        signalDolar = AbortSignal.timeout(12000);
      } else {
        const controllerDolar = new AbortController();
        timeoutIdDolar = setTimeout(() => controllerDolar.abort(), 12000);
        signalDolar = controllerDolar.signal;
      }

      const resDolar = await fetch('https://ve.dolarapi.com/v1/dolares', {
        signal: signalDolar,
        headers: { 'Accept': 'application/json' }
      });
      if (timeoutIdDolar) clearTimeout(timeoutIdDolar);

      if (resDolar.ok) {
        const dolares = await resDolar.json();
        if (Array.isArray(dolares)) {
          const oficial = dolares.find(d => d.fuente === 'oficial');
          const paralelo = dolares.find(d => d.fuente === 'paralelo');

          if (oficial && oficial.promedio) {
            current.usd_oficial = Number(oficial.promedio);
            if (oficial.fechaActualizacion) {
              current.dates.usd_oficial = this.formatApiDate(oficial.fechaActualizacion);
            }
            updatedAny = true;
          }
          if (paralelo && paralelo.promedio) {
            current.usd_paralelo = Number(paralelo.promedio);
            if (paralelo.fechaActualizacion) {
              current.dates.usd_paralelo = this.formatApiDate(paralelo.fechaActualizacion);
            }
            updatedAny = true;
          }
        }
      }
    } catch (err) {
      console.warn('Aviso: No se pudo consultar dólares en vivo (usando tasas guardadas):', err.message);
    }

    try {
      // 2. Obtener Euros (Oficial y Paralelo) con margen de 12 segundos
      let signalEuro;
      let timeoutIdEuro;
      if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        signalEuro = AbortSignal.timeout(12000);
      } else {
        const controllerEuro = new AbortController();
        timeoutIdEuro = setTimeout(() => controllerEuro.abort(), 12000);
        signalEuro = controllerEuro.signal;
      }

      const resEuro = await fetch('https://ve.dolarapi.com/v1/euros', {
        signal: signalEuro,
        headers: { 'Accept': 'application/json' }
      });
      if (timeoutIdEuro) clearTimeout(timeoutIdEuro);

      if (resEuro.ok) {
        const euros = await resEuro.json();
        if (Array.isArray(euros)) {
          const oficial = euros.find(e => e.fuente === 'oficial');
          const paralelo = euros.find(e => e.fuente === 'paralelo');

          if (oficial && oficial.promedio) {
            current.eur_oficial = Number(oficial.promedio);
            if (oficial.fechaActualizacion) {
              current.dates.eur_oficial = this.formatApiDate(oficial.fechaActualizacion);
            }
            updatedAny = true;
          }
          if (paralelo && paralelo.promedio) {
            current.eur_paralelo = Number(paralelo.promedio);
            if (paralelo.fechaActualizacion) {
              current.dates.eur_paralelo = this.formatApiDate(paralelo.fechaActualizacion);
            }
            updatedAny = true;
          }
        }
      }
    } catch (err) {
      console.warn('Aviso: No se pudo consultar euros en vivo (usando tasas guardadas):', err.message);
    }

    if (updatedAny) {
      this.saveRates(current);
    }

    return {
      rates: current,
      success: updatedAny
    };
  },

  /**
   * Cambia la tasa activa seleccionada por el usuario
   */
  setSelectedRate(rateKey) {
    const current = this.getStoredRates();
    if (['usd_oficial', 'usd_paralelo', 'eur_oficial', 'eur_paralelo', 'usd_custom', 'eur_custom'].includes(rateKey)) {
      current.selectedRate = rateKey;
      this.saveRates(current);
    }
    return current;
  },

  /**
   * Permite fijar un valor manual a cualquiera de las tasas
   */
  setManualRate(rateKey, value) {
    const current = this.getStoredRates();
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0 && current[rateKey] !== undefined) {
      current[rateKey] = num;
      if (!current.dates) current.dates = {};
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      current.dates[rateKey] = `${day}/${month}/${year} (Manual)`;
      this.saveRates(current);
      return true;
    }
    return false;
  }
};
