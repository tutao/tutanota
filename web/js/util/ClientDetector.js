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
/** Black Berry */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_BB = "BlackBerry";
/** Ubuntu browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_UBUNTU = "Ubuntu";
/** other browser */
tutao.tutanota.util.ClientDetector.BROWSER_TYPE_OTHER = "Other";


/** iPhone device */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE = "iPhone";
/** iPad device */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPAD = "iPad";
/** Android device */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID = "Android";
/** Windows phone */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_WINDOWS_PHONE = "Windows Phone";
/** Black Berry */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_BB = "BlackBerry";
/** other device */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP = "Desktop";
/** Other device */
tutao.tutanota.util.ClientDetector.DEVICE_TYPE_OTHER_MOBILE = "Other mobile";


/** browser is supported */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED = "supported";
/** browser is supported in legacy mode for Safari (view mails es external recipient). Downloading attachments is not fully supported. */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_SAFARI = "legacy safari";
/** browser is not supported */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_NOT_SUPPORTED = "not supported";
/** browser is generally supported, but must be updated to fit supported version */
tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_UPDATE_NEEDED = "update needed";

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
tutao.tutanota.util.ClientDetector._device = null;
/**
 * @type {?string}
 * @private
 */
tutao.tutanota.util.ClientDetector._supported = null;

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
 * Provides the current language from the browser.
 * @return {string=} The language string.
 */
tutao.tutanota.util.ClientDetector.getDefaultLanguage = function() {
	// navigator.languages can be an empty array on android 5.x devices
	return (navigator.languages && navigator.languages.length > 0) ? navigator.languages[0] : (navigator.language || navigator.userLanguage);
};

/**
 * Provides the current country code from the browser.
 * @return {string=} The country code.
 */
tutao.tutanota.util.ClientDetector.getDefaultCountry = function() {
	var locale = tutao.tutanota.util.ClientDetector.getDefaultLanguage();
	if (locale) {
		var split = locale.replace("-", "_").split("_");
		if (split.length > 1) {
			return split[1].toUpperCase();
		}
	}
	return null;
};

/**
 * Sets the information about the client from a user agent string.
 * @param {string} userAgent The user agent string.
 */
