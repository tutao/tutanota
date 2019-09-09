//@flow
import {assertMainOrNodeBoot, Mode} from "../api/Env"
import type {BrowserData, BrowserTypeEnum, DeviceTypeEnum} from "./ClientConstants"
import {BrowserType, DeviceType} from "./ClientConstants"
import {neverNull} from "../api/common/utils/Utils"

assertMainOrNodeBoot()

class ClientDetector {
	userAgent: string;
	browser: BrowserTypeEnum;
	browserVersion: number;
	device: DeviceTypeEnum;
	overflowAuto: string;
	isMacOS: boolean;

	constructor() {
	}

	init(userAgent: string, platform: string) {
		this.userAgent = userAgent
		this.browser = BrowserType.OTHER
		this.browserVersion = 0
		this.device = DeviceType.DESKTOP
		this._setBrowserAndVersion()
		this._setDeviceInfo()
		this.overflowAuto = this.cssPropertyValueSupported("overflow", "overlay") ? "overlay" : "auto"
		this.isMacOS = platform.indexOf("Mac") !== -1
	}

	/**
	 * Browsers which support these features are supported
	 */
	isSupported(): boolean {
		return this.isSupportedBrowserVersion() &&
			this.flexbox() &&
			this.websockets() &&
			this.xhr2() &&
			this.randomNumbers() &&
			this.dateFormat() &&
			this.blob() &&
			this.history() &&
			this.supportsFocus()
	}

	isMobileDevice(): boolean {
		return this.device !== DeviceType.DESKTOP
	}

	isDesktopDevice(): boolean {
		return this.device === DeviceType.DESKTOP
	}


	/**
	 * @see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/css/flexbox.js
	 */
	flexbox(): boolean {
		return typeof neverNull(document.documentElement).style.flexBasis === 'string'
	}

	/**
	 * @see https://github.com/Modernizr/Modernizr/blob/5e3f359bfc9aa511543ece60bd8a6ea8aa7defd3/feature-detects/websockets.js
	 */
	websockets(): boolean {
		//require('../../node_modules/modernizr/feature-detects/websockets')
		return 'WebSocket' in window && window.WebSocket.CLOSING === 2
	}

	/**
	 * @see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/crypto/getrandomvalues.js
	 */
	randomNumbers(): boolean {
		let crypto = window['crypto'] || window['msCrypto']
		if (crypto && 'getRandomValues' in crypto && 'Uint32Array' in window) {
			var array = new Uint8Array(1)
			var values = crypto.getRandomValues(array)
			return values && typeof values[0] === 'number'
		} else {
			return false
		}
	}

	supportsFocus(): boolean {
		return typeof HTMLInputElement !== "undefined"
			&& typeof HTMLInputElement.prototype.focus === "function"
	}

	dateFormat(): boolean {
		return typeof Intl !== "undefined"
	}

	/**
	 * @see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/blob.js
	 */
	blob(): boolean {
		try {
			return !!new Blob()
		} catch (e) {
			return false
		}
	}

	localStorage(): boolean {
		try {
			return localStorage ? true : false
		} catch (e) {
			return false
		}

	}

	/**
	 * @see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
	 */
	history(): boolean {
		// Issue #733
		// The stock browser on Android 2.2 & 2.3, and 4.0.x returns positive on history support
		// Unfortunately support is really buggy and there is no clean way to detect
		// these bugs, so we fall back to a user agent sniff :(
		var ua = this.userAgent

		// We only want Android 2 and 4.0, stock browser, and not Chrome which identifies
		// itself as 'Mobile Safari' as well, nor Windows Phone (issue #1471).
		if ((ua.indexOf('Android 2.') !== -1 ||
			(ua.indexOf('Android 4.0') !== -1)) &&
			ua.indexOf('Mobile Safari') !== -1 &&
			ua.indexOf('Chrome') === -1 &&
			ua.indexOf('Windows Phone') === -1) {
			return false
		}

		// Return the regular check
		return (window.history && 'pushState' in window.history)
	}

	/**
	 * @see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/network/xhr2.js
	 */
	xhr2(): boolean {
		return 'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest()
	}


	indexedDb(): boolean {
		try {
			return indexedDB != null
		} catch (e) {
			return false
		}
	}

	/**
	 * @see https://github.com/Modernizr/Modernizr/issues/1894
	 */
	passive(): boolean {
		var supportsPassive = false;
		try {
			window.document.addEventListener("test", null, ({
				get passive() {
					supportsPassive = true
				}
			}: any));
		} catch (e) {
		}
		return supportsPassive
	}

