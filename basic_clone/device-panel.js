// Device Panel Content Script
// This script handles the device selection panel that appears when the device button is clicked

// Device data from background script
const DEVICES = [
  {
    slug: "ip16",
    name: "iPhone 16",
    viewport: { width: 393, height: 852 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip16.png",
    screenPct: { top: 2.2, right: 0, bottom: 2.2, left: 0, radius: 8.0 },
  },
  {
    slug: "mb-air",
    name: "MacBook Air",
    viewport: { width: 1280, height: 800 },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "macOS",
    mockup: "devices/macbook-air.png",
    screenPct: { top: 8.0, right: 0, bottom: 8.0, left: 0, radius: 1.0 },
  },
  {
    slug: "apple-imac",
    name: "Apple iMac",
    viewport: { width: 1280, height: 800 },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "macOS",
    mockup: "devices/apple-imac.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "applewatch",
    name: "Apple Watch",
    viewport: { width: 200, height: 300 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/applewatch.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "dell14",
    name: "Dell Latitude 14",
    viewport: { width: 1280, height: 800 },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "macOS",
    mockup: "devices/dell14.png",
    screenPct: { top: 5, right: 9, bottom: 5, left: 9, radius: 0 },
  },
  {
    slug: "gpixel5",
    name: "Google Pixel 5",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/gpixel5.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "gpixel6",
    name: "Google Pixel 6",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/gpixel6.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "gpixel8",
    name: "Google Pixel 8",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/gpixel8.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "hp30",
    name: "Huawei P30 Pro",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/hp30.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip11",
    name: "iPhone 11",
    viewport: { width: 393, height: 852 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip11.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip11pro",
    name: "iPhone 11 Pro",
    viewport: { width: 393, height: 852 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip11pro.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip11promax",
    name: "iPhone 11 Pro Max",
    viewport: { width: 430, height: 932 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip11promax.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip12",
    name: "iPhone 12",
    viewport: { width: 390, height: 844 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip12.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip12max",
    name: "iPhone 12 Max",
    viewport: { width: 428, height: 926 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip12max.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip12mini",
    name: "iPhone 12 Mini",
    viewport: { width: 360, height: 780 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip12mini.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip12promax",
    name: "iPhone 12 Pro Max",
    viewport: { width: 428, height: 926 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip12promax.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip13",
    name: "iPhone 13",
    viewport: { width: 390, height: 844 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip13.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip13mini",
    name: "iPhone 13 Mini",
    viewport: { width: 360, height: 780 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip13mini.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip13pro",
    name: "iPhone 13 Pro",
    viewport: { width: 390, height: 844 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip13pro.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip13promax",
    name: "iPhone 13 Pro Max",
    viewport: { width: 428, height: 926 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip13promax.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip14",
    name: "iPhone 14",
    viewport: { width: 393, height: 852 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip14.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip14max",
    name: "iPhone 14 Max",
    viewport: { width: 430, height: 932 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip14max.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip14pro",
    name: "iPhone 14 Pro",
    viewport: { width: 393, height: 852 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip14pro.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip14promax",
    name: "iPhone 14 Pro Max",
    viewport: { width: 430, height: 932 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip14promax.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip15",
    name: "iPhone 15",
    viewport: { width: 393, height: 852 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip15.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip15plus",
    name: "iPhone 15 Plus",
    viewport: { width: 430, height: 932 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip15plus.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip15pro",
    name: "iPhone 15 Pro",
    viewport: { width: 393, height: 852 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip15pro.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip15promax",
    name: "iPhone 15 Pro Max",
    viewport: { width: 430, height: 932 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip15pro.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip16plus",
    name: "iPhone 16 Plus",
    viewport: { width: 430, height: 932 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip16plus.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip16promax",
    name: "iPhone 16 Pro Max",
    viewport: { width: 430, height: 932 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip16promax.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ip5",
    name: "iPhone 5",
    viewport: { width: 320, height: 568 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ip5.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ipad-air",
    name: "iPad Air",
    viewport: { width: 820, height: 1180 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipad-air.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ipad-mini",
    name: "iPad Mini",
    viewport: { width: 744, height: 1133 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipad-mini.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ipad-pro",
    name: "iPad Pro",
    viewport: { width: 1024, height: 1366 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipad-pro.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ipse",
    name: "iPhone SE",
    viewport: { width: 375, height: 667 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipse.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ipx",
    name: "iPhone X",
    viewport: { width: 375, height: 812 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipx.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ipxr",
    name: "iPhone XR",
    viewport: { width: 414, height: 896 },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iOS",
    mockup: "devices/ipxr.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "macbookpro",
    name: "MacBook Pro",
    viewport: { width: 1280, height: 800 },
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "macOS",
    mockup: "devices/macbookpro.png",
    screenPct: { top: 8, right: 0, bottom: 8, left: 0, radius: 1 },
  },
  {
    slug: "microsoftsurfaceduo",
    name: "Microsoft Surface Duo",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/microsoftsurfaceduo.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "nord2",
    name: "OnePlus Nord 2",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/nord2.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ofindx3",
    name: "OPPO Find X3 Pro",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/ofindx3.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxya12",
    name: "Samsung Galaxy A12",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxya12.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxyfold",
    name: "Samsung Galaxy Fold",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxyfold.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxynote20ultra",
    name: "Samsung Galaxy Note 20 Ultra",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxynote20ultra.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxys12ultra",
    name: "Samsung Galaxy S12 Ultra",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys12ultra.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxys20",
    name: "Samsung Galaxy S20",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys20.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxys22",
    name: "Samsung Galaxy S22",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys22.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxys22plus",
    name: "Samsung Galaxy S22+",
    viewport: { width: 412, height: 915 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys22plus.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxys22ultra",
    name: "Samsung Galaxy S22 Ultra",
    viewport: { width: 412, height: 915 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys22ultra.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxys24",
    name: "Samsung Galaxy S24",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys24.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxys24ultra",
    name: "Samsung Galaxy S24 Ultra",
    viewport: { width: 412, height: 915 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxys24ultra.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxytabs7",
    name: "Samsung Galaxy Tab S7",
    viewport: { width: 800, height: 1280 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxytabs7.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "sgalaxyzflip",
    name: "Samsung Galaxy Z Flip",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/sgalaxyzflip.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "ssmarttv",
    name: "Samsung Smart TV",
    viewport: { width: 1920, height: 1080 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Special",
    mockup: "devices/ssmarttv.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "x12",
    name: "Xiaomi 12",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/x12.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
  {
    slug: "xm11i",
    name: "Xiaomi Mi 11i",
    viewport: { width: 400, height: 800 },
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mockup: "devices/xm11i.png",
    screenPct: { top: 5, right: 5, bottom: 5, left: 5, radius: 3 },
  },
];

// Create and show the device selection panel
function createDevicePanel() {
  // Remove existing panel if it exists
  const existingPanel = document.getElementById("__mf_device_panel__");
  if (existingPanel) {
    existingPanel.remove();
  }

  // Create the main panel container
  const panel = document.createElement("div");
  panel.id = "__mf_device_panel__";
  panel.style.cssText = `
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(30, 30, 30, 0.95);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    color: white;
    z-index: 2147483648;
    max-height: 80vh;
    overflow-y: auto;
    min-width: 280px;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  `;

  // Create header
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #555;
  `;

  const title = document.createElement("h3");
  title.textContent = "Select Device";
  title.style.cssText = `
    margin: 0;
    font-size: 16px;
    color: #fff;
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "×";
  closeBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
  `;
  closeBtn.onclick = () => panel.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Create device categories
  // Create device categories
  const categories = [
    {
      name: "📱 iPhones",
      filter: (d) =>
        d.platform === "iOS" && d.name.toLowerCase().includes("iphone"),
    },
    {
      name: "💻 MacBooks",
      filter: (d) =>
        d.platform === "macOS" && d.name.toLowerCase().includes("macbook"),
    },
    {
      name: "📱 Android Phones",
      filter: (d) => d.platform === "Android", // covers Samsung, Pixel, Huawei, Oppo, etc.
    },
    {
      name: "📱 Tablets",
      filter: (d) =>
        d.name.toLowerCase().includes("ipad") ||
        d.name.toLowerCase().includes("tab"),
    },
    {
      name: "🖥️ Other Devices",
      filter: (d) =>
        !(
          (d.platform === "iOS" && d.name.toLowerCase().includes("iphone")) ||
          (d.platform === "macOS" &&
            d.name.toLowerCase().includes("macbook")) ||
          d.platform === "Android" ||
          d.name.toLowerCase().includes("ipad") ||
          d.name.toLowerCase().includes("tab")
        ),
    },
  ];

  categories.forEach((category) => {
    const devices = DEVICES.filter(category.filter);
    if (devices.length === 0) return;

    const categoryDiv = document.createElement("div");
    categoryDiv.style.cssText = `
      margin-bottom: 20px;
    `;

    const categoryTitle = document.createElement("h4");
    categoryTitle.textContent = category.name;
    categoryTitle.style.cssText = `
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #ccc;
      border-bottom: 1px solid #555;
      padding-bottom: 5px;
    `;

    const deviceGrid = document.createElement("div");
    deviceGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    `;

    devices.forEach((device) => {
      const deviceItem = document.createElement("div");
      deviceItem.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        font-size: 11px;
      `;

      // Create device icon
      const icon = document.createElement("div");
      icon.style.cssText = `
        width: 40px;
        height: 40px;
        background: ${
          device.platform === "iOS"
            ? "#007AFF"
            : device.platform === "Android"
            ? "#3DDC84"
            : "#0066CC"
        };
        border-radius: 8px;
        margin: 0 auto 5px auto;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      `;
      icon.textContent =
        device.platform === "iOS"
          ? "🍎"
          : device.platform === "Android"
          ? "🤖"
          : "💻";

      const name = document.createElement("div");
      name.textContent = device.name;
      name.style.cssText = `
        font-size: 10px;
        line-height: 1.2;
        color: white;
      `;

      deviceItem.appendChild(icon);
      deviceItem.appendChild(name);

      // Add hover effects
      deviceItem.onmouseenter = () => {
        deviceItem.style.background = "rgba(255, 255, 255, 0.2)";
        deviceItem.style.borderColor = "rgba(255, 255, 255, 0.4)";
        deviceItem.style.transform = "scale(1.05)";
      };

      deviceItem.onmouseleave = () => {
        deviceItem.style.background = "rgba(255, 255, 255, 0.1)";
        deviceItem.style.borderColor = "rgba(255, 255, 255, 0.2)";
        deviceItem.style.transform = "scale(1)";
      };

      // Add click event to select device
      deviceItem.onclick = () => {
        selectDevice(device.slug);
      };

      deviceGrid.appendChild(deviceItem);
    });

    categoryDiv.appendChild(categoryTitle);
    categoryDiv.appendChild(deviceGrid);
    panel.appendChild(categoryDiv);
  });

  // Add click outside to close
  document.addEventListener("click", function closeOnOutsideClick(e) {
    if (
      !panel.contains(e.target) &&
      !e.target.closest("#__mf_simulator_device_btn__")
    ) {
      panel.remove();
      document.removeEventListener("click", closeOnOutsideClick);
    }
  });

  document.body.appendChild(panel);
}

// Function to select a device
function selectDevice(deviceSlug) {
  chrome.runtime.sendMessage({
    type: "SET_DEVICE_FOR_TAB",
    deviceSlug: deviceSlug,
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_DEVICE_PANEL") {
    createDevicePanel();
    sendResponse({ ok: true });
  }

  if (message.type === "RECORDING_COMPLETED") {
    showRecordingDownloadDialog(message.videoUrl);
  }
});

// Function to show recording download dialog
function showRecordingDownloadDialog(videoUrl) {
  // Create a floating download dialog
  const dialog = document.createElement("div");
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(30, 30, 30, 0.95);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    color: white;
    z-index: 2147483650;
    min-width: 300px;
    text-align: center;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  `;

  const title = document.createElement("h3");
  title.textContent = "Recording Complete!";
  title.style.cssText = `
    margin: 0 0 15px 0;
    font-size: 18px;
    color: #fff;
  `;

  const message = document.createElement("p");
  message.textContent = "Your screen recording is ready for download.";
  message.style.cssText = `
    margin: 0 0 20px 0;
    color: #ccc;
    font-size: 14px;
  `;

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download Video";
  downloadBtn.style.cssText = `
    background: #007AFF;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    margin: 0 10px 10px 0;
    transition: background 0.2s ease;
  `;

  downloadBtn.onmouseenter = () => {
    downloadBtn.style.background = "#0056CC";
  };

  downloadBtn.onmouseleave = () => {
    downloadBtn.style.background = "#007AFF";
  };

  downloadBtn.onclick = () => {
    // Send message to background script to handle download
    chrome.runtime.sendMessage({
      type: "INITIATE_VIDEO_DOWNLOAD",
      videoUrl: videoUrl,
    });
    dialog.remove();
  };

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    margin: 0 10px 10px 0;
    transition: background 0.2s ease;
  `;

  closeBtn.onmouseenter = () => {
    closeBtn.style.background = "rgba(255, 255, 255, 0.3)";
  };

  closeBtn.onmouseleave = () => {
    closeBtn.style.background = "rgba(255, 255, 255, 0.2)";
  };

  closeBtn.onclick = () => {
    dialog.remove();
  };

  dialog.appendChild(title);
  dialog.appendChild(message);
  dialog.appendChild(downloadBtn);
  dialog.appendChild(closeBtn);

  document.body.appendChild(dialog);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (dialog.parentNode) {
      dialog.remove();
    }
  }, 10000);
}

// Export functions for global access
window.createDevicePanel = createDevicePanel;
window.selectDevice = selectDevice;
