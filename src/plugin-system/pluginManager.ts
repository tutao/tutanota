import { RpcTarget, RpcStub, newMessagePortRpcSession } from "capnweb"
import { IWorkerApi, PluginMetadata } from "./IWorkerApi.js"
import { HostApi } from "./hostPluginAdapter.js"

export async function initPluginSystem() {
	console.log("Initializing plugin system")
	const pluginManager = new PluginManager()
	await pluginManager.registerPlugins()
	await pluginManager.loadPlugins()

	const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
	await sleep(1000 * 5)

	await pluginManager.unloadPlugins()
}

class PluginManager {
	private registeredPlugins: Map<number, Plugin> = new Map()

	async registerPlugins(): Promise<void> {
		// TODO() somehow load individual plugin
		const tempPlugins = await Plugin.create(0)
		this.registeredPlugins.set(0, tempPlugins)
	}

	async loadPlugin(id: number): Promise<void> {
		const foundPlugin = this.registeredPlugins.get(id)
		if (foundPlugin) {
			await foundPlugin.load()
		} else {
			console.error(`Plugin id ${id} not found.`)
		}
	}
	async loadPlugins(): Promise<void> {
		for (const plugin of this.registeredPlugins.values()) {
			await plugin.load()
		}
	}

	async unloadPlugin(id: number): Promise<void> {
		const foundPlugin = this.registeredPlugins.get(id)
		if (foundPlugin) {
			await foundPlugin.unload()
			this.registeredPlugins.delete(id)
		} else {
			console.error(`Plugin id ${id} not found.`)
		}
	}
	async unloadPlugins(): Promise<void> {
		for (const plugin of this.registeredPlugins.values()) {
			await plugin.unload()
			this.registeredPlugins.delete(plugin.id)
		}
	}
}

class Plugin {
	id: number
	metadata: PluginMetadata
	worker: Worker
	channel: MessageChannel
	workerStub: RpcStub<IWorkerApi>

	private constructor(id: number, worker: Worker, channel: MessageChannel, workerStub: RpcStub<IWorkerApi>, metadata: PluginMetadata) {
		this.id = id
		this.worker = worker
		this.channel = channel
		this.workerStub = workerStub
		this.metadata = metadata
	}

	static async create(id: number): Promise<Plugin> {
		const channel = new MessageChannel()
		const worker = new Worker("/plugin-worker.js", { type: "module" })
		worker.onerror = (err: ErrorEvent) => {
			console.error("Plugin worker error:", err.message)
		}
		worker.postMessage(channel.port2, [channel.port2])

		const workerStub: RpcStub<IWorkerApi> = newMessagePortRpcSession(channel.port1, new HostApi())
		const metadata = await workerStub.getMetadata()

		return new Plugin(id, worker, channel, workerStub, metadata)
	}

	async load(): Promise<void> {
		await this.workerStub.load()
	}

	async unload(): Promise<void> {
		await this.workerStub.unload()
		this.worker.terminate()
	}
}
