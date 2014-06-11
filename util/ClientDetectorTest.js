"use strict";

goog.provide('ClientDetectorTest');

// see: http://www.useragentstring.com/
TestCase("ClientDetectorTest", {
	
	setUp: function() {
		swfobject =  {
			getFlashPlayerVersion: function() {
				return {major: 8 };
			}
		};
	},
	
	"test detect chrome windows": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.15 (KHTML, like Gecko) Chrome/29.0.1295.0 Safari/537.15");
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_UPDATE_NEEDED, info.getSupportedType());
		info._setClientInfo("Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.15 (KHTML, like Gecko) Chrome/30.0.1295.0 Safari/537.15");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_CHROME, info.getBrowserType());
		assertEquals(30, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
		assertEquals(false, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
		
	},
	"test detect firefox linux": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:17.0) Gecko/17.0 Firefox/17.0");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_FIREFOX, info.getBrowserType());
		assertEquals(17, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_LINUX, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
		assertEquals(false, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
	},
    "test detect safari 5.1 ipad": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (iPad; CPU OS 5_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko ) Version/5.1 Mobile/9B176 Safari/7534.48.3");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI, info.getBrowserType());
        assertEquals(5.1, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPAD, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(false, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_UPDATE_NEEDED, info.getSupportedType());
    },
	"test detect safari 6.0 ipad": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A403 Safari/8536.25");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI, info.getBrowserType());
		assertEquals(6, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPAD, info.getDeviceType());
		assertEquals(true, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
	},
	"test detect safari 6.1 ipad": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.1 Mobile/10A403 Safari/8536.25");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI, info.getBrowserType());
		assertEquals(6.1, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPAD, info.getDeviceType());
		assertEquals(true, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
	},
    "test detect safari 7 iphone": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A501 Safari/9537.53");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI, info.getBrowserType());
        assertEquals(7, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(true, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
    },
    "test detect safari 6.0 iphone home screen": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (iPhone; CPU iPhone OS 6_1_6 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Mobile/10B500");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_OTHER, info.getBrowserType());
        assertEquals(0, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(true, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_NOT_SUPPORTED, info.getSupportedType());
    },
    "test detect safari 7 iphone home screen": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/11A501");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_OTHER, info.getBrowserType());
        assertEquals(0, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(true, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_NOT_SUPPORTED, info.getSupportedType());
    },
    "test detect ie11 windows": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE, info.getBrowserType());
		assertEquals(11, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
		assertEquals(false, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
	},
	"test detect ie 10 windows": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE, info.getBrowserType());
		assertEquals(10, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
		assertEquals(false, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
	},
	"test detect old ie9 windows": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/6.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE, info.getBrowserType());
		assertEquals(9, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
		assertEquals(false, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE, info.getSupportedType());
	},
	"test detect old ie9 in IE8 mode windows": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; GTB7.4; InfoPath.2; SV1; .NET CLR 3.3.69573; WOW64; en-US)");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE, info.getBrowserType());
		assertEquals(8, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
		assertEquals(false, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE, info.getSupportedType());
	},
	"test detect old IE8 mode windows": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0)");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE, info.getBrowserType());
		assertEquals(8, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
		assertEquals(false, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE, info.getSupportedType());
	},
	"test detect old ie7 windows": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Mozilla/4.0(compatible; MSIE 7.0b; Windows NT 6.0)");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE, info.getBrowserType());
		assertEquals(7, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
		assertEquals(false, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_UPDATE_NEEDED, info.getSupportedType());
	},
	"test detect opera 12 windows": function() {
		var info = tutao.tutanota.util.ClientDetector;
		info._setClientInfo("Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.11");
		assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_OPERA, info.getBrowserType());
		assertEquals(12.1, info.getBrowserVersion());
		assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
		assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
		assertEquals(false, info.isMobileDevice());
		assertEquals(false, info.isPhoneSupported());
		assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_UPDATE_NEEDED, info.getSupportedType());
	},
    "test detect opera 21 windows": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36 OPR/21.0.1432.67 (Edition Campaign 38)");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_OPERA, info.getBrowserType());
        assertEquals(21, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
        assertEquals(false, info.isMobileDevice());
        assertEquals(false, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
    },
    "test detect opera 21 Mac": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36 OPR/21.0.1432.67");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_OPERA, info.getBrowserType());
        assertEquals(21, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
        assertEquals(false, info.isMobileDevice());
        assertEquals(false, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
    },
    "test detect safari 6.1 on OS X": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.71 (KHTML, like Gecko) Version/6.1 Safari/537.71");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI, info.getBrowserType());
        assertEquals(6.1, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
        assertEquals(false, info.isMobileDevice());
        assertEquals(false, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_SAFARI, info.getSupportedType());
    },
    "test detect safari 7 on OS X": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9) AppleWebKit/537.71 (KHTML, like Gecko) Version/7.0 Safari/537.71");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI, info.getBrowserType());
        assertEquals(7, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
        assertEquals(false, info.isMobileDevice());
        assertEquals(false, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_SAFARI, info.getSupportedType());
    },
    "test detect safari 6.05 on OS X": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/536.30.1 (KHTML, like Gecko) Version/6.0.5 Safari/536.30.1");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI, info.getBrowserType());
        assertEquals(6, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP, info.getDeviceType());
        assertEquals(false, info.isMobileDevice());
        assertEquals(false, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_UPDATE_NEEDED, info.getSupportedType());
    },
    "test detect chrome on Android": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (Linux; Android 4.1.1; HTC Desire X Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.99 Mobile Safari/537.36");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_CHROME, info.getBrowserType());
        assertEquals(32, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_LINUX, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(true, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
    },
    "test detect firefox on Android": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (Android; Mobile; rv:27.0) Gecko/27.0 Firefox/27.0");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_FIREFOX, info.getBrowserType());
        assertEquals(27, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_LINUX, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(true, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_NOT_SUPPORTED, info.getSupportedType());
    },
    "test detect android browser 4.1 on Android": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (Linux; U; Android 4.1.1, de-de; HTC_Desire_X Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_ANDROID, info.getBrowserType());
        assertEquals(4.1, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_LINUX, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(true, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_ANDROID, info.getSupportedType());
    },
    "test detect opera 19 on Android": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (Linux; Android 4.1.1; HTC One X+ Build/JRO03C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.72 Mobile Safari/537.36 OPR/19.0.1340.69721");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_OPERA, info.getBrowserType());
        assertEquals(19, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_LINUX, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(true, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED, info.getSupportedType());
    },
    "test detect windows phone 8.0": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; Microsoft; Virtual)");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE, info.getBrowserType());
        assertEquals(10, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_WINDOWS_PHONE, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(true, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE_MOBILE, info.getSupportedType());
    },
    "test detect windows phone 7.5": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0)");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE, info.getBrowserType());
        assertEquals(9, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_WINDOWS_PHONE, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(true, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_NOT_SUPPORTED, info.getSupportedType());
    },
    "test detect chrome 34 on iphone": function() {
        var info = tutao.tutanota.util.ClientDetector;
        info._setClientInfo("Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_2 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/34.0.1847.18 Mobile/11A501 Safari/9537.53");
        assertEquals(tutao.tutanota.util.ClientDetector.BROWSER_TYPE_OTHER, info.getBrowserType());
        assertEquals(0, info.getBrowserVersion());
        assertEquals(tutao.tutanota.util.ClientDetector.OS_TYPE_MAC, info.getOs());
        assertEquals(tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE, info.getDeviceType());
        assertEquals(true, info.isMobileDevice());
        assertEquals(true, info.isPhoneSupported());
        assertEquals(tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_NOT_SUPPORTED, info.getSupportedType());
    }
});
