import { PluginConfigurationProvider } from "../../plugin/PluginConfigurationProvider.js"
import { PLUGIN_REGISTRY } from "../../../../plugin-kit/plugins/PluginRegistry.js"
import { EnabledPlugin, PluginManager } from "../../../../plugin-kit/plugin-manager/PluginManager.js"
import { ConfigFieldConfiguration } from "../../../../plugin-kit/sdk/PluginHostApi.js"

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

	constructor(
		private readonly provider: PluginConfigurationProvider,
		private readonly pluginManager: PluginManager,
	) {}

	async loadAll(): Promise<void> {
		const customerPluginConfigs = await this.provider.getCustomerPluginConfigs()
		for (const entry of PLUGIN_REGISTRY) {
			const configJson = customerPluginConfigs.get(entry.id)
			this.state.set(entry.id, {
				enabled: configJson != null,
				config: parseConfig(configJson),
			})
		}
	}

	getState(pluginId: string): PluginState {
		return this.state.get(pluginId) ?? { enabled: false, config: {} }
	}

	/** Config fields are defined by the plugin itself and only registered once its bundle has been loaded, i.e. while it's enabled. */
	getConfigFields(pluginId: string): ReadonlyArray<ConfigFieldConfiguration> {
		return this.pluginManager.getRegisteredConfigFieldsByPluginId(pluginId).map((c) => c.config)
	}

	async setEnabled(pluginId: string, enabled: boolean): Promise<void> {
		if (enabled) {
			const config = this.getState(pluginId).config
			await this.provider.setCustomerPluginConfig(pluginId, JSON.stringify(config))
			this.state.set(pluginId, { enabled: true, config })
			const enabledPlugin: EnabledPlugin = {
				pluginId,
				customerConfigJson: "{}",
			}
			await this.pluginManager.loadPlugins([enabledPlugin])
		} else {
			await this.provider.removeCustomerPluginConfig(pluginId)
			this.state.set(pluginId, { enabled: false, config: {} })

			await this.pluginManager.unloadPlugins(pluginId)
		}
	}

	/** Persists a full config object for an already-enabled plugin, e.g. when the admin clicks "Update" in the config panel. */
	async updateConfig(pluginId: string, config: Record<string, string>): Promise<void> {
		if (!this.getState(pluginId).enabled) return
		this.state.set(pluginId, { enabled: true, config })
		await this.provider.setCustomerPluginConfig(pluginId, JSON.stringify(config))
	}
}
