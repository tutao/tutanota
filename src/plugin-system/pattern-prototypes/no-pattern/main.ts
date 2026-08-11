import { PluginManager } from "./PluginManager"
import { HelloWorldPlugin } from "./plugins/HelloWorldPlugin"

function main() {
	const pluginManager = new PluginManager()

	// somehow discover plugins
	pluginManager.register(new HelloWorldPlugin())

	pluginManager.initializeAll()

	pluginManager.startAll()

	pluginManager.startAll()
}
