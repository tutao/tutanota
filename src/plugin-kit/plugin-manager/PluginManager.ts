import { PluginApi } from "../sdk/PluginApi"
import { ButtonExtensionPoint } from "../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../sdk/AttachmentButtonExtensionPoint"
import { PluginButtonConfiguration, PluginHost } from "./PluginHost"
import { assertNotNull, downcast } from "@tutao/utils"
import { EnvProvider } from "@tutao/app-env"

export class PluginManager {
	private registeredPlugins: string[] = ["nextcloud"]
	public readonly loadedPlugins: Record<string, PluginApi> = {}

	constructor(private readonly pluginHost: PluginHost) {}

	async loadPlugins(): Promise<void> {
		if (EnvProvider.get().isAdminClient()) {
			return
		}
		console.log("loading plugins")
		for (const pluginName of this.registeredPlugins) {
			//new Worker(`../plugins/${pluginName}.js`)
			const pluginModule = await import(`${EnvProvider.get().getPathPrefix()}/plugin-kit/plugins/${pluginName}.js`)
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