	_setBrowserAndVersion() {
		var operaIndex1 = this.userAgent.indexOf("Opera")
		var operaIndex2 = this.userAgent.indexOf("OPR/")
		var firefoxIndex = this.userAgent.indexOf("Firefox/")
		var paleMoonIndex = this.userAgent.indexOf("PaleMoon/")
		var iceweaselIndex = this.userAgent.indexOf("Iceweasel/")
		var waterfoxIndex = this.userAgent.indexOf("Waterfox/")
		var chromeIndex = this.userAgent.indexOf("Chrome/")
		var chromeIosIndex = this.userAgent.indexOf("CriOS/")
		var safariIndex = this.userAgent.indexOf("Safari/")
		var ieIndex = this.userAgent.indexOf("MSIE")
		var edgeIndex = this.userAgent.indexOf("Edge") // "Old" edge based on EdgeHTML, "new" one based on Blink has only "Edg"
		var ie11Index = this.userAgent.indexOf("Trident/7.0")
		var androidIndex = this.userAgent.indexOf("Android")
		var blackBerryIndex = this.userAgent.indexOf("BB10")
		var ubuntuMobileIndex = this.userAgent.indexOf("Ubuntu Mobile")
		var ubuntuTabletIndex = this.userAgent.indexOf("Ubuntu Tablet")
		var ubuntuIndex = this.userAgent.indexOf("Ubuntu")

		var versionIndex = -1
		if (edgeIndex !== -1) {
			this.browser = BrowserType.EDGE
			versionIndex = edgeIndex + 5
		} else if (operaIndex1 !== -1) {
			this.browser = BrowserType.OPERA
			versionIndex = this.userAgent.indexOf("Version/")
			if (versionIndex !== -1) {
				versionIndex += 8
			} else {
				versionIndex = operaIndex1 + 6
			}
		} else if (operaIndex2 !== -1) {
			this.browser = BrowserType.OPERA
			versionIndex = operaIndex2 + 4
		} else if (paleMoonIndex !== -1) {
			this.browser = BrowserType.PALEMOON
			versionIndex = paleMoonIndex + 9
		} else if (waterfoxIndex !== -1) {
			this.browser = BrowserType.WATERFOX
			versionIndex = waterfoxIndex + 9
		} else if ((firefoxIndex !== -1 || iceweaselIndex !== -1) && (operaIndex1 === -1) && (operaIndex2 === -1)) {
			// Opera may pretend to be Firefox, so it is skipped
			this.browser = BrowserType.FIREFOX
			if (firefoxIndex !== -1) {
				versionIndex = firefoxIndex + 8
			} else {
				versionIndex = iceweaselIndex + 10
			}
		} else if (chromeIndex !== -1) {
			this.browser = BrowserType.CHROME
			versionIndex = chromeIndex + 7
		} else if (androidIndex !== -1) {
			if (ubuntuIndex !== -1) { // ubuntu phone browser
				this.browser = BrowserType.UBUNTU
				versionIndex = ubuntuIndex + 7
			} else { // default android browser
				// keep this check after Chrome, Firefox and Opera, because the Android browser does not identify itself in any other way
				this.browser = BrowserType.ANDROID
				versionIndex = androidIndex + 8
			}
		} else if (chromeIosIndex !== -1) {
			this.browser = BrowserType.CHROME
			versionIndex = chromeIosIndex + 6
		} else if (safariIndex !== -1 && chromeIndex === -1 && blackBerryIndex === -1) {
			// Chrome and black berry pretends to be Safari, so it is skipped
			this.browser = BrowserType.SAFARI
			// Safari prints its version after "Version/"
			versionIndex = this.userAgent.indexOf("Version/")
			if (versionIndex !== -1) {
				versionIndex += 8
			} else {
				// Other browsers on iOS do not usually send Version/ and we can assume that they're Safari
				this.extractIosVersion()
				return
			}
		} else if (this.userAgent.match(/iPad.*AppleWebKit/) || this.userAgent.match(/iPhone.*AppleWebKit/)) {
			// iPad and iPhone do not send the Safari this.userAgent when HTML-apps are directly started from the homescreen a browser version is sent neither
			// after "OS" the iOS version is sent, so use that one
			// Also there are a lot of browsers on iOS but they all are based on Safari so we can use the same extraction mechanism for all of them.
			this.extractIosVersion()
			return
		} else if (ieIndex !== -1) {
			this.browser = BrowserType.IE
			versionIndex = ieIndex + 5
		} else if (ie11Index !== -1) {
			this.browser = BrowserType.IE
			this.browserVersion = 11
		} else if (blackBerryIndex !== -1) {
			this.browser = BrowserType.BB
			this.browserVersion = 10
		} else if (ubuntuMobileIndex !== -1 || ubuntuTabletIndex !== -1) {
			this.browser = BrowserType.UBUNTU
			this.browserVersion = 1 // dummy, no browser version is provided
		}
		if (versionIndex !== -1) {
			var mainVersionEndIndex = this.userAgent.indexOf(".", versionIndex)
			if (mainVersionEndIndex !== -1) {
				try {
					this.browserVersion = Number(this.userAgent.substring(versionIndex, mainVersionEndIndex + 2)) // we recognize one digit after the '.'
				} catch (e) {
				}
			}
		}
		// if the version is not valid, the browser type is not valid, so set it to other
		if (this.browserVersion === 0) {
			this.browser = BrowserType.OTHER
		}
	}

