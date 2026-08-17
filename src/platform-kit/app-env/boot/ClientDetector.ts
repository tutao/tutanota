import { EnvProvider, PlatformId } from "../Env"
import { BrowserData, BrowserType, DeviceType } from "./ClientConstants"
import { BotKind, load } from "@fingerprintjs/botd"
import { AppType } from "../AppType"
import { console, hasTouchEvent, indexedDbIsSupported, TsString, TypeChecks } from "@tutao/lang-api"

EnvProvider.assertMainOrNodeBoot()

export class ClientDetector {
	private userAgent: string | null = null
	isMacOS: boolean | null = null
	appType: AppType | null = null
	isAutomatedBrowser: boolean = false
	browserVersion: number = 0
	browser: BrowserType = BrowserType.OTHER
	device: DeviceType = DeviceType.DESKTOP

	private static singeleton: ClientDetector | null = null
	public static get(): ClientDetector {
		if (ClientDetector.singeleton != null) {
			return ClientDetector.singeleton.appType as any
		}

		ClientDetector.singeleton = new ClientDetector()
		return ClientDetector.singeleton
	}

	constructor() {}

	init(userAgent: string, platform: string, appType: AppType = AppType.Integrated): ClientDetector {
		this.userAgent = userAgent
		this.appType = appType
		this._setBrowserAndVersion()
		this._setDeviceInfo()

		load({ monitoring: false })
			.then((botd) => botd.detect())
			.then((result) => {
				this.isAutomatedBrowser = result.bot && result.botKind !== BotKind.Electron
			})
			.catch((error) => console.error(error))

		this.isMacOS = platform.indexOf("Mac") !== -1

		return this
	}

	getUserAgent(): NonNullable<TsString> {
		if (this.userAgent == null) {
			throw new Error("Client detector is not yet initialized!")
		}
		return this.userAgent
	}

	isMobileDevice(): boolean {
		return this.device !== DeviceType.DESKTOP
	}

	isDesktopDevice(): boolean {
		return this.device === DeviceType.DESKTOP
	}

	_setBrowserAndVersion(): void {
		const userAgent = this.getUserAgent()
		const operaIndex1 = userAgent.indexOf("Opera")
		const operaIndex2 = userAgent.indexOf("OPR/")
		const firefoxIndex = userAgent.indexOf("Firefox/")
		const paleMoonIndex = userAgent.indexOf("PaleMoon/")
		const iceweaselIndex = userAgent.indexOf("Iceweasel/")
		const chromeIndex = userAgent.indexOf("Chrome/")
		const chromeIosIndex = userAgent.indexOf("CriOS/")
		const safariIndex = userAgent.indexOf("Safari/")
		const edgeIndex = userAgent.indexOf("Edge") // "Old" edge based on EdgeHTML, "new" one based on Blink has only "Edg"

		const androidIndex = userAgent.indexOf("Android")
		let versionIndex = -1

		if (edgeIndex !== -1) {
			this.browser = BrowserType.EDGE
			versionIndex = edgeIndex + 5
		} else if (operaIndex1 !== -1) {
			this.browser = BrowserType.OPERA
			versionIndex = userAgent.indexOf("Version/")

			if (versionIndex !== -1) {
				versionIndex += 8
			} else {
				versionIndex = operaIndex1 + 6
			}
		} else if (operaIndex2 !== -1) {
			this.browser = BrowserType.OPERA
			versionIndex = operaIndex2 + 4
		} else if ((firefoxIndex !== -1 || iceweaselIndex !== -1) && operaIndex1 === -1 && operaIndex2 === -1 && paleMoonIndex === -1) {
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
			// default android browser
			// keep this check after Chrome, Firefox and Opera, because the Android browser does not identify itself in any other way
			this.browser = BrowserType.ANDROID
			versionIndex = androidIndex + 8
		} else if (chromeIosIndex !== -1) {
			this.browser = BrowserType.CHROME
			versionIndex = chromeIosIndex + 6
		} else if (safariIndex !== -1 && chromeIndex === -1) {
			// Chrome and black berry pretends to be Safari, so it is skipped
			this.browser = BrowserType.SAFARI
			// Safari prints its version after "Version/"
			versionIndex = userAgent.indexOf("Version/")

			if (versionIndex !== -1) {
				versionIndex += 8
			} else {
				// Other browsers on iOS do not usually send Version/ and we can assume that they're Safari
				this.extractIosVersion()
				return
			}
		} else if (userAgent.match(/iPad.*AppleWebKit/) != null || userAgent.match(/iPhone.*AppleWebKit/) != null) {
			// iPad and iPhone do not send the Safari this.userAgent when HTML-apps are directly started from the homescreen a browser version is sent neither
			// after "OS" the iOS version is sent, so use that one
			// Also there are a lot of browsers on iOS but they all are based on Safari so we can use the same extraction mechanism for all of them.
			this.extractIosVersion()
			return
		}

		if (versionIndex !== -1) {
			const mainVersionEndIndex = userAgent.indexOf(".", versionIndex)

			if (mainVersionEndIndex !== -1) {
				try {
					this.browserVersion = Number(userAgent.substring(versionIndex, mainVersionEndIndex + 2)) // we recognize one digit after the '.'
				} catch (e) {
					/* empty */
				}
			}
		}

		// if the version is not valid, the browser type is not valid, so set it to other
		if (this.browserVersion === 0) {
			this.browser = BrowserType.OTHER
		}
	}

