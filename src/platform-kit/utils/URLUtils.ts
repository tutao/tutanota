import { Nullable } from "./Utils"

export function parseUrl(link: string): URL | null {
	try {
		return new URL(link)
	} catch (e) {
		return null
	}
}

export function getUrlDomain(link: string): Nullable<string> {
	return parseUrl(link)?.hostname ?? null
}
