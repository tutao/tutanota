// Attention: The contents of this file is evaluated at compile time and not at runtime

export function create(params) {
	const {staticUrl, version, mode, dist} = params

	if (version == null || mode == null || dist == null) {
		throw new Error(`Invalid env parameters ${params}`)
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