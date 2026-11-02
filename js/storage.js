/**
 * Mi Compra - Módulo de Almacenamiento Local Robusto (IndexedDB + LocalStorage Fallback)
 * Crea y gestiona la base de datos 'MiCompraDB' en el dispositivo móvil (Android / iOS / PWA)
 * con almacenamiento persistente para evitar purgas del sistema operativo.
 */

const StorageManager = {
  DB_NAME: 'MiCompraDB',
  DB_VERSION: 1,
  CART_KEY: 'micompra_cart_items_v1',
  HISTORY_KEY: 'micompra_history_v1',
  PREFS_KEY: 'micompra_preferences_v1',

  // Memoria caché para respuesta síncrona inmediata en UI
  _cartCache: null,
  _historyCache: null,
  _prefsCache: null,
  _dbInstance: null,
  _isPersistent: false,

  /**
   * Inicializa la base de datos IndexedDB y solicita persistencia al sistema operativo del teléfono
   */
  async init() {
    this._loadInitialMemoryCache();

    if (navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        this._isPersistent = isPersisted;
        console.log(`[MiCompraDB] Almacenamiento persistente en teléfono: ${isPersisted ? 'CONCEDIDO' : 'ESTÁNDAR'}`);
      } catch (e) {
        console.warn('[MiCompraDB] No se pudo solicitar persistencia:', e);
      }
    }

    try {
      this._dbInstance = await this._openDatabase();
      console.log('[MiCompraDB] Base de datos nativa abierta correctamente.');
      await this._syncAndMigrate();
    } catch (err) {
      console.warn('[MiCompraDB] IndexedDB no disponible o bloqueado, funcionando con LocalStorage:', err);
    }

    window.dispatchEvent(new CustomEvent('micompra:db-ready', { 
      detail: { 
        persistent: this._isPersistent,
        ticketCount: (this._historyCache || []).length 
      } 
    }));
  },

  _openDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        return reject(new Error('IndexedDB no soportado en este navegador'));
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains('tickets')) {
          const ticketStore = db.createObjectStore('tickets', { keyPath: 'id' });
          ticketStore.createIndex('timestamp', 'timestamp', { unique: false });
          ticketStore.createIndex('date', 'date', { unique: false });
          ticketStore.createIndex('storeName', 'storeName', { unique: false });
        }

        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  _loadInitialMemoryCache() {
    try {
      const cartData = localStorage.getItem(this.CART_KEY);
      this._cartCache = cartData ? JSON.parse(cartData) : null;
    } catch (e) {
      this._cartCache = null;
    }

    try {
      const historyData = localStorage.getItem(this.HISTORY_KEY);
      this._historyCache = historyData ? JSON.parse(historyData) : [];
    } catch (e) {
      this._historyCache = [];
    }

    try {
      const prefsData = localStorage.getItem(this.PREFS_KEY);
      this._prefsCache = prefsData ? JSON.parse(prefsData) : null;
    } catch (e) {
      this._prefsCache = null;
    }
  },

  async _syncAndMigrate() {
    if (!this._dbInstance) return;

    try {
      const dbTickets = await this._getAllFromStore('tickets');

      if (dbTickets && dbTickets.length > 0) {
        dbTickets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        this._historyCache = dbTickets;
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(dbTickets));
      } else if (this._historyCache && this._historyCache.length > 0) {
        console.log(`[MiCompraDB] Migrando ${this._historyCache.length} tickets a la base de datos del teléfono...`);
        for (const ticket of this._historyCache) {
          await this._putInStore('tickets', ticket);
        }
      }

      const dbCart = await this._getAllFromStore('cart');
      if (dbCart && dbCart.length > 0) {
        this._cartCache = dbCart;
        localStorage.setItem(this.CART_KEY, JSON.stringify(dbCart));
      } else if (this._cartCache && this._cartCache.length > 0) {
        for (const item of this._cartCache) {
          await this._putInStore('cart', item);
        }
      }

      const dbPrefs = await this._getFromStore('preferences', 'user_prefs');
      if (dbPrefs && dbPrefs.value) {
        this._prefsCache = dbPrefs.value;
        localStorage.setItem(this.PREFS_KEY, JSON.stringify(dbPrefs.value));
      } else if (this._prefsCache) {
        await this._putInStore('preferences', { key: 'user_prefs', value: this._prefsCache });
      }
    } catch (err) {
      console.warn('[MiCompraDB] Error en sincronización de datos:', err);
    }
  },

  _getAllFromStore(storeName) {
    return new Promise((resolve) => {
      if (!this._dbInstance) return resolve([]);
      try {
        const tx = this._dbInstance.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  },

  _getFromStore(storeName, key) {
    return new Promise((resolve) => {
      if (!this._dbInstance) return resolve(null);
      try {
        const tx = this._dbInstance.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },

  _putInStore(storeName, data) {
    return new Promise((resolve) => {
      if (!this._dbInstance) return resolve(false);
      try {
        const tx = this._dbInstance.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(data);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  },

  _deleteFromStore(storeName, key) {
    return new Promise((resolve) => {
      if (!this._dbInstance) return resolve(false);
      try {
        const tx = this._dbInstance.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  },

  _clearStore(storeName) {
    return new Promise((resolve) => {
      if (!this._dbInstance) return resolve(false);
      try {
        const tx = this._dbInstance.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  },

  /* ================= CARRITO ACTIVO ================= */

  getCartItems() {
    if (this._cartCache !== null) {
      return this._cartCache;
    }

    try {
      const data = localStorage.getItem(this.CART_KEY);
      if (data !== null) {
        this._cartCache = JSON.parse(data);
        return this._cartCache;
      }
    } catch (e) {}

    const initialDemoItems = [
      { id: '1', name: 'Arroz', quantity: 2, price: 1.58, currency: 'USD', icon: '🌾' },
      { id: '2', name: 'Harina', quantity: 5, price: 1.03, currency: 'USD', icon: '🌽' }
    ];
    this.saveCartItems(initialDemoItems);
    return initialDemoItems;
  },

  saveCartItems(items) {
    this._cartCache = items;
    try {
      localStorage.setItem(this.CART_KEY, JSON.stringify(items));
    } catch (e) {}

    if (this._dbInstance) {
      this._clearStore('cart').then(() => {
        items.forEach(item => this._putInStore('cart', item));
      });
    }
  },

  addItem(item) {
    const items = [...this.getCartItems()];
    const newItem = {
      id: Date.now().toString(),
      name: item.name.trim() || 'Producto',
      quantity: Math.max(1, parseFloat(item.quantity) || 1),
      price: Math.max(0, parseFloat(item.price) || 0),
      currency: item.currency || 'USD',
      icon: item.icon || this.guessProductIcon(item.name)
    };
    items.push(newItem);
    this.saveCartItems(items);
    return items;
  },

  removeItem(id) {
    let items = this.getCartItems();
    items = items.filter(item => item.id !== id);
    this.saveCartItems(items);
    return items;
  },

  updateItem(id, updatedData) {
    let items = this.getCartItems();
    items = items.map(it => {
      if (it.id === id) {
        return {
          ...it,
          name: updatedData.name !== undefined ? (updatedData.name.trim() || it.name) : it.name,
          quantity: updatedData.quantity !== undefined ? Math.max(1, parseFloat(updatedData.quantity) || 1) : it.quantity,
          price: updatedData.price !== undefined ? Math.max(0, parseFloat(updatedData.price) || 0) : it.price,
          currency: updatedData.currency !== undefined ? updatedData.currency : it.currency
        };
      }
      return it;
    });
    this.saveCartItems(items);
    return items;
  },

  changeItemQuantity(id, delta) {
    let items = this.getCartItems();
    items = items.map(it => {
      if (it.id === id) {
        const newQty = Math.max(1, (parseFloat(it.quantity) || 1) + delta);
        return { ...it, quantity: newQty };
      }
      return it;
    });
    this.saveCartItems(items);
    return items;
  },

  clearCart() {
    this.saveCartItems([]);
    return [];
  },

  /* ================= HISTORIAL DE TICKETS (BASE DE DATOS) ================= */

  getHistory() {
    if (this._historyCache !== null) {
      return this._historyCache;
    }

    try {
      const data = localStorage.getItem(this.HISTORY_KEY);
      if (data) {
        this._historyCache = JSON.parse(data);
        return this._historyCache;
      }
    } catch (e) {}

    this._historyCache = [];
    return [];
  },

  savePurchaseTicket(ticketData) {
    const history = [...this.getHistory()];
    const ticketNumber = history.length + 1;
    const newEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ticketNumber: ticketNumber,
      storeName: ticketData.storeName || 'Mi Compra',
      storeType: ticketData.storeType || 'Supermercado',
      date: new Date().toLocaleDateString('es-VE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      items: ticketData.items,
      totalItemsCount: ticketData.totalItemsCount,
      totalBs: ticketData.totalBs,
      totalUSD: ticketData.totalUSD,
      totalEUR: ticketData.totalEUR,
      rateUsed: ticketData.rateLabel
    };

    history.unshift(newEntry);
    this._historyCache = history;

    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (e) {}

    // Persistir de inmediato en la base de datos IndexedDB
    this._putInStore('tickets', newEntry);

    window.dispatchEvent(new CustomEvent('micompra:ticket-saved', { detail: newEntry }));

    return newEntry;
  },

  clearHistory() {
    this._historyCache = [];
    localStorage.removeItem(this.HISTORY_KEY);
    this._clearStore('tickets');
    return [];
  },

  deleteHistoryItem(id) {
    let history = this.getHistory();
    history = history.filter(item => item.id !== id);
    this._historyCache = history;
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    this._deleteFromStore('tickets', id);
    return history;
  },

  /* ================= PREFERENCIAS ================= */

  getPreferences() {
    if (this._prefsCache !== null) {
      return this._prefsCache;
    }

    try {
      const data = localStorage.getItem(this.PREFS_KEY);
      if (data) {
        this._prefsCache = {
          defaultCurrency: 'USD',
          autoRefresh: true,
          syncFrequency: '2d',
          spreadPercent: 2.0,
          ...JSON.parse(data)
        };
        return this._prefsCache;
      }
    } catch (e) {}

    this._prefsCache = {
      defaultCurrency: 'USD',
      autoRefresh: true,
      syncFrequency: '2d',
      spreadPercent: 2.0
    };
    return this._prefsCache;
  },

  savePreferences(prefs) {
    this._prefsCache = prefs;
    localStorage.setItem(this.PREFS_KEY, JSON.stringify(prefs));
    this._putInStore('preferences', { key: 'user_prefs', value: prefs });
  },

  /* ================= RESPALDO Y RESTAURACIÓN (EXPORT / IMPORT) ================= */

  /**
   * Genera un archivo JSON de respaldo con todos los tickets, carrito y preferencias
   */
  exportBackupJSON() {
    const backupData = {
      app: 'Mi Compra Venezuela',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tickets: this.getHistory(),
      cart: this.getCartItems(),
      preferences: this.getPreferences()
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `MiCompra_Respaldo_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  },

  /**
   * Restaura datos desde un archivo JSON de respaldo
   */
  async importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.tickets)) {
        throw new Error('El archivo no contiene un formato de respaldo válido');
      }

      this._historyCache = data.tickets;
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(data.tickets));
      await this._clearStore('tickets');
      for (const t of data.tickets) {
        await this._putInStore('tickets', t);
      }

      if (Array.isArray(data.cart)) {
        this.saveCartItems(data.cart);
      }

      if (data.preferences) {
        this.savePreferences(data.preferences);
      }

      window.dispatchEvent(new CustomEvent('micompra:db-ready', { 
        detail: { 
          persistent: this._isPersistent,
          ticketCount: this._historyCache.length 
        } 
      }));

      return { success: true, count: data.tickets.length };
    } catch (e) {
      console.error('[MiCompraDB] Error al restaurar respaldo:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Deduce un emoji representativo según el nombre del producto
   */
  guessProductIcon(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('arroz')) return '🌾';
    if (n.includes('harina') || n.includes('pan')) return '🌽';
    if (n.includes('pasta') || n.includes('espagueti')) return '🍝';
    if (n.includes('aceite')) return '🫒';
    if (n.includes('azucar') || n.includes('azúcar')) return '🍬';
    if (n.includes('leche')) return '🥛';
    if (n.includes('queso')) return '🧀';
    if (n.includes('huevo')) return '🥚';
    if (n.includes('carne') || n.includes('res')) return '🥩';
    if (n.includes('pollo')) return '🍗';
    if (n.includes('cafe') || n.includes('café')) return '☕';
    if (n.includes('pan')) return '🥖';
    if (n.includes('mantequilla') || n.includes('margarina')) return '🧈';
    if (n.includes('jabon') || n.includes('detergente')) return '🧼';
    if (n.includes('atun') || n.includes('sardina') || n.includes('pescado')) return '🐟';
    if (n.includes('refresco') || n.includes('jugo') || n.includes('malta')) return '🥤';
    if (n.includes('tomate') || n.includes('cebolla') || n.includes('papa')) return '🥔';
    return '📦';
  }
};
