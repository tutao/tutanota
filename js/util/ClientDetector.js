"use strict";

goog.provide('tutao.tutanota.util.ClientDetector');

/** Chrome browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_CHROME = "Chrome";
/** Firefox browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_FIREFOX = "Firefox";
/** IE browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE = "Internet Explorer";
/** Safari browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI = "Safari";
/** other browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_OTHER = "Other";

/** Unix/Linux OS */
tutao.tutanota.util.ClientDetector.OS_TYPE_LINUX = "Linux";
/** Mac/iOS OS */
tutao.tutanota.util.ClientDetector.OS_TYPE_MAC = "Mac";
/** Windows OS */
tutao.tutanota.util.ClientDetector.OS_TYPE_WINDOWS = "Windows";
/** other OS */
tutao.tutanota.util.ClientDetector.OS_TYPE_OTHER = "Other";

/** iPhone device */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE = "iPhone";
/** iPad device */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPAD = "iPad";
/** Android device */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID = "Android";
/** other device */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_OTHER = "Other";

/** browser is supported */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED = "supported";
/** browser is supported in legacy mode (view mails es external recipient). Legacy mode is the same as update needed for all internal users. */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY = "legacy";
/** browser is not supported */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_NOT_SUPPORTED = "not supported";
/** browser is generally supported, but must be updated to fit supported version */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_UPDATE_NEEDED = "update needed";
/** support is unknown */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_UNKNOWN = "unknown";

/** german language */
tutao.tutanota.util.ClientDetector.LANGUAGE_DE = "de";
/** english language */
tutao.tutanota.util.ClientDetector.LANGUAGE_EN = "en";

/**
 * Information about the client.
 * For a list of use agent strings, see: http://www.useragentstring.com/pages/Browserlist/
 */
tutao.tutanota.util.ClientDetector._browser = null;
tutao.tutanota.util.ClientDetector._browserVersion = null;
tutao.tutanota.util.ClientDetector._os = null;
tutao.tutanota.util.ClientDetector._device = null;
tutao.tutanota.util.ClientDetector._touch = null;
tutao.tutanota.util.ClientDetector._phone = null;
tutao.tutanota.util.ClientDetector._supported = null;
tutao.tutanota.util.ClientDetector._lang = null;

/**
 * Provides the browser type.
 * @return {string} The type of browser. One of BROWSER_TYPES.
 */
tutao.tutanota.util.ClientDetector.getBrowserType = function() {
	if (tutao.tutanota.util.ClientDetector._browser == null) {
		tutao.tutanota.util.ClientDetector._setClientInfo(navigator.userAgent);
	}
	return tutao.tutanota.util.ClientDetector._browser;
};

/**
 * Provides the browser main version.
 * @return {number} The version of the browser. 0 if unknown.
 */
tutao.tutanota.util.ClientDetector.getBrowserVersion = function() {
	if (tutao.tutanota.util.ClientDetector._browser == null) {
		tutao.tutanota.util.ClientDetector._setClientInfo(navigator.userAgent);
	}
	return tutao.tutanota.util.ClientDetector._browserVersion;
};

/**
 * Provides the operating system.
 * @return {string} The operating system. One of OS_TYPES.
 */
tutao.tutanota.util.ClientDetector.getOs = function() {
	if (tutao.tutanota.util.ClientDetector._browser == null) {
		tutao.tutanota.util.ClientDetector._setClientInfo(navigator.userAgent);
	}
	return tutao.tutanota.util.ClientDetector._os;
};

/**
 * Provides the device type.
 * @return {string} The operating system. One of DEVICE_TYPES.
 */
tutao.tutanota.util.ClientDetector.getDeviceType = function() {
	if (tutao.tutanota.util.ClientDetector._browser == null) {
		tutao.tutanota.util.ClientDetector._setClientInfo(navigator.userAgent);
	}
	return tutao.tutanota.util.ClientDetector._device;
};

/**
 * Provides the information if touch is supported by the device. Defaults to false for desktop browsers.
 * @return {Boolean} True if the device is a touch device, false otherwise.
 */
