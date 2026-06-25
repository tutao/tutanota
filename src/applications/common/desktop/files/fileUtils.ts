import { ProgrammingError } from "@tutao/app-env"

export function fileUrlFromString(urlString: string): URL {
	let url: URL

	try {
		url = new URL(urlString)
	} catch (e) {
		throw new ProgrammingError(`Invalid file URL: ${urlString}`)
	}
	if (url.protocol !== "file:") {
		throw new ProgrammingError(`Invalid file URL: ${urlString}`)
	}
	return url
}
