import { PluginApi } from "../sdk/PluginApi"
import { ButtonExtensionPoint } from "../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../sdk/AttachmentButtonExtensionPoint"
import { ConfigurationAdapter, PluginButtonConfiguration, PluginHost } from "./PluginHost"
import { assertNotNull, downcast } from "@tutao/utils"
import { EnvProvider } from "@tutao/app-env"

export type EnabledPlugin = {
	pluginId: string
	globalConfigJson: string
}

type PluginWrapper = {
	pluginId: string
	globalConfigJson: string
	api: PluginApi
	pluginHost: PluginHost
}

export class PluginManager {
	public readonly loadedPlugins: Record<string, PluginWrapper> = {}
	public readonly buttonRegistry: Array<PluginButtonConfiguration> = []

	constructor(public readonly configurationAdapter: ConfigurationAdapter) {}

	async loadPlugins(enabledPlugins: Array<EnabledPlugin>): Promise<void> {
		if (EnvProvider.get().isAdminClient()) {
			return
		}
		console.log("loading plugins", enabledPlugins)
		for (const enabledPlugin of enabledPlugins) {
			const { pluginId, globalConfigJson } = enabledPlugin
			//new Worker(`../plugins/${pluginName}.js`)
			const pluginModule = await import(`${EnvProvider.get().getPathPrefix()}/plugin-kit/plugins/${pluginId}.js`)
			let pluginHost = new PluginHost(this, pluginId)
			const plugin: PluginApi = new pluginModule.Plugin(pluginHost)

			await plugin.load()
			this.loadedPlugins[pluginId] = { pluginId, globalConfigJson, api: plugin, pluginHost: pluginHost }
		}
	}
	getRegisteredButtonsByExtensionPoint(extensionPoint: ButtonExtensionPoint): PluginButtonConfiguration[] {
		switch (extensionPoint) {
			case ButtonExtensionPoint.SaveAttachmentDialog:
				return this.buttonRegistry.filter((b) => b.config.extensionPoint === ButtonExtensionPoint.SaveAttachmentDialog) ?? null
		}
		return []
	}
	async attachmentButtonClicked(pluginName: string, dataFile: Promise<PluginDataFile>): Promise<void> {
		downcast<AttachmentButtonExtension>(assertNotNull(this.loadedPlugins[pluginName]).api).attachmentButtonClicked(await dataFile)
	}
}
