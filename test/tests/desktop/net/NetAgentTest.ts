import o from "@tutao/otest"
import type { Agent } from "undici"
import http from "node:http"
import type { AddressInfo } from "node:net"
import { NetAgent } from "../../../../src/applications/common/desktop/net/NetAgent.js"

o.spec("NetAgent", function () {
	let server: http.Server
	let breakConnections: boolean
	let url: string
	let fakeFingerprint: string
	let client: NetAgent

	class TestAgent extends NetAgent {
		override networkFingerprint(): string {
			return fakeFingerprint
		}
	}
	let initialAgent: Agent
	/** all agents that were in use at some point */
	let agents: Set<Agent>

	const currentAgent = (): Agent => client["agent"]

	const fetchText = async () => {
		try {
			return await (await client.fetch(url)).text()
		} catch {
			return null
		} finally {
			agents.add(currentAgent())
		}
	}

	o.beforeEach(async function () {
		breakConnections = false
		fakeFingerprint = "wlan0|10.0.0.2"
		client = new TestAgent()
		initialAgent = currentAgent()
		agents = new Set([initialAgent])
		server = http.createServer((req, res) => {
			// closing the socket without an answer makes the request fail with UND_ERR_SOCKET
			if (breakConnections) req.socket.destroy()
			else res.end("ok")
		})
		await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
		url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
	})

	o.afterEach(async function () {
		server.closeAllConnections()
		await new Promise((resolve) => server.close(resolve))
		await Promise.all([initialAgent.destroy(), currentAgent().destroy()])
	})

	o("does not replace the agent if requests succeed", async function () {
		fakeFingerprint = "wlan0|10.0.0.99"
		o(await fetchText()).equals("ok")
		o(agents.size).equals(1)
	})

	o("does not replace the agent after a failure if the network did not change", async function () {
		breakConnections = true
		o(await fetchText()).equals(null)
		o(agents.size).equals(1)
	})

	o("replaces the agent after a failure if the network changed", async function () {
		breakConnections = true
		fakeFingerprint = "wlan0|10.0.0.99"
		o(await fetchText()).equals(null)
		o(agents.size).equals(2)
		o(initialAgent.destroyed).equals(true)

		breakConnections = false
		o(await fetchText()).equals("ok")
		o(agents.size).equals(2)
	})

	o("replaces the agent only once for concurrent failures and again on the next network change", async function () {
		breakConnections = true
		fakeFingerprint = "wlan0|10.0.0.99"
		await Promise.all([fetchText(), fetchText(), fetchText()])
		o(agents.size).equals(2)

		// the new agent belongs to the current network, failures alone do not replace it
		await fetchText()
		o(agents.size).equals(2)

		fakeFingerprint = "eth0|192.168.1.5"
		await fetchText()
		o(agents.size).equals(3)
	})
})
