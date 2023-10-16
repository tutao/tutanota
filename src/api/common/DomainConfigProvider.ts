export class DomainConfigProvider {
	/** Get domain config for the current domain (staticUrl or the one the app is running on). */
	getCurrentDomainConfig(): DomainConfig {
		// It is ambiguous what to do when we run website on one domain but have static URL for another
		// one but this actually shouldn't happen.
		const hostname = new URL(env.staticUrl ?? location.href).hostname
		return this.getDomainConfigForHostname(hostname)
	}

	getDomainConfigForHostname(hostname: string): DomainConfig {
		const staticConfig = env.domainConfigs[hostname]
		if (staticConfig) {
			return staticConfig
		} else {
			const dynamicConfig = env.domainConfigs["{hostname}"]
			const entries = Object.entries(dynamicConfig).map(([key, value]) => {
				const replacedValue = typeof value === "string" ? value.replace("{hostname}", hostname) : value
				return [key, replacedValue]
			})
			return Object.fromEntries(entries)
		}
	}
}
