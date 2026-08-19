import { RpcTarget, RpcStub, newMessagePortRpcSession } from "capnweb"

export interface WorkerApi {
	helloFromWorker(): string
}

class HostApi extends RpcTarget implements HostApi {
	helloFromHost() {
		return "hello from host"
	}
}

export async function execWorker() {
	const worker = new Worker("/plugin-worker.js", { type: "module" })

	const channel = new MessageChannel()
	worker.postMessage(channel.port2, [channel.port2])
	const workerStub: RpcStub<WorkerApi> = newMessagePortRpcSession(channel.port1, new HostApi())
	console.log(await workerStub.helloFromWorker())
}

function registerError(worker: Worker) {
	worker.onerror = (err: ErrorEvent) => {
		new Error(err.message)
	}
}

function registerIncomingMessageHandler(worker: Worker) {
	worker.onmessage = (msg) => {
		if (msg.data.isReady) {
			console.log(msg.data.initMessage)

			worker.postMessage({ doRequest: true })
		} else {
			// worker not ready
		}
	}
}
