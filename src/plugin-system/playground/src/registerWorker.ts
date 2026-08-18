import { Worker } from "node:worker_threads"
import { newMessagePortRpcSession, RpcStub } from "capnweb"
import { Greeter } from "./rpc.js"
import utilityProcess = Electron.utilityProcess

export async function registerWorker() {
	const child = utilityProcess.fork("./child.js")
	const channel = new MessageChannel()
	const stub = newMessagePortRpcSession<Greeter>(channel.port1)

	//
	child.postMessage({ type: "INIT_PORT" }, [channel.port2])
	await new Promise((resolve) => setTimeout(resolve, 100))
}
