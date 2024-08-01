import n from "../nodemocker.js"
import o from "@tutao/otest"
import { makeTimeoutMock, spy } from "@tutao/tutanota-test-utils"
import { Socketeer } from "../../../src/common/desktop/Socketeer.js"
o.spec("Socketeer Test", function () {
	const electron = {
		app: {
			callbacks: {},
			on: function (ev: string, cb: () => void) {
				this.callbacks[ev] = cb
				return n.spyify(electron.app)
			},
			dock: {
				show: () => {},
				setMenu: () => {},
				isVisible: () => false,
			},
		},
	}
	let serverMock
	let connectionMock

	const standardMocks = () => {
		const net = {
			createServer: (connectionHandler) => {
				serverMock.connectionHandler = connectionHandler
				return serverMock
			},
			createConnection: () => connectionMock,
		}
		serverMock = n
			.mock("__server", {
				connectionHandler: (connection: any) => {},
				callbacks: {},
				on: function (ev: string, cb: () => void) {
					this.callbacks[ev] = cb
					return serverMock
				},
				listen: () => {},
				close: () => {},
			})
			.set()
		connectionMock = n
			.mock("__connection", {
				callbacks: {},
				on: function (ev: string, cb: () => void) {
					this.callbacks[ev] = cb
					return connectionMock
				},
				write: () => {},
				end: () => {},
			})
			.set()
		return {
			netMock: n.mock<typeof import("net")>("net", net).set(),
			electronMock: n.mock<typeof Electron>("electron", electron).set(),
			timeoutMock: makeTimeoutMock(),
		}
	}

	o("startServer & cleanup", function () {
		const { electronMock, netMock } = standardMocks()
		const sock = new Socketeer(netMock, electronMock.app)
		o(electronMock.app.on.callCount).equals(1)
		o(electronMock.app.on.args[0]).equals("will-quit")
		o(electronMock.app.on.args.length).equals(2)
		sock.startServer()
		sock.startServer() // this should get ignored

		// check server set up
		o(serverMock.callbacks["error"]).notEquals(undefined)
		o(serverMock.callbacks["close"]).notEquals(undefined)
		o(netMock.createServer.callCount).equals(1)
		o(netMock.createConnection.callCount).equals(0)
		// make connection
		serverMock.connectionHandler(connectionMock)
		//check connection set up
		o(connectionMock.callbacks["data"]).notEquals(undefined)
		o(connectionMock.callbacks["end"]).notEquals(undefined)
		// send message
		sock.sendSocketMessage({
			some: "data",
			to: "send",
		})
		//check correct sending
		o(connectionMock.write.callCount).equals(1)
		o(connectionMock.write.args[0]).equals('{"some":"data","to":"send"}')
		o(connectionMock.write.args[1]).equals("utf8")
		o(connectionMock.write.args.length).equals(2)
		// cleanup
		// @ts-ignore
		electronMock.app.callbacks["will-quit"]()
		o(serverMock.listen.callCount).equals(1)
		o(serverMock.listen.args[0]).equals("/tmp/tutadb.sock")
		o(serverMock.listen.args.length).equals(1)
		o(serverMock.close.callCount).equals(1)
		o(serverMock.close.args.length).equals(0)
	})
	o("startClient & cleanup", function () {
		const { electronMock, netMock } = standardMocks()
		const sock = new Socketeer(netMock, electronMock.app)
		const ondata = spy(() => {})
		const ondata2 = spy(() => {})
		sock.startClient(ondata)
		sock.startClient(ondata2) // ignored

		// check setup
		o(netMock.createConnection.callCount).equals(1)
		o(connectionMock.on.callCount).equals(5)
		// check callbacks
		o(typeof connectionMock.callbacks["connect"]).equals("function")
		o(typeof connectionMock.callbacks["error"]).equals("function")
		//receive data
		connectionMock.callbacks["data"]("somedata")
		o(ondata.callCount).equals(1)
		o(ondata.args[0]).equals("somedata")
		o(ondata.args.length).equals(1)
		o(ondata2.callCount).equals(0)
		// cleanup
		// @ts-ignore
		electronMock.app.callbacks["will-quit"]()
		o(netMock.createServer.callCount).equals(0)
		o(netMock.createConnection.callCount).equals(1)
	})
	o("reconnect on end", async function () {
		const { electronMock, netMock, timeoutMock } = standardMocks()
		const sock = new Socketeer(netMock, electronMock.app, timeoutMock)
		const ondata = spy(() => {})
		sock.startClient(ondata)
		connectionMock.callbacks["end"]()
		timeoutMock.next()
		await Promise.resolve()
		o(connectionMock.on.callCount).equals(10)
		// cleanup
		// @ts-ignore
		electronMock.app.callbacks["will-quit"]()
		o(netMock.createServer.callCount).equals(0)
		o(netMock.createConnection.callCount).equals(2)
	})
	o("reconnect on close with error", async function () {
		const { electronMock, netMock, timeoutMock } = standardMocks()
		const sock = new Socketeer(netMock, electronMock.app, timeoutMock)
		const ondata = spy(() => {})
		sock.startClient(ondata)
		connectionMock.callbacks["close"](true)
		timeoutMock.next()
		await Promise.resolve()
		o(connectionMock.on.callCount).equals(10)
		// cleanup
		// @ts-ignore
		electronMock.app.callbacks["will-quit"]()
		o(netMock.createServer.callCount).equals(0)
		o(netMock.createConnection.callCount).equals(2)
	})
	o("don't reconnect on close without error", async function () {
		const { electronMock, netMock, timeoutMock } = standardMocks()
		const sock = new Socketeer(netMock, electronMock.app, timeoutMock)
		const ondata = spy(() => {})
		sock.startClient(ondata)
		connectionMock.callbacks["close"](false)
		timeoutMock.next()
		await Promise.resolve()
		o(connectionMock.on.callCount).equals(5)
		// cleanup
		// @ts-ignore
		electronMock.app.callbacks["will-quit"]()
		o(netMock.createServer.callCount).equals(0)
		o(netMock.createConnection.callCount).equals(1)
	})
	o("sendSocketMessage calls write", function () {
		const { electronMock, netMock } = standardMocks()
		const sock = new Socketeer(netMock, electronMock.app)
		const ondata = spy(() => {})
		sock.startClient(ondata)
		sock.sendSocketMessage({
			some: ["a", "b", "c"],
			stuff: 1337,
		})
		o(connectionMock.write.callCount).equals(1)
		o(connectionMock.write.args[0]).equals('{"some":["a","b","c"],"stuff":1337}')
		o(connectionMock.write.args[1]).equals("utf8")
		o(connectionMock.write.args.length).equals(2)
		// @ts-ignore
		electronMock.app.callbacks["will-quit"]()
	})
})
