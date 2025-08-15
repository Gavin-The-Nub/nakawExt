/**
 * Mobile FIRST Browser Extension - Popup Component
 * This is a deobfuscated and restructured version of the original obfuscated code
 */

// ============================================================================
// MAIN APPLICATION ENTRY POINT
// ============================================================================

(function () {
  "use strict";

  // Initialize the Vue.js application
  const app = new Vue({
    el: "#app",
    render: (h) => h(PopupComponent),
  });

  // Use required plugins
  Vue.use(Buefy);
  Vue.use(VueRouter);
  Vue.use(TranslationPlugin);
})();

// ============================================================================
// POPUP COMPONENT
// ============================================================================

const PopupComponent = {
  name: "PopupComponent",

  // Component template (converted from render function)
  template: `
    <div>
      <header>
        <a class="logo" 
           :href="'https://www.webmobilefirst.com' + websiteLocale" 
           target="_blank">
          <img width="25" height="25" src="data:image/png;base64,..." />
          <span>Mobile FIRST</span>
        </a>
      </header>
      
      <div id="main">
        <div class="wrapper">
          <!-- Show message for incompatible sites -->
          <p v-if="pageType === 'native_page'">
            <b-icon class="picto" icon="mobile_off"></b-icon>
            {{ $translation.getMessage('popup_site_incompatible') }}.
          </p>
          
          <!-- Show message for local files -->
          <p v-else-if="pageType === 'local_file'">
            <b-icon class="picto" icon="settings"></b-icon>
            {{ $translation.getMessage('popup_activate_local_files_info') }}
          </p>
          
          <!-- Button to activate local files -->
          <b-button v-if="pageType === 'local_file'"
                    class="button"
                    tag="a"
                    target="_blank"
                    type="is-primary"
                    :href="supportLink">
            {{ $translation.getMessage('popup_activate_local_files_button') }}
          </b-button>
        </div>
      </div>
    </div>
  `,

  // Component data
  data() {
    return {
      pageType: "",
      supportLink: "",
    };
  },

  // Component lifecycle
  async mounted() {
    await this.initializePopup();
  },

  // Component methods
  methods: {
    /**
     * Initialize the popup with current tab information
     */
    async initializePopup() {
      try {
        // Get current active tab
        const [currentTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        // Determine page type based on URL
        this.pageType = currentTab.url.startsWith("file://")
          ? "local_file"
          : "native_page";

        // Get support link for local files
        if (this.pageType === "local_file") {
          this.supportLink = await this.buildSupportLink();
        }
      } catch (error) {
        console.error("Failed to initialize popup:", error);
        this.pageType = "error";
      }
    },

    /**
     * Build support link with tracking parameters
     */
    async buildSupportLink() {
      const baseUrl = "support/activate-local-files/";
      const trackingParams =
        "utm_source=extension&utm_campaign=support&utm_content=support_activate_local_file";

      return await this.getLinkWithClientId(baseUrl + "?" + trackingParams);
    },

    /**
     * Get link with client ID for analytics
     */
    async getLinkWithClientId(path = "") {
      try {
        // Get client ID from storage
        const { client_id } =
          (await chrome.storage.local.get("client_id")) || {};

        // Build base URL
        let fullUrl =
          "https://www.webmobilefirst.com" + this.websiteLocale + path;

        // Add client ID if available
        if (client_id) {
          const separator = path.includes("?") ? "&" : "?";
          fullUrl += separator + "client_id=" + encodeURIComponent(client_id);
        }

        return fullUrl;
      } catch (error) {
        console.error("Failed to build link:", error);
        return "https://www.webmobilefirst.com" + this.websiteLocale + path;
      }
    },
  },

  // Computed properties
  computed: {
    /**
     * Get website locale based on browser language
     */
    websiteLocale() {
      const uiLanguage = chrome.i18n.getUILanguage();

      if (uiLanguage === "fr") {
        return "/";
      } else if (["ja", "en", "es"].includes(uiLanguage)) {
        return "/" + uiLanguage + "/";
      } else {
        return "/en/";
      }
    },
  },

  // Mixins
  mixins: [TranslationMixin],
};

// ============================================================================
// TRANSLATION MIXIN
// ============================================================================

const TranslationMixin = {
  methods: {
    /**
     * Get link with client ID for analytics
     */
    async getLinkWithClientId(path = "") {
      try {
        const { client_id } =
          (await chrome.storage.local.get("client_id")) || {};
        const separator = path.includes("?") ? "&" : "?";

        if (client_id) {
          return (
            "https://www.webmobilefirst.com" +
            this.websiteLocale +
            path +
            separator +
            "client_id=" +
            encodeURIComponent(client_id)
          );
        } else {
          return "https://www.webmobilefirst.com" + this.websiteLocale + path;
        }
      } catch (error) {
        console.error("Failed to build link:", error);
        return "https://www.webmobilefirst.com" + this.websiteLocale + path;
      }
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const Utils = {
  /**
   * Get nested object property safely
   */
  getNestedProperty(obj, path) {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current[key] === undefined) return undefined;
      current = current[key];
    }

    return current;
  },

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Remove www prefix from URL
   */
  removeWWW(url) {
    return url.replace(/^www\.?\./, "");
  },

  /**
   * Clean mobile subdomain from URL
   */
  cleanMobileSubdomain(url) {
    const match = url.match(/^(https?:\/\/)(.*)/);

    if (!match) return url;

    let [, protocol, domain] = match;

    // Split domain and filter out mobile subdomains
    let parts = domain.split(".");
    parts = parts.filter(
      (part) => !part.match(/^m$|^mob$|^mobi$|^mobile$|^mobiles$/)
    );

    // Rebuild URL
    let cleanUrl = protocol + parts.join(".");

    // Remove www if present
    if (cleanUrl.match(/^https?:\/\/(www\.)/)) {
      cleanUrl = cleanUrl.replace("www.", "");
    }

    return cleanUrl;
  },

  /**
   * Check if domain has valid TLD
   */
  hasValidTLD(url) {
    const tld = this.extractTLD(url);
    if (!tld) return false;

    const cleanUrl = url.replace(tld, "");
    return cleanUrl.split(".").length >= 2;
  },

  /**
   * Extract TLD from URL
   */
  extractTLD(url) {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");

    if (parts.length === 1) return "";

    // Try to find 2-level TLD first
    let tld = "." + parts[parts.length - 2] + "." + parts[parts.length - 1];
    if (this.validTLDs.includes(tld)) return tld;

    // Fall back to 1-level TLD
    tld = "." + parts[parts.length - 1];
    return tld;
  },

  /**
   * List of valid TLDs for domain validation
   */
  validTLDs: [
    ".co.il",
    ".lan",
    ".co.jp",
    ".site",
    ".store",
    ".tech",
    ".online",
    ".live",
    ".art",
    ".me",
    ".shop",
    ".space",
    ".fun",
    ".xyz",
    ".website",
    ".uno",
    ".link",
    ".cloud",
    ".ovh",
    ".com",
    ".fr",
    ".io",
    ".info",
    ".christmas",
    ".bzh",
    ".be",
    ".net",
    ".best",
    ".org",
    ".eu",
    ".mx",
    ".cc",
    ".click",
    ".aaa.pro",
    ".abogado",
    ".ac",
    ".ac.uk",
    ".aca.pro",
    ".academy",
    ".accountant",
    ".accountants",
    ".acct.pro",
    ".actor",
    ".adult",
    ".adult.ht",
    ".aeroport.fr",
    ".af",
    ".ag",
    ".agency",
    ".agro.pl",
    ".aid.pl",
    ".airforce",
    ".alsace",
    ".am",
    ".amsterdam",
    ".apartments",
    ".app",
    ".arc.pro",
    ".archi",
    ".army",
    ".art.ht",
    ".art.sn",
    ".asia",
    ".assedic.fr",
    ".asso.fr",
    ".asso.ht",
    ".associates",
    ".at",
    ".atm.pl",
    ".attorney",
    ".auction",
    ".audio",
    ".augustow.pl",
    ".auto",
    ".auto.pl",
    ".avocat.fr",
    ".avocat.pro",
    ".avoues.fr",
    ".babia-gora.pl",
    ".baby",
    ".band",
    ".bar",
    ".bar.pro",
    ".barcelona",
    ".bargains",
    ".bayern",
    ".bedzin.pl",
    ".beer",
    ".berlin",
    ".beskidy.pl",
    ".bet",
    ".bialowieza.pl",
    ".bialystok.pl",
    ".bible",
    ".bid",
    ".bielawa.pl",
    ".bieszczady.pl",
    ".bike",
    ".bingo",
    ".bio",
    ".biz",
    ".biz.ki",
    ".biz.pl",
    ".black",
    ".blackfriday",
    ".blog",
    ".blue",
    ".bo",
    ".boleslawiec.pl",
    ".boutique",
    ".broker",
    ".brussels",
    ".builders",
    ".bus.pro",
    ".business",
    ".buzz",
    ".bydgoszcz.pl",
    ".bytom.pl",
    ".bz",
    ".ca",
    ".cab",
    ".cafe",
    ".cam",
    ".camera",
    ".camp",
    ".capital",
    ".car",
    ".cards",
    ".care",
    ".career",
    ".careers",
    ".cars",
    ".casa",
    ".cash",
    ".casino",
    ".cat",
    ".catering",
    ".cci.fr",
    ".center",
    ".ceo",
    ".ch",
    ".chambagri.fr",
    ".chat",
    ".cheap",
    ".chi.pro",
    ".chiro.pro",
    ".chirurgiens-dentistes.fr",
    ".church",
    ".cieszyn.pl",
    ".city",
    ".cl",
    ".claims",
    ".cleaning",
    ".clinic",
    ".clothing",
    ".club",
    ".cm",
    ".cn",
    ".co",
    ".co.ag",
    ".co.cm",
    ".co.cr",
    ".co.gg",
    ".co.gy",
    ".co.im",
    ".co.in",
    ".co.je",
    ".co.lc",
    ".co.mg",
    ".co.ms",
    ".co.uk",
    ".coach",
    ".codes",
    ".coffee",
    ".college",
    ".cologne",
    ".com.af",
    ".com.ag",
    ".com.bo",
    ".com.br",
    ".com.cm",
    ".com.co",
    ".com.cu",
    ".com.do",
    ".com.ec",
    ".com.es",
    ".com.fr",
    ".com.gt",
    ".com.gy",
    ".com.hr",
    ".com.ht",
    ".com.im",
    ".com.ki",
    ".com.lc",
    ".com.lv",
    ".com.mg",
    ".com.ms",
    ".com.nf",
    ".com.ni",
    ".com.pa",
    ".com.pe",
    ".com.pl",
    ".com.pt",
    ".com.py",
    ".com.sb",
    ".com.sc",
    ".com.sn",
    ".com.so",
    ".com.tl",
    ".com.tn",
    ".com.uy",
    ".com.vc",
    ".com.ve",
    ".community",
    ".company",
    ".computer",
    ".condos",
    ".construction",
    ".consulting",
    ".contractors",
    ".cooking",
    ".cool",
    ".corsica",
    ".country",
    ".coupons",
    ".courses",
    ".cpa.pro",
    ".cr",
    ".credit",
    ".creditcard",
    ".cricket",
    ".cruises",
    ".cu",
    ".cx",
    ".cymru",
    ".cz",
    ".czeladz.pl",
    ".czest.pl",
    ".dance",
    ".date",
    ".dating",
    ".de",
    ".deals",
    ".degree",
    ".delivery",
    ".democrat",
    ".den.pro",
    ".dent.pro",
    ".dental",
    ".dentist",
    ".desi",
    ".design",
    ".dev",
    ".diamonds",
    ".diet",
    ".digital",
    ".direct",
    ".directory",
    ".discount",
    ".dk",
    ".dlugoleka.pl",
    ".do",
    ".doctor",
    ".dog",
    ".domains",
    ".download",
    ".dzierzoniow.pl",
    ".earth",
    ".ec",
    ".eco",
    ".edu.es",
    ".edu.hn",
    ".edu.ki",
    ".edu.pl",
    ".edu.sn",
    ".education",
    ".elblag.pl",
    ".elk.pl",
    ".email",
    ".energy",
    ".eng.pro",
    ".engineer",
    ".engineering",
    ".ens.tn",
    ".enterprises",
    ".equipment",
    ".es",
    ".estate",
    ".eus",
    ".events",
    ".exchange",
    ".expert",
    ".experts-comptables.fr",
    ".exposed",
    ".express",
    ".fail",
    ".faith",
    ".family",
    ".fans",
    ".farm",
    ".fashion",
    ".feedback",
    ".fi",
    ".film",
    ".fin.tn",
    ".finance",
    ".financial",
    ".firm.ht",
    ".firm.in",
    ".firm.nf",
    ".fish",
    ".fishing",
    ".fit",
    ".fitness",
    ".flights",
    ".florist",
    ".flowers",
    ".fm",
    ".football",
    ".forex",
    ".forsale",
    ".foundation",
    ".fund",
    ".furniture",
    ".futbol",
    ".fyi",
    ".gal",
    ".gallery",
    ".game",
    ".games",
    ".garden",
    ".gay",
    ".gd",
    ".gdn",
    ".gen.in",
    ".geometre-expert.fr",
    ".gg",
    ".gift",
    ".gifts",
    ".gives",
    ".glass",
    ".global",
    ".glogow.pl",
    ".gmbh",
    ".gmina.pl",
    ".gniezno.pl",
    ".gob.es",
    ".gold",
    ".golf",
    ".gorlice.pl",
    ".gouv.fr",
    ".gov.ki",
    ".gov.uk",
    ".grajewo.pl",
    ".graphics",
    ".gratis",
    ".green",
    ".greta.fr",
    ".gripe",
    ".group",
    ".gs",
    ".gsm.pl",
    ".gt",
    ".guide",
    ".guitars",
    ".guru",
    ".gy",
    ".hamburg",
    ".haus",
    ".healthcare",
    ".help",
    ".hiphop",
    ".hiv",
    ".hk",
    ".hn",
    ".hockey",
    ".holdings",
    ".holiday",
    ".horse",
    ".hospital",
    ".host",
    ".hosting",
    ".house",
    ".how",
    ".hr",
    ".ht",
    ".huissier-justice.fr",
    ".icu",
    ".ie",
    ".ilawa.pl",
    ".im",
    ".immo",
    ".immobilien",
    ".in",
    ".ind.in",
    ".ind.tn",
    ".industries",
    ".info.ht",
    ".info.ki",
    ".info.pl",
    ".info.tn",
    ".ink",
    ".institute",
    ".insure",
    ".international",
    ".intl.tn",
    ".investments",
    ".irish",
    ".ist",
    ".istanbul",
    ".it",
    ".jaworzno.pl",
    ".je",
    ".jelenia-gora.pl",
    ".jetzt",
    ".jewelry",
    ".jgora.pl",
    ".jobs",
    ".juegos",
    ".jur.pro",
    ".kalisz.pl",
    ".karpacz.pl",
    ".kartuzy.pl",
    ".kaszuby.pl",
    ".katowice.pl",
    ".kaufen",
    ".kazimierz-dolny.pl",
    ".kepno.pl",
    ".ketrzyn.pl",
    ".ki",
    ".kim",
    ".kitchen",
    ".kiwi",
    ".klodzko.pl",
    ".kobierzyce.pl",
    ".koeln",
    ".kolobrzeg.pl",
    ".konin.pl",
    ".konskowola.pl",
    ".koronowo.pl",
    ".kutno.pl",
    ".kyoto",
    ".l.lc",
    ".la",
    ".land",
    ".lapy.pl",
    ".lat",
    ".law",
    ".law.pro",
    ".lawyer",
    ".lc",
    ".lease",
    ".lebork.pl",
    ".legal",
    ".legnica.pl",
    ".lezajsk.pl",
    ".lgbt",
    ".li",
    ".life",
    ".lighting",
    ".limanowa.pl",
    ".limited",
    ".limo",
    ".loan",
    ".loans",
    ".lol",
    ".lomza.pl",
    ".london",
    ".love",
    ".lowicz.pl",
    ".lt",
    ".ltd",
    ".ltd.uk",
    ".ltda",
    ".lu",
    ".lubin.pl",
    ".lukow.pl",
    ".luxe",
    ".luxury",
    ".lv",
    ".madrid",
    ".mail.pl",
    ".maison",
    ".makeup",
    ".malbork.pl",
    ".malopolska.pl",
    ".management",
    ".market",
    ".marketing",
    ".markets",
    ".mazowsze.pl",
    ".mazury.pl",
    ".mba",
    ".me.uk",
    ".med.pro",
    ".medecin.fr",
    ".media",
    ".media.pl",
    ".melbourne",
    ".memorial",
    ".men",
    ".menu",
    ".mg",
    ".miami",
    ".miasta.pl",
    ".mielec.pl",
    ".mielno.pl",
    ".mil.pl",
    ".min.pro",
    ".mn",
    ".mobi",
    ".mobi.ki",
    ".moda",
    ".moe",
    ".mom",
    ".money",
    ".mortgage",
    ".movie",
    ".mragowo.pl",
    ".ms",
    ".mu",
    ".museum",
    ".nagoya",
    ".naklo.pl",
    ".name",
    ".nat.tn",
    ".navy",
    ".net.af",
    ".net.ag",
    ".net.cm",
    ".net.co",
    ".net.gg",
    ".net.gy",
    ".net.hn",
    ".net.ht",
    ".net.im",
    ".net.in",
    ".net.je",
    ".net.ki",
    ".net.lc",
    ".net.lv",
    ".net.mg",
    ".net.nf",
    ".net.pl",
    ".net.sb",
    ".net.sc",
    ".net.so",
    ".net.tl",
    ".net.tn",
    ".net.uk",
    ".net.vc",
    ".network",
    ".news",
    ".nf",
    ".ni",
    ".nieruchomosci.pl",
    ".ninja",
    ".nl",
    ".nom.ag",
    ".nom.co",
    ".nom.es",
    ".nom.fr",
    ".nom.pl",
    ".notaires.fr",
    ".nowaruda.pl",
    ".nu",
    ".nur.pro",
    ".nurse.pro",
    ".nysa.pl",
    ".okinawa",
    ".olawa.pl",
    ".olecko.pl",
    ".olkusz.pl",
    ".olsztyn.pl",
    ".one",
    ".onl",
    ".ooo",
    ".opoczno.pl",
    ".opole.pl",
    ".org.af",
    ".org.ag",
    ".org.es",
    ".org.gg",
    ".org.hn",
    ".org.ht",
    ".org.im",
    ".org.in",
    ".org.je",
    ".org.ki",
    ".org.lc",
    ".org.lv",
    ".org.mg",
    ".org.ms",
    ".org.pl",
    ".org.sb",
    ".org.sc",
    ".org.sn",
    ".org.so",
    ".org.tl",
    ".org.tn",
    ".org.uk",
    ".org.vc",
    ".organic",
    ".osaka",
    ".ostroda.pl",
    ".ostroleka.pl",
    ".ostrowiec.pl",
    ".ostrowwlkp.pl",
    ".other.nf",
    ".p.lc",
    ".page",
    ".paris",
    ".partners",
    ".parts",
    ".party",
    ".pc.pl",
    ".pe",
    ".perso.ht",
    ".perso.sn",
    ".perso.tn",
    ".pet",
    ".pharma.pro",
    ".pharmacien.fr",
    ".phone.ki",
    ".photo",
    ".photography",
    ".photos",
    ".pics",
    ".pictures",
    ".pila.pl",
    ".pink",
    ".pisz.pl",
    ".pizza",
    ".pl",
    ".place",
    ".plc.uk",
    ".plumbing",
    ".plus",
    ".pm",
    ".podhale.pl",
    ".podlasie.pl",
    ".poker",
    ".pol.ht",
    ".polkowice.pl",
    ".pomorskie.pl",
    ".pomorze.pl",
    ".porn",
    ".port.fr",
    ".powiat.pl",
    ".prd.fr",
    ".press",
    ".presse.fr",
    ".priv.pl",
    ".pro",
    ".pro.ht",
    ".prochowice.pl",
    ".productions",
    ".prof.pro",
    ".promo",
    ".properties",
    ".property",
    ".protection",
    ".pruszkow.pl",
    ".prx.pro",
    ".przeworsk.pl",
    ".pt",
    ".pub",
    ".pulawy.pl",
    ".pw",
    ".quebec",
    ".racing",
    ".radio",
    ".radio.am",
    ".radio.fm",
    ".radom.pl",
    ".rawa-maz.pl",
    ".re",
    ".realestate.pl",
    ".recht.pro",
    ".recipes",
    ".red",
    ".rehab",
    ".reise",
    ".reisen",
    ".rel.ht",
    ".rel.pl",
    ".rel.pro",
    ".rent",
    ".rentals",
    ".repair",
    ".report",
    ".republican",
    ".rest",
    ".restaurant",
    ".review",
    ".reviews",
    ".rich",
    ".rip",
    ".ro",
    ".rocks",
    ".rodeo",
    ".ruhr",
    ".run",
    ".rybnik.pl",
    ".ryukyu",
    ".rzeszow.pl",
    ".saarland",
    ".sale",
    ".salon",
    ".sanok.pl",
    ".sarl",
    ".sb",
    ".sc",
    ".sch.uk",
    ".school",
    ".schule",
    ".science",
    ".scot",
    ".se",
    ".security",
    ".sejny.pl",
    ".services",
    ".sex",
    ".sex.pl",
    ".sexy",
    ".sh",
    ".shiksha",
    ".shoes",
    ".shop.ht",
    ".shop.pl",
    ".shopping",
    ".show",
    ".si",
    ".siedlce.pl",
    ".singles",
    ".ski",
    ".sklep.pl",
    ".skoczow.pl",
    ".slask.pl",
    ".slupsk.pl",
    ".sn",
    ".so",
    ".soccer",
    ".social",
    ".software",
    ".solar",
    ".solutions",
    ".sos.pl",
    ".sosnowiec.pl",
    ".soy",
    ".srl",
    ".stalowa-wola.pl",
    ".starachowice.pl",
    ".stargard.pl",
    ".storage",
    ".stream",
    ".studio",
    ".study",
    ".style",
    ".sucks",
    ".supplies",
    ".supply",
    ".support",
    ".surf",
    ".surgery",
    ".suwalki.pl",
    ".swidnica.pl",
    ".swiebodzin.pl",
    ".swinoujscie.pl",
    ".swiss",
    ".sx",
    ".systems",
    ".szczecin.pl",
    ".szczytno.pl",
    ".szkola.pl",
    ".taipei",
    ".targi.pl",
    ".tarnobrzeg.pl",
    ".tattoo",
    ".tax",
    ".taxi",
    ".teach.pro",
    ".team",
    ".technology",
    ".tel",
    ".tel.ki",
    ".tennis",
    ".tf",
    ".tgory.pl",
    ".theater",
    ".theatre",
    ".tickets",
    ".tienda",
    ".tips",
    ".tires",
    ".tirol",
    ".tl",
    ".tm.fr",
    ".tm.pl",
    ".tn",
    ".today",
    ".tokyo",
    ".tools",
    ".top",
    ".tourism.pl",
    ".tourism.tn",
    ".tours",
    ".town",
    ".toys",
    ".trade",
    ".trading",
    ".training",
    ".travel",
    ".travel.pl",
    ".tube",
    ".turek.pl",
    ".turystyka.pl",
    ".tv",
    ".tw",
    ".tychy.pl",
    ".uk",
    ".univ.sn",
    ".university",
    ".us",
    ".ustka.pl",
    ".uy",
    ".vacations",
    ".vc",
    ".vegas",
    ".ventures",
    ".vet",
    ".vet.pro",
    ".veterinaire.fr",
    ".vg",
    ".viajes",
    ".video",
    ".villas",
    ".vin",
    ".vip",
    ".vision",
    ".vlaanderen",
    ".vodka",
    ".vote",
    ".voto",
    ".voyage",
    ".walbrzych.pl",
    ".wales",
    ".wang",
    ".warmia.pl",
    ".warszawa.pl",
    ".watch",
    ".waw.pl",
    ".web.nf",
    ".webcam",
    ".wedding",
    ".wegrow.pl",
    ".wf",
    ".wielun.pl",
    ".wiki",
    ".win",
    ".wine",
    ".wlocl.pl",
    ".wloclawek.pl",
    ".wlodawa.pl",
    ".wodzislaw.pl",
    ".wolomin.pl",
    ".work",
    ".works",
    ".world",
    ".wroclaw.pl",
    ".ws",
    ".wtf",
    ".八卦",
    ".移动",
    ".орг",
    ".网店",
    ".संगठन",
    ".شبكة",
    ".机构",
    ".تونس",
    ".みんな",
    ".xxx",
    ".yoga",
    ".yokohama",
    ".yt",
    ".zachpomor.pl",
    ".zagan.pl",
    ".zarow.pl",
    ".zgora.pl",
    ".zgorzelec.pl",
    ".zone",
    ".com.ar",
  ],
};

// ============================================================================
// TRANSLATION PLUGIN
// ============================================================================

const TranslationPlugin = {
  install(Vue) {
    Vue.mixin({
      data() {
        return {
          $translation: chrome.i18n,
          $path: chrome.runtime.getURL("/"),
        };
      },

      computed: {
        websiteLocale() {
          return Utils.getWebsiteLocale();
        },
      },
    });

    Vue.prototype.$translation = chrome.i18n;
  },
};

// ============================================================================
// EXPORT FOR USE
// ============================================================================

// Make components available globally if needed
if (typeof window !== "undefined") {
  window.PopupComponent = PopupComponent;
  window.Utils = Utils;
  window.TranslationPlugin = TranslationPlugin;
}
