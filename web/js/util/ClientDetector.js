"use strict";

tutao.provide('tutao.tutanota.util.ClientDetector');

/** Chrome browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_CHROME = "Chrome";
/** Firefox browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_FIREFOX = "Firefox";
/** IE browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE = "Internet Explorer";
/** Safari browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI = "Safari";
/** Android browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_ANDROID = "Android";
/** Opera browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_OPERA = "Opera";
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
/** Windows phone */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_WINDOWS_PHONE = "Windows Phone";
/** other device */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP = "Desktop";



/** browser is supported */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED = "supported";
/** browser is supported in legacy mode for IE8 and IE9 with flash plugin (view mails es external recipient). Replying to emails is not supported. */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE = "legacy ie";
/** browser does not support attaching files and downloading attachments */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE_MOBILE = "legacy ie mobile";
/** browser is supported in legacy mode for Safari (view mails es external recipient). Downloading attachments is not fully supported. */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_SAFARI = "legacy safari";
/** browser is supported in legacy mode for Android 4.0 - 4.3. Replying to emails is not supported. */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_ANDROID = "legacy android";
/** browser is not supported */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_NOT_SUPPORTED = "not supported";
/** browser is generally supported, but must be updated to fit supported version */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_UPDATE_NEEDED = "update needed";

/** german language */
tutao.tutanota.util.ClientDetector.LANGUAGE_DE = "de";
/** english language */
tutao.tutanota.util.ClientDetector.LANGUAGE_EN = "en";

/**
 * Information about the client.
 * For a list of used agent strings, see: http://www.useragentstring.com/pages/Browserlist/
 */
/**
 * @type {?string}
 * @private
 */
tutao.tutanota.util.ClientDetector._browser = null;
/**
 * @type {?number}
 * @private
 */
tutao.tutanota.util.ClientDetector._browserVersion = null;
/**
 * @type {?string}
 * @private
 */
tutao.tutanota.util.ClientDetector._os = null;
/**
 * @type {?string}
 * @private
 */
tutao.tutanota.util.ClientDetector._device = null;
/**
 * @type {?boolean}
 * @private
 */
tutao.tutanota.util.ClientDetector._phone = null;
/**
 * @type {?string}
 * @private
 */
tutao.tutanota.util.ClientDetector._supported = null;
/**
 * @type {?string}
 * @private
 */
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
	minVersionNeeded[info.BROWSER_TYPE_CHROME] = 30; // we need at least version 30 as swiping is used for tab switching in earlier releases (see https://code.google.com/p/chromium/issues/detail?id=117657)
	minVersionNeeded[info.BROWSER_TYPE_FIREFOX] = 16;
	minVersionNeeded[info.BROWSER_TYPE_IE] = 10;
    minVersionNeeded[info.BROWSER_TYPE_SAFARI] = 6;
    minVersionNeeded[info.BROWSER_TYPE_ANDROID] = 4; // only legacy
    minVersionNeeded[info.BROWSER_TYPE_OPERA] = 19;

    if (info._browser == info.BROWSER_TYPE_OTHER ||
        (info._device != info.DEVICE_TYPE_DESKTOP && (info._browser == info.BROWSER_TYPE_FIREFOX))) {
		info._supported = info.SUPPORTED_TYPE_NOT_SUPPORTED;
    } else if (info._browserVersion < minVersionNeeded[info._browser]) {
		info._supported = info.SUPPORTED_TYPE_UPDATE_NEEDED;
    } else {
        info._supported = info.SUPPORTED_TYPE_SUPPORTED;
    }
	if (info._device == info.DEVICE_TYPE_DESKTOP &&
            info._browser == info.BROWSER_TYPE_IE &&
            info._browserVersion >= 8 && // since version 8 file download is supported
            info._browserVersion < 10 &&
            window.swfobject &&
            swfobject.getFlashPlayerVersion().major >= 8) {
        info._supported = info.SUPPORTED_TYPE_LEGACY_IE;
    } if (info._device == info.DEVICE_TYPE_WINDOWS_PHONE &&
            info._browser == info.BROWSER_TYPE_IE &&
            info._browserVersion >= 10) {
        info._supported = info.SUPPORTED_TYPE_LEGACY_IE_MOBILE;
    } if (info._device == info.DEVICE_TYPE_WINDOWS_PHONE &&
            info._browser == info.BROWSER_TYPE_IE &&
            info._browserVersion < 10) {
        // tool old IE versions on win phone shall be shown as not supported instead of update needed
        info._supported = info.SUPPORTED_TYPE_NOT_SUPPORTED;
    } else if (info._device == info.DEVICE_TYPE_DESKTOP &&
            info._browser == info.BROWSER_TYPE_SAFARI &&
            info._browserVersion >= 6.1) {
        info._supported = info.SUPPORTED_TYPE_LEGACY_SAFARI;
	} else if (info._device == info.DEVICE_TYPE_DESKTOP &&
            info._browser == info.BROWSER_TYPE_SAFARI &&
            info._browserVersion < 6.1) {
        info._supported = info.SUPPORTED_TYPE_UPDATE_NEEDED;
    } else if (info._device == info.DEVICE_TYPE_ANDROID &&
            info._browser == info.BROWSER_TYPE_ANDROID &&
            info._browserVersion >= 4) {
        info._supported = info.SUPPORTED_TYPE_LEGACY_ANDROID;
    }
};

tutao.tutanota.util.ClientDetector.isSupported = function() {
	return tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED;
};


