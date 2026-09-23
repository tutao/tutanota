import { DialogAdapter, PluginApi } from "../sdk/PluginApi"
import { ButtonConfiguration, ConfigFieldConfiguration, ExtensionPoint } from "../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../sdk/AttachmentButtonExtensionPoint"
import { EventLocationButtonExtension } from "../sdk/EventLocationButtonExtensionPoint"
import { ButtonExtension, ConfigExtension, ConfigurationAdapter, MailIntegrationAdapter, PluginConfigurationOwner, PluginHost } from "./PluginHost"
import { assertNotNull, base64UrlCustomIdToString, downcast, Nullable, ofClass } from "@tutao/utils"
import { EnvProvider } from "@tutao/app-env"
import { EntityUpdateData, EntityUpdatesListener, isUpdateForTypeRef, ListenerPriority } from "../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { PluginConfigurationTypeRef } from "@tutao/entities/sys"
import { OperationType } from "@tutao/meta"
import { PluginId, pluginIdFromString } from "../sdk/PluginId"
import { CustomerConfigPluginError } from "../sdk/PluginError"

export type EnabledPlugin = {
	pluginId: PluginId
	customerConfigJson: string
}

type PluginWrapper = {
	pluginId: string
	globalConfigJson: string
	api: PluginApi
	pluginHost: PluginHost
	pluginAsWorker: Worker
}

export class PluginManager {
	private readonly loadedPlugins: Partial<Record<PluginId, PluginWrapper>> = {}
	private readonly extensionPointToButtonExtension: Map<ExtensionPoint, Array<ButtonExtension>> = new Map()
	private readonly pluginToConfigFieldExtension: Map<PluginId, Array<ConfigExtension>> = new Map()

	constructor(
		public readonly configurationAdapter: ConfigurationAdapter,
		private readonly dialogAdapter: DialogAdapter,
		public readonly mailIntegrationAdapter: Nullable<MailIntegrationAdapter> = null,
	) {}

	async loadPlugins(enabledPlugins: Array<EnabledPlugin>): Promise<void> {
		if (EnvProvider.get().isAdminClient()) {
			return
		}
		console.log("loading plugins", enabledPlugins)
		for (const enabledPlugin of enabledPlugins) {
			const { pluginId, customerConfigJson } = enabledPlugin
			if (this.loadedPlugins[pluginId] != null) {
				throw new Error(`Could not load plugin: ${pluginId} as it is already loaded. Call unload() first`)
			}

			const pluginHost = new PluginHost(this, pluginId)
			const { pluginApi, pluginAsWorker } = PluginApi.newPluginFromFile(pluginId, pluginHost, this.dialogAdapter)
			pluginHost.setPluginManifest(await pluginApi.getManifest())
			await pluginApi.load(customerConfigJson)

			this.loadedPlugins[pluginId] = {
				pluginId,
				globalConfigJson: customerConfigJson,
				api: pluginApi,
				pluginHost,
				pluginAsWorker,
			}
		}
	}

	getRegisteredButtonsByExtensionPoint(extensionPoint: ExtensionPoint): ReadonlyArray<ButtonExtension> {
		return this.extensionPointToButtonExtension.get(extensionPoint) ?? []
	}

	getRegisteredConfigFieldsByPluginId(pluginId: PluginId): ReadonlyArray<ConfigExtension> {
		return this.pluginToConfigFieldExtension.get(pluginId) ?? []
	}

	async attachmentButtonClicked(pluginId: PluginId, dataFile: Promise<PluginDataFile>): Promise<void> {
		downcast<AttachmentButtonExtension>(assertNotNull(this.loadedPlugins[pluginId]).api).attachmentButtonClicked(await dataFile)
	}

	async eventLocationButtonClicked(pluginId: PluginId, roomName: string): Promise<Readonly<string>> {
		return downcast<EventLocationButtonExtension>(assertNotNull(this.loadedPlugins[pluginId]).api).eventLocationButtonClicked(roomName)
	}

	async unloadPlugins(pluginId: PluginId): Promise<void> {
		const loadedPlugin = this.loadedPlugins[pluginId]
		if (loadedPlugin == null) {
			throw new Error(`Plugin ${pluginId} is not yet loaded. Call .load() first`)
		}
		await loadedPlugin.api.unload()
		loadedPlugin.pluginAsWorker.terminate()

		for (const [currentPluginId, value] of this.pluginToConfigFieldExtension.entries()) {
			this.pluginToConfigFieldExtension.set(
				currentPluginId,
				value.filter((it) => it.pluginId !== pluginId),
			)
		}

		for (const [extensionPoint, value] of this.extensionPointToButtonExtension.entries()) {
			this.extensionPointToButtonExtension.set(
				extensionPoint,
				value.filter((it) => it.pluginId !== pluginId),
			)
		}

		delete this.loadedPlugins[pluginId]
	}

	registerConfigField(pluginId: PluginId, config: ConfigFieldConfiguration) {
		const existingExtensions = this.pluginToConfigFieldExtension.get(pluginId) ?? []
		existingExtensions.push({ config, pluginId })
		this.pluginToConfigFieldExtension.set(pluginId, existingExtensions)

		const b = this.extensionPointToButtonExtension.get(config.extensionPoint) ?? []
		b.push({ config, pluginId })
	}

	registerButton(pluginId: PluginId, config: ButtonConfiguration) {
		if (!this.extensionPointToButtonExtension.has(config.extensionPoint)) {
			this.extensionPointToButtonExtension.set(config.extensionPoint, [])
		}
		this.extensionPointToButtonExtension.get(config.extensionPoint)!.push({ config, pluginId })
	}

	public readonly entityUpdatesListener: EntityUpdatesListener = {
		id: "PluginManager",
		onEntityUpdatesReceived: async (updates: ReadonlyArray<EntityUpdateData>): Promise<void> => {
			for (const update of updates) {
				if (isUpdateForTypeRef(PluginConfigurationTypeRef, update)) {
					const pluginId = pluginIdFromString(base64UrlCustomIdToString(update.instanceId))
					const configOwner = this.configurationAdapter.getConfigOwner(assertNotNull(update.instanceListId))

					if (update.operation === OperationType.CREATE && configOwner === PluginConfigurationOwner.Customer) {
						const customerConfigJson = assertNotNull((await this.configurationAdapter.getCustomerPluginConfigs()).get(pluginId))
						const pluginToLoad: EnabledPlugin = { pluginId, customerConfigJson: customerConfigJson }
						await this.loadPlugins([pluginToLoad])
					} else if (update.operation === OperationType.DELETE && configOwner === PluginConfigurationOwner.User) {
						// FIXME: also delete this pluginConfig from user( better to do from serverside ) ?
						await this.unloadPlugins(pluginId)
					} else {
						const loadedPlugin = assertNotNull(
							this.loadedPlugins[pluginId],
							`Got UPDATE for config for plugin ${pluginId}. But the plugin is not yet loaded`,
						)
						if (configOwner === PluginConfigurationOwner.Customer) {
							await loadedPlugin.api.onCustomerChange().catch(
								ofClass(CustomerConfigPluginError, (e) => {
									this.dialogAdapter.showDialog(`Error while updating config: ${e.message}`)
								}),
							)
						} else if (configOwner === PluginConfigurationOwner.User) {
							await loadedPlugin.api.onUserConfigChange()
						}
					}
				}
			}
		},
		priority: ListenerPriority.NORMAL,
	}
}