tutao.tutanota.util.ClientDetector._setClientInfo = function(userAgent) {
	if (location.href.substring(location.href.length - 5) == "force") {
		if (tutao.env.mode == tutao.Mode.App) {
			userAgent = "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 5 Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.65 Mobile Safari/537.36";
		} else {
			userAgent = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:49.0) Gecko/20100101 Firefox/49.0";
		}
	}
	tutao.tutanota.util.ClientDetector._setBrowserAndVersion(userAgent);
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
    minVersionNeeded[info.BROWSER_TYPE_BB] = 10;
    minVersionNeeded[info.BROWSER_TYPE_UBUNTU] = 1;

    if (info._browser == info.BROWSER_TYPE_OTHER) {
		info._supported = info.SUPPORTED_TYPE_NOT_SUPPORTED;
    } else if (info._browserVersion < minVersionNeeded[info._browser]) {
		info._supported = info.SUPPORTED_TYPE_UPDATE_NEEDED;
    } else {
        info._supported = info.SUPPORTED_TYPE_SUPPORTED;
    }

  	if (info._device == info.DEVICE_TYPE_WINDOWS_PHONE &&
            info._browser == info.BROWSER_TYPE_IE &&
            info._browserVersion >= 10) {
        info._supported = info.SUPPORTED_TYPE_SUPPORTED;
    } if (info._device == info.DEVICE_TYPE_WINDOWS_PHONE &&
            info._browser == info.BROWSER_TYPE_IE &&
            info._browserVersion < 10) {
        // tool old IE versions on win phone shall be shown as not supported instead of update needed
        info._supported = info.SUPPORTED_TYPE_NOT_SUPPORTED;
	} else if (info._device == info.DEVICE_TYPE_DESKTOP && info._browser == info.BROWSER_TYPE_SAFARI) {
        if ( info._browserVersion < 6.1 ){
            info._supported = info.SUPPORTED_TYPE_UPDATE_NEEDED;
        } else {
            info._supported = info.SUPPORTED_TYPE_SUPPORTED;
        }
    } else if (info._device == info.DEVICE_TYPE_ANDROID &&
            info._browser == info.BROWSER_TYPE_ANDROID &&
            info._browserVersion >= 4) {
        if (tutao.env.mode == tutao.Mode.App) {
            info._supported = info.SUPPORTED_TYPE_SUPPORTED;
        } else {
            info._supported = info.SUPPORTED_TYPE_NOT_SUPPORTED;
        }
    } else if (info._device == info.DEVICE_TYPE_BB) {
        info._supported = info.SUPPORTED_TYPE_SUPPORTED;
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
	if (userAgent.match(/iPad.*AppleWebKit/) != null) {
		info._device = info.DEVICE_TYPE_IPAD;
	} else if (userAgent.match(/iPhone.*AppleWebKit/) != null) {
		info._device = info.DEVICE_TYPE_IPHONE;
	} else if (userAgent.match(/Android/) != null) {
        if (userAgent.match(/Ubuntu/) != null ){
            info._device = info.DEVICE_TYPE_OTHER_MOBILE;
        }else {
            info._device = info.DEVICE_TYPE_ANDROID;
        }
	} else if (userAgent.match(/Windows Phone/) != null) {
        info._device = info.DEVICE_TYPE_WINDOWS_PHONE;
    } else if (userAgent.match(/Windows NT/) != null){
        info._device = info.DEVICE_TYPE_DESKTOP;
    } else if (userAgent.match(/BB10/) != null) {
        info._device = info.DEVICE_TYPE_BB;
    } else if (userAgent.match(/Mobile/) != null || userAgent.match(/Tablet/) != null) {
        info._device = info.DEVICE_TYPE_OTHER_MOBILE;
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
    var iceweaselIndex = userAgent.indexOf("Iceweasel/");
	var chromeIndex = userAgent.indexOf("Chrome/");
	var safariIndex = userAgent.indexOf("Safari/");
	var ieIndex = userAgent.indexOf("MSIE");
	var ie11Index = userAgent.indexOf("Trident/7.0");
    var androidIndex = userAgent.indexOf("Android");
    var blackBerryIndex = userAgent.indexOf("BB10");
    var ubuntuMobileIndex = userAgent.indexOf("Ubuntu; Mobile");
    var ubuntuTabletIndex = userAgent.indexOf("Ubuntu; Tablet");
    var ubuntuIndex = userAgent.indexOf("Ubuntu");

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
    } else if ((firefoxIndex != -1 || iceweaselIndex != -1) && (operaIndex1 == -1) && (operaIndex2 == -1)) {
		// Opera may pretend to be Firefox, so it is skipped
		info._browser = info.BROWSER_TYPE_FIREFOX;
        if (firefoxIndex != -1) {
            versionIndex = firefoxIndex + 8;
        } else {
            versionIndex = iceweaselIndex + 10;
        }
	} else if (chromeIndex != -1) {
		info._browser = info.BROWSER_TYPE_CHROME;
		versionIndex = chromeIndex + 7;
    } else if (androidIndex != -1) {
        if ( ubuntuIndex != -1){ // ubuntu phone browser
            info._browser = info.BROWSER_TYPE_UBUNTU;
            versionIndex = ubuntuIndex + 7;
        }else { // default android browser
            // keep this check after Chrome, Firefox and Opera, because the Android browser does not identify itself in any other way
            info._browser = info.BROWSER_TYPE_ANDROID;
            versionIndex = androidIndex + 8;
        }
	} else if (safariIndex != -1 && chromeIndex == -1 && blackBerryIndex == -1) {
		// Chrome and black berry pretends to be Safari, so it is skipped
		info._browser = info.BROWSER_TYPE_SAFARI;
		// Safari prints its version after "Version/"
		versionIndex = userAgent.indexOf("Version/");
		if (versionIndex != -1) {
			versionIndex += 8;
		}
	} else if (userAgent.match(/iPad.*AppleWebKit/) || userAgent.match(/iPhone.*AppleWebKit/)) {
        // homescreen detection is only available when in app mode otherwise it is deactivated because of problems in iOS
        if (tutao.env.mode == tutao.Mode.App) {
            // ipad and iphone do not send the Safari userAgent when HTML-apps are directly started from the homescreen; a browser version is sent neither
            // after "OS" the iOS version is sent, so use that one
            versionIndex = userAgent.indexOf(" OS ");
            if (versionIndex != -1) {
                info._browser = info.BROWSER_TYPE_SAFARI;
                try {
					// Support two digit numbers for iOS iPhone6 Simulator
					var numberString = userAgent.substring(versionIndex + 4, versionIndex + 6);
                    info._browserVersion = Number(numberString.replace("_", ""));
                } catch (e) {}
                return;
            }
        }
	} else if (ieIndex != -1) {
		info._browser = info.BROWSER_TYPE_IE;
		versionIndex = ieIndex + 5;
	} else if (ie11Index != -1) {
		info._browser = info.BROWSER_TYPE_IE;
		info._browserVersion = 11;
	} else if (blackBerryIndex !=-1){
        info._browser = info.BROWSER_TYPE_BB;
        info._browserVersion = 10;
    } else if (ubuntuMobileIndex != -1 || ubuntuTabletIndex != -1) {
        info._browser = info.BROWSER_TYPE_UBUNTU;
        info._browserVersion = 1; // dummy, no browser version is provided
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
