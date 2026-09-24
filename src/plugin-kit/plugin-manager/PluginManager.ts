import { DialogAdapter, PluginApi } from "../sdk/PluginApi"
import { ButtonConfiguration, ConfigFieldConfiguration, ExtensionPoint } from "../sdk/hostApi/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../sdk/AttachmentButtonExtensionPoint"
import { EventLocationButtonExtension } from "../sdk/EventLocationButtonExtensionPoint"
import { ButtonExtension, ConfigExtension, ConfigurationAdapter, MailIntegrationAdapter, PluginConfigurationOwner, PluginHost } from "./hostApi/PluginHost"
import { assert, assertNotNull, base64UrlCustomIdToString, downcast, isNotNull, Nullable, ofClass } from "@tutao/utils"
import { EnvProvider } from "@tutao/app-env"
import { EntityUpdateData, EntityUpdatesListener, isUpdateForTypeRef, ListenerPriority } from "../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { PluginConfiguration, PluginConfigurationTypeRef } from "@tutao/entities/sys"
import { isSameSingleId, OperationType } from "@tutao/meta"
import { PluginId, pluginIdFromString } from "../sdk/PluginId"
import { CustomerConfigPluginError } from "../sdk/PluginError"
import { PluginManifest } from "../sdk/PluginManifest"
import { isNull } from "../../platform-kit/utils/Utils"

type PluginWrapper = {
	pluginId: PluginId
	api: PluginApi
	pluginHost: PluginHost
	pluginAsWorker: Worker
	draftConfig: Record<string, string>
}

export interface PluginSourceHostServer {
	getPluginSourceHostUrl(): string
}

export class PluginManager {
	private readonly loadedPlugins: Partial<Record<PluginId, PluginWrapper>> = {}
	private readonly extensionPointToButtonExtension: Map<ExtensionPoint, Array<ButtonExtension>> = new Map()
	private readonly pluginToConfigFieldExtension: Map<PluginId, Array<ConfigExtension>> = new Map()
	private configChangeListener: () => void

	constructor(
		public readonly configurationAdapter: ConfigurationAdapter,
		private readonly dialogAdapter: DialogAdapter,
		private readonly PLUGIN_REGISTRY: Readonly<Record<PluginId, PluginManifest>>,
		private readonly pluginSourceHostServer: PluginSourceHostServer,
		public readonly mailIntegrationAdapter: Nullable<MailIntegrationAdapter> = null,
	) {
		this.configChangeListener = () => {}
	}

	public setConfigChangeListener(listener: () => void) {
		this.configChangeListener = listener
	}

	async loadAllPlugins(): Promise<void> {
		const allPluginIdsForCustomer = new Array(...(await this.configurationAdapter.getEnabledPluginIdsForCustomer()).keys())

		const unknownPlugins = allPluginIdsForCustomer.filter((pluginId) => isNull(this.PLUGIN_REGISTRY[pluginId as PluginId]))
		const knownPlugins = allPluginIdsForCustomer
			.filter((pluginId) => isNotNull(this.PLUGIN_REGISTRY[pluginId as PluginId]))
			.map((pluginId) => pluginIdFromString(pluginId))
		console.log("Could not load these plugin as they do not exists in registery: ", unknownPlugins)
		await this.loadPlugins(...knownPlugins)
	}

	async loadPlugins(...pluginIdsToLoad: Array<PluginId>): Promise<void> {
		if (EnvProvider.get().isAdminClient()) {
			return
		}
		for (const pluginIdToEnable of pluginIdsToLoad) {
			console.log(`loading plugin:  ${pluginIdToEnable}`)
			if (isNotNull(this.loadedPlugins[pluginIdToEnable])) {
				throw new Error(`Could not load plugin: ${pluginIdToEnable} as it is already loaded. Call unload() first`)
			}

			const pluginHost = new PluginHost(this, pluginIdToEnable)
			const { pluginApi, pluginAsWorker } = PluginApi.newPluginFromFile(
				pluginIdToEnable,
				pluginHost,
				this.dialogAdapter,
				this.pluginSourceHostServer.getPluginSourceHostUrl(),
			)
			pluginHost.initialize(await pluginApi.getManifest())
			const customerConfigJson = await this.loadCustomerConfigOrDefault(pluginIdToEnable, pluginHost.pluginManifest)
			await pluginApi.load(customerConfigJson)

			this.loadedPlugins[pluginIdToEnable] = {
				pluginId: pluginIdToEnable,
				api: pluginApi,
				pluginHost,
				pluginAsWorker,
				draftConfig: JSON.parse(customerConfigJson),
			}
		}
	}

