import o from "@tutao/otest"
import { BrowserType, DeviceType } from "../../../src/platform-kit/app-env/boot/ClientConstants.js"
import { AppType, Mode } from "../../../src/platform-kit/app-env"
import { CheckBrowser } from "../../../src/ui/CheckBrowser"
import { Singletons } from "../../../src/platform-kit/singletons/singleton"

o.spec("ClientDetector test", () => {
	o("ClientDetector detect chrome windows", async () => {
		// Even though TouchEvent is defined for Chrome, it should not be consider mobile verson
		//@ts-ignore
		window.TouchEvent = async () => {}

		await Singletons.init(
			"Mozilla/5.0 (Windows NT 6.2 WOW64) AppleWebKit/537.15 (KHTML, like Gecko) Chrome/30.0.1295.0 Safari/537.15",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.CHROME)
		o(Singletons.clientDetector.browserVersion).equals(30)
		o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
		o(Singletons.clientDetector.isMobileDevice()).equals(false)
		// @ts-ignore
		window.touchEvent = undefined
	})
	o("ClientDetector detect chrome macOS", async () => {
		// Even though TouchEvent is defined for Chrome, it should not be consider mobile verson
		// @ts-ignore
		window.TouchEvent = async () => {}

		await Singletons.init(
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36",
			"MacIntel",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.CHROME)
		o(Singletons.clientDetector.browserVersion).equals(77)
		o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
		o(Singletons.clientDetector.isMobileDevice()).equals(false)
		// @ts-ignore
		window.touchEvent = undefined
	})
	o("ClientDetector detect firefox linux", async () => {
		await Singletons.init("Mozilla/5.0 (X11 Ubuntu Linux x86_64 rv:17.0) Gecko/17.0 Firefox/17.0", "Linux", AppType.Integrated)
		o(Singletons.clientDetector.browser).equals(BrowserType.FIREFOX)
		o(Singletons.clientDetector.browserVersion).equals(17)
		o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
		o(Singletons.clientDetector.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect safari 5.1 ipad", async () => {
		await Singletons.init(
			"Mozilla/5.0 (iPad CPU OS 5_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko ) Version/5.1 Mobile/9B176 Safari/7534.48.3",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
		o(Singletons.clientDetector.browserVersion).equals(5.1)
		o(Singletons.clientDetector.device).equals(DeviceType.IPAD)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect safari 6.0 ipad", async () => {
		await Singletons.init(
			"Mozilla/5.0 (iPad CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A403 Safari/8536.25",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
		o(Singletons.clientDetector.browserVersion).equals(6)
		o(Singletons.clientDetector.device).equals(DeviceType.IPAD)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect safari 6.1 ipad", async () => {
		await Singletons.init(
			"Mozilla/5.0 (iPad CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.1 Mobile/10A403 Safari/8536.25",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
		o(Singletons.clientDetector.browserVersion).equals(6.1)
		o(Singletons.clientDetector.device).equals(DeviceType.IPAD)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect safari 7 iphone", async () => {
		await Singletons.init(
			"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A501 Safari/9537.53",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
		o(Singletons.clientDetector.browserVersion).equals(7)
		o(Singletons.clientDetector.device).equals(DeviceType.IPHONE)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect safari 6.0 iphone home screen", async () => {
		await Singletons.init(
			"Mozilla/5.0 (iPhone CPU iPhone OS 6_1_6 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Mobile/10B500",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
		o(Singletons.clientDetector.browserVersion).equals(6.1)
		o(Singletons.clientDetector.device).equals(DeviceType.IPHONE)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect safari 7 iphone home screen", async () => {
		await Singletons.init(
			"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/11A501",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
		o(Singletons.clientDetector.browserVersion).equals(7)
		o(Singletons.clientDetector.device).equals(DeviceType.IPHONE)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect opera 12 windows", async () => {
		await Singletons.init("Opera/9.80 (Windows NT 6.1 WOW64) Presto/2.12.388 Version/12.11", "Linux", AppType.Integrated)
		o(Singletons.clientDetector.browser).equals(BrowserType.OPERA)
		o(Singletons.clientDetector.browserVersion).equals(12.1)
		o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
		o(Singletons.clientDetector.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect opera 21 windows", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36 OPR/21.0.1432.67 (Edition Campaign 38)",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.OPERA)
		o(Singletons.clientDetector.browserVersion).equals(21)
		o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
		o(Singletons.clientDetector.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect opera 21 Mac", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Macintosh Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36 OPR/21.0.1432.67",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.OPERA)
		o(Singletons.clientDetector.browserVersion).equals(21)
		o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
		o(Singletons.clientDetector.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect safari 6.1 on OS X", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Macintosh Intel Mac OS X 10_8_5) AppleWebKit/537.71 (KHTML, like Gecko) Version/6.1 Safari/537.71",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
		o(Singletons.clientDetector.browserVersion).equals(6.1)
		o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
		o(Singletons.clientDetector.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect safari 7 on OS X", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Macintosh Intel Mac OS X 10_9) AppleWebKit/537.71 (KHTML, like Gecko) Version/7.0 Safari/537.71",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
		o(Singletons.clientDetector.browserVersion).equals(7)
		o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
		o(Singletons.clientDetector.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect safari 8 on OS X", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Macintosh Intel Mac OS X 10_10_1) AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
		o(Singletons.clientDetector.browserVersion).equals(8)
		o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
		o(Singletons.clientDetector.isMobileDevice()).equals(false)
	})
	o("palemoon gets classified as other, linux", async () => {
		await Singletons.init("Mozilla/5.0 (X11; Linux x86_64; rv:68.0) Gecko/20100101 Goanna/5.1 Firefox/68.0 PaleMoon/31.1.0", "Linux", AppType.Integrated)
		o(Singletons.clientDetector.browserVersion).equals(null)
		o(Singletons.clientDetector.browser).equals(BrowserType.OTHER)
	})
	o("palemoon gets classified as other, windows", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Goanna/5.1 Firefox/68.0 PaleMoon/31.1.1",
			"Win32",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browserVersion).equals(null)
		o(Singletons.clientDetector.browser).equals(BrowserType.OTHER)
	})

	o("ClientDetector detect safari 6.05 on OS X", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Macintosh Intel Mac OS X 10_8_4) AppleWebKit/536.30.1 (KHTML, like Gecko) Version/6.0.5 Safari/536.30.1",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
		o(Singletons.clientDetector.browserVersion).equals(6)
		o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
		o(Singletons.clientDetector.isMobileDevice()).equals(false)
	})
	o("ClientDetector detect chrome on Android", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Linux Android 4.1.1 HTC Desire X Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.99 Mobile Safari/537.36",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.CHROME)
		o(Singletons.clientDetector.browserVersion).equals(32)
		o(Singletons.clientDetector.device).equals(DeviceType.ANDROID)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect firefox on Android", async () => {
		await Singletons.init("Mozilla/5.0 (Android Mobile rv:27.0) Gecko/27.0 Firefox/27.0", "Linux", AppType.Integrated)
		o(Singletons.clientDetector.browser).equals(BrowserType.FIREFOX)
		o(Singletons.clientDetector.browserVersion).equals(27)
		o(Singletons.clientDetector.device).equals(DeviceType.ANDROID)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect android browser 4.1 on Android", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Linux U Android 4.1.1, de-de HTC_Desire_X Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.ANDROID)
		o(Singletons.clientDetector.browserVersion).equals(4.1)
		o(Singletons.clientDetector.device).equals(DeviceType.ANDROID)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect opera 19 on Android", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Linux Android 4.1.1 HTC One X+ Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.72 Mobile Safari/537.36 OPR/19.0.1340.69721",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.OPERA)
		o(Singletons.clientDetector.browserVersion).equals(19)
		o(Singletons.clientDetector.device).equals(DeviceType.ANDROID)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o("ClientDetector detect chrome 34 on iphone", async () => {
		await Singletons.init(
			"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/34.0.1847.18 Mobile/11A501 Safari/9537.53",
			"Linux",
			AppType.Integrated,
		)
		o(Singletons.clientDetector.browser).equals(BrowserType.CHROME)
		o(Singletons.clientDetector.browserVersion).equals(34)
		o(Singletons.clientDetector.device).equals(DeviceType.IPHONE)
		o(Singletons.clientDetector.isMobileDevice()).equals(true)
	})
	o.spec("app", () => {
		o("ClientDetector the android 4 in app mode supported", async () => {
			await Singletons.init(
				"Mozilla/5.0 (Linux U Android 4.0, de-de HTC_Desire_X Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30",
				"Linux",
				AppType.Integrated,
			)
			o(Singletons.clientDetector.browser).equals(BrowserType.ANDROID)
			o(Singletons.clientDetector.browserVersion).equals(4)
			o(Singletons.clientDetector.device).equals(DeviceType.ANDROID)
			o(Singletons.clientDetector.isMobileDevice()).equals(true)
		})
		o("ClientDetector the android 3 in app mode not supported", async () => {
			await Singletons.init(
				"Mozilla/5.0 (Linux U Android 4.0, de-de HTC_Desire_X Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/3.9 Mobile Safari/534.30",
				"Linux",
				AppType.Integrated,
			)
			o(Singletons.clientDetector.browser).equals(BrowserType.ANDROID)
			o(Singletons.clientDetector.browserVersion).equals(4)
			o(Singletons.clientDetector.device).equals(DeviceType.ANDROID)
			o(Singletons.clientDetector.isMobileDevice()).equals(true)
		})
		o("ClientDetector apps on ios are supported", async () => {
			await Singletons.init("Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit", "Linux", AppType.Integrated)
			o(Singletons.clientDetector.browser).equals(BrowserType.SAFARI)
			o(Singletons.clientDetector.browserVersion).equals(7)
			o(Singletons.clientDetector.device).equals(DeviceType.IPHONE)
			o(Singletons.clientDetector.isMobileDevice()).equals(true)
		})
		o("ClientDetector iceweasel browser are supported", async () => {
			await Singletons.init("Mozilla/5.0 (X11 Linux x86_64 rv:37.0)  Gecko/20100101 Iceweasel/37.0.1", "Linux", AppType.Integrated)
			o(Singletons.clientDetector.browser).equals(BrowserType.FIREFOX)
			o(Singletons.clientDetector.browserVersion).equals(37)
			o(Singletons.clientDetector.device).equals(DeviceType.DESKTOP)
			o(Singletons.clientDetector.isMobileDevice()).equals(false)
		})
		o("ClientDetector firefox os is supported", async () => {
			await Singletons.withOverriddenEnvForTest({ mode: Mode.Android }, async () => {
				await Singletons.init("Mozilla/5.0 (Mobile rv:26.0) Gecko/26.0 Firefox/26.0", "Linux", AppType.Integrated)
				o(Singletons.clientDetector.browser).equals(BrowserType.FIREFOX)
				o(Singletons.clientDetector.browserVersion).equals(26)
				o(Singletons.clientDetector.device).equals(DeviceType.OTHER_MOBILE)
				o(Singletons.clientDetector.isMobileDevice()).equals(true)
			})
		})
		o("ClientDetector firefox os tablet is supported", async () => {
			await Singletons.withOverriddenEnvForTest({ mode: Mode.Android }, async () => {
				await Singletons.init("Mozilla/5.0 (Tablet rv:26.0) Gecko/26.0 Firefox/26.0", "Linux", AppType.Integrated)
				o(Singletons.clientDetector.browser).equals(BrowserType.FIREFOX)
				o(Singletons.clientDetector.browserVersion).equals(26)
				o(Singletons.clientDetector.device).equals(DeviceType.OTHER_MOBILE)
				o(Singletons.clientDetector.isMobileDevice()).equals(true)
			})
		})
	})
	o("old Chrome is not supported", async () => {
		await Singletons.init(
			"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36",
			"Linux",
			AppType.Integrated,
		)
		o(CheckBrowser.isSupportedBrowserVersion(Singletons.clientDetector)).equals(false)
	})
	o("Chrome 55 is not supported", async () => {
		await Singletons.init(
			"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2062.120 Safari/537.36",
			"Linux",
			AppType.Integrated,
		)
		o(CheckBrowser.isSupportedBrowserVersion(Singletons.clientDetector)).equals(false)
	})
	o("newer Chrome is supported", async () => {
		await Singletons.init(
			"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.4606.61 Safari/537.36",
			"Linux",
			AppType.Integrated,
		)
		o(CheckBrowser.isSupportedBrowserVersion(Singletons.clientDetector)).equals(true)
	})
	o("detect iPadOS", async () => {
		// Use hack with TouchEvent to detect iPad
		// @ts-ignore
		window.TouchEvent = async () => {}

		await Singletons.init("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko)", "MacIntel", AppType.Integrated)
		o(Singletons.clientDetector.device).equals(DeviceType.IPAD)
		// @ts-ignore
		window.TouchEvent = undefined
	})
})

o.spec("ClientDetector AppType test", () => {
	o("ClientDetector detect calendar app on Android", async () => {
		await Singletons.withOverriddenEnvForTest({ mode: Mode.Android }, async () => {
			await Singletons.init(
				"Mozilla/5.0 (Linux Android 4.1.1 HTC Desire X Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.99 Mobile Safari/537.36",
				"Linux",
				AppType.Calendar,
			)
			o(Singletons.clientDetector.device).equals(DeviceType.ANDROID)
			o(Singletons.clientDetector.isMobileDevice()).equals(true)
			o(Singletons.clientDetector.getIdentifier()).equals("Android Calendar App")
		})
	})

	o("ClientDetector detect calendar app on iPhone", async () => {
		await Singletons.withOverriddenEnvForTest({ mode: Mode.Ios }, async () => {
			await Singletons.init(
				"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A501 Safari/9537.53",
				"Linux",
				AppType.Calendar,
			)
			o(Singletons.clientDetector.device).equals(DeviceType.IPHONE)
			o(Singletons.clientDetector.isMobileDevice()).equals(true)
			o(Singletons.clientDetector.getIdentifier()).equals("iPhone Calendar App")
		})
	})

	o("ClientDetector detect mail app on Android", async () => {
		await Singletons.withOverriddenEnvForTest({ mode: Mode.Android }, async () => {
			await Singletons.init(
				"Mozilla/5.0 (Linux Android 4.1.1 HTC Desire X Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.99 Mobile Safari/537.36",
				"Linux",
				AppType.Mail,
			)
			o(Singletons.clientDetector.device).equals(DeviceType.ANDROID)
			o(Singletons.clientDetector.isMobileDevice()).equals(true)
			o(Singletons.clientDetector.getIdentifier()).equals("Android Mail App")
		})
	})

	o("ClientDetector detect mail app on iPhone", async () => {
		await Singletons.withOverriddenEnvForTest({ mode: Mode.Ios }, async () => {
			await Singletons.init(
				"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A501 Safari/9537.53",
				"Linux",
				AppType.Mail,
			)
			o(Singletons.clientDetector.device).equals(DeviceType.IPHONE)
			o(Singletons.clientDetector.isMobileDevice()).equals(true)
			o(Singletons.clientDetector.getIdentifier()).equals("iPhone Mail App")
		})
	})

	o("ClientDetector throws on wrong configuration", async () => {
		await Singletons.withOverriddenEnvForTest({ mode: Mode.Android }, async () => {
			await Singletons.init(
				"Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A501 Safari/9537.53",
				"Linux",
				AppType.Integrated,
			)
			o(Singletons.clientDetector.device).equals(DeviceType.IPHONE)
			o(Singletons.clientDetector.isMobileDevice()).equals(true)
			o(() => Singletons.clientDetector.getIdentifier()).throws("AppType.Integrated is not allowed for mobile apps")
		})
	})
})
