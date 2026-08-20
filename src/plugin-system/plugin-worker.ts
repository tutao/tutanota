import { newMessagePortRpcSession, RpcStub, RpcTarget } from "capnweb"
import { IHostApi } from "./IHostApi.js"
import { IWorkerApi, PluginCapabilities } from "./IWorkerApi.js"

class WorkerApi extends RpcTarget implements IWorkerApi {
	hostStub!: RpcStub<IHostApi>

	async load(): Promise<void> {
		console.log("Plugin loaded")
		const mail = await this.hostStub.getMail("id")
		console.log(mail)
		return Promise.resolve()
	}
	async unload(): Promise<void> {
		console.log("Plugin unload")
		return Promise.resolve()
	}
	getMetadata(): { name: string; description: string; version: string; pluginCapabilities: PluginCapabilities } {
		return {
			name: "Test",
			description: "Plugin for testing capabilities",
			version: "0.0.1",
			pluginCapabilities: PluginCapabilities.None,
		}
	}
}

self.onmessage = async (event) => {
	const port = event.data as MessagePort
	const workerApi = new WorkerApi()
	const hostStub: RpcStub<IHostApi> = newMessagePortRpcSession(port, workerApi)
	workerApi.hostStub = hostStub // TODO() maybe do some registration ack to signify readiness?
}
