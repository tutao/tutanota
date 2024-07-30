import o from "@tutao/otest"
import { client } from "../../../src/common/misc/ClientDetector.js"
import { Mode } from "../../../src/common/api/common/Env.js"
import { AppType, BrowserType, DeviceType } from "../../../src/common/misc/ClientConstants.js"

o.spec("ClientDetector test", function () {
	o("ClientDetector detect chrome windows", () => {
		// Even though TouchEvent is defined for Chrome, it should not be consider mobile verson
		//@ts-ignore
		window.TouchEvent = function () {}

		client.init("Mozilla/5.0 (Windows NT 6.2 WOW64) AppleWebKit/537.15 (KHTML, like Gecko) Chrome/30.0.1295.0 Safari/537.15", "Linux")
		o(client.browser).equals(BrowserType.CHROME)
		o(client.browserVersion).equals(30)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
		// @ts-ignore
		window.touchEvent = undefined
	})
	o("ClientDetector detect chrome macOS", () => {
		// Even though TouchEvent is defined for Chrome, it should not be consider mobile verson
		// @ts-ignore
		window.TouchEvent = function () {}

		client.init("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36", "MacIntel")
		o(client.browser).equals(BrowserType.CHROME)
		o(client.browserVersion).equals(77)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
		// @ts-ignore
		window.touchEvent = undefined
	})
	o("ClientDetector detect firefox linux", () => {
		client.init("Mozilla/5.0 (X11 Ubuntu Linux x86_64 rv:17.0) Gecko/17.0 Firefox/17.0", "Linux")
		o(client.browser).equals(BrowserType.FIREFOX)
		o(client.browserVersion).equals(17)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect safari 5.1 ipad", () => {
		client.init("Mozilla/5.0 (iPad CPU OS 5_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko ) Version/5.1 Mobile/9B176 Safari/7534.48.3", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(5.1)
		o(client.device).equals(DeviceType.IPAD)
		o(client.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect safari 6.0 ipad", () => {
		client.init("Mozilla/5.0 (iPad CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A403 Safari/8536.25", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(6)
		o(client.device).equals(DeviceType.IPAD)
		o(client.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect safari 6.1 ipad", () => {
		client.init("Mozilla/5.0 (iPad CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.1 Mobile/10A403 Safari/8536.25", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(6.1)
		o(client.device).equals(DeviceType.IPAD)
		o(client.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect safari 7 iphone", () => {
		client.init(
			"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A501 Safari/9537.53",
			"Linux",
		)
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(7)
		o(client.device).equals(DeviceType.IPHONE)
		o(client.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect safari 6.0 iphone home screen", () => {
		client.init("Mozilla/5.0 (iPhone CPU iPhone OS 6_1_6 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Mobile/10B500", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(6.1)
		o(client.device).equals(DeviceType.IPHONE)
		o(client.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect safari 7 iphone home screen", () => {
		client.init("Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/11A501", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(7)
		o(client.device).equals(DeviceType.IPHONE)
		o(client.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect opera 12 windows", () => {
		client.init("Opera/9.80 (Windows NT 6.1 WOW64) Presto/2.12.388 Version/12.11", "Linux")
		o(client.browser).equals(BrowserType.OPERA)
		o(client.browserVersion).equals(12.1)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect opera 21 windows", () => {
		client.init(
			"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36 OPR/21.0.1432.67 (Edition Campaign 38)",
			"Linux",
		)
		o(client.browser).equals(BrowserType.OPERA)
		o(client.browserVersion).equals(21)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect opera 21 Mac", () => {
		client.init(
			"Mozilla/5.0 (Macintosh Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36 OPR/21.0.1432.67",
			"Linux",
		)
		o(client.browser).equals(BrowserType.OPERA)
		o(client.browserVersion).equals(21)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect safari 6.1 on OS X", () => {
		client.init("Mozilla/5.0 (Macintosh Intel Mac OS X 10_8_5) AppleWebKit/537.71 (KHTML, like Gecko) Version/6.1 Safari/537.71", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(6.1)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect safari 7 on OS X", () => {
		client.init("Mozilla/5.0 (Macintosh Intel Mac OS X 10_9) AppleWebKit/537.71 (KHTML, like Gecko) Version/7.0 Safari/537.71", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(7)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect safari 8 on OS X", () => {
		client.init("Mozilla/5.0 (Macintosh Intel Mac OS X 10_10_1) AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(8)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})
	o("palemoon gets classified as other, linux", function () {
		client.init("Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Goanna/5.1 Firefox/68.0 PaleMoon/31.1.0", "Linux")
		client.browserVersion = 0
		client.browser = BrowserType.OTHER
	})
	o("palemoon gets classified as other, windows", function () {
		client.init("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Goanna/5.1 Firefox/68.0 PaleMoon/31.1.1", "Win32")
		client.browserVersion = 0
		client.browser = BrowserType.OTHER
	})

	o("ClientDetector detect safari 6.05 on OS X", () => {
		client.init("Mozilla/5.0 (Macintosh Intel Mac OS X 10_8_4) AppleWebKit/536.30.1 (KHTML, like Gecko) Version/6.0.5 Safari/536.30.1", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(6)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect chrome on Android", () => {
		client.init(
			"Mozilla/5.0 (Linux Android 4.1.1 HTC Desire X Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.99 Mobile Safari/537.36",
			"Linux",
		)
		o(client.browser).equals(BrowserType.CHROME)
		o(client.browserVersion).equals(32)
		o(client.device).equals(DeviceType.ANDROID)
		o(client.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect firefox on Android", () => {
		client.init("Mozilla/5.0 (Android Mobile rv:27.0) Gecko/27.0 Firefox/27.0", "Linux")
		o(client.browser).equals(BrowserType.FIREFOX)
		o(client.browserVersion).equals(27)
		o(client.device).equals(DeviceType.ANDROID)
		o(client.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect android browser 4.1 on Android", () => {
		client.init(
			"Mozilla/5.0 (Linux U Android 4.1.1, de-de HTC_Desire_X Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30",
			"Linux",
		)
		o(client.browser).equals(BrowserType.ANDROID)
		o(client.browserVersion).equals(4.1)
		o(client.device).equals(DeviceType.ANDROID)
		o(client.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect opera 19 on Android", () => {
		client.init(
			"Mozilla/5.0 (Linux Android 4.1.1 HTC One X+ Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.72 Mobile Safari/537.36 OPR/19.0.1340.69721",
			"Linux",
		)
		o(client.browser).equals(BrowserType.OPERA)
		o(client.browserVersion).equals(19)
		o(client.device).equals(DeviceType.ANDROID)
		o(client.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect chrome 34 on iphone", () => {
		client.init(
			"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/34.0.1847.18 Mobile/11A501 Safari/9537.53",
			"Linux",
		)
		o(client.browser).equals(BrowserType.CHROME)
		o(client.browserVersion).equals(34)
		o(client.device).equals(DeviceType.IPHONE)
		o(client.isMobileDevice()).equals(true)
	})
	o.spec("app", function () {
		let prevMode
		o.before(function () {
			prevMode = env.mode
			env.mode = Mode.App
		})
		o.after(function () {
			env.mode = prevMode
		})
		o("ClientDetector the android 4 in app mode supported", () => {
			client.init(
				"Mozilla/5.0 (Linux U Android 4.0, de-de HTC_Desire_X Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30",
				"Linux",
			)
			o(client.browser).equals(BrowserType.ANDROID)
			o(client.browserVersion).equals(4)
			o(client.device).equals(DeviceType.ANDROID)
			o(client.isMobileDevice()).equals(true)
		})
		o("ClientDetector the android 3 in app mode not supported", () => {
			client.init(
				"Mozilla/5.0 (Linux U Android 4.0, de-de HTC_Desire_X Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/3.9 Mobile Safari/534.30",
				"Linux",
			)
			o(client.browser).equals(BrowserType.ANDROID)
			o(client.browserVersion).equals(4)
			o(client.device).equals(DeviceType.ANDROID)
			o(client.isMobileDevice()).equals(true)
		})
		o("ClientDetector apps on ios are supported", () => {
			client.init("Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit", "Linux")
			o(client.browser).equals(BrowserType.SAFARI)
			o(client.browserVersion).equals(7)
			o(client.device).equals(DeviceType.IPHONE)
			o(client.isMobileDevice()).equals(true)
		})
		o("ClientDetector iceweasel browser are supported", () => {
			client.init("Mozilla/5.0 (X11 Linux x86_64 rv:37.0)  Gecko/20100101 Iceweasel/37.0.1", "Linux")
			o(client.browser).equals(BrowserType.FIREFOX)
			o(client.browserVersion).equals(37)
			o(client.device).equals(DeviceType.DESKTOP)
			o(client.isMobileDevice()).equals(false)
		})
		o("ClientDetector firefox os is supported", () => {
			env.mode = Mode.App
			client.init("Mozilla/5.0 (Mobile rv:26.0) Gecko/26.0 Firefox/26.0", "Linux")
			o(client.browser).equals(BrowserType.FIREFOX)
			o(client.browserVersion).equals(26)
			o(client.device).equals(DeviceType.OTHER_MOBILE)
			o(client.isMobileDevice()).equals(true)
			env.mode = Mode.Browser
		})
		o("ClientDetector firefox os tablet is supported", () => {
			env.mode = Mode.App
			client.init("Mozilla/5.0 (Tablet rv:26.0) Gecko/26.0 Firefox/26.0", "Linux")
			o(client.browser).equals(BrowserType.FIREFOX)
			o(client.browserVersion).equals(26)
			o(client.device).equals(DeviceType.OTHER_MOBILE)
			o(client.isMobileDevice()).equals(true)
			env.mode = Mode.Browser
		})
	})
	o("old Chrome is not supported", function () {
		client.init("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36", "Linux")
		o(client.isSupportedBrowserVersion()).equals(false)
	})
	o("Chrome 55 is not supported", function () {
		client.init("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2062.120 Safari/537.36", "Linux")
		o(client.isSupportedBrowserVersion()).equals(false)
	})
	o("newer Chrome is supported", function () {
		client.init("Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2125.104 Safari/537.36", "Linux")
		o(client.isSupportedBrowserVersion()).equals(true)
	})
	o("detect iPadOS", function () {
		// Use hack with TouchEvent to detect iPad
		// @ts-ignore
		window.TouchEvent = function () {}

		client.init("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko)", "MacIntel")
		o(client.device).equals(DeviceType.IPAD)
		// @ts-ignore
		window.TouchEvent = undefined
	})
})

o.spec("ClientDetector AppType test", function () {
	o.beforeEach(function () {
		env.mode = Mode.App
	})
	o("ClientDetector detect calendar app on Android", () => {
		client.init(
			"Mozilla/5.0 (Linux Android 4.1.1 HTC Desire X Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.99 Mobile Safari/537.36",
			"Linux",
			AppType.Calendar,
		)
		o(client.device).equals(DeviceType.ANDROID)
		o(client.isMobileDevice()).equals(true)
		o(client.getIdentifier()).equals("Android Calendar App")
	})

	o("ClientDetector detect calendar app on iPhone", () => {
		client.init(
			"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A501 Safari/9537.53",
			"Linux",
			AppType.Calendar,
		)
		o(client.device).equals(DeviceType.IPHONE)
		o(client.isMobileDevice()).equals(true)
		o(client.getIdentifier()).equals("iPhone Calendar App")
	})

	o("ClientDetector detect mail app on Android", () => {
		client.init(
			"Mozilla/5.0 (Linux Android 4.1.1 HTC Desire X Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.99 Mobile Safari/537.36",
			"Linux",
			AppType.Mail,
		)
		o(client.device).equals(DeviceType.ANDROID)
		o(client.isMobileDevice()).equals(true)
		o(client.getIdentifier()).equals("Android Mail App")
	})

	o("ClientDetector detect mail app on iPhone", () => {
		client.init(
			"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A501 Safari/9537.53",
			"Linux",
			AppType.Mail,
		)
		o(client.device).equals(DeviceType.IPHONE)
		o(client.isMobileDevice()).equals(true)
		o(client.getIdentifier()).equals("iPhone Mail App")
	})

	o("ClientDetector throws on wrong configuration", () => {
		client.init(
			"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A501 Safari/9537.53",
			"Linux",
			AppType.Integrated,
		)
		o(client.device).equals(DeviceType.IPHONE)
		o(client.isMobileDevice()).equals(true)
		o(() => client.getIdentifier()).throws("AppType.Integrated is not allowed for mobile apps")
	})
})
