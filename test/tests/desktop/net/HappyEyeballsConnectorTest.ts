import o, { assertThrows, mockAttribute, unmockAttribute } from "@tutao/otest"
import dns from "node:dns"
import net from "node:net"
import os from "node:os"
import {
	CONNECTION_ATTEMPT_DELAY_MS,
	CONNECTION_TIMEOUT_MS,
	connectWithHappyEyeballs,
	determinePreferredIpFamily,
} from "../../../../src/applications/common/desktop/net/HappyEyeballsConnector.js"
import type { ConnectionCandidate, HappyEyeballsOptions } from "../../../../src/applications/common/desktop/net/HappyEyeballsConnector.js"

o.spec("HappyEyeballsConnector", () => {
	let timers: TimerMock
	let lookupResults: Promise<Array<{ address: string; family: number }>>
	let lookupCalls: number
	let mocks: Array<Record<string, unknown>>

	o.beforeEach(() => {
		timers = new TimerMock()
		lookupResults = Promise.resolve([
			{ address: "192.0.2.1", family: 4 },
			{ address: "2001:db8::1", family: 6 },
		])
		lookupCalls = 0
		mocks = [
			mockAttribute(globalThis, globalThis.setTimeout, timers.setTimeout),
			mockAttribute(globalThis, globalThis.clearTimeout, timers.clearTimeout),
			mockAttribute(dns.promises, dns.promises.lookup, async () => {
				lookupCalls += 1
				return await lookupResults
			}),
			mockAttribute(os, os.networkInterfaces, () => dualStackInterfaces),
		]
	})

	o.afterEach(() => {
		for (const mock of mocks.reverse()) unmockAttribute(mock)
	})

	o.test("interleaves families and keeps previous attempts active", async () => {
		lookupResults = Promise.resolve([
			{ address: "2001:db8::1", family: 6 },
			{ address: "192.0.2.1", family: 4 },
			{ address: "192.0.2.1", family: 4 },
			{ address: "2001:db8::2", family: 6 },
			{ address: "192.0.2.2", family: 4 },
		])
		const attempts: Array<ConnectionAttempt> = []
		const result = connect((candidate) => addAttempt(attempts, candidate))

		await flushPromises()
		o(attempts.map(({ candidate }) => candidate)).deepEquals([{ address: "192.0.2.1", family: 4 }])
		let resolved = false
		void result.then(() => {
			resolved = true
		})
		attempts[0].socket.emit("connect")
		await flushPromises()
		o(resolved).equals(false)

		timers.runNext(CONNECTION_ATTEMPT_DELAY_MS)
		o(attempts.map(({ candidate }) => candidate)).deepEquals([
			{ address: "192.0.2.1", family: 4 },
			{ address: "2001:db8::1", family: 6 },
		])
		o(attempts[0].socket.destroyCalls).equals(0)

		timers.runNext(CONNECTION_ATTEMPT_DELAY_MS)
		timers.runNext(CONNECTION_ATTEMPT_DELAY_MS)
		o(attempts.map(({ candidate }) => candidate)).deepEquals([
			{ address: "192.0.2.1", family: 4 },
			{ address: "2001:db8::1", family: 6 },
			{ address: "192.0.2.2", family: 4 },
			{ address: "2001:db8::2", family: 6 },
		])

		attempts[3].socket.emit("secureConnect")
		o(await result).equals(attempts[3].socket)
		o(attempts.slice(0, 3).map(({ socket }) => socket.destroyCalls)).deepEquals([1, 1, 1])
		o(attempts[3].socket.destroyCalls).equals(0)
	})

	o.test("starts the next address immediately after a hard error", async () => {
		const attempts: Array<ConnectionAttempt> = []
		const result = connect((candidate) => addAttempt(attempts, candidate))
		await flushPromises()

		const firstError = new Error("first failed")
		attempts[0].socket.emit("error", firstError)
		o(attempts.length).equals(2)
		o(attempts[0].socket.destroyCalls).equals(1)

		const secondError = new Error("second failed")
		attempts[1].socket.emit("error", secondError)
		const error = await assertThrows(AggregateError, () => result)
		o(error.errors).deepEquals([firstError, secondError])
	})

	o.test("waits for active attempts after every address has started", async () => {
		const attempts: Array<ConnectionAttempt> = []
		const result = connect((candidate) => addAttempt(attempts, candidate))
		await flushPromises()
		timers.runNext(CONNECTION_ATTEMPT_DELAY_MS)

		const secondError = new Error("second failed")
		attempts[1].socket.emit("error", secondError)
		o(attempts[0].socket.destroyCalls).equals(0)

		const firstError = new Error("first failed")
		attempts[0].socket.emit("error", firstError)
		const error = await assertThrows(AggregateError, () => result)
		o(error.errors).deepEquals([secondError, firstError])
	})

	o.test("advances past synchronous connection errors without recursion", async () => {
		const attempts: Array<ConnectionAttempt> = []
		const syncError = new Error("synchronous failure")
		const result = connect((candidate) => {
			if (candidate.family === 4) throw syncError
			return addAttempt(attempts, candidate)
		})

		await flushPromises()
		o(attempts.map(({ candidate }) => candidate)).deepEquals([{ address: "2001:db8::1", family: 6 }])
		attempts[0].socket.emit("error", new Error("IPv6 failed"))
		const error = await assertThrows(AggregateError, () => result)
		o(error.errors[0]).equals(syncError)
	})

	o.test("uses the requested family and the local address family", async () => {
		const familyAttempts: Array<ConnectionAttempt> = []
		const familyResult = connect((candidate) => addAttempt(familyAttempts, candidate), { family: 6 })
		await flushPromises()
		o(familyAttempts.map(({ candidate }) => candidate)).deepEquals([{ address: "2001:db8::1", family: 6 }])
		familyAttempts[0].socket.emit("secureConnect")
		await familyResult

		const localAddressAttempts: Array<ConnectionAttempt> = []
		const localAddressResult = connect((candidate) => addAttempt(localAddressAttempts, candidate), { localAddress: "192.0.2.10" })
		await flushPromises()
		o(localAddressAttempts.map(({ candidate }) => candidate)).deepEquals([{ address: "192.0.2.1", family: 4 }])
		localAddressAttempts[0].socket.emit("secureConnect")
		await localAddressResult
	})

	o.test("rejects conflicting requested and local address families", async () => {
		const result = assertThrows(Error, () =>
			connect(() => new SocketStub(), {
				family: 4,
				localAddress: "2001:db8::10",
			}),
		)

		await flushPromises()
		const error = (await result) as NodeJS.ErrnoException
		o(error.code).equals("ENOTFOUND")
		o(lookupCalls).equals(0)
	})

	o.test("destroys active sockets at the overall deadline", async () => {
		const attempts: Array<ConnectionAttempt> = []
		const result = assertThrows(Error, () => connect((candidate) => addAttempt(attempts, candidate)))
		await flushPromises()

		timers.runNext(CONNECTION_TIMEOUT_MS)
		const error = (await result) as NodeJS.ErrnoException
		o(error.code).equals("ETIMEDOUT")
		o(attempts[0].socket.destroyCalls).equals(1)
	})

	o.test("applies the overall deadline while DNS is pending", async () => {
		let resolveLookup: (addresses: Array<{ address: string; family: number }>) => void
		lookupResults = new Promise((resolve) => {
			resolveLookup = resolve
		})
		const attempts: Array<ConnectionAttempt> = []
		const result = assertThrows(Error, () => connect((candidate) => addAttempt(attempts, candidate)))

		timers.runNext(CONNECTION_TIMEOUT_MS)
		const error = (await result) as NodeJS.ErrnoException
		o(error.code).equals("ETIMEDOUT")
		resolveLookup!([{ address: "192.0.2.1", family: 4 }])
		await flushPromises()
		o(attempts).deepEquals([])
	})

	o.test("treats a close before the handshake as a connection error", async () => {
		lookupResults = Promise.resolve([{ address: "192.0.2.1", family: 4 }])
		const attempts: Array<ConnectionAttempt> = []
		const result = assertThrows(AggregateError, () => connect((candidate) => addAttempt(attempts, candidate)))
		await flushPromises()

		attempts[0].socket.emit("close")
		const error = await result
		o((error.errors[0] as NodeJS.ErrnoException).code).equals("ECONNRESET")
	})

	o.test("uses interface addresses only as an ordering hint", () => {
		o(determinePreferredIpFamily(dualStackInterfaces)).equals(4)
		o(determinePreferredIpFamily(ipv6OnlyInterfaces)).equals(6)
		o(determinePreferredIpFamily(linkLocalOnlyInterfaces)).equals(4)
	})

	function connect(
		createConnection: (candidate: ConnectionCandidate) => SocketStub,
		overrides: Partial<HappyEyeballsOptions<SocketStub>> = {},
	): Promise<SocketStub> {
		return connectWithHappyEyeballs({
			hostname: "example.com",
			port: 443,
			readyEvent: "secureConnect",
			createConnection,
			...overrides,
		})
	}
})

