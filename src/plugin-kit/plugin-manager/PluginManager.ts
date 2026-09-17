import { PluginApi } from "../sdk/PluginApi"
import { ExtensionPoint } from "../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../sdk/AttachmentButtonExtensionPoint"
import { EventLocationButtonExtension } from "../sdk/EventLocationButtonExtensionPoint"
import { ButtonExtension, ConfigExtension, ConfigurationAdapter, PluginHost } from "./PluginHost"
import { assertNotNull, downcast } from "@tutao/utils"
import { EnvProvider } from "@tutao/app-env"

export type EnabledPlugin = {
	pluginId: string
	customerConfigJson: string
}

type PluginWrapper = {
	pluginId: string
	globalConfigJson: string
	api: PluginApi
	pluginHost: PluginHost
}

export class PluginManager {
	public readonly loadedPlugins: Record<string, PluginWrapper> = {}
	public readonly buttonRegistry: Array<ButtonExtension> = []
	public readonly configFieldRegistry: Array<ConfigExtension> = []

	constructor(public readonly configurationAdapter: ConfigurationAdapter) {}

	async loadPlugins(enabledPlugins: Array<EnabledPlugin>): Promise<void> {
		if (EnvProvider.get().isAdminClient()) {
			return
		}
		console.log("loading plugins", enabledPlugins)
		for (const enabledPlugin of enabledPlugins) {
			const { pluginId, customerConfigJson } = enabledPlugin
			const pluginHost = new PluginHost(this, pluginId)
			const pluginApi = PluginApi.newPluginFromFile(pluginId, pluginHost)
			const pluginFilePath = `${EnvProvider.get().getPathPrefix()}/plugin-kit/plugins/${pluginId}.js`
			await pluginApi.load(pluginFilePath, customerConfigJson)

			this.loadedPlugins[pluginId] = { pluginId, globalConfigJson: customerConfigJson, api: pluginApi, pluginHost }
		}
	}
	getRegisteredButtonsByExtensionPoint(extensionPoint: ExtensionPoint): ButtonExtension[] {
		switch (extensionPoint) {
			case ExtensionPoint.SaveAttachmentDialog:
			case ExtensionPoint.EventLocationButton:
				return this.buttonRegistry.filter((b) => b.config.extensionPoint === extensionPoint) ?? null
		}
		return []
	}
	getRegisteredConfigFieldsByPluginId(pluginId: string): ConfigExtension[] {
		return this.configFieldRegistry.filter((c) => c.pluginName === pluginId)
	}
	async attachmentButtonClicked(pluginName: string, dataFile: Promise<PluginDataFile>): Promise<void> {
		downcast<AttachmentButtonExtension>(assertNotNull(this.loadedPlugins[pluginName]).api).attachmentButtonClicked(await dataFile)
	}
	async eventLocationButtonClicked(pluginName: string): Promise<string> {
		return downcast<EventLocationButtonExtension>(assertNotNull(this.loadedPlugins[pluginName]).api).eventLocationButtonClicked()
	}
}
