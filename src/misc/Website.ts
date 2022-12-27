const WEBSITE_BASE_URL = "https://tutanota.com"

export async function requestFromWebsite(path: string): Promise<Response> {
	const url = new URL(path, WEBSITE_BASE_URL)
	return fetch(url.href)
}
