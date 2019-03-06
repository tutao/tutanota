//@flow
import o from "ospec/ospec.js"
import {client} from "../../../src/misc/ClientDetector"
import {Mode} from "../../../src/api/Env"
import {BrowserType, DeviceType} from "../../../src/misc/ClientConstants"

o.spec("ClientDetector test", function () {
	o("ClientDetector detect chrome windows", () => {
		client.init("Mozilla/5.0 (Windows NT 6.2 WOW64) AppleWebKit/537.15 (KHTML, like Gecko) Chrome/30.0.1295.0 Safari/537.15", "Linux")
		o(client.browser).equals(BrowserType.CHROME)
		o(client.browserVersion).equals(30)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect firefox linux", () => {
		client.init("Mozilla/5.0 (X11 Ubuntu Linux x86_64 rv:17.0) Gecko/17.0 Firefox/17.0", "Linux")
		o(client.browser).equals(BrowserType.FIREFOX)
		o(client.browserVersion).equals(17)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect palemoon firefox compat mode", () => {
		client.init("Mozilla/5.0 (X11; Linux x86_64; rv:60.9) Gecko/20100101 Goanna/4.1 Firefox/60.9 PaleMoon/28.2.2", "Linux")
		o(client.browser).equals(BrowserType.PALEMOON)
		o(client.browserVersion).equals(28.2)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect palemoon native mode", () => {
		client.init("Mozilla/5.0 (X11; Linux x86_64; rv:60.9) Goanna/4.1 PaleMoon/28.2.2", "Linux")
		o(client.browser).equals(BrowserType.PALEMOON)
		o(client.browserVersion).equals(28.2)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect palemoon gecko compat mode", () => {
		client.init("Mozilla/5.0 (X11; Linux x86_64; rv:60.9) Gecko/20100101 Goanna/4.1 PaleMoon/28.2.2", "Linux")
		o(client.browser).equals(BrowserType.PALEMOON)
		o(client.browserVersion).equals(28.2)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detects Waterfox", () => {
		client.init("Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:65.0) Gecko/20100101 Firefox/65.0 Waterfox/56.2.7", "Windows")
		o(client.browser).equals(BrowserType.WATERFOX)
		o(client.browserVersion).equals(56.2)
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
		client.init("Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A501 Safari/9537.53", "Linux")
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

	o("ClientDetector detect ie11 windows enterprise edition", () => {
		client.init("Mozilla/5.0 (Windows NT 6.1 Trident/7.0 SLCC2 .NET CLR 2.0.50727 .NET CLR 3.5.30729 .NET CLR 3.0.30729 Media Center PC 6.0 .NET4.0C .NET4.0E Tablet PC 2.0 rv:11.0) like Gecko", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(11)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect ie7 windows contains Trident/7.0 tag", () => {
		client.init("Mozilla/4.0 (compatible MSIE 7.0 Windows NT 6.1 WOW64 Trident/7.0 SLCC2 .NET CLR 2.0.50727 .NET CLR 3.5.30729 .NET CLR 3.0.30729 .NET4.0C .NET4.0E Media Center PC 6.0 InfoPath.3)", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(7)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect ie11 windows additional tags", () => {
		client.init("Mozilla/5.0 (Windows NT 6.1 WOW64 Trident/7.0 SLCC2 .NET CLR 2.0.50727 .NET CLR 3.5.30729 .NET CLR 3.0.30729 .NET4.0C .NET4.0E Media Center PC 6.0 InfoPath.3 rv:11.0) like Gecko", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(11)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect ie11 windows", () => {
		client.init("Mozilla/5.0 (Windows NT 6.3 Trident/7.0 rv:11.0) like Gecko", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(11)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect ie 10 windows", () => {
		client.init("Mozilla/5.0 (compatible MSIE 10.0 Windows NT 6.1 WOW64 Trident/6.0 SLCC2 .NET CLR 2.0.50727 .NET CLR 3.5.30729 .NET CLR 3.0.30729 Media Center PC 6.0 .NET4.0C)", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(10)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect old ie9 windows", () => {
		client.init("Mozilla/5.0 (compatible MSIE 9.0 Windows NT 6.1 WOW64 Trident/6.0 SLCC2 .NET CLR 2.0.50727 .NET CLR 3.5.30729 .NET CLR 3.0.30729 Media Center PC 6.0 .NET4.0C)", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(9)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect old ie9 in IE8 mode windows", () => {
		client.init("Mozilla/5.0 (compatible MSIE 8.0 Windows NT 6.1 Trident/4.0 GTB7.4 InfoPath.2 SV1 .NET CLR 3.3.69573 WOW64 en-US)", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(8)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect old IE8 mode windows", () => {
		client.init("Mozilla/4.0 (compatible MSIE 8.0 Windows NT 5.1 Trident/4.0)", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(8)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect old ie7 windows", () => {
		client.init("Mozilla/4.0(compatible MSIE 7.0b Windows NT 6.0)", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(7)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect opera 12 windows", () => {
		client.init("Opera/9.80 (Windows NT 6.1 WOW64) Presto/2.12.388 Version/12.11", "Linux")
		o(client.browser).equals(BrowserType.OPERA)
		o(client.browserVersion).equals(12.1)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect opera 21 windows", () => {
		client.init("Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36 OPR/21.0.1432.67 (Edition Campaign 38)", "Linux")
		o(client.browser).equals(BrowserType.OPERA)
		o(client.browserVersion).equals(21)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect opera 21 Mac", () => {
		client.init("Mozilla/5.0 (Macintosh Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36 OPR/21.0.1432.67", "Linux")
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


	o("ClientDetector detect safari 6.05 on OS X", () => {
		client.init("Mozilla/5.0 (Macintosh Intel Mac OS X 10_8_4) AppleWebKit/536.30.1 (KHTML, like Gecko) Version/6.0.5 Safari/536.30.1", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(6)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
	})

	o("ClientDetector detect chrome on Android", () => {
		client.init("Mozilla/5.0 (Linux Android 4.1.1 HTC Desire X Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.99 Mobile Safari/537.36", "Linux")
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
		client.init("Mozilla/5.0 (Linux U Android 4.1.1, de-de HTC_Desire_X Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30", "Linux")
		o(client.browser).equals(BrowserType.ANDROID)
		o(client.browserVersion).equals(4.1)
		o(client.device).equals(DeviceType.ANDROID)
		o(client.isMobileDevice()).equals(true)
	})

	o("ClientDetector detect opera 19 on Android", () => {
		client.init("Mozilla/5.0 (Linux Android 4.1.1 HTC One X+ Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.72 Mobile Safari/537.36 OPR/19.0.1340.69721", "Linux")
		o(client.browser).equals(BrowserType.OPERA)
		o(client.browserVersion).equals(19)
		o(client.device).equals(DeviceType.ANDROID)
		o(client.isMobileDevice()).equals(true)
	})

	o("ClientDetector detect windows phone 8.0", () => {
		client.init("Mozilla/5.0 (compatible MSIE 10.0 Windows Phone 8.0 Trident/6.0 IEMobile/10.0 ARM Touch Microsoft Virtual)", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(10)
		o(client.device).equals(DeviceType.WINDOWS_PHONE)
		o(client.isMobileDevice()).equals(true)
	})

	o("ClientDetector detect windows phone 7.5", () => {
		client.init("Mozilla/5.0 (compatible MSIE 9.0 Windows Phone OS 7.5 Trident/5.0 IEMobile/9.0)", "Linux")
		o(client.browser).equals(BrowserType.IE)
		o(client.browserVersion).equals(9)
		o(client.device).equals(DeviceType.WINDOWS_PHONE)
		o(client.isMobileDevice()).equals(true)
	})

	o("ClientDetector detect chrome 34 on iphone", () => {
		client.init("Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/34.0.1847.18 Mobile/11A501 Safari/9537.53", "Linux")
		o(client.browser).equals(BrowserType.CHROME)
		o(client.browserVersion).equals(34)
		o(client.device).equals(DeviceType.IPHONE)
		o(client.isMobileDevice()).equals(true)
	})

	o("ClientDetector the android 4 in app mode supported", () => {
		env.mode = Mode.App
		client.init("Mozilla/5.0 (Linux U Android 4.0, de-de HTC_Desire_X Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30", "Linux")
		o(client.browser).equals(BrowserType.ANDROID)
		o(client.browserVersion).equals(4)
		o(client.device).equals(DeviceType.ANDROID)
		o(client.isMobileDevice()).equals(true)
		env.mode = Mode.Browser
	})

	o("ClientDetector the android 3 in app mode not supported", () => {
		env.mode = Mode.App
		client.init("Mozilla/5.0 (Linux U Android 4.0, de-de HTC_Desire_X Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/3.9 Mobile Safari/534.30", "Linux")
		o(client.browser).equals(BrowserType.ANDROID)
		o(client.browserVersion).equals(4)
		o(client.device).equals(DeviceType.ANDROID)
		o(client.isMobileDevice()).equals(true)
		env.mode = Mode.Browser
	})

	o("ClientDetector apps on ios are supported", () => {
		env.mode = Mode.App
		client.init("Mozilla/5.0 (iPhone CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit", "Linux")
		o(client.browser).equals(BrowserType.SAFARI)
		o(client.browserVersion).equals(7)
		o(client.device).equals(DeviceType.IPHONE)
		o(client.isMobileDevice()).equals(true)
		env.mode = Mode.Browser
	})

	o("ClientDetector blackberry browser are supported", () => {
		env.mode = Mode.App
		client.init("Mozilla/5.0 (BB10 Touch) AppleWebKit/537.35+ (KHTML, like Gecko) Version/10.2.1.3247 Mobile Safari/537.35+", "Linux")
		o(client.browser).equals(BrowserType.BB)
		o(client.browserVersion).equals(10)
		o(client.device).equals(DeviceType.BB)
		o(client.isMobileDevice()).equals(true)
		env.mode = Mode.Browser
	})

	o("ClientDetector iceweasel browser are supported", () => {
		env.mode = Mode.App
		client.init("Mozilla/5.0 (X11 Linux x86_64 rv:37.0)  Gecko/20100101 Iceweasel/37.0.1", "Linux")
		o(client.browser).equals(BrowserType.FIREFOX)
		o(client.browserVersion).equals(37)
		o(client.device).equals(DeviceType.DESKTOP)
		o(client.isMobileDevice()).equals(false)
		env.mode = Mode.Browser
	})

	o("ClientDetector ubuntu phone is supported", () => {
		env.mode = Mode.App
		client.init("Mozilla/5.0 (Ubuntu Mobile) WebKit/537.21", "Linux")
		o(client.browser).equals(BrowserType.UBUNTU)
		o(client.browserVersion).equals(1)
		o(client.device).equals(DeviceType.OTHER_MOBILE)
		o(client.isMobileDevice()).equals(true)
		env.mode = Mode.Browser
	})

	o("ClientDetector ubuntu tablet is supported", () => {
		env.mode = Mode.App
		client.init("Mozilla/5.0 (Ubuntu Tablet) WebKit/537.21", "Linux")
		o(client.browser).equals(BrowserType.UBUNTU)
		o(client.browserVersion).equals(1)
		o(client.device).equals(DeviceType.OTHER_MOBILE)
		o(client.isMobileDevice()).equals(true)
		env.mode = Mode.Browser
	})

	o("ClientDetector ubuntu phone (like Android) is supported", () => {
		env.mode = Mode.App
		client.init("Mozilla/5.0 (Linux Ubuntu 14.04 like Android 4.4) AppleWebKit/537.36 Chromium/35.0.1870.2 Mobile Safari/537.36", "Linux")
		o(client.browser).equals(BrowserType.UBUNTU)
		o(client.browserVersion).equals(14)
		o(client.device).equals(DeviceType.OTHER_MOBILE)
		o(client.isMobileDevice()).equals(true)
		env.mode = Mode.Browser
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
