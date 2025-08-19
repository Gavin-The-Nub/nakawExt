// Basic clone background service worker
// - Per-tab DNR rules to force mobile UA
// - Inject/remove scrollbar CSS
// - Screen recording functionality

const DEVICES = [
  {
    slug: "ip16",
    name: "iphone 16",
    viewport: { width: 393, height: 852 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip16.png",
    screenPct: {
      top: 2.2,
      right: 5,
      bottom: 2.2,
      left: 5,
      radius: 13.0,
      scale: 0.9,
    },
  },
  {
    slug: "mb-air",
    name: "MacBook Air",
    viewport: { width: 1280, height: 800 },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "macOS",
    mockup: "devices/macbook-air.png",
    screenPct: {
      top: 8.0,
      right: 10,
      bottom: 8.0,
      left: 10,
      radius: 1.0,
      scale: 0.8,
    },
  },
  {
    slug: "apple-imac",
    name: `Apple iMac 24"`,
    viewport: { width: 2048, height: 1152 },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "macOS",
    mockup: "devices/apple-imac.png",
    screenPct: { top: 5, right: 0, bottom: 5, left: 0, radius: 3, scale: 0.5 },
  },
  {
    slug: "applewatch",
    name: "Apple Watch Series 6",
    viewport: { width: 162, height: 197 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/applewatch.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3, scale: 1.2 },
  },
  {
    slug: "dell14",
    name: "Dell Latitude",
    viewport: { width: 1440, height: 809 },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "macOS",
    mockup: "devices/dell14.png",
    screenPct: {
      top: 8,
      right: 9,
      bottom: 25,
      left: 9,
      radius: 3,
      scale: 0.65,
    },
  },
  {
    slug: "gpixel5",
    name: "gpixel5",
    viewport: { width: 393, height: 851 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/gpixel5.png",
    screenPct: {
      top: 2,
      right: 4.5,
      bottom: 1,
      left: 4.5,
      radius: 3,
      scale: 0.85,
    },
  },
  {
    slug: "gpixel6",
    name: "gpixel6",
    viewport: { width: 360, height: 780 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/gpixel6.png",
    screenPct: {
      top: 2,
      right: 0,
      bottom: 1,
      left: 0,
      radius: 3,
      scale: 0.85,
    },
  },
  {
    slug: "gpixel8",
    name: "gpixel8",
    viewport: { width: 412, height: 916 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/gpixel8.png",
    screenPct: {
      top: 2,
      right: 2,
      bottom: 1,
      left: 2,
      radius: 3,
      scale: 0.7,
    },
  },
  {
    slug: "hp30",
    name: "hp30",
    viewport: { width: 360, height: 780 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/hp30.png",
    screenPct: {
      top: 2,
      right: 2,
      bottom: 1,
      left: 2,
      radius: 3,
      scale: 0.7,
    },
  },
  {
    slug: "ip11",
    name: "ip11",
    viewport: { width: 414, height: 896 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip11.png",
    screenPct: { top: 4, right: 7, bottom: 3, left: 7, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip11pro",
    name: "ip11pro",
    viewport: { width: 375, height: 812 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip11pro.png",
    screenPct: { top: 3, right: 7, bottom: 3, left: 7, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip11promax",
    name: "ip11promax",
    viewport: { width: 414, height: 896 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip11promax.png",
    screenPct: { top: 2, right: 6, bottom: 2, left: 6, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip12",
    name: "ip12",
    viewport: { width: 390, height: 844 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip12.png",
    screenPct: { top: 2, right: 5, bottom: 2, left: 5, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip12max",
    name: "ip12max",
    viewport: { width: 390, height: 844 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip12max.png",
    screenPct: { top: 2, right: 5, bottom: 2, left: 5, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip12mini",
    name: "ip12mini",
    viewport: { width: 360, height: 780 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip12mini.png",
    screenPct: { top: 2, right: 5, bottom: 2, left: 5, radius: 3, scale: 0.85 },
  },
  {
    slug: "ip12promax",
    name: "ip12promax",
    viewport: { width: 428, height: 926 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip12promax.png",
    screenPct: { top: 2, right: 5, bottom: 2, left: 5, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip13",
    name: "ip13",
    viewport: { width: 390, height: 844 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip13.png",
    screenPct: { top: 2, right: 5, bottom: 2, left: 5, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip13mini",
    name: "ip13mini",
    viewport: { width: 375, height: 812 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip13mini.png",
    screenPct: { top: 2, right: 5, bottom: 2, left: 5, radius: 3, scale: 0.85 },
  },
  {
    slug: "ip13pro",
    name: "ip13pro",
    viewport: { width: 390, height: 844 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip13pro.png",
    screenPct: { top: 2, right: 4, bottom: 2, left: 4, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip13promax",
    name: "ip13promax",
    viewport: { width: 428, height: 926 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip13promax.png",
    screenPct: { top: 2, right: 5, bottom: 2, left: 5, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip14",
    name: "ip14",
    viewport: { width: 390, height: 844 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip14.png",
    screenPct: { top: 2, right: 4, bottom: 2, left: 4, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip14max",
    name: "ip14max",
    viewport: { width: 428, height: 926 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip14max.png",
    screenPct: {
      top: 2,
      right: 4.8,
      bottom: 2,
      left: 5,
      radius: 3,
      scale: 0.9,
    },
  },
  {
    slug: "ip14pro",
    name: "ip14pro",
    viewport: { width: 390, height: 844 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip14pro.png",
    screenPct: { top: 2, right: 5, bottom: 2, left: 5, radius: 3, scale: 0.9 },
  },
  {
    slug: "ip14promax",
    name: "ip14promax",
    viewport: { width: 428, height: 928 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip14promax.png",
    screenPct: {
      top: 2,
      right: 4.9,
      bottom: 2,
      left: 5,
      radius: 3,
      scale: 0.9,
    },
  },
  {
    slug: "ip15",
    name: "ip15",
    viewport: { width: 393, height: 852 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip15.png",
    screenPct: {
      top: 1.8,
      right: 4.5,
      bottom: 1.8,
      left: 4.5,
      radius: 3,
      scale: 0.9,
    },
  },
  {
    slug: "ip15plus",
    name: "ip15plus",
    viewport: { width: 430, height: 932 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip15plus.png",
    screenPct: {
      top: 1.8,
      right: 4.5,
      bottom: 1.8,
      left: 4.5,
      radius: 3,
      scale: 0.9,
    },
  },
  {
    slug: "ip15pro",
    name: "ip15pro",
    viewport: { width: 393, height: 852 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip15pro.png",
    screenPct: {
      top: 1.8,
      right: 4.5,
      bottom: 1.8,
      left: 4.5,
      radius: 4.3,
      scale: 0.9,
    },
  },
  {
    slug: "ip15promax",
    name: "ip15promax",
    viewport: { width: 430, height: 932 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip15promax.png",
    screenPct: {
      top: 1.5,
      right: 4,
      bottom: 1.5,
      left: 4,
      radius: 5,
      scale: 0.9,
    },
  },
  {
    slug: "ip16plus",
    name: "ip16plus",
    viewport: { width: 430, height: 932 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip16plus.png",
    screenPct: {
      top: 2,
      right: 4,
      bottom: 2,
      left: 4,
      radius: 5,
      scale: 0.9,
    },
  },
  {
    slug: "ip16promax",
    name: "ip16promax",
    viewport: { width: 440, height: 956 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip16promax.png",
    screenPct: {
      top: 1.8,
      right: 4,
      bottom: 1.8,
      left: 4,
      radius: 6.5,
      scale: 0.9,
    },
  },
  {
    slug: "ip5",
    name: "ip5",
    viewport: { width: 320, height: 568 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip5.png",
    screenPct: { top: 14, right: 5, bottom: 14, left: 5, radius: 3, scale: 1 },
  },
  {
    slug: "ipad-air",
    name: "ipad air",
    viewport: { width: 820, height: 1180 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipad-air.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ipad-mini",
    name: "ipad mini",
    viewport: { width: 768, height: 1024 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipad-mini.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ipad-pro",
    name: "ipad pro",
    viewport: { width: 834, height: 1194 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipad-pro.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ipse",
    name: "ipse",
    viewport: { width: 320, height: 586 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipse.png",
    screenPct: { top: 12, right: 5, bottom: 12, left: 5, radius: 3, scale: 1 },
  },
  {
    slug: "ipx",
    name: "ipx",
    viewport: { width: 375, height: 812 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipx.png",
    screenPct: {
      top: 2,
      right: 4.5,
      bottom: 2,
      left: 4.5,
      radius: 4.3,
      scale: 0.9,
    },
  },
  {
    slug: "ipxr",
    name: "ipxr",
    viewport: { width: 414, height: 896 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipxr.png",
    screenPct: {
      top: 3.5,
      right: 5.5,
      bottom: 2,
      left: 5.5,
      radius: 4.3,
      scale: 0.9,
    },
  },
  {
    slug: "macbookpro",
    name: "macbookpro",
    viewport: { width: 1728, height: 1085 },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "macOS",
    mockup: "devices/macbookpro.png",
    screenPct: {
      top: 3.5,
      right: 8,
      bottom: 8,
      left: 8,
      radius: 1,
      scale: 0.6,
    },
  },
  {
    slug: "microsoftsurfaceduo",
    name: "microsoftsurfaceduo",
    viewport: { width: 1114, height: 705 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/microsoftsurfaceduo.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "nord2",
    name: "nord2",
    viewport: { width: 412, height: 915 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/nord2.png",
    screenPct: {
      top: 2,
      right: 2,
      bottom: 3,
      left: 2,
      radius: 3,
      scale: 0.7,
    },
  },
  {
    slug: "ofindx3",
    name: "ofindx3",
    viewport: { width: 360, height: 804 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/ofindx3.png",
    screenPct: {
      top: 2,
      right: 2,
      bottom: 3,
      left: 2,
      radius: 3,
    },
  },
  {
    slug: "sgalaxya12",
    name: "sgalaxya12",
    viewport: { width: 360, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxya12.png",
    screenPct: {
      top: 2,
      right: 2,
      bottom: 3,
      left: 2,
      radius: 3,
      scale: 0.7,
    },
  },
  {
    slug: "sgalaxyfold",
    name: "sgalaxyfold",
    viewport: { width: 844, height: 1104 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxyfold.png",
    screenPct: {
      top: 1.8,
      right: 2,
      bottom: 1.8,
      left: 2,
      radius: 3,
      scale: 0.6,
    },
  },
  {
    slug: "sgalaxynote20ultra",
    name: "sgalaxynote20ultra",
    viewport: { width: 360, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "special",
    mockup: "devices/sgalaxynote20ultra.png",
    screenPct: {
      top: 0,
      right: 0.5,
      bottom: 2,
      left: 0,
      radius: 3,
      scale: 0.8,
    },
  },
  {
    slug: "sgalaxys12ultra",
    name: "sgalaxys12ultra",
    viewport: { width: 412, height: 883 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys12ultra.png",
    screenPct: {
      top: 1.4,
      right: 2,
      bottom: 2,
      left: 2,
      radius: 3,
      scale: 0.7,
    },
  },
  {
    slug: "sgalaxys20",
    name: "sgalaxys20",
    viewport: { width: 360, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys20.png",
    screenPct: { top: 1, right: 4, bottom: 1, left: 4, radius: 3 },
  },
  {
    slug: "sgalaxys22",
    name: "sgalaxys22",
    viewport: { width: 360, height: 780 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys22.png",
    screenPct: { top: 1, right: 4, bottom: 1, left: 4, radius: 3 },
  },
  {
    slug: "sgalaxys22plus",
    name: "sgalaxys22plus",
    viewport: { width: 360, height: 780 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys22plus.png",
    screenPct: { top: 1, right: 4, bottom: 1, left: 3.8, radius: 3 },
  },
  {
    slug: "sgalaxys22ultra",
    name: "sgalaxys22ultra",
    viewport: { width: 360, height: 772 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys22ultra.png",
    screenPct: { top: 0, right: 1, bottom: 0, left: 1, radius: 3 },
  },
  {
    slug: "sgalaxys24",
    name: "sgalaxys24",
    viewport: { width: 360, height: 780 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys24.png",
    screenPct: { top: 1, right: 4, bottom: 1, left: 3.3, radius: 3 },
  },
  {
    slug: "sgalaxys24ultra",
    name: "sgalaxys24ultra",
    viewport: { width: 384, height: 832 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys24ultra.png",
    screenPct: { top: 1, right: 4.5, bottom: 1, left: 4, radius: 3 },
  },
  {
    slug: "sgalaxytabs7",
    name: "sgalaxytabs7",
    viewport: { width: 800, height: 1280 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxytabs7.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxyzflip",
    name: "sgalaxyzflip",
    viewport: { width: 360, height: 880 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxyzflip.png",
    screenPct: { top: 2, right: 5, bottom: 2, left: 5, radius: 3 },
  },
  {
    slug: "ssmarttv",
    name: "ssmarttv",
    viewport: { width: 1920, height: 1080 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/ssmarttv.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "undefined-medium_upscaled",
    name: "undefined medium upscaled",
    viewport: { width: 360, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/undefined-medium_upscaled.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "x12",
    name: "x12",
    viewport: { width: 360, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/x12.png",
    screenPct: { top: 1.5, right: 2, bottom: 2, left: 2, radius: 3 },
  },
  {
    slug: "xm11i",
    name: "xm11i",
    viewport: { width: 360, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/xm11i.png",
    screenPct: { top: 2, right: 2, bottom: 2, left: 2, radius: 3 },
  },
];

function getDeviceBySlug(slug) {
  return DEVICES.find((d) => d.slug === slug) || DEVICES[0];
}

const tabState = {};

function storageArea() {
  // Prefer session storage when available; fall back to local
  return chrome.storage && chrome.storage.session
    ? chrome.storage.session
    : chrome.storage.local;
}

function stateKey(tabId) {
  return `tabState_${tabId}`;
}

async function loadState(tabId) {
  const key = stateKey(tabId);
  const area = storageArea();
  const data = await area.get(key);
  const state = data[key] || {
    mobile: true, // Changed default to true
    showScrollbar: false, // Changed default to false
    simulator: true, // Changed default to true - auto-show simulator
    deviceSlug: "ip16", // Set iphone 16 as default
  };
  tabState[tabId] = state;
  return state;
}

async function saveState(tabId) {
  const key = stateKey(tabId);
  const area = storageArea();
  const value = {};
  value[key] = tabState[tabId] || {
    mobile: true, // Changed default to true
    showScrollbar: false, // Changed default to false
    simulator: true, // Changed default to true - auto-show simulator
    deviceSlug: "ip16", // Set iphone 16 as default
  };
  await area.set(value);
}

async function removeState(tabId) {
  const key = stateKey(tabId);
  const area = storageArea();
  await area.remove(key);
}

function toInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return i;
}

function ruleIdsForTab(tabId) {
  // Ensure stable unique 32-bit integer rule IDs per tab
  const base = toInt(tabId, 0) | 0; // force 32-bit
  const reqRuleId = (base << 2) + 101;
  const resRuleId = (base << 2) + 102;
  return { reqRuleId: toInt(reqRuleId), resRuleId: toInt(resRuleId) };
}

async function enableMobileHeaders(tabId) {
  const { reqRuleId, resRuleId } = ruleIdsForTab(tabId);
  const state = await loadState(tabId);
  const device = getDeviceBySlug(state.deviceSlug);
  try {
    const removeIds = [toInt(reqRuleId), toInt(resRuleId)].filter(
      (id) => Number.isInteger(id) && id > 0
    );
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: removeIds,
      addRules: [
        {
          id: toInt(reqRuleId),
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              { header: "user-agent", operation: "set", value: device.ua },
              { header: "sec-ch-ua", operation: "remove" },
              { header: "sec-ch-ua-arch", operation: "remove" },
              { header: "sec-ch-ua-bitness", operation: "remove" },
              { header: "sec-ch-ua-full-version-list", operation: "remove" },
              { header: "sec-ch-ua-model", operation: "remove" },
              { header: "sec-ch-ua-platform-version", operation: "remove" },
              { header: "sec-ch-ua-mobile", operation: "set", value: "?1" },
              {
                header: "sec-ch-ua-platform",
                operation: "set",
                value: device.platform === "iOS" ? "iOS" : "Android",
              },
            ],
          },
          condition: {
            tabIds: [toInt(tabId)].filter((v) => Number.isInteger(v)),
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "stylesheet",
              "script",
              "image",
              "object",
              "xmlhttprequest",
              "other",
            ],
          },
        },
        {
          id: toInt(resRuleId),
          priority: 1,
          action: {
            type: "modifyHeaders",
            responseHeaders: [
              { header: "content-security-policy", operation: "remove" },
              { header: "x-frame-options", operation: "remove" },
            ],
          },
          condition: {
            tabIds: [toInt(tabId)].filter((v) => Number.isInteger(v)),
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "stylesheet",
              "script",
              "image",
              "object",
              "xmlhttprequest",
              "other",
            ],
          },
        },
      ],
    });
  } catch (err) {
    console.error("enableMobileHeaders error", err);
  }
}

async function disableMobileHeaders(tabId) {
  const { reqRuleId, resRuleId } = ruleIdsForTab(tabId);
  try {
    const removeIds = [toInt(reqRuleId), toInt(resRuleId)].filter(
      (id) => Number.isInteger(id) && id > 0
    );
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: removeIds,
    });
  } catch (err) {
    console.error("disableMobileHeaders error", err);
  }
}

// Remove Debugger UA override approach to avoid banner

function toMobileUrlIfLikely(urlString) {
  try {
    const url = new URL(urlString);
    const host = url.hostname;
    if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host))
      return urlString;
    if (host.startsWith("m.")) return urlString;
    // Do not force m. automatically; respect existing URL
    return urlString;
  } catch (_) {}
  return urlString;
}

async function applyScrollbar(tabId, show) {
  // inject CSS that properly controls scrollbar visibility
  let css;
  if (show) {
    // Show scrollbar with proper styling
    css = `
      html, body {
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      ::-webkit-scrollbar {
        background: transparent;
        width: 13px !important;
        height: 13px !important;
      }
      ::-webkit-scrollbar-thumb {
        border: solid 3px transparent;
        background-clip: content-box;
        border-radius: 17px;
      }
    `;
  } else {
    // Completely hide scrollbar but keep scrolling functional
    css = `
      html, body {
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      ::-webkit-scrollbar {
        background: transparent;
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
        display: none !important;
      }
      ::-webkit-scrollbar-thumb {
        background: transparent;
        display: none !important;
      }
      ::-webkit-scrollbar-corner {
        background: transparent;
        display: none !important;
      }
      ::-webkit-scrollbar-button {
        display: none !important;
      }
    `;
  }

  try {
    // Remove any existing scrollbar CSS first
    await chrome.scripting.removeCSS({
      target: { tabId, allFrames: true },
      css: "html,body{overflow-y:auto !important;overflow-x:hidden !important}::-webkit-scrollbar{background:transparent;width:13px !important;height:13px !important}::-webkit-scrollbar-thumb{border:solid 3px transparent;background-clip:content-box;border-radius:17px}",
    });
  } catch (_) {}

  try {
    await chrome.scripting.removeCSS({
      target: { tabId, allFrames: true },
      css: "html,body{overflow-y:auto !important;overflow-x:hidden !important}::-webkit-scrollbar{background:transparent;width:0 !important;height:0 !important}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:transparent}",
    });
  } catch (_) {}

  await chrome.scripting.insertCSS({
    target: { tabId, allFrames: true },
    css,
  });
}

async function showSimulator(tabId, state) {
  try {
    // Inject the device panel content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["device-panel.js"],
    });

    await chrome.scripting.insertCSS({
      target: { tabId },
      css: `
        #__mf_simulator_overlay__{position:fixed;inset:0;background:#FFFF;z-index:2147483647;display:flex;align-items:center;justify-content:center}
        #__mf_simulator_frame__{position:relative;display:inline-block;overflow:hidden;background: transparent;}
        
        /* Completely hide main page scrollbar when simulator is active */
        html, body {
          overflow: hidden !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        ::-webkit-scrollbar-track {
          display: none !important;
        }
        ::-webkit-scrollbar-thumb {
          display: none !important;
        }
        ::-webkit-scrollbar-corner {
          display: none !important;
        }
        ::-webkit-scrollbar-button {
          display: none !important;
        }
      `,
    });
  } catch (_) {}

  const device = getDeviceBySlug(state.deviceSlug);
  if (device) {
    console.log(device);
  }

  const tab = await chrome.tabs.get(tabId);

  await chrome.scripting.executeScript({
    target: { tabId },
    func: ({ w, h, deviceName, mockupPath, deviceScreenPct }) => {
      const prev = document.getElementById("__mf_simulator_overlay__");
      if (prev) prev.remove();

      const overlay = document.createElement("div");
      overlay.id = "__mf_simulator_overlay__";

      // Create mockup container with proper styling
      const mockupContainer = document.createElement("div");
      mockupContainer.id = "__mf_simulator_frame__";
      mockupContainer.style.position = "relative";
      mockupContainer.style.display = "inline-block";
      mockupContainer.style.width = String(w) + "px";
      mockupContainer.style.height = String(h) + "px";
      mockupContainer.style.scale = String(deviceScreenPct?.scale || 0.7);
      mockupContainer.style.overflow = "hidden";

      // Create mockup image with proper sizing (will sit below content)
      const mockupImg = document.createElement("img");
      mockupImg.src = chrome.runtime.getURL(mockupPath);
      mockupImg.style.width = String(w) + "px";
      mockupImg.style.height = String(h) + "px";
      mockupImg.style.display = "block";
      mockupImg.style.position = "absolute";
      mockupImg.style.top = "0";
      mockupImg.style.left = "0";
      mockupImg.style.zIndex = "5"; // mockup above iframe for bezel overlay
      mockupImg.style.pointerEvents = "none";

      // Screen container that clips the iframe to the device screen area using percentage insets
      const pct = deviceScreenPct || {
        top: 10,
        right: 6,
        bottom: 10,
        left: 6,
        radius: 3,
        scale: 0.7,
      };
      const preset = {
        x: Math.round((pct.left / 100) * w),
        y: Math.round((pct.top / 100) * h),
        w: Math.max(0, Math.round(w - ((pct.left + pct.right) / 100) * w)),
        h: Math.max(0, Math.round(h - ((pct.top + pct.bottom) / 100) * h)),
        radius: Math.round((pct.radius / 100) * Math.min(w, h)),
      };

      const iframeContainer = document.createElement("div");
      iframeContainer.style.position = "absolute";
      iframeContainer.style.top = String(preset.y) + "px";
      iframeContainer.style.left = String(preset.x) + "px";
      iframeContainer.style.width = String(preset.w) + "px";
      iframeContainer.style.height = String(preset.h) + "px";
      iframeContainer.style.overflow = "hidden"; // critical for clipping
      iframeContainer.style.borderRadius = String(preset.radius) + "px";

      // Build an SVG clipPath so we can support more complex shapes later (e.g., notches)
      const maskId =
        "__mf_viewport_mask__" + Math.random().toString(36).slice(2);
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "0");
      svg.setAttribute("height", "0");
      svg.style.position = "absolute";
      svg.style.width = "0";
      svg.style.height = "0";
      const defs = document.createElementNS(svgNS, "defs");
      const clip = document.createElementNS(svgNS, "clipPath");
      clip.setAttribute("id", maskId);
      // Use userSpaceOnUse so the rect dimensions match the element's pixel box
      clip.setAttribute("clipPathUnits", "userSpaceOnUse");
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", String(preset.w));
      rect.setAttribute("height", String(preset.h));
      rect.setAttribute("rx", String(preset.radius));
      rect.setAttribute("ry", String(preset.radius));
      clip.appendChild(rect);
      defs.appendChild(clip);
      svg.appendChild(defs);
      overlay.appendChild(svg);

      // Apply the clip-path via URL reference
      iframeContainer.style.clipPath = `url(#${maskId})`;
      iframeContainer.style.webkitClipPath = `url(#${maskId})`;
      iframeContainer.style.zIndex = "1"; // behind mockup, acts as clipping area

      // Create iframe positioned to fill the screen container
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.border = "none";
      iframe.style.background = "transparent";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.zIndex = "2"; // below mockup, above container background
      iframe.sandbox =
        "allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-popups";
      iframe.src = window.location.href;

      // Add CSS to iframe to hide scrollbars after it loads
      iframe.onload = function () {
        try {
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow.document;
          const style = iframeDoc.createElement("style");
          style.textContent = `
            html, body {
              overflow: auto !important;
            }
            ::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            ::-webkit-scrollbar-track {
              display: none !important;
            }
            ::-webkit-scrollbar-thumb {
              display: none !important;
            }
            ::-webkit-scrollbar-corner {
              display: none !important;
            }
            ::-webkit-scrollbar-button {
              display: none !important;
            }
          `;
          iframeDoc.head.appendChild(style);
        } catch (e) {
          // Cross-origin iframe, can't inject CSS
          console.log("Cannot inject CSS into cross-origin iframe");
        }
      };

      iframeContainer.appendChild(iframe);
      mockupContainer.appendChild(mockupImg);
      mockupContainer.appendChild(iframeContainer);

      // Create portrait navigation bar on the right side
      const navBar = document.createElement("div");
      navBar.id = "__mf_simulator_nav__";
      navBar.style.position = "fixed";
      navBar.style.right = "20px";
      navBar.style.top = "50%";
      navBar.style.transform = "translateY(-50%)";
      navBar.style.display = "flex";
      navBar.style.flexDirection = "column";
      navBar.style.gap = "15px";
      navBar.style.zIndex = "2147483648";
      navBar.style.alignItems = "center";

      // Close button
      const closeBtn = document.createElement("button");
      closeBtn.id = "__mf_simulator_close_btn__";
      closeBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      closeBtn.style.width = "50px";
      closeBtn.style.height = "50px";
      closeBtn.style.borderRadius = "50%";
      closeBtn.style.background = "rgba(51, 51, 51, 0.9)";
      closeBtn.style.border = "none";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.display = "flex";
      closeBtn.style.alignItems = "center";
      closeBtn.style.justifyContent = "center";
      closeBtn.style.transition = "all 0.2s ease";
      closeBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

      closeBtn.onmouseenter = () => {
        closeBtn.style.background = "rgba(85, 85, 85, 0.9)";
        closeBtn.style.transform = "scale(1.1)";
      };

      closeBtn.onmouseleave = () => {
        closeBtn.style.background = "rgba(51, 51, 51, 0.9)";
        closeBtn.style.transform = "scale(1)";
      };

      closeBtn.onclick = () => {
        // Immediate UI cleanup
        overlay.remove();
        navBar.remove();
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";

        // Ask background to fully deactivate for this tab
        try {
          chrome.runtime.sendMessage({ type: "DEACTIVATE_FOR_TAB" });
        } catch (_) {}
      };

      // Change device button
      const deviceBtn = document.createElement("button");
      deviceBtn.id = "__mf_simulator_device_btn__";
      deviceBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 18H12.01M8 21H16C17.1046 21 18 20.1046 18 19V5C18 3.89543 17.1046 3 16 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21ZM12 18C12 18.5523 11.5523 19 11 19C10.4477 19 10 18.5523 10 18C10 17.4477 10.4477 17 11 17C11.5523 17 12 17.4477 12 18Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      deviceBtn.style.width = "50px";
      deviceBtn.style.height = "50px";
      deviceBtn.style.borderRadius = "50%";
      deviceBtn.style.background = "rgba(51, 51, 51, 0.9)";
      deviceBtn.style.border = "none";
      deviceBtn.style.cursor = "pointer";
      deviceBtn.style.display = "flex";
      deviceBtn.style.alignItems = "center";
      deviceBtn.style.justifyContent = "center";
      deviceBtn.style.transition = "all 0.2s ease";
      deviceBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

      deviceBtn.onmouseenter = () => {
        deviceBtn.style.background = "rgba(85, 85, 85, 0.9)";
        deviceBtn.style.transform = "scale(1.1)";
      };

      deviceBtn.onmouseleave = () => {
        deviceBtn.style.background = "rgba(51, 51, 51, 0.9)";
        deviceBtn.style.transform = "scale(1)";
      };

      deviceBtn.onclick = () => {
        // Show device selection panel
        chrome.runtime.sendMessage({
          type: "SHOW_DEVICE_PANEL",
        });
      };

      // --- Screenshot button ---
      const screenshotBtn = document.createElement("button");
      screenshotBtn.id = "__mf_simulator_screenshot_btn__";
      screenshotBtn.title = "Screenshot";
      screenshotBtn.innerHTML = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="7" width="18" height="13" rx="2" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="13.5" r="1.6" fill="white"/>
  </svg>
`;
      screenshotBtn.style.width = "50px";
      screenshotBtn.style.height = "50px";
      screenshotBtn.style.borderRadius = "50%";
      screenshotBtn.style.background = "rgba(51, 51, 51, 0.9)";
      screenshotBtn.style.border = "none";
      screenshotBtn.style.cursor = "pointer";
      screenshotBtn.style.display = "flex";
      screenshotBtn.style.alignItems = "center";
      screenshotBtn.style.justifyContent = "center";
      screenshotBtn.style.transition = "all 0.16s ease";
      screenshotBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

      screenshotBtn.onmouseenter = () => {
        screenshotBtn.style.background = "rgba(85,85,85,0.95)";
        screenshotBtn.style.transform = "scale(1.08)";
      };
      screenshotBtn.onmouseleave = () => {
        screenshotBtn.style.background = "rgba(51,51,51,0.9)";
        screenshotBtn.style.transform = "scale(1)";
      };

      // handler: request background to capture, crop, then show menu: download / copy
      screenshotBtn.onclick = () => {
        const frameEl = document.getElementById("__mf_simulator_frame__");
        if (!frameEl) return alert("Simulator frame not found.");

        const rect = frameEl.getBoundingClientRect(); // relative to viewport
        const dpr = window.devicePixelRatio || 1;

        // Ask background to capture the visible tab as PNG dataUrl
        chrome.runtime.sendMessage({ type: "CAPTURE_TAB" }, async (resp) => {
          if (!resp || !resp.ok) {
            console.error("Capture failed", resp && resp.error);
            return alert(
              "Screenshot failed: " +
                (resp && resp.error ? resp.error : "unknown")
            );
          }

          const dataUrl = resp.dataUrl;
          const img = new Image();
          img.onload = async () => {
            try {
              // Create canvas sized to the target region in device pixels
              const cw = Math.round(rect.width * dpr);
              const ch = Math.round(rect.height * dpr);
              const sx = Math.round(rect.left * dpr);
              const sy = Math.round(rect.top * dpr);

              const canvas = document.createElement("canvas");
              canvas.width = cw;
              canvas.height = ch;
              const ctx = canvas.getContext("2d");

              // Draw the captured full-image then crop
              ctx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);

              // Convert to blob
              canvas.toBlob(async (blob) => {
                if (!blob) {
                  return alert("Failed to create screenshot blob.");
                }

                // Build a small floating menu next to the navBar
                const menu = document.createElement("div");
                menu.style.position = "fixed";
                menu.style.right = "86px"; // slightly left of buttons
                menu.style.top = "50%";
                menu.style.transform = "translateY(-50%)";
                menu.style.zIndex = "2147483650";
                menu.style.display = "flex";
                menu.style.flexDirection = "column";
                menu.style.gap = "8px";
                menu.style.padding = "10px";
                menu.style.borderRadius = "10px";
                menu.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
                menu.style.background = "rgba(30,30,30,0.95)";
                menu.style.color = "white";
                menu.style.alignItems = "center";

                const downloadBtn = document.createElement("button");
                downloadBtn.textContent = "Download";
                downloadBtn.style.padding = "8px 12px";
                downloadBtn.style.border = "none";
                downloadBtn.style.borderRadius = "8px";
                downloadBtn.style.cursor = "pointer";

                const copyBtn = document.createElement("button");
                copyBtn.textContent = "Copy";
                copyBtn.style.padding = "8px 12px";
                copyBtn.style.border = "none";
                copyBtn.style.borderRadius = "8px";
                copyBtn.style.cursor = "pointer";

                const closeBtnSmall = document.createElement("button");
                closeBtnSmall.textContent = "Close";
                closeBtnSmall.style.padding = "6px 10px";
                closeBtnSmall.style.border = "none";
                closeBtnSmall.style.borderRadius = "8px";
                closeBtnSmall.style.cursor = "pointer";

                // Download behavior
                downloadBtn.onclick = () => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "mockup-screenshot.png";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  setTimeout(() => URL.revokeObjectURL(url), 5000);
                  menu.remove();
                };

                // Copy behavior (Clipboard API)
                copyBtn.onclick = async () => {
                  try {
                    // ClipboardItem requires a Blob
                    await navigator.clipboard.write([
                      new ClipboardItem({ "image/png": blob }),
                    ]);
                    // small visual confirmation
                    copyBtn.textContent = "Copied!";
                    setTimeout(() => {
                      try {
                        copyBtn.textContent = "Copy";
                      } catch (e) {}
                      menu.remove();
                    }, 900);
                  } catch (err) {
                    console.error("Copy failed", err);
                    alert(
                      "Copy to clipboard failed: " +
                        (err && err.message ? err.message : err)
                    );
                  }
                };

                closeBtnSmall.onclick = () => menu.remove();

                menu.appendChild(downloadBtn);
                menu.appendChild(copyBtn);
                menu.appendChild(closeBtnSmall);
                document.body.appendChild(menu);

                // Auto-remove menu if user clicks elsewhere
                const onDocClick = (ev) => {
                  if (
                    !menu.contains(ev.target) &&
                    ev.target !== screenshotBtn
                  ) {
                    menu.remove();
                    document.removeEventListener("mousedown", onDocClick);
                  }
                };
                document.addEventListener("mousedown", onDocClick);
              }, "image/png");
            } catch (e) {
              console.error("Processing failed", e);
              alert("Screenshot processing failed: " + e.message);
            }
          };
          img.onerror = (e) => {
            console.error("Image load error", e);
            alert("Failed to load captured image.");
          };
          img.src = dataUrl;
        });
      };

      // --- Screen Recording button ---
      const recordingBtn = document.createElement("button");
      recordingBtn.id = "__mf_simulator_recording_btn__";
      recordingBtn.title = "Screen Recording";
      recordingBtn.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
      `;
      recordingBtn.style.width = "50px";
      recordingBtn.style.height = "50px";
      recordingBtn.style.borderRadius = "50%";
      recordingBtn.style.background = "rgba(51, 51, 51, 0.9)";
      recordingBtn.style.border = "none";
      recordingBtn.style.cursor = "pointer";
      recordingBtn.style.display = "flex";
      recordingBtn.style.alignItems = "center";
      recordingBtn.style.justifyContent = "center";
      recordingBtn.style.transition = "all 0.16s ease";
      recordingBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

      recordingBtn.onmouseenter = () => {
        recordingBtn.style.background = "rgba(85,85,85,0.95)";
        recordingBtn.style.transform = "scale(1.08)";
      };
      recordingBtn.onmouseleave = () => {
        recordingBtn.style.background = "rgba(51,51,51,0.9)";
        recordingBtn.style.transform = "scale(1)";
      };

      // Check recording status and update button appearance
      let isRecording = false;

      const updateRecordingButton = () => {
        if (isRecording) {
          recordingBtn.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="12" height="12" fill="white"/>
            </svg>
          `;
          recordingBtn.style.background = "rgba(220, 53, 69, 0.9)"; // Red when recording
          recordingBtn.title = "Stop Recording";
        } else {
          recordingBtn.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" stroke-width="1.5"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `;
          recordingBtn.style.background = "rgba(51, 51, 51, 0.9)";
          recordingBtn.title = "Start Recording";
        }
      };

      // Check initial recording status
      chrome.runtime.sendMessage(
        { type: "GET_RECORDING_STATUS" },
        (response) => {
          if (response && response.isRecording) {
            isRecording = true;
            updateRecordingButton();
          }
        }
      );

      // Recording button click handler
      recordingBtn.onclick = async () => {
        if (isRecording) {
          // Stop recording
          try {
            const response = await chrome.runtime.sendMessage({
              type: "STOP_SCREEN_RECORDING",
            });
            if (response && response.success) {
              isRecording = false;
              updateRecordingButton();
            } else {
              alert(
                "Failed to stop recording: " +
                  (response?.error || "Unknown error")
              );
            }
          } catch (error) {
            console.error("Stop recording error:", error);
            alert("Failed to stop recording: " + error.message);
          }
        } else {
          // Start recording
          try {
            const response = await chrome.runtime.sendMessage({
              type: "START_SCREEN_RECORDING",
            });
            if (response && response.success) {
              isRecording = true;
              updateRecordingButton();
            } else {
              alert(
                "Failed to start recording: " +
                  (response?.error || "Unknown error")
              );
            }
          } catch (error) {
            console.error("Start recording error:", error);
            alert("Failed to start recording: " + error.message);
          }
        }
      };

      // Add buttons to navigation bar
      navBar.appendChild(closeBtn);
      navBar.appendChild(deviceBtn);
      navBar.appendChild(screenshotBtn);
      navBar.appendChild(recordingBtn);

      overlay.appendChild(mockupContainer);
      document.body.appendChild(overlay);
      document.body.appendChild(navBar);
    },
    args: [
      {
        w: device.viewport.width,
        h: device.viewport.height,
        deviceName: device.name,
        mockupPath: device.mockup,
        deviceScreenPct: device.screenPct,
      },
    ],
  });
}

async function hideSimulator(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const el = document.getElementById("__mf_simulator_overlay__");
      const navBar = document.getElementById("__mf_simulator_nav__");
      if (el) el.remove();
      if (navBar) navBar.remove();

      // Restore main page scrolling
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    },
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SET_DEVICE_FOR_TAB") {
    const tabId = sender.tab.id; // 🚨 if `sender.tab` is undefined (like from sidebar), this will fail
    tabState[tabId] = { deviceSlug: message.deviceSlug };
    showSimulator(tabId, tabState[tabId]);
  }
});

// Listen for device change requests from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg && msg.type === "DEACTIVATE_FOR_TAB") {
      try {
        const tabId = sender?.tab?.id;
        if (typeof tabId === "number") {
          // Load and mark simulator off; clear state so we don't auto-apply
          const state = await loadState(tabId);
          state.simulator = false;
          state.showScrollbar = false;
          tabState[tabId] = state;
          await saveState(tabId);

          // Remove overlays/UI and CSS
          await hideSimulator(tabId);
          await applyScrollbar(tabId, false);

          // Remove UA/header overrides
          await disableMobileHeaders(tabId);

          // Finally, remove state so reapply on updated/startup won't trigger
          delete tabState[tabId];
          await removeState(tabId);
        }
      } catch (e) {
        console.error("DEACTIVATE_FOR_TAB error", e);
      }
      sendResponse({ ok: true });
      return;
    } // Background/service worker: capture visible tab and return dataUrl
    if (msg && msg.type === "CAPTURE_TAB") {
      (async () => {
        try {
          // captureVisibleTab uses the currently focused window; null is fine
          chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.error("captureVisibleTab err", chrome.runtime.lastError);
              sendResponse({
                ok: false,
                error: chrome.runtime.lastError.message,
              });
              return;
            }
            sendResponse({ ok: true, dataUrl });
          });
        } catch (e) {
          console.error("CAPTURE_TAB error", e);
          sendResponse({ ok: false, error: e.message });
        }
      })();
      return true; // keep message channel open for async sendResponse
    }

    if (msg && msg.type === "DEVICE_CHANGE_REQUEST") {
      const tabId = sender.tab.id;
      const deviceSlug = msg.deviceSlug;
      await loadState(tabId);
      tabState[tabId].deviceSlug = deviceSlug;
      await saveState(tabId);
      if (tabState[tabId].mobile) {
        // re-apply UA with the new device
        await enableMobileHeaders(tabId);
      }
      // Refresh simulator with new device if it's active
      if (tabState[tabId].simulator) {
        await showSimulator(tabId, tabState[tabId]);
      }
      sendResponse({ ok: true });
      return;
    }
    if (msg && msg.type === "SHOW_DEVICE_PANEL") {
      const tabId = sender.tab.id;
      // Send message to content script to show device panel
      try {
        await chrome.tabs.sendMessage(tabId, { type: "SHOW_DEVICE_PANEL" });
        sendResponse({ ok: true });
      } catch (e) {
        console.error("Failed to show device panel:", e);
        sendResponse({ ok: false, error: e.message });
      }
      return;
    }

    // Frame capture message handlers
    if (msg && msg.type === "mf-request-frame-capture") {
      const { tabId, frameRate } = msg;
      startFrameCapture(tabId, frameRate);
      sendResponse({ success: true });
      return;
    }

    // Screen recording message handlers
    if (msg && msg.type === "START_SCREEN_RECORDING") {
      const tabId = sender.tab.id;
      try {
        const result = await startScreenRecording(tabId);
        sendResponse(result);
      } catch (e) {
        console.error("Start recording error:", e);
        sendResponse({ success: false, error: e.message });
      }
      return;
    }

    if (msg && msg.type === "STOP_SCREEN_RECORDING") {
      const tabId = sender.tab.id;
      try {
        const result = await stopScreenRecording(tabId);
        sendResponse(result);
      } catch (e) {
        console.error("Stop recording error:", e);
        sendResponse({ success: false, error: e.message });
      }
      return;
    }

    if (msg && msg.type === "GET_RECORDING_STATUS") {
      const tabId = sender.tab.id;
      const isRecording = recordingTabs.has(tabId);
      sendResponse({ isRecording });
      return;
    }

    if (msg && msg.type === "INITIATE_VIDEO_DOWNLOAD") {
      const videoUrl = msg.videoUrl;
      if (videoUrl) {
        chrome.downloads.download({
          url: videoUrl,
          filename: `screen-recording-${Date.now()}.webm`,
          saveAs: true,
        });
      }
      sendResponse({ success: true });
      return;
    }
    if (msg && msg.type === "TOGGLE_MOBILE_FOR_TAB") {
      const tabId = msg.tabId;
      await loadState(tabId);
      tabState[tabId].mobile = !tabState[tabId].mobile;
      if (tabState[tabId].mobile) await enableMobileHeaders(tabId);
      else await disableMobileHeaders(tabId);
      await saveState(tabId);
      try {
        const tab = await chrome.tabs.get(tabId);
        const targetUrl = toMobileUrlIfLikely(tab.url);
        if (targetUrl !== tab.url) {
          await chrome.tabs.update(tabId, { url: targetUrl });
        } else {
          await chrome.tabs.reload(tabId);
        }
      } catch (_) {}
      sendResponse({ mobile: tabState[tabId].mobile });
      return;
    }
    if (msg && msg.type === "TOGGLE_SCROLLBAR_FOR_TAB") {
      const tabId = msg.tabId;
      await loadState(tabId);
      tabState[tabId].showScrollbar = !tabState[tabId].showScrollbar;
      await applyScrollbar(tabId, tabState[tabId].showScrollbar);
      await saveState(tabId);
      sendResponse({
        showScrollbar: tabState[tabId].showScrollbar,
        mobile: tabState[tabId].mobile,
        simulator: tabState[tabId].simulator,
        deviceSlug: tabState[tabId].deviceSlug,
      });
      return;
    }
    if (msg && msg.type === "GET_TAB_STATE") {
      const tabId = msg.tabId;
      const state = await loadState(tabId);
      sendResponse({
        mobile: state.mobile,
        showScrollbar: state.showScrollbar,
        deviceSlug: state.deviceSlug,
        simulator: state.simulator,
      });
      return;
    }
    if (msg && msg.type === "SET_DEVICE_FOR_TAB") {
      const { tabId, deviceSlug } = msg;
      await loadState(tabId);
      tabState[tabId].deviceSlug = deviceSlug;
      await saveState(tabId);
      if (tabState[tabId].mobile) {
        // re-apply UA with the new device
        await enableMobileHeaders(tabId);
      }
      // Refresh simulator with new device if it's active
      if (tabState[tabId].simulator) {
        await showSimulator(tabId, tabState[tabId]);
      }
      sendResponse({ ok: true });
      return true;
    }
    if (msg && msg.type === "TOGGLE_SIMULATOR_FOR_TAB") {
      const { tabId } = msg;
      const state = await loadState(tabId);
      state.simulator = !state.simulator;
      tabState[tabId] = state;
      await saveState(tabId);
      if (state.simulator) {
        try {
          await showSimulator(tabId, state);
        } catch (_) {}
      } else {
        try {
          await hideSimulator(tabId);
        } catch (_) {}
      }
      sendResponse({
        simulator: state.simulator,
        mobile: state.mobile,
        showScrollbar: state.showScrollbar,
        deviceSlug: state.deviceSlug,
      });
      return;
    }
    if (msg && msg.type === "ACTIVATE_SIMULATOR_FOR_TAB") {
      const { tabId } = msg;
      const state = await loadState(tabId);
      // Ensure simulator is enabled and show it ONLY for this tab
      state.simulator = true;
      state.showScrollbar = false; // Always hide scrollbars
      tabState[tabId] = state;
      await saveState(tabId);
      try {
        await showSimulator(tabId, state);
        // Apply hidden scrollbars
        await applyScrollbar(tabId, false);
      } catch (_) {}
      sendResponse({
        simulator: state.simulator,
        mobile: state.mobile,
        showScrollbar: state.showScrollbar,
        deviceSlug: state.deviceSlug,
      });
      return;
    }
  })();
  return true;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  delete tabState[tabId];
  await disableMobileHeaders(tabId);
  await removeState(tabId);
});

// Re-apply settings after reloads/navigation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.status) return;

  // Only apply settings if this tab has been explicitly activated
  if (!tabState[tabId]) return;

  // Re-apply settings on complete only for activated tabs
  if (changeInfo.status === "complete") {
    const state = await loadState(tabId);
    if (state.mobile) {
      await enableMobileHeaders(tabId);
    }
    if (state.showScrollbar) {
      await applyScrollbar(tabId, true);
    }
    // Auto-show simulator if it's enabled (which it is by default)
    if (state.simulator) {
      await showSimulator(tabId, state);
    }
  }
});

// Remove automatic application to all tabs on startup/installation
// Only apply to tabs that have been explicitly activated
async function reapplyActivatedTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      // Only reapply if this tab has been explicitly activated
      if (tabState[t.id]) {
        const state = await loadState(t.id);
        if (state.mobile) await enableMobileHeaders(t.id);
        if (state.showScrollbar) await applyScrollbar(t.id, true);
        if (state.simulator) await showSimulator(t.id, state);
      }
    }
  } catch (_) {}
}

chrome.runtime.onStartup.addListener(reapplyActivatedTabs);
chrome.runtime.onInstalled.addListener(reapplyActivatedTabs);

// Screen recording functionality
let recordingTabs = new Set();
let frameCaptureIntervals = new Map(); // Track frame capture intervals per tab

async function startScreenRecording(tabId) {
  try {
    // Check if already recording
    if (recordingTabs.has(tabId)) {
      return { success: false, error: "Already recording" };
    }

    // Close any existing offscreen document to ensure clean state
    try {
      await chrome.offscreen.closeDocument();
    } catch (e) {
      console.log("No existing offscreen document to close");
    }

    // First, check if the simulator frame exists and get its bounds
    const frameInfo = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const frame = document.getElementById("__mf_simulator_frame__");
        if (!frame) {
          return null;
        }

        const rect = frame.getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };
      },
    });

    if (!frameInfo || !frameInfo[0] || !frameInfo[0].result) {
      return { success: false, error: "Simulator frame not found" };
    }

    const frameBounds = frameInfo[0].result;

    // Get device dimensions from the current state
    const state = await loadState(tabId);
    const device = getDeviceBySlug(state.deviceSlug);
    const deviceWidth = device ? device.width : 375;
    const deviceHeight = device ? device.height : 812;

    // Create fresh offscreen document
    await chrome.offscreen.createDocument({
      url: "offscreen/tab_capture/offscreenTabCapture.html",
      reasons: ["USER_MEDIA"],
      justification: "Recording from chrome.scripting.captureVisibleTab API",
    });

    // Test communication with offscreen document
    try {
      await chrome.runtime.sendMessage({
        type: "test",
        target: "offscreen",
      });
      console.log("Test message sent successfully to offscreen document");
    } catch (error) {
      console.error(
        "Failed to send test message to offscreen document:",
        error
      );
    }

    // Get tab dimensions for recording
    const tab = await chrome.tabs.get(tabId);
    const measurement = {
      tabId: tabId, // Add tabId to measurement object
      window_width: tab.width || 1920,
      window_height: tab.height || 1080,
      width: frameBounds.width,
      height: frameBounds.height,
      top: frameBounds.y,
      left: frameBounds.x,
      device_width: deviceWidth,
      device_height: deviceHeight,
    };

    // Start recording using element capture instead of tab capture
    await chrome.runtime.sendMessage({
      type: "mf-start-recording",
      target: "offscreen",
      measurement: measurement,
      video_quality: "medium", // Default to medium quality
      useElementCapture: true, // Flag to indicate we want element capture
    });

    recordingTabs.add(tabId);
    return { success: true };
  } catch (error) {
    console.error("Start recording error:", error);
    return { success: false, error: error.message };
  }
}

async function stopScreenRecording(tabId) {
  try {
    if (!recordingTabs.has(tabId)) {
      return { success: false, error: "Not recording" };
    }

    // Stop frame capture
    stopFrameCapture(tabId);

    // Stop recording
    await chrome.runtime.sendMessage({
      type: "mf-stop-recording",
      target: "offscreen",
      tabId: tabId,
    });

    // Wait a bit for the recording to complete and video to be generated
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Close the offscreen document to clean up resources
    try {
      await chrome.offscreen.closeDocument();
    } catch (e) {
      console.log("Offscreen document already closed or doesn't exist");
    }

    recordingTabs.delete(tabId);
    return { success: true };
  } catch (error) {
    console.error("Stop recording error:", error);
    return { success: false, error: error.message };
  }
}

// Check if a tab is currently recording
function isTabRecording(tabId) {
  return recordingTabs.has(tabId);
}

// Frame capture functions for element-based recording
async function startFrameCapture(tabId, frameRate) {
  console.log(`Starting frame capture for tab ${tabId} at ${frameRate} fps`);

  // Stop any existing frame capture for this tab
  if (frameCaptureIntervals.has(tabId)) {
    clearInterval(frameCaptureIntervals.get(tabId));
  }

  const frameInterval = 1000 / frameRate;

  const intervalId = setInterval(async () => {
    try {
      // Capture the visible tab
      const dataUrl = await chrome.tabs.captureVisibleTab(tabId, {
        format: "png",
        quality: 100,
      });

      // Get the current frame bounds
      const frameInfo = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const frame = document.getElementById("__mf_simulator_frame__");
          if (!frame) {
            return null;
          }

          const rect = frame.getBoundingClientRect();
          return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          };
        },
      });

      if (frameInfo && frameInfo[0] && frameInfo[0].result) {
        const frameBounds = frameInfo[0].result;
        console.log(`Captured frame for tab ${tabId}, bounds:`, frameBounds);

        // Send the frame data to the offscreen document
        try {
          await chrome.runtime.sendMessage({
            type: "mf-frame-data",
            target: "offscreen",
            frameData: dataUrl,
            bounds: frameBounds,
          });
          console.log(
            `Frame data sent successfully for tab ${tabId}, data size:`,
            dataUrl.length
          );
        } catch (error) {
          console.error(`Failed to send frame data for tab ${tabId}:`, error);
        }
      } else {
        console.warn(`No frame bounds found for tab ${tabId}`);
      }
    } catch (error) {
      console.error(`Error capturing frame for tab ${tabId}:`, error);
    }
  }, frameInterval);

  frameCaptureIntervals.set(tabId, intervalId);
  console.log(`Frame capture interval set for tab ${tabId}`);
}

function stopFrameCapture(tabId) {
  if (frameCaptureIntervals.has(tabId)) {
    clearInterval(frameCaptureIntervals.get(tabId));
    frameCaptureIntervals.delete(tabId);
  }
}

// Cleanup function to stop recording and close offscreen document
async function cleanupRecording(tabId) {
  if (recordingTabs.has(tabId)) {
    try {
      // Stop frame capture
      stopFrameCapture(tabId);

      // Stop recording
      await chrome.runtime.sendMessage({
        type: "mf-stop-recording",
        target: "offscreen",
        tabId: tabId,
      });

      // Close offscreen document
      try {
        await chrome.offscreen.closeDocument();
      } catch (e) {
        console.log("Offscreen document already closed or doesn't exist");
      }

      recordingTabs.delete(tabId);
    } catch (e) {
      console.error("Cleanup recording error:", e);
      recordingTabs.delete(tabId);
    }
  }
}

// Listen for tab removal to cleanup recording
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await cleanupRecording(tabId);
});

// Listen for extension reload to cleanup all recordings
chrome.runtime.onSuspend.addListener(async () => {
  for (const tabId of recordingTabs) {
    await cleanupRecording(tabId);
  }
});

// Handle video generation completion
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "tab_capture_video_generated") {
    const { tabId, url } = message;

    // Send message to content script to show download dialog
    chrome.tabs
      .sendMessage(tabId, {
        type: "RECORDING_COMPLETED",
        videoUrl: url,
      })
      .catch(() => {
        // If content script is not available, create download directly
        chrome.downloads.download({
          url: url,
          filename: `screen-recording-${Date.now()}.webm`,
          saveAs: true,
        });
      });
  }
});

// Handle keyboard shortcuts for recording
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "start-stop-video-capture") {
    const tabId = tab.id;

    if (recordingTabs.has(tabId)) {
      // Stop recording
      await stopScreenRecording(tabId);
    } else {
      // Start recording
      await startScreenRecording(tabId);
    }
  }
});
