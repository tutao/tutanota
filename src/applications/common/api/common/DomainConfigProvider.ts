import { DomainConfig, EnvProvider } from "@tutao/app-env"
import { PluginSourceHostServer } from "../../../../plugin-kit/plugin-manager/PluginManager"

export interface DomainConfigProvider extends PluginSourceHostServer {
	/** Get domain config for the current domain (staticUrl or the one the app is running on). */
	getCurrentDomainConfig(): DomainConfig

	getDomainConfigForHostname(hostname: string, protocol?: string, port?: string): DomainConfig
}

class DomainConfigProviderImpl implements DomainConfigProvider {
	/** Get domain config for the current domain (staticUrl or the one the app is running on). */
	public getCurrentDomainConfig(): DomainConfig {
		// It is ambiguous what to do when we run website on one domain but have static URL for another
		// one but this actually shouldn't happen.
		let url: URL = new URL(env.staticUrl ?? location.href)
		// replace with targetUrl when inside nextcloud
		url = new URL(EnvProvider.get().ifNextcloudGetArgs()?.targetTutaHost ?? url)

		const port = url.port
		const hostname = url.hostname
		const protocol = url.protocol
		return this.getDomainConfigForHostname(hostname, protocol, port)
	}

	public getDomainConfigForHostname(hostname: string, protocol: string = "https:", port?: string): DomainConfig {
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

	public getPluginSourceHostUrl(): string {
		return this.getCurrentDomainConfig().apiUrl + "/plugin-kit/plugins"
	}
}

export const DomainConfigProvider: new () => DomainConfigProvider = DomainConfigProviderImpl
