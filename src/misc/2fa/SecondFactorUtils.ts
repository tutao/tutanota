import { DomainConfigProvider } from "../../api/common/DomainConfigProvider.js"

export function appIdToLoginDomain(appId: string, domainConfigProvider: DomainConfigProvider): string {
	// legacy U2F keys use the URL of a json file as appId.
	//        in that case, we use the hostname of that URL to figure out where to authenticate.
	// newer ones use some domain (no protocol, no port). we use the whitelabel domain
	//       if the key is registered through a whitelabel login. it might have a port
	//       on local builds.
	const parts = (appId.endsWith(".json") ? new URL(appId).hostname : appId).split(":")
	const domain = parts[0]
	// this might be undefined, but that's okay.
	const port = parts[1]
	// if we use webauthn, we can assume https because no browser allows webauthn over http
	const domainConfig = domainConfigProvider.getDomainConfigForHostname(domain, "https:", port)
	return new URL(domainConfig.webauthnUrl).hostname
}
