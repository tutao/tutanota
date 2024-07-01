import { DomainConfigProvider } from "../../api/common/DomainConfigProvider.js"
import { Const } from "../../api/common/TutanotaConstants.js"

/**
 * Given appId (from the U2fKey), figure out which url should the user use for the login with that appId.
 */
export function appIdToLoginUrl(appId: string, domainConfigProvider: DomainConfigProvider): string {
	// Webauthn keys for our domains are special case because local, test and prod keys are registered for the same superdomain.
	if (appId === Const.WEBAUTHN_RP_ID) {
		return webauthnUrlToLoginUrl(domainConfigProvider.getCurrentDomainConfig().webauthnUrl)
	} else if (appId === Const.LEGACY_WEBAUTHN_RP_ID) {
		return webauthnUrlToLoginUrl(domainConfigProvider.getCurrentDomainConfig().legacyWebauthnUrl)
	}

	// If we get here, there are two options:
	//  * legacy (pre-Webauthn) U2F keys use the URL of a json file as appId. in that case, we use the hostname of that URL to figure out where to authenticate.
	//  * newer ones use some domain (no protocol, no port) for a whitelabel domain. we use the whitelabel domain if the key is registered through a whitelabel
	//       login. it might have a port on local builds.
	const parts = (appId.endsWith(".json") ? new URL(appId).hostname : appId).split(":")
	const domain = parts[0]
	// This might be undefined, but that's okay.
	const port = parts[1]
	// If we use webauthn, we can assume https because no browser allows webauthn over http.
	const domainConfig = domainConfigProvider.getDomainConfigForHostname(domain, "https:", port)
	return webauthnUrlToLoginUrl(domainConfig.webauthnUrl)
}

function webauthnUrlToLoginUrl(webauthnUrl: string): string {
	const url = new URL(webauthnUrl)
	url.pathname = ""
	return url.toString()
}
