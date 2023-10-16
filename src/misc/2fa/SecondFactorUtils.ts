import { DomainConfigProvider } from "../../api/common/DomainConfigProvider.js"

export function appIdToLoginDomain(appId: string, domainConfigProvider: DomainConfigProvider): string {
	// If it's legacy U2F key, get domain from before the path part. Otherwise it's just a domain.
	const domain = appId.endsWith(".json") ? new URL(appId).hostname : appId
	const domainConfig = domainConfigProvider.getDomainConfigForHostname(domain)
	return new URL(domainConfig.webauthnUrl).hostname
}