tutao.tutanota.util.ClientDetector.isMobileDevice = function() {
    if (tutao.tutanota.util.ClientDetector._device == null) {
        tutao.tutanota.util.ClientDetector._setClientInfo(navigator.userAgent);
    }
    var info = tutao.tutanota.util.ClientDetector;
    return (info._device != info.DEVICE_TYPE_DESKTOP);
};



/**
 * Sets the device info.
 * @param {string} userAgent The user agent string.
 */
tutao.tutanota.util.ClientDetector._setDeviceInfo = function(userAgent) {
	var info = tutao.tutanota.util.ClientDetector;
	info._device = info.DEVICE_TYPE_DESKTOP;
	info._phone = false; // we assume by default devices do not support phones
	if (userAgent.match(/iPad.*AppleWebKit/) != null) {
		info._device = info.DEVICE_TYPE_IPAD;
		info._phone = false;
	} else if (userAgent.match(/iPhone.*AppleWebKit/) != null) {
		info._device = info.DEVICE_TYPE_IPHONE;
		info._phone = true;
	} else if (userAgent.match(/Android/) != null) {
		info._device = info.DEVICE_TYPE_ANDROID;
		info._phone = true;
	} else if (userAgent.match(/Windows Phone/) != null){
        info._device = info.DEVICE_TYPE_WINDOWS_PHONE;
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
    var androidIndex = userAgent.indexOf("Android");
    var appleIndex1 = userAgent.indexOf("Macintosh");
    var appleIndex2 = userAgent.indexOf("Mac OS");
	if (windowsIndex != -1) {
        info._os = info.OS_TYPE_WINDOWS;
	} else if (linuxIndex != -1 || androidIndex != -1) {
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

    var operaIndex1 = userAgent.indexOf("Opera");
    var operaIndex2 = userAgent.indexOf("OPR/");
	var firefoxIndex = userAgent.indexOf("Firefox/");
	var chromeIndex = userAgent.indexOf("Chrome/");
	var safariIndex = userAgent.indexOf("Safari/");
	var ieIndex = userAgent.indexOf("MSIE");
	var ie11Index = userAgent.indexOf("Trident");
    var androidIndex = userAgent.indexOf("Android");
	var versionIndex = -1;
    if (operaIndex1 != -1) {
        info._browser = info.BROWSER_TYPE_OPERA;
        versionIndex = userAgent.indexOf("Version/");
        if (versionIndex != -1) {
            versionIndex += 8;
        } else {
            versionIndex = operaIndex1 + 6;
        }
    } else if (operaIndex2 != -1) {
        info._browser = info.BROWSER_TYPE_OPERA;
        versionIndex = operaIndex2 + 4;
    } else if ((firefoxIndex != -1) && (operaIndex1 == -1) && (operaIndex2 == -1)) {
		// Opera may pretend to be Firefox, so it is skipped
		info._browser = info.BROWSER_TYPE_FIREFOX;
		versionIndex = firefoxIndex + 8;
	} else if (chromeIndex != -1) {
		info._browser = info.BROWSER_TYPE_CHROME;
		versionIndex = chromeIndex + 7;
    } else if (androidIndex != -1) {
        // keep this check after Chrome, Firefox and Opera, because the Android browser does not identify itself in any other way
        info._browser = info.BROWSER_TYPE_ANDROID;
        versionIndex = androidIndex + 8;
	} else if (safariIndex != -1 && chromeIndex == -1) {
		// Chrome pretends to be Safari, so it is skipped
		info._browser = info.BROWSER_TYPE_SAFARI;
		// Safari prints its version after "Version/"
		versionIndex = userAgent.indexOf("Version/");
		if (versionIndex != -1) {
			versionIndex += 8;
		}
	/* homescreen detection currently deactivated because of problems (see: https://next.tutao.de/confluence/display/next/Browser+support)
	} else if (userAgent.match(/iPad.*AppleWebKit/) || userAgent.match(/iPhone.*AppleWebKit/)) {
		// ipad and iphone do not send the Safari userAgent when HTML-apps are directly started from the homescreen; a browser version is sent neither
        // after "OS" the iOS version is sent, so use that one
		versionIndex = userAgent.indexOf(" OS ");
        if (versionIndex != -1) {
		    info._browser = info.BROWSER_TYPE_SAFARI;
            try {
		        info._browserVersion = Number(userAgent.substring(versionIndex + 4, versionIndex + 5));
            } catch (e) {}
            return;
        }*/
	} else if (ieIndex != -1) {
		info._browser = info.BROWSER_TYPE_IE;
		versionIndex = ieIndex + 5;
	} else if (ie11Index != -1) {
		info._browser = info.BROWSER_TYPE_IE;
		info._browserVersion = 11;
	}	
	if (versionIndex != -1) {
		var mainVersionEndIndex = userAgent.indexOf(".", versionIndex);
		if (mainVersionEndIndex != -1) {
			try {
				info._browserVersion = Number(userAgent.substring(versionIndex, mainVersionEndIndex + 2)); // we recognize one digit after the '.'
			} catch (e) {}
		}
	}
    // if the version is not valid, the browser type is not valid, so set it to other
    if (info._browserVersion == 0) {
        info._browser = info.BROWSER_TYPE_OTHER;
    }
};

/**
 * Sets the default language derived from the browser language.
 */
tutao.tutanota.util.ClientDetector._setDefaultLanguage = function() {
	var lang = navigator.language || navigator.userLanguage;
	if (lang && (lang.toLowerCase() == "de" || lang.toLowerCase() == "de-de")) {
		tutao.tutanota.util.ClientDetector._lang = tutao.tutanota.util.ClientDetector.LANGUAGE_DE;
	} else {
		tutao.tutanota.util.ClientDetector._lang = tutao.tutanota.util.ClientDetector.LANGUAGE_EN;
	}
};

