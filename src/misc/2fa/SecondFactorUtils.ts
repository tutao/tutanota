import { Const } from "../../api/common/TutanotaConstants.js"

export function appIdToLoginDomain(appId: string): string {
	// If it's legacy U2F key, get domain from before the path part. Otherwise it's just a domain.
	const domain = appId.endsWith(".json") ? appId.split("/")[2] : appId
	if (domain === Const.LEGACY_WEBAUTHN_RP_ID) {
		return "mail.tutanota.com"
	} else if (domain === Const.WEBAUTHN_RP_ID) {
		return Const.DEFAULT_APP_DOMAIN
	}
	return domain === "tutanota.com" ? "mail.tutanota.com" : domain
}

export function rpIdFromHostname(hostname: string): string {
	if (hostname.endsWith(Const.LEGACY_WEBAUTHN_RP_ID)) {
		return Const.LEGACY_WEBAUTHN_RP_ID
	} else if (hostname.endsWith(Const.WEBAUTHN_RP_ID)) {
		return Const.WEBAUTHN_RP_ID
	} else {
		return hostname
	}
}