type ConnectionAttempt = {
	candidate: ConnectionCandidate
	socket: SocketStub
}

function addAttempt(attempts: Array<ConnectionAttempt>, candidate: ConnectionCandidate): SocketStub {
	const socket = new SocketStub()
	attempts.push({ candidate, socket })
	return socket
}

class SocketStub extends net.Socket {
	destroyCalls = 0

	override destroy(): this {
		this.destroyCalls += 1
		this.emit("close")
		return this
	}
}

class TimerMock {
	private nextId = 1
	private readonly scheduled = new Map<number, { callback: () => void; delay: number }>()

	readonly setTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
		const id = this.nextId++
		this.scheduled.set(id, { callback, delay })
		return id as unknown as NodeJS.Timeout
	}

	readonly clearTimeout = (timeout: NodeJS.Timeout | number | undefined): void => {
		this.scheduled.delete(timeout as number)
	}

	runNext(delay: number): void {
		const entry = Array.from(this.scheduled.entries()).find(([, timer]) => timer.delay === delay)
		if (entry == null) throw new Error(`No timer scheduled after ${delay} ms`)
		this.scheduled.delete(entry[0])
		entry[1].callback()
	}
}

async function flushPromises(): Promise<void> {
	await Promise.resolve()
	await Promise.resolve()
}

