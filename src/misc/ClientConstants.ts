import { assertMainOrNodeBoot } from "../api/common/Env"

assertMainOrNodeBoot()

export const enum BrowserType {
	CHROME = "Chrome",
	FIREFOX = "Firefox",
	EDGE = "Edge",
	SAFARI = "Safari",
	ANDROID = "Android",
	OPERA = "Opera",
	OTHER = "Other",
}

export const enum DeviceType {
	IPHONE = "iPhone",
	IPAD = "iPad",
	ANDROID = "Android",
	DESKTOP = "Desktop",
	OTHER_MOBILE = "Other mobile",
}

/**
 * Some information about the environment which might be useful to the worker part
 */
export type BrowserData = {
	/**
	 * If true then should work around browsers not scheduling microtasks correctly (problems with IndexedDB).
	 * {@see PromiseUtils.js}
	 * */
	needsMicrotaskHack: boolean

	/**
	 * If true then cannot rely on auto generated IDs, IDs need to be provided manually
	 */
	needsExplicitIDBIds: boolean
	indexedDbSupported: boolean
}
