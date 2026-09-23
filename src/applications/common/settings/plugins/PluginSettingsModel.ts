import { PluginConfigurationProvider } from "../../plugin/PluginConfigurationProvider.js"
import { PluginManager } from "../../../../plugin-kit/plugin-manager/PluginManager.js"
import { ConfigFieldConfiguration } from "../../../../plugin-kit/sdk/PluginHostApi.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { PluginConfigurationTypeRef } from "@tutao/entities/sys"
import { assertNotNull, base64UrlCustomIdToString, Nullable } from "@tutao/utils"
import { PLUGIN_REGISTRY, PluginRegistryEntry } from "../../../../plugin-kit/plugins/PluginRegistry"
import { isNull } from "../../../../platform-kit/utils/Utils"
import { PluginId, pluginIdFromString } from "../../../../plugin-kit/sdk/PluginId"
import { OperationType } from "@tutao/meta"

export type PluginState = {
	enabled: boolean
	config: Record<string, string>
}

function parseConfig(configJson: string): Record<string, string> {
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
		for (const [pluginId, customerConfigJson] of customerPluginConfigs.entries()) {
			const pluginRegisterEntry: Nullable<PluginRegistryEntry> = PLUGIN_REGISTRY[pluginId as keyof typeof PLUGIN_REGISTRY]
			if (isNull(pluginRegisterEntry)) {
				console.error(`Could not load plugin of id: ${pluginId} as it is not in the registry`)
				continue
			}

			this.state.set(pluginId, { enabled: true, config: parseConfig(customerConfigJson) })
		}
	}

	getState(pluginId: PluginId): PluginState {
		return this.state.get(pluginId) ?? { enabled: false, config: {} }
	}

	/** Config fields are defined by the plugin itself and only registered once its bundle has been loaded, i.e. while it's enabled. */
	getConfigFields(pluginId: PluginId): ReadonlyArray<ConfigFieldConfiguration> {
		return this.pluginManager.getRegisteredConfigFieldsByPluginId(pluginId).map((c) => c.config)
	}

	async setEnabled(pluginId: PluginId, enabled: boolean): Promise<void> {
		if (enabled) {
			await this.provider.storeCustomerConfig(pluginId, "{}")
		} else {
			await this.provider.removeCustomerPluginConfig(pluginId)
		}
	}

	/** Persists a full config object for an already-enabled plugin, e.g. when the admin clicks "Update" in the config panel. */
	async updateConfig(pluginId: PluginId, config: Record<string, string>): Promise<boolean> {
		if (!this.getState(pluginId).enabled) {
			return false
		}
		return await this.provider.storeCustomerConfig(pluginId, JSON.stringify(config))
	}

	public readonly onEntityUpdatesReceived = async (updates: ReadonlyArray<EntityUpdateData>) => {
		for (const update of updates) {
			if (isUpdateForTypeRef(PluginConfigurationTypeRef, update)) {
				const pluginId = pluginIdFromString(base64UrlCustomIdToString(update.instanceId))

				if (update.operation === OperationType.CREATE) {
					const updatedConfig = assertNotNull(await this.provider.fetchCustomerConfig(pluginId))
					this.state.set(pluginId, { enabled: true, config: parseConfig(updatedConfig.configJson) })
				} else if (update.operation === OperationType.UPDATE) {
					if (this.state.get(pluginId)?.enabled) {
						const updatedConfig = assertNotNull(await this.provider.fetchCustomerConfig(pluginId))
						this.state.set(pluginId, { enabled: true, config: parseConfig(updatedConfig.configJson) })
					}
				} else if (update.operation === OperationType.DELETE) {
					this.state.delete(pluginId)
				}
			}
		}
	}
}
