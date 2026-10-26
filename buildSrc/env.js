/**
 * @param {{staticUrl: string | null, version: string, mode: EnvMode | null, dist: boolean, domainConfigs: DomainConfigMap, networkDebugging: boolean, clientName?: string, }} params
 *  @return {import("../src/platform-kit/app-env/Env.ts").EnvType}
 */
export function create(params) {
	const { staticUrl, version, mode, dist, domainConfigs, networkDebugging, clientName } = params

	if (version == null || mode == null || dist == null || networkDebugging == null) {
		throw new Error(`Invalid env parameters: ${JSON.stringify(params)}`)
	}
	return {
		staticUrl: staticUrl?.toString() ?? null,
		versionNumber: version,
		dist,
		mode: mode ?? "Browser",
		paymentSetup: "default",
		timeout: 20000,
		domainConfigs,
		platformId: null,
		networkDebugging,
		clientName: clientName ?? null,
		integrationPlatform: null,
		shadowDomAppRoot: null,
	}
}

/** @param {import("../src/platform-kit/app-env/Env.ts").EnvType} env */
export function preludeEnvPlugin(env) {
	return {
		name: "prelude-env",
		banner() {
			return `globalThis.env = ${JSON.stringify(env, null, 2)};`
		},
	}
}
