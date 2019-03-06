//@flow

export const BrowserType = {
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
}
export type BrowserTypeEnum = $Values<typeof BrowserType>;

export const DeviceType = {
	IPHONE: "iPhone",
	IPAD: "iPad",
	ANDROID: "Android",
	WINDOWS_PHONE: "Windows Phone",
	BB: "BlackBerry",
	DESKTOP: "Desktop",
	OTHER_MOBILE: "Other mobile"
}
export type DeviceTypeEnum = $Values<typeof DeviceType>;

export type BrowserData = {
	browserType: BrowserTypeEnum,
	browserVersion: number
}