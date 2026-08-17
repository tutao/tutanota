import { load as botdLoad } from "@fingerprintjs/botd"
import { downcast } from "@tutao/lang-api"

export type BotdResult = { bot: boolean; botKind: BotKind | null }

export const enum BotKind {
	Awesomium = "awesomium",
	Cef = "cef",
	CefSharp = "cefsharp",
	CoachJS = "coachjs",
	Electron = "electron",
	FMiner = "fminer",
	Geb = "geb",
	NightmareJS = "nightmarejs",
	Phantomas = "phantomas",
	PhantomJS = "phantomjs",
	Rhino = "rhino",
	Selenium = "selenium",
	Sequentum = "sequentum",
	SlimerJS = "slimerjs",
	WebDriverIO = "webdriverio",
	WebDriver = "webdriver",
	HeadlessChrome = "headless_chrome",
	Unknown = "unknown",
}

export class FingerprintJs {
	public static async detect(monitoring: boolean): Promise<BotdResult> {
		const botdInterface = await botdLoad({ monitoring })
		const detectResult = botdInterface.detect()
		if (detectResult.bot) {
			return { bot: true, botKind: downcast<BotKind>(detectResult.botKind) }
		} else {
			return { bot: false, botKind: null }
		}
	}
}