const dualStackInterfaces: ReturnType<typeof os.networkInterfaces> = {
	eth0: [
		{ address: "192.0.2.10", netmask: "255.255.255.0", family: "IPv4", mac: "00:00:00:00:00:00", internal: false, cidr: "192.0.2.10/24" },
		{
			address: "2001:db8::10",
			netmask: "ffff:ffff:ffff:ffff::",
			family: "IPv6",
			mac: "00:00:00:00:00:00",
			internal: false,
			cidr: "2001:db8::10/64",
			scopeid: 0,
		},
	],
}

const ipv6OnlyInterfaces: ReturnType<typeof os.networkInterfaces> = {
	eth0: [
		{
			address: "fd00::10",
			netmask: "ffff:ffff:ffff:ffff::",
			family: "IPv6",
			mac: "00:00:00:00:00:00",
			internal: false,
			cidr: "fd00::10/64",
			scopeid: 0,
		},
	],
}

const linkLocalOnlyInterfaces: ReturnType<typeof os.networkInterfaces> = {
	eth0: [
		{ address: "169.254.1.1", netmask: "255.255.0.0", family: "IPv4", mac: "00:00:00:00:00:00", internal: false, cidr: "169.254.1.1/16" },
		{
			address: "fe80::1",
			netmask: "ffff:ffff:ffff:ffff::",
			family: "IPv6",
			mac: "00:00:00:00:00:00",
			internal: false,
			cidr: "fe80::1/64",
			scopeid: 2,
		},
	],
}
