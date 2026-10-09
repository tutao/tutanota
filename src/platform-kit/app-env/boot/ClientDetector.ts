import { EnvProvider, PlatformId } from "../Env"
import { BrowserData, BrowserType, DeviceType } from "./ClientConstants"
import { AppType } from "../AppType"
import {
	assertNotNull,
	console,
	isNotNull,
	isNull,
	LangApiEnum,
	Nullable,
	ProgrammingError,
	RuntimeInfo,
	TsDouble,
	TsInt,
	TsString,
	TutanotaError,
	TypeChecks,
} from "@tutao/lang-api"
import { BotKind, FingerprintJs } from "@tutao/lang-api/fingerprintJs"

EnvProvider.assertMainOrNodeBoot()

export class ClientDetector {
	public readonly isMacOS: boolean
	public readonly browserVersion: Nullable<TsDouble>
	public readonly browser: BrowserType
	public readonly device: DeviceType

	/** @TMutableStaticSafety MainThreadInitialized */
	private static singleton: ClientDetector | null = null

	/** @TTranspileIgnore This method is only used from locator */
	public static get(): ClientDetector {
		return assertNotNull(ClientDetector.singleton, "Should call .init() method before using ClientDetector")
	}

	private constructor(
		private readonly envProvider: EnvProvider,
		private readonly userAgent: TsString,
		private readonly appType: AppType,
		public readonly isAutomatedBrowser: boolean,
		platform: TsString,
	) {
		this.isAutomatedBrowser = false

		this.device = ClientDetector._getDeviceInfo(userAgent)
		this.isMacOS = platform.indexOf("Mac") !== -1
		const [browser, browserVersion] = ClientDetector._getBrowserAndVersion(userAgent)
		this.browser = browser
		this.browserVersion = browserVersion
	}

	public static async init(
		envProvider: EnvProvider,
		userAgent: TsString,
		platform: TsString,
		appType: AppType = AppType.Integrated,
	): Promise<ClientDetector> {
		const isAutomatedBrowser = await FingerprintJs.detect(false)
			.then((result) => result.bot && result.botKind !== BotKind.Electron)
			.catch((error: TutanotaError) => {
				console.error("Error while getting fingerprint:")
				console.error(error)
				return false
			})

		ClientDetector.singleton = new ClientDetector(envProvider, userAgent, appType, isAutomatedBrowser, platform)
		return ClientDetector.singleton
	}

	getUserAgent(): NonNullable<TsString> {
		if (isNull(this.userAgent)) {
			throw new ProgrammingError("Client detector is not yet initialized!")
		}
		return this.userAgent
	}

	isMobileDevice(): boolean {
		return this.device !== DeviceType.DESKTOP
	}

	isDesktopDevice(): boolean {
		return this.device === DeviceType.DESKTOP
	}

