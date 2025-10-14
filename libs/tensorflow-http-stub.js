export class HTTPRequest {
	static URL_SCHEME_REGEX = /^https?:\/\//;

	constructor(...args) {
		throw new Error("HTTPRequest is not supported in this build.");
	}

	async save(_modelArtifacts) {
		throw new Error("HTTPRequest.save() is not supported in this build.");
	}

	async loadModelJSON() {
		throw new Error("HTTPRequest.loadModelJSON() is not supported in this build.");
	}

	async load() {
		throw new Error("HTTPRequest.load() is not supported in this build.");
	}

	async loadStream() {
		throw new Error("HTTPRequest.loadStream() is not supported in this build.");
	}

	async getWeightUrls(_weightsManifest) {
		throw new Error("HTTPRequest.getWeightUrls() is not supported in this build.");
	}

	async loadWeights(_weightsManifest) {
		throw new Error("HTTPRequest.loadWeights() is not supported in this build.");
	}
}

export function parseUrl() {
	throw new Error("parseUrl is not supported in this build.");
}

export function isHTTPScheme() {
	throw new Error("isHTTPScheme is not supported in this build.");
}

export const httpRouter = () => {
	throw new Error("httpRouter is not supported in this build.");
}

export function http(path, loadOptions) {
	throw new Error("http() is not supported in this build.");
}

export function browserHTTPRequest(path, loadOptions) {
	throw new Error("browserHTTPRequest() is not supported in this build.");
}