tutao.tutanota.util.ClientDetector.isTouchSupported = function() {
	if (tutao.tutanota.util.ClientDetector._browser == null) {
		tutao.tutanota.util.ClientDetector._setClientInfo(navigator.userAgent);
	}
	return tutao.tutanota.util.ClientDetector._touch;
};

/**
 * Provides the information if phone capabilities exist on the device. Defaults to true for desktop browsers.
 * @return {Boolean} True if the device has phone capabilities.
 */
tutao.tutanota.util.ClientDetector.isPhoneSupported = function() {
	if (tutao.tutanota.util.ClientDetector._browser == null) {
		tutao.tutanota.util.ClientDetector._setClientInfo(navigator.userAgent);
	}
	return tutao.tutanota.util.ClientDetector._phone;
};

/**
 * Provides the type of support by Tutanota.
 * @return {string} Indicates if the browser is supported. One of SUPPORTED_TYPES.
 */
tutao.tutanota.util.ClientDetector.getSupportedType = function() {
	if (tutao.tutanota.util.ClientDetector._browser == null) {
		tutao.tutanota.util.ClientDetector._setClientInfo(navigator.userAgent);
	}
	return tutao.tutanota.util.ClientDetector._supported;
};

/**
 * Provides the default language which is a supported language derived from the browser language.
 * @return {string} The default language. One of the LANGUAGE* values.
 */
tutao.tutanota.util.ClientDetector.getDefaultLanguage = function() {
	if (tutao.tutanota.util.ClientDetector._lang == null) {
		tutao.tutanota.util.ClientDetector._setDefaultLanguage();
	}
	return tutao.tutanota.util.ClientDetector._lang;
};

/**
 * Sets the information about the client from a user agent string.
 * @param {string} userAgent The user agent string.
 */
tutao.tutanota.util.ClientDetector._setClientInfo = function(userAgent) {
	tutao.tutanota.util.ClientDetector._setBrowserAndVersion(userAgent);
	tutao.tutanota.util.ClientDetector._setOs(userAgent);
	tutao.tutanota.util.ClientDetector._setDeviceInfo(userAgent);
	tutao.tutanota.util.ClientDetector._setSupportInfo(userAgent);
};

/**
 * Sets the support info.
 * @param {string} userAgent The user agent string.
 */
tutao.tutanota.util.ClientDetector._setSupportInfo = function(userAgent) {
	var info = tutao.tutanota.util.ClientDetector;
	var minVersionNeeded = {};
	minVersionNeeded[info.BROWSER_TYPE_CHROME] = 18;
	minVersionNeeded[info.BROWSER_TYPE_FIREFOX] = 16;
	minVersionNeeded[info.BROWSER_TYPE_IE] = 8;
	minVersionNeeded[info.BROWSER_TYPE_SAFARI] = 6;

	if (info._browser == info.BROWSER_TYPE_OTHER) {
		info._supported = info.SUPPORTED_TYPE_UNKNOWN;
	} else if (info._browser == info.BROWSER_TYPE_SAFARI && !info._touch) {
		// safari is only supported on iPad and iPhone
		info._supported = info.SUPPORTED_TYPE_UNKNOWN;
	} else if (info._browserVersion < minVersionNeeded[info._browser]) {
		info._supported = info.SUPPORTED_TYPE_UPDATE_NEEDED;
	} else if (info._browser == info.BROWSER_TYPE_IE && info._browserVersion < 10) {
		if (window.swfobject && swfobject.getFlashPlayerVersion().major >= 8) { // since version 8 file download is supported
			info._supported = info.SUPPORTED_TYPE_LEGACY;
		} else {
			info._supported = info.SUPPORTED_TYPE_NOT_SUPPORTED;
		}
	} else {
		info._supported = info.SUPPORTED_TYPE_SUPPORTED;
	}
};

/**
 * Sets the device info.
 * @param {string} userAgent The user agent string.
 */
