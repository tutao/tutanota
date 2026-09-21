import { PluginApi } from "../sdk/PluginApi"
import { ButtonConfiguration, ConfigFieldConfiguration, ExtensionPoint } from "../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../sdk/AttachmentButtonExtensionPoint"
import { EventLocationButtonExtension } from "../sdk/EventLocationButtonExtensionPoint"
import { ButtonExtension, ConfigExtension, ConfigurationAdapter, MailIntegrationAdapter, PluginHost } from "./PluginHost"
import { assertNotNull, base64UrlCustomIdToString, downcast } from "@tutao/utils"
import { EnvProvider } from "@tutao/app-env"
import { FileImportExtension, PluginFileReference } from "../sdk/FileImportExtensionPoint"
import { EntityUpdateData, EntityUpdatesListener, isUpdateForTypeRef, ListenerPriority } from "../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { PluginConfigurationTypeRef } from "@tutao/entities/sys"

export type EnabledPlugin = {
	pluginId: string
	customerConfigJson: string
}

type PluginWrapper = {
	pluginId: string
	globalConfigJson: string
	api: PluginApi
	pluginHost: PluginHost
	pluginAsWorker: Worker
}

type PluginId = string

export class PluginManager {
	private readonly loadedPlugins: Record<string, PluginWrapper> = {}
	private readonly extensionPointToButtonExtension: Map<ExtensionPoint, Array<ButtonExtension>> = new Map()
	private readonly pluginToConfigFieldExtension: Map<PluginId, Array<ConfigExtension>> = new Map()

	constructor(
		public readonly configurationAdapter: ConfigurationAdapter,
		public readonly mailIntegrationAdapter?: MailIntegrationAdapter,
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
			const { pluginApi, pluginAsWorker } = PluginApi.newPluginFromFile(pluginId, pluginHost)
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

	getRegisteredConfigFieldsByPluginId(pluginId: string): ReadonlyArray<ConfigExtension> {
		return this.pluginToConfigFieldExtension.get(pluginId) ?? []
	}

	async attachmentButtonClicked(pluginName: string, dataFile: Promise<PluginDataFile>): Promise<void> {
		downcast<AttachmentButtonExtension>(assertNotNull(this.loadedPlugins[pluginName]).api).attachmentButtonClicked(await dataFile)
	}

	async eventLocationButtonClicked(pluginName: string): Promise<Readonly<string>> {
		return downcast<EventLocationButtonExtension>(assertNotNull(this.loadedPlugins[pluginName]).api).eventLocationButtonClicked()
	}

	async receiveFileReference(pluginName: string, fileReference: PluginFileReference): Promise<void> {
		return downcast<FileImportExtension>(assertNotNull(this.loadedPlugins[pluginName]).api).receiveFileReference(fileReference)
	}

	async unloadPlugins(pluginId: string): Promise<void> {
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

	registerConfigField(pluginId: string, config: ConfigFieldConfiguration) {
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
		onEntityUpdatesReceived: async (updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> => {
			for (const update of updates) {
				const isUpdateForCustomer = true

				if (isUpdateForTypeRef(PluginConfigurationTypeRef, update)) {
					const pluginId = base64UrlCustomIdToString(update.instanceId)
					let loadedPlugin = this.loadedPlugins[pluginId]
					if (loadedPlugin) {
						const customerConfig = (await this.configurationAdapter.getUserConfig(pluginId)) ?? "{}"
						const userConfig = (await this.configurationAdapter.getUserConfig(pluginId)) ?? "{}"
						await loadedPlugin.api.onConfigChange({ customerConfig, userConfig })
					}
				}
			}
		},
		priority: ListenerPriority.NORMAL,
	}
}
