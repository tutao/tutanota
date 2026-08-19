import { newMessagePortRpcSession, RpcStub, RpcTarget } from "capnweb"

export interface HostApi {
	helloFromHost(): string
}

class WorkerApi extends RpcTarget implements WorkerApi {
	helloFromWorker() {
		return "hello from worker"
	}
}

self.onmessage = async (event) => {
	const port = event.data as MessagePort

	// Worker exposes WorkerApi to the host.
	const hostStub: RpcStub<HostApi> = newMessagePortRpcSession(port, new WorkerApi())

	// The worker can call the host over the SAME port.
	console.log(await hostStub.helloFromHost())
}
