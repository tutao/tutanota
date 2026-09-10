import { PluginApi } from "../../plugin-kit/sdk/PluginApi"
import { ButtonConfiguration, ButtonExtensionPoint, ButtonRef, PluginHostApi } from "../../plugin-kit/sdk/PluginHostApi"

export class PluginManager {
	private registeredPlugins: string[] = ["nextcloud"]
	public readonly loadedPlugins: Array<PluginApi> = []

	constructor(private readonly pluginHost: PluginHostApi) {}

	async loadPlugins(): Promise<void> {
		console.log("loading plugins")
		for (const pluginName of this.registeredPlugins) {
			//new Worker(`../plugins/${pluginName}.js`)
			const pluginModule = await import(`../../plugin-kit/plugins/${pluginName}.js`)
			const plugin: PluginApi = new pluginModule.Plugin(this.pluginHost)
			await plugin.load()
			this.loadedPlugins.push(plugin)
		}
	}
	getRegisteredButtonsByExtensionPoint(extensionPoint: ButtonExtensionPoint): ButtonConfiguration[] {
		switch (extensionPoint) {
			case ButtonExtensionPoint.SaveAttachmentDialog:
				return this.pluginHost.buttonRegistry.filter((b) => b.extensionPoint === ButtonExtensionPoint.SaveAttachmentDialog) ?? null
		}
	}
	async buttonClicked(buttonRef: ButtonRef): Promise<void> {
		const plugin = this.loadedPlugins.find((p) => p.mainButton?.pluginId === buttonRef.id) ?? null
		if (plugin == null) {
			return
		}
		plugin.buttonClicked(buttonRef)
	}
}