	private static _getBrowserAndVersion(userAgent: TsString): [BrowserType, Nullable<TsDouble>] {
		let browser: BrowserType = BrowserType.OTHER
		let browserVersion: Nullable<TsDouble> = null

		const operaIndex1: TsInt = userAgent.indexOf("Opera")
		const operaIndex2: TsInt = userAgent.indexOf("OPR/")
		const firefoxIndex: TsInt = userAgent.indexOf("Firefox/")
		const paleMoonIndex: TsInt = userAgent.indexOf("PaleMoon/")
		const iceweaselIndex: TsInt = userAgent.indexOf("Iceweasel/")
		const chromeIndex: TsInt = userAgent.indexOf("Chrome/")
		const chromeIosIndex: TsInt = userAgent.indexOf("CriOS/")
		const safariIndex: TsInt = userAgent.indexOf("Safari/")
		const edgeIndex: TsInt = userAgent.indexOf("Edge") // "Old" edge based on EdgeHTML, "new" one based on Blink has only "Edg"

		const androidIndex: TsInt = userAgent.indexOf("Android")
		let versionIndex: TsInt = -1

		if (edgeIndex !== -1) {
			browser = BrowserType.EDGE
			versionIndex = edgeIndex + 5
		} else if (operaIndex1 !== -1) {
			browser = BrowserType.OPERA
			versionIndex = userAgent.indexOf("Version/")

			if (versionIndex !== -1) {
				versionIndex += 8
			} else {
				versionIndex = operaIndex1 + 6
			}
		} else if (operaIndex2 !== -1) {
			browser = BrowserType.OPERA
			versionIndex = operaIndex2 + 4
		} else if ((firefoxIndex !== -1 || iceweaselIndex !== -1) && operaIndex1 === -1 && operaIndex2 === -1 && paleMoonIndex === -1) {
			// Opera may pretend to be Firefox, so it is skipped
			browser = BrowserType.FIREFOX

			if (firefoxIndex !== -1) {
				versionIndex = firefoxIndex + 8
			} else {
				versionIndex = iceweaselIndex + 10
			}
		} else if (chromeIndex !== -1) {
			browser = BrowserType.CHROME
			versionIndex = chromeIndex + 7
		} else if (androidIndex !== -1) {
			// default android browser
			// keep this check after Chrome, Firefox and Opera, because the Android browser does not identify itself in any other way
			browser = BrowserType.ANDROID
			versionIndex = androidIndex + 8
		} else if (chromeIosIndex !== -1) {
			browser = BrowserType.CHROME
			versionIndex = chromeIosIndex + 6
		} else if (safariIndex !== -1 && chromeIndex === -1) {
			// Chrome and black berry pretends to be Safari, so it is skipped
			browser = BrowserType.SAFARI
			// Safari prints its version after "Version/"
			versionIndex = userAgent.indexOf("Version/")

			if (versionIndex !== -1) {
				versionIndex += 8
			} else {
				// Other browsers on iOS do not usually send Version/ and we can assume that they're Safari
				const iosBrowserVersion = ClientDetector._getIosBrowserVersion(userAgent)
				if (isNotNull(iosBrowserVersion)) {
					return [BrowserType.SAFARI, iosBrowserVersion]
				}
			}
		} else if (isNotNull(userAgent.match(/iPad.*AppleWebKit/)) || isNotNull(userAgent.match(/iPhone.*AppleWebKit/))) {
			// iPad and iPhone do not send the Safari this.userAgent when HTML-apps are directly started from the homescreen a browser version is sent neither
			// after "OS" the iOS version is sent, so use that one
			// Also there are a lot of browsers on iOS but they all are based on Safari so we can use the same extraction mechanism for all of them.
			const iosBrowserVersion = ClientDetector._getIosBrowserVersion(userAgent)
			if (isNotNull(iosBrowserVersion)) {
				return [BrowserType.SAFARI, iosBrowserVersion]
			}
		}

		if (versionIndex !== -1) {
			const mainVersionEndIndex: TsInt = userAgent.indexOf(".", versionIndex)

			if (mainVersionEndIndex !== -1) {
				try {
					browserVersion = TsDouble.parseFloat(userAgent.substring(versionIndex, mainVersionEndIndex + 2)) // we recognize one digit after the '.'
				} catch (e) {
					/* empty */
				}
			}
		}

		// if the version is not valid, the browser type is not valid, so set it to other
		if (isNull(browserVersion)) {
			browser = BrowserType.OTHER
		}

		return [browser, browserVersion]
	}

	private static _getIosBrowserVersion(userAgent: TsString): Nullable<TsDouble> {
		// Extracting version does not work with iPad OS WebView because it's not in the userAgent. We could look it up
		// from Webkit version but maybe we don't need that for now.
		const versionIndex: TsInt = userAgent.indexOf(" OS ")
		if (versionIndex === -1) {
			return null
		}

		try {
			// in case of versions like 12_1_1 get substring 12_1 and convert it to 12.1
			let pos: TsInt = versionIndex + 4
			let hadNan = false

			while (pos < userAgent.length) {
				pos++

				if (TsInt.isNaN(TsInt.parseInt(userAgent.charAt(pos)))) {
					if (hadNan) {
						break
					} else {
						hadNan = true
					}
				}
			}

			const numberString = userAgent.substring(versionIndex + 4, pos)
			return TsDouble.parseFloat(numberString.replace(/_/g, "."))
		} catch (e) {
			return null
		}
	}

	private static _getDeviceInfo(userAgent: TsString): DeviceType {
		if (
			isNotNull(userAgent.match(/iPad.*AppleWebKit/)) || // iPadOS does not differ in UserAgent from Safari on macOS. Use hack with TouchEvent to detect iPad
			// Desktop Chrome has TouchEvent but it also has Chrome in it. Mobile iOS has CriOS in it and not Chrome.
			(/Macintosh; Intel Mac OS X.*AppleWebKit/.test(userAgent) && RuntimeInfo.hasTouchEvent() && /.*Chrome.*/.test(userAgent) === false)
		) {
			return DeviceType.IPAD
		} else if (isNotNull(userAgent.match(/iPhone.*AppleWebKit/))) {
			return DeviceType.IPHONE
		} else if (isNotNull(userAgent.match(/Android/))) {
			if (isNotNull(userAgent.match(/Ubuntu/))) {
				return DeviceType.OTHER_MOBILE
			} else {
				return DeviceType.ANDROID
			}
		} else if (isNotNull(userAgent.match(/Windows NT/))) {
			return DeviceType.DESKTOP
		} else if (isNotNull(userAgent.match(/Mobile/)) || isNotNull(userAgent.match(/Tablet/))) {
			return DeviceType.OTHER_MOBILE
		} else {
			return DeviceType.DESKTOP
		}
	}