	extractIosVersion() {
		const versionIndex = this.userAgent.indexOf(" OS ")
		if (versionIndex !== -1) {
			this.browser = BrowserType.SAFARI
			try {
				// in case of versions like 12_1_1 get substring 12_1 and convert it to 12.1
				let pos = versionIndex + 4
				let hadNan = false
				while (pos < this.userAgent.length) {
					pos++
					if (isNaN(Number(this.userAgent.charAt(pos)))) {
						if (hadNan) {
							break
						} else {
							hadNan = true
						}
					}
				}
				const numberString = this.userAgent.substring(versionIndex + 4, pos)
				this.browserVersion = Number(numberString.replace(/_/g, "."))
			} catch (e) {
			}
		}
	}

	_setDeviceInfo() {
		this.device = DeviceType.DESKTOP
		if (this.userAgent.match(/iPad.*AppleWebKit/) != null) {
			this.device = DeviceType.IPAD
		} else if (this.userAgent.match(/iPhone.*AppleWebKit/) != null) {
			this.device = DeviceType.IPHONE
		} else if (this.userAgent.match(/Android/) != null) {
			if (this.userAgent.match(/Ubuntu/) != null) {
				this.device = DeviceType.OTHER_MOBILE
			} else {
				this.device = DeviceType.ANDROID
			}
		} else if (this.userAgent.match(/Windows Phone/) != null) {
			this.device = DeviceType.WINDOWS_PHONE
		} else if (this.userAgent.match(/Windows NT/) != null) {
			this.device = DeviceType.DESKTOP
		} else if (this.userAgent.match(/BB10/) != null) {
			this.device = DeviceType.BB
		} else if (this.userAgent.match(/Mobile/) != null || this.userAgent.match(/Tablet/) != null) {
			this.device = DeviceType.OTHER_MOBILE
		}
	}

	isTouchSupported() {
		return 'ontouchstart' in window
	}

	isIos() {
		return this.device === DeviceType.IPAD || this.device === DeviceType.IPHONE
	}


	cssPropertyValueSupported(prop: string, value: string) {
		let d = (document.createElement('div'): any)
		d.style[prop] = value
		return d.style[prop] === value
	}

	getIdentifier(): string {
		if (env.mode === Mode.App) {
			return client.device + " App"
		} else if (env.mode === Mode.Browser) {
			return client.browser + " Browser"
		} else if (env.platformId === 'linux') {
			return 'Linux Desktop'
		} else if (env.platformId === 'darwin') {
			return 'Mac Desktop'
		} else if (env.platformId === 'win32') {
			return 'Windows Desktop'
		}
		return 'Unknown'
	}


	isIE() {
		return this.browser === BrowserType.IE
	}

	isSupportedBrowserVersion(): boolean {
		return this.notOldFirefox() && this.notOldChrome()
	}

	notOldFirefox() {
		// issue only occurs for old Firefox browsers
		// https://github.com/tutao/tutanota/issues/835
		return this.browser !== BrowserType.FIREFOX || this.browserVersion > 40
	}

	notOldChrome() {
		return this.browser !== BrowserType.CHROME || this.browserVersion > 37
	}

	canDownloadMultipleFiles(): boolean {
		// appeared in ff 65 https://github.com/tutao/tutanota/issues/1097
		return (this.browser !== BrowserType.FIREFOX || this.browserVersion < 65) && this.browser !== BrowserType.SAFARI
	}

	needsDownloadBatches(): boolean {
		// chrome limits multiple automatic downloads to 10
		return client.browser === BrowserType.CHROME
	}

	needsMicrotaskHack(): boolean {
		return this.isIos()
			|| this.browser === BrowserType.SAFARI
			|| this.browser === BrowserType.PALEMOON
			|| this.browser === BrowserType.WATERFOX
			// Waterfox looks like Firefox 60 currently
			|| this.browser === BrowserType.FIREFOX && this.browserVersion <= 60
			|| this.browser === BrowserType.CHROME && this.browserVersion < 59
	}

	needsExplicitIDBIds(): boolean {
		return this.browser === BrowserType.SAFARI && this.browserVersion < 12.2
	}

	indexedDBSupported(): boolean {
		return this.indexedDb() && !this.isIE()
	}

	calendarSupported(): boolean {
		return !this.isIE()
	}

	browserData(): BrowserData {
		return {
			needsMicrotaskHack: this.needsMicrotaskHack(),
			needsExplicitIDBIds: this.needsExplicitIDBIds(),
			indexedDbSupported: this.indexedDBSupported()
		}
	}
}

export const client: ClientDetector = new ClientDetector()
