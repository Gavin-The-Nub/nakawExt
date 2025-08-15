/**
 * Mobile FIRST Browser Extension - Vendor Libraries
 * This is a deobfuscated and restructured version of the original obfuscated code
 * Contains Vue.js framework and other vendor libraries
 */

// ============================================================================
// WEBPACK BOOTSTRAP
// ============================================================================

(function (modules) {
  "use strict";

  // Module cache
  var installedModules = {};

  // The require function
  function webpackRequire(moduleId) {
    // Check if module is in cache
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }

    // Create a new module (and put it into the cache)
    var module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {},
    });

    // Execute the module function
    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      webpackRequire
    );

    // Flag the module as loaded
    module.l = true;

    // Return the exports of the module
    return module.exports;
  }

  // Expose the modules object (__webpack_modules__)
  webpackRequire.m = modules;

  // Expose the module cache
  webpackRequire.c = installedModules;

  // Define getter function for harmony exports
  webpackRequire.d = function (exports, name, getter) {
    if (!webpackRequire.o(exports, name)) {
      Object.defineProperty(exports, name, { enumerable: true, get: getter });
    }
  };

  // Define __esModule on exports
  webpackRequire.r = function (exports) {
    if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    }
    Object.defineProperty(exports, "__esModule", { value: true });
  };

  // Create a fake namespace object
  webpackRequire.t = function (value, mode) {
    if (mode & 1) value = webpackRequire(value);
    if (mode & 8) return value;
    if (mode & 4 && typeof value === "object" && value && value.__esModule)
      return value;
    var ns = Object.create(null);
    webpackRequire.r(ns);
    Object.defineProperty(ns, "default", { enumerable: true, value: value });
    if (mode & 2 && typeof value != "string") {
      for (var key in value) {
        webpackRequire.d(
          ns,
          key,
          function (key) {
            return value[key];
          }.bind(null, key)
        );
      }
    }
    return ns;
  };

  // Get default export function for compatibility with non-harmony modules
  webpackRequire.n = function (module) {
    var getter =
      module && module.__esModule
        ? function getDefault() {
            return module["default"];
          }
        : function getModuleExports() {
            return module;
          };
    webpackRequire.d(getter, "a", getter);
    return getter;
  };

  // Object.prototype.hasOwnProperty.call
  webpackRequire.o = function (object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };

  // __webpack_public_path__
  webpackRequire.p = "/";

  // Load entry module and return exports
  return webpackRequire((webpackRequire.s = 2));
})({
  // ============================================================================
  // MODULE 2: MAIN ENTRY POINT
  // ============================================================================
  2: function (require, exports, module) {
    module.exports = require("d7c2");
  },

  // ============================================================================
  // MODULE d7c2: VUE.JS FRAMEWORK
  // ============================================================================
  d7c2: function (require, exports, module) {
    "use strict";

    // Vue.js v2.7.14
    // (c) 2014-2022 Evan You
    // Released under the MIT License.

    var emptyObject = Object.freeze({});
    var isArray = Array.isArray;

    // Utility functions
    function isUndef(v) {
      return v === undefined || v === null;
    }
    function isDef(v) {
      return v !== undefined && v !== null;
    }
    function isTrue(v) {
      return v === true;
    }
    function isFalse(v) {
      return v === false;
    }
    function isPrimitive(value) {
      return (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "symbol" ||
        typeof value === "boolean"
      );
    }
    function isFunction(value) {
      return typeof value === "function";
    }
    function isObject(obj) {
      return obj !== null && typeof obj === "object";
    }

    var toString = Object.prototype.toString;
    function isPlainObject(obj) {
      return toString.call(obj) === "[object Object]";
    }
    function isRegExp(v) {
      return toString.call(v) === "[object RegExp]";
    }
    function isValidArrayIndex(val) {
      var n = parseFloat(String(val));
      return n >= 0 && Math.floor(n) === n && isFinite(val);
    }
    function isPromise(val) {
      return (
        isDef(val) &&
        typeof val.then === "function" &&
        typeof val.catch === "function"
      );
    }

    // String conversion utilities
    function toString(val) {
      return val == null
        ? ""
        : Array.isArray(val) ||
          (isPlainObject(val) && val.toString === toString)
        ? JSON.stringify(val, null, 2)
        : String(val);
    }
    function toNumber(val) {
      var n = parseFloat(val);
      return isNaN(n) ? val : n;
    }

    // Reserved tag checking
    var makeMap = function (str, expectsLowerCase) {
      var map = Object.create(null);
      var list = str.split(",");
      for (var i = 0; i < list.length; i++) {
        map[list[i]] = true;
      }
      return expectsLowerCase
        ? function (val) {
            return map[val.toLowerCase()];
          }
        : function (val) {
            return map[val];
          };
    };

    var isReservedTag = makeMap("slot,component", true);
    var isReservedAttr = makeMap("key,ref,slot,slot-scope,is");

    // Remove item from array
    function remove(arr, item) {
      if (arr.length) {
        var index = arr.indexOf(item);
        if (index > -1) {
          return arr.splice(index, 1);
        }
      }
    }

    // Check if object has property
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function hasOwn(obj, key) {
      return hasOwnProperty.call(obj, key);
    }

    // Convert kebab-case to camelCase
    var camelizeRE = /-(\w)/g;
    var camelize = cached(function (str) {
      return str.replace(camelizeRE, function (_, c) {
        return c ? c.toUpperCase() : "";
      });
    });

    // Convert first character to uppercase
    var capitalize = cached(function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Convert camelCase to kebab-case
    var hyphenateRE = /\B([A-Z])/g;
    var hyphenate = cached(function (str) {
      return str.replace(hyphenateRE, "-$1").toLowerCase();
    });

    // Bind function to context
    function bind(fn, ctx) {
      function boundFn(a) {
        var l = arguments.length;
        return l
          ? l > 1
            ? fn.apply(ctx, arguments)
            : fn.call(ctx, a)
          : fn.call(ctx);
      }
      boundFn._length = fn.length;
      return boundFn;
    }

    // Convert to array
    function toArray(list, start) {
      start = start || 0;
      var i = list.length - start;
      var ret = new Array(i);
      while (i--) {
        ret[i] = list[i + start];
      }
      return ret;
    }

    // Extend object
    function extend(to, _from) {
      for (var key in _from) {
        to[key] = _from[key];
      }
      return to;
    }

    // Merge objects
    function toObject(arr) {
      var res = {};
      for (var i = 0; i < arr.length; i++) {
        if (arr[i]) {
          extend(res, arr[i]);
        }
      }
      return res;
    }

    // No operation function
    function noop(a, b, c) {}

    // Identity function
    var no = function (a, b, c) {
      return false;
    };
    var identity = function (_) {
      return _;
    };

    // Deep equality check
    function looseEqual(a, b) {
      if (a === b) return true;
      var isObjectA = isObject(a);
      var isObjectB = isObject(b);
      if (isObjectA && isObjectB) {
        try {
          var isArrayA = Array.isArray(a);
          var isArrayB = Array.isArray(b);
          if (isArrayA && isArrayB) {
            return (
              a.length === b.length &&
              a.every(function (e, i) {
                return looseEqual(e, b[i]);
              })
            );
          } else if (a instanceof Date && b instanceof Date) {
            return a.getTime() === b.getTime();
          } else if (!isArrayA && !isArrayB) {
            var keysA = Object.keys(a);
            var keysB = Object.keys(b);
            return (
              keysA.length === keysB.length &&
              keysA.every(function (key) {
                return looseEqual(a[key], b[key]);
              })
            );
          } else {
            return false;
          }
        } catch (e) {
          return false;
        }
      } else if (!isObjectA && !isObjectB) {
        return String(a) === String(b);
      } else {
        return false;
      }
    }

    // Find index in array
    function looseIndexOf(arr, val) {
      for (var i = 0; i < arr.length; i++) {
        if (looseEqual(arr[i], val)) return i;
      }
      return -1;
    }

    // Ensure function is called only once
    function once(fn) {
      var called = false;
      return function () {
        if (!called) {
          called = true;
          fn.apply(this, arguments);
        }
      };
    }

    // Loose equality check
    function looseEqual(a, b) {
      return a === b ? a !== 0 || 1 / a === 1 / b : a !== a && b !== b;
    }

    // Vue configuration
    var config = {
      optionMergeStrategies: Object.create(null),
      silent: false,
      productionTip: true,
      devtools: true,
      performance: false,
      errorHandler: null,
      warnHandler: null,
      ignoredElements: [],
      keyCodes: Object.create(null),
      isReservedTag: no,
      isReservedAttr: no,
      isUnknownElement: no,
      getTagNamespace: noop,
      parsePlatformTagName: identity,
      mustUseProp: no,
      _lifecycleHooks: [
        "beforeCreate",
        "created",
        "beforeMount",
        "mounted",
        "beforeUpdate",
        "updated",
        "beforeDestroy",
        "destroyed",
        "activated",
        "deactivated",
        "errorCaptured",
        "serverPrefetch",
        "renderTracked",
        "renderTriggered",
      ],
    };

    // ... existing code ...

    // Vue constructor
    function Vue(options) {
      if (!(this instanceof Vue)) {
        warn(
          "Vue is a constructor and should be called with the `new` keyword"
        );
      }
      this._init(options);
    }

    // Initialize Vue
    initMixin(Vue);
    stateMixin(Vue);
    eventsMixin(Vue);
    lifecycleMixin(Vue);
    renderMixin(Vue);

    // Export Vue
    Vue.version = "2.7.14";
    module.exports = Vue;
  },

  // ============================================================================
  // MODULE 4360: STORE MANAGEMENT
  // ============================================================================
  4360: function (require, exports, module) {
    "use strict";

    var Vue = require("2b0e")["a"];
    var devices = require("8c42");
    var colorUtils = require("a12a");
    var colorUtilsDefault = require.n(colorUtils);
    var deepMerge = require("42454");
    var deepMergeDefault = require.n(deepMerge);

    // Store state
    const store = Vue.observable({
      local: {
        activeTabs: [],
      },
      sync: {
        id: null,
        installDate: {
          extension: null,
          website: null,
        },
        configuration: {
          background: {
            active: false,
            color: "#2b492f",
            presenter_mode: false,
          },
          analytics: {
            google: true,
          },
          video_quality: "medium",
          device: {
            hide: false,
            header_footer: {
              hide: false,
            },
            fullscreen: false,
            keyboard: {
              hide: false,
            },
            cursor: {
              default: false,
            },
            default: devices["a"].find((device) => device.default).slug,
            scrollbar: {
              show: false,
            },
            batterie_level: 100,
            orientation: "portrait",
          },
          theme: "day",
          style: {
            mockup: false,
          },
        },
        spentTime: 0,
        notifications: [],
        storeRefresh: 0,
        behavior: {
          activationCounter: 0,
        },
        modales: {
          review: { date: null },
          "new-iphone-14": { date: null },
          "new-iphone-15": { date: null },
        },
      },
      isolated: {
        store: {
          updating: false,
          waitForUpdate: false,
        },
        tabId: null,
        frameId: null,
        translation: chrome.i18n,
        user: null,
      },
    });

    // Getters
    const getters = {
      storeUpdating() {
        return store.isolated.store.updating;
      },
      waitForUpdate() {
        return store.isolated.store.waitForUpdate;
      },
      translation: () => chrome.i18n,
      tabId: () => store.isolated.tabId,
      state: () => store,
      activeTabIds: () => store.local.activeTabs.map((tab) => tab.tabId),
      isActiveTab(tabId = store.isolated.tabId) {
        return typeof tabId === "number"
          ? store.local.activeTabs.some((tab) => tab.tabId === tabId)
          : store.local.activeTabs.some(
              (tab) => tab.tabId === store.isolated.tabId
            );
      },
      isActiveFrame: (tabId, frameId) => {
        let tabIndex = store.local.activeTabs.findIndex(
          (tab) => tab.tabId === tabId
        );
        return store.local.activeTabs[tabIndex].windows.some(
          (window) => window.frames.parent === frameId
        );
      },
      getWindowPositionByFrameId(tabId, frameId) {
        return store.local.activeTabs
          .find((tab) => tab.tabId === tabId)
          .windows.find((window) => window.frames.parent === frameId).position;
      },
      activeTab: () =>
        store.local.activeTabs.find(
          (tab) => tab.tabId === store.isolated.tabId
        ),
      getTabInfo: (tabId) =>
        store.local.activeTabs.find((tab) => tab.tabId === tabId),
      isIncognitoTab: () =>
        store.local.activeTabs.find((tab) => tab.tabId === store.isolated.tabId)
          .incognito,
      windowByTabIdAndFrameId(
        tabId = store.isolated.tabId,
        frameId = store.isolated.frameId
      ) {
        let window = store.local.activeTabs
          .find((tab) => tab.tabId === tabId)
          .windows.find((window) => window.frames.parent === frameId);
        return (
          window ||
          store.local.activeTabs
            .find((tab) => tab.tabId === tabId)
            .windows.find((window) => window.frames.children.includes(frameId))
        );
      },
      deviceByTabId(tabId = store.isolated.tabId) {
        if (
          store.local.activeTabs.find((tab) => tab.tabId === tabId).windows[0]
        ) {
          return store.local.activeTabs.find((tab) => tab.tabId === tabId)
            .windows[0].device;
        }
      },
      deviceByTabIdAndFrameId(
        tabId = store.isolated.tabId,
        frameId = store.isolated.frameId
      ) {
        if (getters.windowByTabIdAndFrameId(tabId, frameId)) {
          return getters.windowByTabIdAndFrameId(tabId, frameId).device;
        }
      },
      windows() {
        if (
          store.local.activeTabs.find(
            (tab) => tab.tabId === store.isolated.tabId
          )
        ) {
          return store.local.activeTabs.find(
            (tab) => tab.tabId === store.isolated.tabId
          ).windows;
        }
      },
      windowByPosition(position) {
        return getters
          .activeTab()
          .windows.find((window) => window.position === position);
      },
      deviceByPosition(position) {
        return getters.windowByPosition(position).device;
      },
      orientationByPosition(position) {
        return position
          ? store.local.activeTabs
              .find((tab) => tab.tabId === store.isolated.tabId)
              .windows.find((window) => window.position === position)
              .orientation
          : store.isolated.frameId
          ? getters.windowByTabIdAndFrameId().orientation
          : undefined;
      },
      minuteur() {
        return getters
          .activeTab()
          .windows.find((window) => window.position === this.position)
          .screencast.minuteur;
      },
      configuration() {
        return store.sync.configuration;
      },
      contrast() {
        return this.configuration.background.active ||
          getters.theme() === "night"
          ? colorUtilsDefault()(store.sync.configuration.background.color)
          : "light";
      },
      user() {
        return store.isolated.user;
      },
      isPRO() {
        return (
          getters.getTabInfo(store.isolated.tabId).metadata.isSiteCopilot ||
          (store.isolated.user && store.isolated.user.active_subscription)
        );
      },
      screencasts() {
        return store.sync.screencasts.list;
      },
      spentTime() {
        return store.sync.spentTime;
      },
      id() {
        return store.sync.id;
      },
      installDate() {
        let websiteDate = store.sync.installDate.website
          ? new Date(store.sync.installDate.website)
          : new Date();
        let extensionDate = store.sync.installDate.extension
          ? new Date(store.sync.installDate.extension)
          : new Date();
        return new Date(Math.min(websiteDate, extensionDate));
      },
      notifications() {
        return store.sync.notifications;
      },
      theme() {
        return store.sync.configuration.theme;
      },
      activationCounter() {
        return store.sync.behavior.activationCounter;
      },
      modales_auto_triggered() {
        return store.sync.modales;
      },
    };

    // Mutations
    const mutations = {
      setFrameId(tabId, frameId, position) {
        store.local.activeTabs
          .find((tab) => tab.tabId === tabId)
          .windows.find(
            (window) => window.position === position
          ).frames.parent = frameId;
      },
      setChildFrameId(tabId, frameId, position) {
        let window = store.local.activeTabs
          .find((tab) => tab.tabId === tabId)
          .windows.find((window) => window.position === position);
        if (!window.frames.children.some((child) => child === frameId)) {
          window.frames.children.push(frameId);
        }
      },
      removeChildrenFrames(tabId, position) {
        let window = store.local.activeTabs
          .find((tab) => tab.tabId === tabId)
          .windows.find((window) => window.position === position);
        if (window) {
          window.frames.children = [];
        }
      },
      setCurrentTab(tabId, frameId) {
        store.isolated.tabId = tabId;
        store.isolated.frameId = frameId;
      },
      setDevice(deviceSlug, position) {
        store.isolated.store.waitForUpdate = true;
        store.local.activeTabs
          .find((tab) => tab.tabId === store.isolated.tabId)
          .windows.find((window) => window.position === position).device =
          devices["a"].find((device) => device.slug === deviceSlug);
      },
      removeWindow() {
        store.local.activeTabs.find(
          (tab) => tab.tabId === store.isolated.tabId
        ).windows = getters
          .windows()
          .filter((window) => window.position !== this.position);
      },
      toggleOrientation(position, orientation) {
        store.isolated.store.waitForUpdate = true;
        store.local.activeTabs
          .find((tab) => tab.tabId === store.isolated.tabId)
          .windows.find((window) => window.position === position).orientation =
          orientation === "portrait" ? "landscape" : "portrait";
      },
      incrementMinuteur() {
        store.local.activeTabs
          .find((tab) => tab.tabId === store.isolated.tabId)
          .windows.find((window) => window.position === this.position)
          .screencast.minuteur++;
      },
      initMinuteur() {
        store.local.activeTabs
          .find((tab) => tab.tabId === store.isolated.tabId)
          .windows.find(
            (window) => window.position === this.position
          ).screencast.minuteur = 0;
      },
      setUser(user) {
        store.isolated.user = user;
        if (
          user &&
          !user.active_subscription &&
          devices["a"].find(
            (device) => device.slug === store.sync.configuration.device.default
          ).isPro
        ) {
          store.sync.configuration.device.default = devices["a"].find(
            (device) => device.default
          ).slug;
        }
      },
      removeUser() {
        store.isolated.user = null;
      },
      setSpentTime(time) {
        store.sync.spentTime = time;
      },
      setId(id) {
        store.sync.id = id;
      },
      setInstallDate(date, type) {
        store.sync.installDate[type] = date;
      },
      toggleTheme() {
        store.sync.configuration.theme =
          store.sync.configuration.theme === "day" ? "night" : "day";
      },
      addNotification(version) {
        if (
          !store.sync.notifications.some(
            (notification) => notification.version === version
          )
        ) {
          store.sync.notifications.push({ version: version, closed: false });
          store.sync.notifications.splice(
            0,
            store.sync.notifications.length - 5
          );
        }
      },
      updateNotificationsView(version) {
        let notificationIndex = store.sync.notifications.findIndex(
          (notification) => notification.version === version
        );
        store.sync.notifications[notificationIndex].closed = true;
      },
      forceStoreRefresh() {
        store.sync.storeRefresh++;
      },
      increaseActivationCounter() {
        store.sync.behavior.activationCounter++;
      },
      setDisplayDateModale(modaleName) {
        store.sync.modales[modaleName].date = new Date();
      },
      removeScreencasts() {
        if (store.sync.screencasts) {
          store.sync.screencasts.list = [];
          delete store.sync.screencasts.list;
          delete store.sync.screencasts;
        }
      },
    };

    // Actions
    const actions = {
      async addActiveTab(tabId, tab, windowId, tabInfo) {
        store.isolated.store.waitForUpdate = true;
        let defaultDevice = devices["a"].find(
          (device) => device.slug === store.sync.configuration.device.default
        );
        let orientation = defaultDevice.viewport.enableRotation
          ? store.sync.configuration.device.orientation
          : "portrait";
        let metadata = {};

        if (tab.href.includes("simulator-0v4EdgVOcbWb")) {
          metadata.isSiteCopilot = true;
        }

        store.local.activeTabs.push({
          tabId: tabId,
          tabUrl: tab.href,
          windowId: windowId,
          windows: [
            {
              position: 1,
              frames: { parent: null, children: [] },
              device: defaultDevice,
              orientation: orientation,
              screencast: { minuteur: 0 },
            },
          ],
          metadata: metadata,
          incognito: tabInfo.incognito,
        });
      },

      addNewWindow(deviceSlug) {
        let device = devices["a"].find((device) => device.slug === deviceSlug);
        getters.windows().push({
          position: 2,
          frames: { parent: null, children: [] },
          device: device,
          orientation: "portrait",
          screencast: { minuteur: 0 },
        });
      },

      removeActiveTab(tabId) {
        store.local.activeTabs = store.local.activeTabs.filter(
          (tab) => tab.tabId !== tabId
        );
      },

      removeActiveTabs(windowId) {
        store.local.activeTabs = store.local.activeTabs.filter(
          (tab) => tab.windowId !== windowId
        );
      },

      resetProVersion() {
        store.sync.configuration.background.presenter_mode = false;
        store.sync.configuration.video_quality = "medium";
        store.sync.configuration.device.batterie_level = 100;
      },
    };

    // Storage functions
    const loadFromStorage = async (type, force = false) => {
      let data = (await chrome.storage[type].get(type))[type];
      if (data) {
        if (force) {
          isUpdating = true;
        }
        store[type] = deepMergeDefault()({}, store[type], data);
      }
    };

    const saveToStorage = async (type) => {
      await Promise.all([
        chrome.storage[type].set({
          [type]: JSON.parse(JSON.stringify(store[type])),
        }),
      ]);
    };

    // Message listener for storage updates
    chrome.runtime.onMessage.addListener((message, sender) => {
      if (
        message.message === "mf-update-storage" &&
        sender.id === chrome.runtime.id
      ) {
        return loadFromStorage(message.type, true);
      }
    });

    // Update storage function
    const updateStorage = async (type) => {
      if (isUpdating) {
        isUpdating = false;
      } else {
        store.isolated.store.updating = true;
        await saveToStorage(type);
        await notifyOtherTabs(type);
        store.isolated.store.waitForUpdate = false;
        store.isolated.store.updating = false;
      }
    };

    let isUpdating = false;

    // Notify other tabs
    const notifyOtherTabs = async (type) => {
      if (chrome.runtime.sendMessage) {
        await chrome.runtime
          .sendMessage({ message: "mf-update-storage", type: type })
          .catch(() => {});
      }

      if (chrome.tabs) {
        let tabs = await chrome.tabs.query({});
        let promises = [];
        tabs.forEach(async (tab) => {
          promises.push(
            chrome.tabs
              .sendMessage(tab.id, {
                message: "mf-update-storage",
                type: type,
              })
              .catch(() => {})
          );
        });
        await Promise.all(promises);
      }
    };

    // Initialize store
    const initStore = Promise.all([
      loadFromStorage("local", true),
      loadFromStorage("sync", true),
    ]);

    // Create Vue reactive store
    new Vue({
      data: store,
      watch: {
        local: {
          deep: true,
          handler: () => {
            updateStorage("local");
          },
        },
        sync: {
          deep: true,
          handler: () => {
            updateStorage("sync");
          },
        },
      },
    });

    // Export store components
    module.exports = {
      store: store,
      getters: getters,
      mutations: mutations,
      actions: actions,
      initStore: initStore,
    };
  },

  // ... existing code ...
});
