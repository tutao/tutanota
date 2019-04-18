//@flow

export const BrowserType = Object.freeze({
	CHROME: "Chrome",
	FIREFOX: "Firefox",
	PALEMOON: "PaleMoon",
	WATERFOX: "Waterfox",
	IE: "Internet Explorer",
	EDGE: "Edge",
	SAFARI: "Safari",
	ANDROID: "Android",
	OPERA: "Opera",
	BB: "BlackBerry",
	UBUNTU: "Ubuntu",
	OTHER: "Other"
})
export type BrowserTypeEnum = $Values<typeof BrowserType>;

export const DeviceType = Object.freeze({
	IPHONE: "iPhone",
	IPAD: "iPad",
	ANDROID: "Android",
	WINDOWS_PHONE: "Windows Phone",
	BB: "BlackBerry",
	DESKTOP: "Desktop",
	OTHER_MOBILE: "Other mobile"
})
export type DeviceTypeEnum = $Values<typeof DeviceType>;

/**
 * Some information about the environment which might be useful to the worker part
 */
export type BrowserData = {
	/**
	 * If true then should work around browsers not scheduling microtasks correctly (problems with IndexedDB).
	 * {@see PromiseUtils.js}
	 * */
	needsMicrotaskHack: boolean,
	/**
	 * If true then cannot rely on auto generated IDs, IDs need to be provided manually
	 */
	needsExplicitIDBIds: boolean,
	indexedDbSupported: boolean
}
