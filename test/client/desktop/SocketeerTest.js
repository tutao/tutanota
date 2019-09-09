// @flow
import n from "../nodemocker"
import o from "ospec/ospec.js"

o.spec("Socketeer Test", (done, timeout) => {
	n.startGroup(__filename, [
		'../api/common/utils/Utils',
		'../TutanotaConstants',
		'./utils/Utils',
		'../EntityFunctions',
		'./utils/Encoding',
		'../error/CryptoError',
		'./TutanotaError',
		'./StringUtils',
		'./EntityConstants',
		'./utils/Utils',
		'./utils/ArrayUtils',
		'./Utils',
		'./MapUtils',
	], 2000)

	const electron = {
		app: {
			callbacks: {},
			on: function (ev: string, cb: ()=>void) {
				this.callbacks[ev] = cb
				return n.spyify(electron.app)
			},
			dock: {
				show: () => {
				},
				setMenu: () => {
				},
				isVisible: () => false,
			}
		},
	}

	let serverMock
	let connectionMock
	const net = {
		createServer: connectionHandler => {
			serverMock.connectionHandler = connectionHandler
			return serverMock
		},
		createConnection: () => connectionMock
	}

	const standardMocks = () => {
		serverMock = n.mock("__server", {
			connectionHandler: (connection: any) => {
			},
			callbacks: {},
			on: function (ev: string, cb: ()=>void) {
				this.callbacks[ev] = cb
				return serverMock
			},
			listen: () => {
			},
			close: () => {
			}
		}).set()
		connectionMock = n.mock("__connection", {
			callbacks: {},
			on: function (ev: string, cb: ()=>void) {
				this.callbacks[ev] = cb
				return connectionMock
			},
			write: () => {
			},
			end: () => {
			}
		}).set()
		return {
			netMock: n.mock("net", net).set(),
			electronMock: n.mock("electron", electron).set(),
		}
	}

	o("startServer & cleanup", () => {
		const {electronMock, netMock} = standardMocks()
		const {Socketeer} = n.subject('../../src/desktop/Socketeer.js')
		const sock = new Socketeer()

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
			to: "send"
		})

		//check correct sending
		o(connectionMock.write.callCount).equals(1)
		o(connectionMock.write.args[0]).equals('{"some":"data","to":"send"}')
		o(connectionMock.write.args[1]).equals('utf8')
		o(connectionMock.write.args.length).equals(2)

		// cleanup
		electronMock.app.callbacks["will-quit"]()

		o(serverMock.listen.callCount).equals(1)
		o(serverMock.listen.args[0]).equals("/tmp/tutadb.sock")
		o(serverMock.listen.args.length).equals(1)

		o(serverMock.close.callCount).equals(1)
		o(serverMock.close.args.length).equals(0)
	})

	o("startClient & cleanup", () => {
		const {electronMock, netMock} = standardMocks()
		const {Socketeer} = n.subject('../../src/desktop/Socketeer.js')
		const sock = new Socketeer()

		const ondata = o.spy(data => {
		})

		const ondata2 = o.spy(data => {

		})

		sock.startClient(ondata)
		sock.startClient(ondata2) // ignored

		// check setup
		o(netMock.createConnection.callCount).equals(1)
		o(connectionMock.on.callCount).equals(5)

		// check callbacks
		o(typeof (connectionMock.callbacks['connect'])).equals('function')
		o(typeof (connectionMock.callbacks['error'])).equals('function')

		//receive data
		connectionMock.callbacks['data']('somedata')

		o(ondata.callCount).equals(1)
		o(ondata.args[0]).equals("somedata")
		o(ondata.args.length).equals(1)
		o(ondata2.callCount).equals(0)

		// cleanup
		electronMock.app.callbacks["will-quit"]()

		o(netMock.createServer.callCount).equals(0)
		o(netMock.createConnection.callCount).equals(1)
	})

	o("reconnect on end", done => {
		const {electronMock, netMock} = standardMocks()
		const {Socketeer} = n.subject('../../src/desktop/Socketeer.js')
		const sock = new Socketeer()
		const ondata = o.spy(data => {
		})

		sock.startClient(ondata)

		connectionMock.callbacks['end']()

		setTimeout(() => {
			o(connectionMock.on.callCount).equals(10)

			// cleanup
			electronMock.app.callbacks["will-quit"]()

			o(netMock.createServer.callCount).equals(0)
			o(netMock.createConnection.callCount).equals(2)

			done()
		}, 1500)
	})

	o("reconnect on close with error", done => {
		const {electronMock, netMock} = standardMocks()
		const {Socketeer} = n.subject('../../src/desktop/Socketeer.js')
		const sock = new Socketeer()
		const ondata = o.spy(data => {
		})

		sock.startClient(ondata)

		connectionMock.callbacks['close'](true)

		setTimeout(() => {
			o(connectionMock.on.callCount).equals(10)

			// cleanup
			electronMock.app.callbacks["will-quit"]()

			o(netMock.createServer.callCount).equals(0)
			o(netMock.createConnection.callCount).equals(2)

			done()
		}, 1500)
	})

	o("don't reconnect on close without error", done => {
		const {electronMock, netMock} = standardMocks()
		const {Socketeer} = n.subject('../../src/desktop/Socketeer.js')
		const sock = new Socketeer()
		const ondata = o.spy(data => {
		})

		sock.startClient(ondata)

		connectionMock.callbacks['close'](false)

		setTimeout(() => {
			o(connectionMock.on.callCount).equals(5)

			// cleanup
			electronMock.app.callbacks["will-quit"]()

			o(netMock.createServer.callCount).equals(0)
			o(netMock.createConnection.callCount).equals(1)

			done()
		}, 1500)
	})

	o("sendSocketMessage calls write", () => {
		const {electronMock, netMock} = standardMocks()
		const {Socketeer} = n.subject('../../src/desktop/Socketeer.js')
		const sock = new Socketeer()
		const ondata = o.spy(data => {
		})

		sock.startClient(ondata)

		sock.sendSocketMessage({some: ["a", "b", "c"], stuff: 1337})

		o(connectionMock.write.callCount).equals(1)
		o(connectionMock.write.args[0]).equals('{"some":["a","b","c"],"stuff":1337}')
		o(connectionMock.write.args[1]).equals("utf8")
		o(connectionMock.write.args.length).equals(2)

		electronMock.app.callbacks["will-quit"]()
	})

})
