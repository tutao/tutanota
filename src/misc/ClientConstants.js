//@flow

export const BrowserType = Object.freeze({
	CHROME: "Chrome",
	FIREFOX: "Firefox",
	PALEMOON: "PaleMoon",
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

export type BrowserData = {
	browserType: BrowserTypeEnum,
	browserVersion: number
}