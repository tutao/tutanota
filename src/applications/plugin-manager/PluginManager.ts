import { PluginApi } from "../../plugin-kit/sdk/PluginApi"

export class PluginManager {
	private registeredPlugins: string[] = ["nextcloud"]

	async loadPlugins(): Promise<void> {
		console.log("loading plugins")
		for (const pluginName of this.registeredPlugins) {
			//new Worker(`../plugins/${pluginName}.js`)
			const pluginModule = await import(`../../plugin-kit/plugins/${pluginName}.js`)
			const plugin: PluginApi = new pluginModule.Plugin()
			console.log(plugin)
			await plugin.load()
		}
	}
}
