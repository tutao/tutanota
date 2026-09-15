import { PluginConfigurationProvider } from "../../plugin/PluginConfigurationProvider.js"
import { PLUGIN_REGISTRY } from "./PluginRegistry.js"

export type PluginState = {
	enabled: boolean
	config: Record<string, string>
}

function parseConfig(configJson: string | undefined): Record<string, string> {
	if (!configJson) return {}
	try {
		return JSON.parse(configJson)
	} catch (e) {
		return {}
	}
}

/**
 * Loads/saves the org-wide (customer-scoped) enabled-state and config for each known plugin.
 * "Enabled" has no separate flag: presence of a PluginConfiguration entity in the customer's
 * plugin list is the only enabled signal (delete = disabled), matching PluginConfigurationProvider.init().
 */
export class PluginSettingsModel {
	private readonly state: Map<string, PluginState> = new Map()

	constructor(private readonly provider: PluginConfigurationProvider) {}

	async loadAll(): Promise<void> {
		const customerPluginConfigs = await this.provider.loadCustomerPluginConfigs()
		for (const entry of PLUGIN_REGISTRY) {
			const pluginConfig = customerPluginConfigs.get(entry.id)
			this.state.set(entry.id, {
				enabled: pluginConfig != null,
				config: parseConfig(pluginConfig?.configJson),
			})
		}
	}

	getState(pluginId: string): PluginState {
		return this.state.get(pluginId) ?? { enabled: false, config: {} }
	}

	async setEnabled(pluginId: string, enabled: boolean): Promise<void> {
		if (enabled) {
			const config = this.getState(pluginId).config
			await this.provider.setCustomerPluginConfig(pluginId, JSON.stringify(config))
			this.state.set(pluginId, { enabled: true, config })
		} else {
			await this.provider.removeCustomerPluginConfig(pluginId)
			this.state.set(pluginId, { enabled: false, config: {} })
		}
	}

	async setConfigField(pluginId: string, key: string, value: string): Promise<void> {
		const current = this.getState(pluginId)
		if (!current.enabled) return
		const config = { ...current.config, [key]: value }
		this.state.set(pluginId, { enabled: true, config })
		await this.provider.setCustomerPluginConfig(pluginId, JSON.stringify(config))
	}
}
