import { PluginApi } from "../sdk/PluginApi"
import { ButtonExtensionPoint } from "../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../sdk/AttachmentButtonExtensionPoint"
import { PluginButtonConfiguration, PluginHost } from "./PluginHost"
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
}

export class PluginManager {
	public readonly loadedPlugins: Record<string, PluginWrapper> = {}

	constructor(private readonly pluginHost: PluginHost) {}

	async loadPlugins(enabledPlugins: Array<EnabledPlugin>): Promise<void> {
		if (EnvProvider.get().isAdminClient()) {
			return
		}
		console.log("loading plugins")
		for (const enabledPlugin of enabledPlugins) {
			const { pluginId, globalConfigJson } = enabledPlugin
			//new Worker(`../plugins/${pluginName}.js`)
			const pluginModule = await import(`${EnvProvider.get().getPathPrefix()}/plugin-kit/plugins/${pluginId}.js`)
			const plugin: PluginApi = new pluginModule.Plugin(this.pluginHost)

			this.pluginHost.loadingPluginName = pluginId
			await plugin.load()
			this.loadedPlugins[pluginId] = { pluginId, globalConfigJson, api: plugin }
			this.pluginHost.loadingPluginName = null
		}
	}
	getRegisteredButtonsByExtensionPoint(extensionPoint: ButtonExtensionPoint): PluginButtonConfiguration[] {
		switch (extensionPoint) {
			case ButtonExtensionPoint.SaveAttachmentDialog:
				return this.pluginHost.buttonRegistry.filter((b) => b.config.extensionPoint === ButtonExtensionPoint.SaveAttachmentDialog) ?? null
		}
	}
	async attachmentButtonClicked(pluginName: string, dataFile: Promise<PluginDataFile>): Promise<void> {
		downcast<AttachmentButtonExtension>(assertNotNull(this.loadedPlugins[pluginName])).attachmentButtonClicked(await dataFile)
	}
}
