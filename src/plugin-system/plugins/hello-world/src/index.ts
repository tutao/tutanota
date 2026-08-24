import { PluginModule } from "../../../getPluginModules"

const plugin: PluginModule = {
	load(context) {
		// context.logger("")
		console.log("Hello, World!")
	},

	unload() {
		console.log("Goodbye, World!")
	},
}

export default plugin
