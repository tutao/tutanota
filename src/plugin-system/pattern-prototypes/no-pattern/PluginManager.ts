import { IPlugin } from "./IPlugin"

export class PluginManager {
	private readonly plugins = new Map<string, IPlugin>()

	register(plugin: IPlugin): void {
		if (this.plugins.has(plugin.id)) {
			throw new Error(`Plugin '${plugin.id}' is already registered.`)
		}

		this.plugins.set(plugin.id, plugin)
	}

	get(id: string): IPlugin | undefined {
		return this.plugins.get(id)
	}

	getAll(): readonly IPlugin[] {
		return Array.from(this.plugins.values())
	}

	initializeAll(): void {
		for (const plugin of Array.from(this.plugins.values())) {
			plugin.initalize()
		}
	}

	startAll(): void {
		for (const plugin of Array.from(this.plugins.values())) {
			plugin.start()
		}
	}

	shutdownAll(): void {
		for (const plugin of Array.from(this.plugins.values())) {
			plugin.shutdown()
		}
	}
}
