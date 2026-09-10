import { PluginModule } from "../../../getPluginModules.js"

const plugin: PluginModule = {
	async load(context) {
		console.log("Hello, World!")
		// context.logger.info("Hello World!")
	},

	unload() {
		console.log("Goodbye, World!")
	},
}

export default plugin