tutao.tutanota.util.ClientDetector._setDeviceInfo = function(userAgent) {
	var info = tutao.tutanota.util.ClientDetector;
	info._device = info.DEVICE_TYPE_OTHER;
	info._touch = false;
	info._phone = false; // we assume by default devices do not support phones
	if (userAgent.match(/iPad.*AppleWebKit/) != null) {
		info._device = info.DEVICE_TYPE_IPAD;
		info._touch = true;
		info._phone = false;
	} else if (userAgent.match(/iPhone.*AppleWebKit/) != null) {
		info._device = info.DEVICE_TYPE_IPHONE;
		info._touch = true;
		info._phone = true;
	} else if (userAgent.match(/Android/) != null) {
		info._device = info.DEVICE_TYPE_ANDROID;
		info._touch = true;
		info._phone = true;
	}
};

/**
 * Sets the OS info.
 * @param {string} userAgent The user agent string.
 */
tutao.tutanota.util.ClientDetector._setOs = function(userAgent) {
	var info = tutao.tutanota.util.ClientDetector;
	info._os = info.OS_TYPE_OTHER;
	var windowsIndex = userAgent.indexOf("Windows");
	var linuxIndex = userAgent.indexOf("Linux");
	var appleIndex1 = userAgent.indexOf("Macintosh");
	var appleIndex2 = userAgent.indexOf("Mac OS");
	if (windowsIndex != -1) {
		info._os = info.OS_TYPE_WINDOWS;
	} else if (linuxIndex != -1) {
		info._os = info.OS_TYPE_LINUX;
	} else if (appleIndex1 != -1 || appleIndex2 != -1) {
		info._os = info.OS_TYPE_MAC;
	}
};

/**
 * Sets the browser and version info.
 * @param {string} userAgent The user agent string.
 */
tutao.tutanota.util.ClientDetector._setBrowserAndVersion = function(userAgent) {
	var info = tutao.tutanota.util.ClientDetector;
	info._browser = info.BROWSER_TYPE_OTHER;
	info._browserVersion = 0;

	var firefoxIndex = userAgent.indexOf("Firefox/");
	var chromeIndex = userAgent.indexOf("Chrome/");
	var safariIndex = userAgent.indexOf("Safari/");
	var ieIndex = userAgent.indexOf("MSIE");
	var versionIndex = -1;
	if ((firefoxIndex != -1) && (userAgent.indexOf("Opera") == -1)) {
		// Opera may pretend to be Firefox, so it is skipped
		info._browser = info.BROWSER_TYPE_FIREFOX;
		versionIndex = firefoxIndex + 8;
	} else if (chromeIndex != -1) {
		info._browser = info.BROWSER_TYPE_CHROME;
		versionIndex = chromeIndex + 7;
	} else if (safariIndex != -1 && chromeIndex == -1) {
		// Chrome pretends to be Safari, so it is skipped
		info._browser = info.BROWSER_TYPE_SAFARI;
		// Safari prints its version after "Version/"
		versionIndex = userAgent.indexOf("Version/");
		if (versionIndex != -1) {
			versionIndex += 8;
		}
	} else if (userAgent.match(/iPad.*AppleWebKit/) != null || userAgent.match(/iPhone.*AppleWebKit/)) {
		// ipad and iphone do not send the Safari userAgent when HTML-apps are directly started from the homescreen; a browser version is sent neither
		alert("alert");
		info._browser = info.BROWSER_TYPE_SAFARI;
		info._browserVersion = 6;
	}
	else if (ieIndex != -1) {
		info._browser = info.BROWSER_TYPE_IE;
		versionIndex = ieIndex + 5;
	}
	if (versionIndex != -1) {
		var versionEndIndex = userAgent.indexOf(".", versionIndex);
		if (versionEndIndex != -1) {
			try {
				info._browserVersion = Number(userAgent.substring(versionIndex, versionEndIndex));
			} catch (e) {}
		}
	}
};

/**
 * Sets the default language derived from the browser language.
 */
tutao.tutanota.util.ClientDetector._setDefaultLanguage = function() {
	var lang = navigator.language || navigator.userLanguage;
	if (lang && lang.toLowerCase() == "de-de") {
		tutao.tutanota.util.ClientDetector._lang = tutao.tutanota.util.ClientDetector.LANGUAGE_DE;
	} else {
		tutao.tutanota.util.ClientDetector._lang = tutao.tutanota.util.ClientDetector.LANGUAGE_EN;
	}
};