	public async loadCustomerConfigOrDefault(pluginId: PluginId, pluginManifest: Nullable<PluginManifest>): Promise<string> {
		const customerConfigInServer = await this.configurationAdapter.getCustomerConfig(pluginId)
		if (isNotNull(customerConfigInServer)) {
			return customerConfigInServer
		}

		const manifest = assertNotNull(pluginManifest, `Customer config for ${pluginId} does not exists in server. Need manifest to create default`)
		assert(isSameSingleId(manifest.id, pluginId), "pluginId and manifestId mismatch")

		const defaultConfig = manifest.initialCustomerConfigFields.reduce(
			(config, { fieldId, defaultValue }) => {
				config[fieldId] = defaultValue
				return config
			},
			{} as Record<string, string>,
		)
		return JSON.stringify(defaultConfig)
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

	async unloadPlugin(pluginId: PluginId): Promise<void> {
		const loadedPlugin = this.loadedPlugins[pluginId]
		if (loadedPlugin == null) {
			throw new Error(`Plugin ${pluginId} is not yet loaded. Call .load() first`)
		}
		console.log(`Unloading plugin: ${pluginId}`)
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

	private async reactToPluginConfigChange(update: EntityUpdateData<PluginConfiguration>): Promise<void> {
		const pluginId = pluginIdFromString(base64UrlCustomIdToString(update.instanceId))
		const configOwner = this.configurationAdapter.getConfigOwner(assertNotNull(update.instanceListId))

		if (update.operation === OperationType.CREATE && configOwner === PluginConfigurationOwner.Customer && !this.pluginIsLoaded(pluginId)) {
			await this.loadPlugins(pluginId)
		} else if (update.operation === OperationType.DELETE) {
			await this.unloadPlugin(pluginId)
			if (configOwner === PluginConfigurationOwner.Customer) {
				// FIXME: also delete this pluginConfig from user( better to do from serverside ) ?
			}
		} else {
			const loadedPlugin = assertNotNull(this.loadedPlugins[pluginId], `Got updated config for plugin ${pluginId}. But the plugin is not yet loaded`)
			if (configOwner === PluginConfigurationOwner.Customer) {
				await loadedPlugin.api.onCustomerConfigChange().catch(
					ofClass(CustomerConfigPluginError, (e) => {
						this.dialogAdapter.showDialog(`Error while updating config: ${e.message}`)
					}),
				)
			} else if (configOwner === PluginConfigurationOwner.User) {
				await loadedPlugin.api.onUserConfigChange()
			}
		}

		this.configChangeListener()
	}

	public readonly entityUpdatesListener: EntityUpdatesListener = {
		id: "PluginManager",
		priority: ListenerPriority.NORMAL,
		onEntityUpdatesReceived: async (updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id) => {
			for (const update of updates) {
				if (isUpdateForTypeRef(PluginConfigurationTypeRef, update)) {
					await this.reactToPluginConfigChange(update)
				}
			}
		},
	}

	async verifyCustomerConfiguration(pluginId: PluginId, newCustomerConfig: string): Promise<void> {
		const loadedPlugin = assertNotNull(this.loadedPlugins[pluginId], `Got config for plugin that is not loaded: ${pluginId}`)
		return loadedPlugin.api.verifyCustomerConfiguration(newCustomerConfig)
	}

	public getLoadedPlugin(pluginId: PluginId): PluginWrapper {
		return assertNotNull(this.loadedPlugins[pluginId], `Plugin ${pluginId} is not yet loaded!`)
	}

	public pluginIsLoaded(pluginId: PluginId): boolean {
		return isNotNull(this.loadedPlugins[pluginId])
	}

	public setConfigField(pluginId: PluginId, fieldName: string, value: string) {
		this.getLoadedPlugin(pluginId).draftConfig[fieldName] = value
	}

	public getConfigFieldValue(pluginId: PluginId, fieldName: string): Nullable<string> {
		return this.getLoadedPlugin(pluginId).draftConfig[fieldName] ?? null
	}

	public async persistCustomerConfig(pluginId: PluginId): Promise<boolean> {
		const draftConfig = this.getLoadedPlugin(pluginId).draftConfig
		return await this.configurationAdapter.storeCustomerConfig(pluginId, JSON.stringify(draftConfig))
	}
}
