import { RpcStub, newMessagePortRpcSession } from "capnweb"
import { IWorkerApi } from "./IWorkerApi.js"
import { HostApi } from "./hostPluginAdapter.js"
import { getPackagePaths } from "./getPluginModules.js"

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
	private registeredPlugins: Map<number, RunningPlugin> = new Map()

	async registerPlugins(): Promise<void> {
		const packagePaths = await getPackagePaths("../plugins")

		const tempPlugins = await RunningPlugin.create(0, packagePaths[0])
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

class RunningPlugin {
	id: number
	worker: Worker
	channel: MessageChannel
	workerStub: RpcStub<IWorkerApi>

	private constructor(id: number, worker: Worker, channel: MessageChannel, workerStub: RpcStub<IWorkerApi>) {
		this.id = id
		this.worker = worker
		this.channel = channel
		this.workerStub = workerStub
	}

	static async create(id: number, packageLocation: string): Promise<RunningPlugin> {
		const channel = new MessageChannel()
		const worker = new Worker("/plugin-worker.js", { type: "module", name: `plugin-worker:${id}` }) //TODO() maybe give plugin name
		worker.onerror = (err: ErrorEvent) => {
			console.error("Plugin worker error:", err.message)
		}
		worker.postMessage(channel.port2, [channel.port2])

		const workerStub: RpcStub<IWorkerApi> = newMessagePortRpcSession(channel.port1, new HostApi())

		await workerStub.init(packageLocation)

		return new RunningPlugin(id, worker, channel, workerStub)
	}

	async load(): Promise<void> {
		await this.workerStub.load()
	}

	async unload(): Promise<void> {
		await this.workerStub.unload()
		this.worker.terminate()
	}
}
