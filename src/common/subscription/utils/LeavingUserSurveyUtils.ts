import { isAndroidApp, isApp, isDesktop, isIOSApp } from "../../api/common/Env"
import { client } from "../../misc/ClientDetector"
import { AppType } from "../../misc/ClientConstants"

export const enum ClientPlatform {
	// this should be unused and exists so the clients that don't write the field get assigned
	// UNKNOWN by default during migrations
	UNKNOWN,
	IOS_MAIL_APP,
	ANDROID_MAIL_APP,
	IOS_CALENDAR_APP,
	ANDROID_CALENDAR_APP,
	WEB,
	DESKTOP,
}

export function getClientPlatform(): ClientPlatform {
	const isCalendar = client.appType === AppType.Calendar

	if (isDesktop()) return ClientPlatform.DESKTOP
	if (!isApp()) return ClientPlatform.WEB

	if (isAndroidApp()) {
		return isCalendar ? ClientPlatform.ANDROID_CALENDAR_APP : ClientPlatform.ANDROID_MAIL_APP
	}

	if (isIOSApp()) {
		return isCalendar ? ClientPlatform.IOS_CALENDAR_APP : ClientPlatform.IOS_MAIL_APP // fixed bug
	}

	// Fallback
	return ClientPlatform.UNKNOWN
}
