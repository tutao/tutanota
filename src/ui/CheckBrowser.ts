import { AppType, EnvProvider } from "@tutao/app-env"
import { ClientDetector } from "../platform-kit/app-env/boot/ClientDetector"
import { BrowserType } from "../platform-kit/app-env/boot/ClientConstants"
import { TsString, TypeChecks } from "@tutao/lang-api"

export class CheckBrowser {
	public static readonly overflowAuto: string = CheckBrowser.cssPropertyValueSupported("overflow", "overlay") ? "overlay" : "auto"

	constructor(appType: AppType) {
		ClientDetector.get().init(navigator.userAgent, navigator.platform, appType)
	}

	/**
	 * A webview or electron client with these features are supported
	 */
	ensureIsSupported() {
		const client = ClientDetector.get()
		const clientHaveExpectedFeatures =
			CheckBrowser.expectedJsSyntaxes() &&
			CheckBrowser.isSupportedBrowserVersion(client) &&
			CheckBrowser.expectedBuiltInsArePresent() &&
			CheckBrowser.haveWebsocket() &&
			CheckBrowser._cssQuerySelectorIsSupported() &&
			CheckBrowser.supportsLookBehindRegex() &&
			CheckBrowser.supportsHistory() &&
			CheckBrowser.supportsXhr2()
		if (!clientHaveExpectedFeatures) {
			throw new Error("Unsupported")
		}
		if (EnvProvider.get().isBrowser() && !CheckBrowser.webAssemblyIsSupported()) {
			const webAssemblyError = new Error()
			webAssemblyError.name = "NoWASMSupport"
			throw webAssemblyError
		}
	}

	private static cssPropertyValueSupported(prop: string, value: string): boolean {
		let d = document.createElement("div") as any
		d.style[prop] = value
		return d.style[prop] === value
	}

	static _cssQuerySelectorIsSupported(): boolean {
		try {
			document.querySelector("blockquote:not(blockquote blockquote)")
			document.querySelectorAll(":where(.mouse-nav)")
			return true
		} catch (e) {
			return false
		}
	}

	private static expectedBuiltInsArePresent() {
		return (
			typeof Set !== "undefined" &&
			typeof Map !== "undefined" &&
			typeof Array.prototype.includes === "function" &&
			typeof Object.entries === "function" &&
			typeof Object.values === "function" &&
			typeof Object.fromEntries === "function" &&
			typeof Symbol !== "undefined" &&
			typeof Uint8Array !== "undefined" &&
			typeof Proxy !== "undefined" &&
			typeof Reflect !== "undefined" &&
			typeof Promise.prototype.finally !== "undefined" &&
			typeof String.prototype.replaceAll === "function" &&
			typeof BigInt !== "undefined" &&
			typeof structuredClone === "function" &&
			typeof Intl.DurationFormat !== "undefined"
		)
	}

	/**
	 * This function uses syntax constructs which we want to make sure are supported. If they are not then this file cannot be imported.
	 */
	private static expectedJsSyntaxes(): boolean {
		// By default rollup disables tree-shaking inside the try-catch.
		try {
			const arrowFunction = (): 1 => {
				return 1
			}

			let aLet = 2

			function* testGenerator() {}

			async function testAsync() {}

			function testDefaultArgs(_a = 2) {}

			testGenerator()
			testAsync()
			testDefaultArgs()
			const anArray = [1, 2, 3]
			const spreadArray = [...anArray]
			const dynamicString = ""
			const impossibleCondition = arrowFunction() === aLet

			if (impossibleCondition) {
				import(dynamicString)
			}

			const objectSyntax = {
				[dynamicString]: true,

				testFn() {},

				get accessor() {
					return null
				},

				set accessor(newValue) {},
			}
			const templateString = `test ${dynamicString}`
			const x = 1
			const y = 2
			const propertyShorthand = {
				x,
				y,
			}
			const { x: x2, y: y2 } = propertyShorthand
			const [a1, a2, ...arest] = anArray

			class WithStatisMember {
				static aFuncton() {}
			}

			for (const item of testGenerator()) {
				/* empty */
			}

			return true
		} catch (e) {
			/* empty */
			return false
		}
	}

	public static isSupportedBrowserVersion(client: ClientDetector): boolean {
		return CheckBrowser.notOldFirefox(client.browser, client.browserVersion) && CheckBrowser.notOldChrome(client.browser, client.browserVersion)
	}

	private static notOldFirefox(browser: BrowserType, browserVersion: number): boolean {
		// issue only occurs for old Firefox browsers
		// Object.hasOwn() is only supported starting in 92
		return browser !== BrowserType.FIREFOX || browserVersion > 92
	}

	private static notOldChrome(browser: BrowserType, browserVersion: number): boolean {
		// Object.hasOwn() is only supported starting in 93
		return browser !== BrowserType.CHROME || browserVersion > 93
	}
	private static haveWebsocket(): boolean {
		return "WebSocket" in window && window.WebSocket.CLOSING === 2
	}

	private static supportsLookBehindRegex(): boolean {
		try {
			;/(?<=([ab]+)([bc]+))$/.exec("abc")
			return true
		} catch (e) {
			return false
		}
	}

	public static isTouchSupported(): boolean {
		return "ontouchstart" in window
	}

	/**
	 * @see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/network/xhr2.js
	 */
	private static supportsXhr2(): boolean {
		return "XMLHttpRequest" in window
	}

	/**
	 * We need WebAssembly for Argon2.
	 *
	 * @returns true if webassembly is supported
	 */
	private static webAssemblyIsSupported(): boolean {
		return TypeChecks.isObject(WebAssembly) && TypeChecks.isFunction(WebAssembly.instantiate)
	}

	private static supportsHistory(): boolean {
		return window.history != null && "pushState" in window.history
	}

	public static haveLocalStorage(): boolean {
		try {
			return localStorage != null
		} catch (e) {
			// DOMException is thrown if all cookies are disabled
			return false
		}
	}
}