	extractIosVersion(): void {
		// Extracting version does not work with iPad OS WebView because it's not in the userAgent. We could look it up
		// from Webkit version but maybe we don't need that for now.
		const userAgent = this.getUserAgent()
		const versionIndex = userAgent.indexOf(" OS ")

		if (versionIndex !== -1) {
			this.browser = BrowserType.SAFARI

			try {
				// in case of versions like 12_1_1 get substring 12_1 and convert it to 12.1
				let pos = versionIndex + 4
				let hadNan = false

				while (pos < userAgent.length) {
					pos++

					if (TypeChecks.isNaN(Number(userAgent.charAt(pos)))) {
						if (hadNan) {
							break
						} else {
							hadNan = true
						}
					}
				}

				const numberString = userAgent.substring(versionIndex + 4, pos)
				this.browserVersion = Number(numberString.replace(/_/g, "."))
			} catch (e) {
				/* empty */
			}
		}
	}

	_setDeviceInfo(): void {
		this.device = DeviceType.DESKTOP

		const userAgent = this.getUserAgent()
		if (
			userAgent.match(/iPad.*AppleWebKit/) != null || // iPadOS does not differ in UserAgent from Safari on macOS. Use hack with TouchEvent to detect iPad
			// Desktop Chrome has TouchEvent but it also has Chrome in it. Mobile iOS has CriOS in it and not Chrome.
			(/Macintosh; Intel Mac OS X.*AppleWebKit/.test(userAgent as string) && hasTouchEvent() && /.*Chrome.*/.test(userAgent as string) === false)
		) {
			this.device = DeviceType.IPAD
		} else if (userAgent.match(/iPhone.*AppleWebKit/) != null) {
			this.device = DeviceType.IPHONE
		} else if (userAgent.match(/Android/) != null) {
			if (userAgent.match(/Ubuntu/) != null) {
				this.device = DeviceType.OTHER_MOBILE
			} else {
				this.device = DeviceType.ANDROID
			}
		} else if (userAgent.match(/Windows NT/) != null) {
			this.device = DeviceType.DESKTOP
		} else if (userAgent.match(/Mobile/) != null || userAgent.match(/Tablet/) != null) {
			this.device = DeviceType.OTHER_MOBILE
		}
	}

	isIos(): boolean {
		return this.device === DeviceType.IPAD || this.device === DeviceType.IPHONE
	}

	getIdentifier(): string {
		const platformId = EnvProvider.get().getPlatformId()

		if (EnvProvider.get().isApp()) {
			if (this.appType === AppType.Integrated) {
				throw new Error("AppType.Integrated is not allowed for mobile apps")
			}
			const appType: string = this.appType === AppType.Mail ? "Mail" : "Calendar"
			return `${ClientDetector.get().device} ${appType} App`
		} else if (EnvProvider.get().isBrowser()) {
			return ClientDetector.get().browser + " Browser"
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
			(this.browser === BrowserType.FIREFOX && this.browserVersion <= 60) ||
			(this.browser === BrowserType.CHROME && this.browserVersion < 59)
		)
	}

	needsExplicitIDBIds(): boolean {
		return this.browser === BrowserType.SAFARI && this.browserVersion < 12.2
	}

	browserData(): BrowserData {
		return {
			needsMicrotaskHack: this.needsMicrotaskHack(),
			needsExplicitIDBIds: this.needsExplicitIDBIds(),
			indexedDbSupported: indexedDbIsSupported(),
			clientPlatform: this.getClientPlatform(),
		}
	}

	compressionStreamSupported(): boolean {
		return TypeChecks.hasProperty("CompressionStream")
	}

	isCalendarApp(): boolean {
		return EnvProvider.get().isApp() && this.appType === AppType.Calendar
	}

	isMailApp(): boolean {
		return EnvProvider.get().isApp() && this.appType === AppType.Mail
	}

	isDriveApp(): boolean {
		return EnvProvider.get().isApp() && this.appType === AppType.Drive
	}

	getClientPlatform(): ClientPlatform {
		if (EnvProvider.get().isDesktop()) {
			const platformId = EnvProvider.get().getPlatformId()
			if (platformId === PlatformId.Darwin) return ClientPlatform.DESKTOP_MAC
			else if (platformId === PlatformId.Linux) return ClientPlatform.DESKTOP_LINUX
			else if (platformId === PlatformId.Win32) return ClientPlatform.DESKTOP_WINDOWS
			else return ClientPlatform.DESKTOP_UNKNOWN
		} else if (!EnvProvider.get().isApp()) return ClientPlatform.WEB
		else if (EnvProvider.get().isAndroidApp()) {
			return this.appType === AppType.Calendar ? ClientPlatform.ANDROID_CALENDAR_APP : ClientPlatform.ANDROID_MAIL_APP
		} else if (EnvProvider.get().isIOSApp()) {
			return this.appType === AppType.Calendar ? ClientPlatform.IOS_CALENDAR_APP : ClientPlatform.IOS_MAIL_APP
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
	WEB,
	DESKTOP_UNKNOWN,
	DESKTOP_MAC,
	DESKTOP_LINUX,
	DESKTOP_WINDOWS,
}
