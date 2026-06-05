import { assertMainOrNodeBoot } from "../Env"

assertMainOrNodeBoot()

export enum ErrorReportClientType {
	Browser = "0",
	Android = "1",
	Ios = "2",
	MacOS = "3",
	Linux = "4",
	Windows = "5",
}

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
	clientPlatform: ClientPlatform
}

export const companyTeamLabel = "Tuta Team"