	isIos(): boolean {
		return this.device === DeviceType.IPAD || this.device === DeviceType.IPHONE
	}

	getIdentifier(): TsString {
		const platformId = this.envProvider.getPlatformId()

		if (this.envProvider.isApp()) {
			if (this.appType === AppType.Integrated) {
				throw new ProgrammingError("AppType.Integrated is not allowed for mobile apps")
			}
			const appType: TsString = this.appType === AppType.Mail ? "Mail" : "Calendar"
			return `${this.device} ${appType} App`
		} else if (this.envProvider.isBrowser()) {
			return LangApiEnum.getStringEnumValue(this.browser) + " Browser"
		} else if (platformId === PlatformId.Linux) {
			return "Linux Desktop"
		} else if (platformId === PlatformId.Darwin) {
			return "Mac Desktop"
		} else if (platformId === PlatformId.Win32) {
			return "Windows Desktop"
		}

		return "Unknown"
	}

	needsMicrotaskHack(): boolean {
		return (
			this.isIos() ||
			this.browser === BrowserType.SAFARI ||
			(this.browser === BrowserType.FIREFOX && isNotNull(this.browserVersion) && this.browserVersion <= 60) ||
			(this.browser === BrowserType.CHROME && isNotNull(this.browserVersion) && this.browserVersion < 59)
		)
	}

	needsExplicitIDBIds(): boolean {
		return this.browser === BrowserType.SAFARI && isNotNull(this.browserVersion) && this.browserVersion < 12.2
	}

	browserData(): BrowserData {
		return {
			needsMicrotaskHack: this.needsMicrotaskHack(),
			needsExplicitIDBIds: this.needsExplicitIDBIds(),
			indexedDbSupported: RuntimeInfo.indexedDbIsSupported(),
			clientPlatform: this.getClientPlatform(),
		}
	}

	compressionStreamSupported(): boolean {
		return TypeChecks.hasProperty("CompressionStream")
	}

	isCalendarApp(): boolean {
		return this.envProvider.isApp() && this.appType === AppType.Calendar
	}

	isMailApp(): boolean {
		return this.envProvider.isApp() && this.appType === AppType.Mail
	}

	isDriveApp(): boolean {
		return this.envProvider.isApp() && this.appType === AppType.Drive
	}

	getClientPlatform(): ClientPlatform {
		if (this.envProvider.isDesktop()) {
			switch (this.envProvider.getPlatformId()) {
				case PlatformId.Win32:
					return ClientPlatform.DESKTOP_WINDOWS
				case PlatformId.Linux:
					return ClientPlatform.DESKTOP_LINUX
				case PlatformId.Darwin:
					return ClientPlatform.DESKTOP_MAC
				default:
					return ClientPlatform.DESKTOP_UNKNOWN
			}
		} else if (!this.envProvider.isApp()) {
			return ClientPlatform.WEB
		} else if (this.envProvider.isAndroidApp()) {
			if (this.appType === AppType.Calendar) {
				return ClientPlatform.ANDROID_CALENDAR_APP
			} else if (this.appType === AppType.Mail) {
				return ClientPlatform.ANDROID_MAIL_APP
			} else {
				return ClientPlatform.ANDROID_DRIVE_APP
			}
		} else if (this.envProvider.isIOSApp()) {
			if (this.appType === AppType.Calendar) {
				return ClientPlatform.IOS_CALENDAR_APP
			} else if (this.appType === AppType.Mail) {
				return ClientPlatform.IOS_MAIL_APP
			} else {
				return ClientPlatform.IOS_DRIVE_APP
			}
		} else {
			// Fallback
			return ClientPlatform.UNKNOWN
		}
	}
}

export enum ClientPlatform {
	// this should be unused and exists so the clients that don't write the field get assigned
	// UNKNOWN by default during migrations
	UNKNOWN,
	IOS_MAIL_APP,
	ANDROID_MAIL_APP,
	IOS_CALENDAR_APP,
	ANDROID_CALENDAR_APP,
	IOS_DRIVE_APP,
	ANDROID_DRIVE_APP,
	WEB,
	DESKTOP_UNKNOWN,
	DESKTOP_MAC,
	DESKTOP_LINUX,
	DESKTOP_WINDOWS,
}
