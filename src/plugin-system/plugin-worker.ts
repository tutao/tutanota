import { newMessagePortRpcSession, RpcStub, RpcTarget } from "capnweb"
import { IHostApi } from "./IHostApi.js"
import { IWorkerApi } from "./IWorkerApi.js"
import { createTutaoPlugin, TutaoPlugin } from "./getPluginModules.js"

class WorkerApi extends RpcTarget implements IWorkerApi {
	hostStub!: RpcStub<IHostApi>
	plugin!: TutaoPlugin

	async init(packageLocation: string): Promise<void> {
		const plugin = await createTutaoPlugin(packageLocation)
	}
	async load(): Promise<void> {
		this.plugin.module.load("context todo")
	}
	async unload(): Promise<void> {
		this.plugin.module.unload()
	}
}

self.onmessage = async (event) => {
	const port = event.data as MessagePort
	const workerApi = new WorkerApi()
	workerApi.hostStub = newMessagePortRpcSession(port, workerApi) // TODO() maybe do some registration ack to signify readiness?
}
