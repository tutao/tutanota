import { PluginManager } from "../../../../plugin-kit/plugin-manager/PluginManager.js"
import { ConfigFieldConfiguration } from "../../../../plugin-kit/sdk/hostApi/PluginHostApi.js"
import { Nullable } from "@tutao/utils"
import { PluginId } from "../../../../plugin-kit/sdk/PluginId"
import { PluginConfigurationProvider } from "../../plugin/PluginConfigurationProvider"

/**
 * Loads/saves the org-wide (customer-scoped) enabled-state and config for each known plugin.
 * "Enabled" has no separate flag: presence of a PluginConfiguration entity in the customer's
 * plugin list is the only enabled signal (delete = disabled), matching PluginConfigurationProvider.init().
 */
export class PluginSettingsModel {
	constructor(
		private readonly configProvider: PluginConfigurationProvider,
		private readonly pluginManager: PluginManager,
	) {}

	public setConfigChangeListener(listener: () => void) {
		this.pluginManager.setConfigChangeListener(listener)
	}

	public pluginIsLoaded(pluginId: PluginId): boolean {
		return this.pluginManager.pluginIsLoaded(pluginId)
	}

	public setConfigField(pluginId: PluginId, fieldName: string, value: string) {
		this.pluginManager.setConfigField(pluginId, fieldName, value)
	}

	public getConfigFieldValue(pluginId: PluginId, fieldName: string): Nullable<string> {
		return this.pluginManager.getConfigFieldValue(pluginId, fieldName)
	}

	/** Config fields are defined by the plugin itself and only registered once its bundle has been loaded, i.e. while it's enabled. */
	getConfigFields(pluginId: PluginId): ReadonlyArray<ConfigFieldConfiguration> {
		return this.pluginManager.getRegisteredConfigFieldsByPluginId(pluginId).map((c) => c.config)
	}

	async setEnabled(pluginId: PluginId, enabled: boolean): Promise<void> {
		if (enabled) {
			await this.pluginManager.loadPlugins(pluginId)
		} else {
			const configRemovedFromServer = await this.configProvider.removeCustomerPluginConfig(pluginId)
			if (!configRemovedFromServer) {
				// when configProvider does not erase the entity from server ( if it was never created )
				// we wont get DELETE entity event which means pluginManager will never unload the plugin,
				// so lemme do it by myself
				await this.pluginManager.unloadPlugin(pluginId)
			}
		}
	}

	/** Persists a full config object for an already-enabled plugin, e.g. when the admin clicks "Update" in the config panel. */
	async updateConfig(pluginId: PluginId): Promise<boolean> {
		return await this.pluginManager.persistCustomerConfig(pluginId)
	}
}
