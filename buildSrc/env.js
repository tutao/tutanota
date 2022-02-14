export function create(params) {
	const {staticUrl, version, mode, dist} = params

	if (version == null || mode == null || dist == null) {
		throw new Error(`Invalid env parameters: ${JSON.stringify(params)}`)
	}
	return {
		staticUrl,
		versionNumber: version,
		dist,
		mode: mode ?? "Browser",
		timeout: 20000,
	}
}

export function preludeEnvPlugin(env) {
	return {
		name: "prelude-env",
		banner() {
			return `globalThis.env = ${JSON.stringify(env, null, 2)};`
		}
	}
}