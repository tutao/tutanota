export class DomainConfigProvider {
	/** Get domain config for the current domain (staticUrl or the one the app is running on). */
	getCurrentDomainConfig(): DomainConfig {
		// It is ambiguous what to do when we run website on one domain but have static URL for another
		// one but this actually shouldn't happen.
		const url = new URL(env.staticUrl ?? location.href)
		const port = url.port
		const hostname = url.hostname
		const protocol = url.protocol
		return this.getDomainConfigForHostname(hostname, protocol, port)
	}

	getDomainConfigForHostname(hostname: string, protocol: string = "https:", port?: string): DomainConfig {
		const staticConfig = env.domainConfigs[hostname]
		if (staticConfig) {
			return staticConfig
		} else {
			const fullHostName = hostname + (port ? `:${port}` : "")
			const dynamicConfig = env.domainConfigs["{hostname}"]
			const entries = Object.entries(dynamicConfig).map(([key, value]) => {
				const replacedValue = typeof value === "string" ? value.replace("{hostname}", fullHostName).replace("{protocol}", protocol) : value
				return [key, replacedValue]
			})
			return Object.fromEntries(entries)
		}
	}
}
