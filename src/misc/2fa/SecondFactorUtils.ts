export function appIdToLoginDomain(appId: string): string {
	// If it's legacy U2F key, get domain from before the path part. Otherwise it's just a domain.
	const domain = appId.endsWith(".json") ? appId.split("/")[2] : appId
	return domain === "tutanota.com" ? "mail.tutanota.com" : domain
}
