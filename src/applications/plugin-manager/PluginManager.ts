import { PluginApi } from "../../plugin-kit/sdk/PluginApi"
import { ButtonExtensionPoint } from "../../plugin-kit/sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../../plugin-kit/sdk/AttachmentButtonExtensionPoint"
import { PluginButtonConfiguration, PluginHost } from "./PluginHost"
import { assertNotNull, downcast } from "@tutao/utils"

export class PluginManager {
	private registeredPlugins: string[] = ["nextcloud"]
	public readonly loadedPlugins: Record<string, PluginApi> = {}

	constructor(private readonly pluginHost: PluginHost) {}

	async loadPlugins(): Promise<void> {
		console.log("loading plugins")
		for (const pluginName of this.registeredPlugins) {
			//new Worker(`../plugins/${pluginName}.js`)
			const pluginModule = await import(`../../plugin-kit/plugins/${pluginName}.js`)
			const plugin: PluginApi = new pluginModule.Plugin(this.pluginHost)

			this.pluginHost.loadingPluginName = pluginName
			await plugin.load()
			this.loadedPlugins[pluginName] = plugin
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
