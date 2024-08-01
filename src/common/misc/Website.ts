export async function requestFromWebsite(path: string, domainConfig: DomainConfig): Promise<Response> {
	const url = new URL(path, domainConfig.websiteBaseUrl)
	return fetch(url.href)
}
