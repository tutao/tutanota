export function parseUrl(link: string): URL | null {
	try {
		return new URL(link)
	} catch (e) {
		return null
	}
}

export function getUrlDomain(link: string): string | null {
	const url = parseUrl(link)
	return url && url.hostname
}
