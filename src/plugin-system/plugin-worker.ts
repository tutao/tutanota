import { newMessagePortRpcSession, RpcStub, RpcTarget } from "capnweb"
import { IHostApi, Mail } from "./IHostApi.js"
import { IWorkerApi } from "./IWorkerApi.js"
import plugin from "./plugins/hello-world/src/index.js"
import { PluginContext } from "./sdk/src/context.js"
import { Commands } from "./sdk/src/commands.js"
import { ILogger } from "./sdk/src/logging.js"
import { Storage } from "./sdk/src/storage.js"
import { Ui } from "./sdk/src/ui.js"

class WorkerApi extends RpcTarget implements IWorkerApi {
	hostStub!: RpcStub<IHostApi>

	async load(): Promise<void> {
		for (let i = 0; i < 1000; i++) {
			const mail = await this.hostStub.getMail("id")
			console.log(mail.from)
		}
		plugin.load("context todo")
	}
	async unload(): Promise<void> {
		plugin.unload()
	}
}

// class ImplPluginContext implements PluginContext {
// 	commands: Commands
// 	config: Config
// 	events: Events
// 	logger: ILogger
// 	mail: Mail
// 	storage: Storage
// 	ui: Ui
// }

self.onmessage = async (event) => {
	const port = event.data as MessagePort
	const workerApi = new WorkerApi()
	workerApi.hostStub = newMessagePortRpcSession(port, workerApi) // TODO() maybe do some registration ack to signify readiness?
}
