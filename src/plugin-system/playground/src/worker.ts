import { newMessagePortRpcSession } from "capnweb"
import type { Greeter } from "./rpc.js"

self.addEventListener("message", (event: MessageEvent) => {
	const port = event.data?.port as MessagePort | undefined

	if (!port) return

	const rpcSession = newMessagePortRpcSession<Greeter>(port)

	rpcSession.greet("Hello World")
})
