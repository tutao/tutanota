// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"

o.spec("DesktopDownloadManagerTest", () => {
	n.startGroup({
		group: __filename, allowables: [
			"../api/common/utils/Utils.js", './Utils',
			"../api/common/utils/Utils",
			"path",
			'./TutanotaConstants',
			'./utils/Utils',
			'./EntityConstants',
			'../EntityFunctions',
			'./StringUtils',
			'./utils/ArrayUtils',
			'./MapUtils',
			'./Utils',
			'../TutanotaConstants',
			'./utils/Encoding',
			'../error/CryptoError',
			'./TutanotaError'
		]
	})

	const conf = {
		removeListener: (key: string, cb: ()=>void) => n.spyify(conf),
		on: (key: string) => n.spyify(conf),
		getDesktopConfig: (key: string) => {
			switch (key) {
				case "defaultDownloadPath":
					return "/a/download/path/"
				default:
					throw new Error(`unexpected getDesktopConfig key ${key}`)
			}
		},
		setDesktopConfig: (key: string, val: any) => {
		},
		get: (key: string) => {
			switch (key) {
				case "fileManagerTimeout":
					return 30
				default:
					throw new Error(`unexpected get key ${key}`)
			}
		}
	}

	const electron = {
		dialog: {
			showMessageBox: () => {
			},
		},
		shell: {
			openItem: () => {
			}
		},
		app: {
			getPath: () => "/some/path/"

		}
	}

	const session = {
		callbacks: {},
		removeAllListeners: function () {
			this.callbacks = {}
			return this
		},
		on: function (ev, cb) {
			this.callbacks[ev] = cb
			return this
		}
	}

	const net = {
		request: url => {
			return new net.ClientRequest()
		},
		ClientRequest: n.classify({
			prototype: {
				callbacks: {},
				on: function (ev, cb) {
					this.callbacks[ev] = cb
					return this
				},
				end: function () {
					return this
				},
				abort: function () {
				},
			},
			statics: {}
		}),
		Response: n.classify({
			prototype: {
				constructor: function (statusCode) {
					this.statusCode = statusCode
				},
				callbacks: {},
				on: function (ev, cb) {
					this.callbacks[ev] = cb
					return this
				},
				setEncoding: function (enc) {
				},
				destroy: function () {}
			},
			statics: {}
		})
	}

	const item = {
		callbacks: {},
		savePath: "NOT SET!",
		on: function (ev, cb) {
			this.callbacks[ev] = cb
			return this
		},
		getFilename: () => "/this/is/a-file.name",
	}

	const fs = {
		readdirSync: (path) => [],
		closeSync: () => {
		},
		openSync: () => {
		},
		mkdirp: () => Promise.resolve(),
		writeFile: () => Promise.resolve()
	}

	const lang = {
		lang: {
			get: (key) => key
		}
	}
	const desktopUtils = {
		nonClobberingFilename: (name) => "nonClobbering",
		touch: (path) => {}
	}

	const standardMocks = () => {
		return {
			netMock: n.mock("__net", net).set(),
			confMock: n.mock("__conf", conf).set(),
			electronMock: n.mock("electron", electron).set(),
			fsMock: n.mock("fs-extra", fs).set(),
			desktopUtilsMock: n.mock("./DesktopUtils", desktopUtils).set(),
			langMock: n.mock('../misc/LanguageViewModel', lang).set()
		}
	}

	o("no default download path => do nothing", () => {
		const {electronMock, netMock} = standardMocks()
		const confMock = n.mock("__conf", conf).with({
			getDesktopConfig: (key) => {
				switch (key) {
					case "defaultDownloadPath":
						return null
					default:
						throw new Error(`unexpected getDesktopConfig key ${key}`)
				}
			}
		}).set()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)
		const sessionMock = n.mock("__session", session).set()
		dl.manageDownloadsForSession(sessionMock)
		o(sessionMock.removeAllListeners.callCount).equals(1)
		o(sessionMock.removeAllListeners.args[0]).equals("will-download")
		o(sessionMock.on.callCount).equals(1)
		o(sessionMock.on.args[0]).equals("will-download")
		// no args so we throw when DownloadManager tries to do any work.
		sessionMock.callbacks["will-download"]()
		o(electronMock.dialog.showMessageBox.callCount).equals(0)
	})

	o("with default download path", () => {
		const {electronMock, desktopUtilsMock, confMock, netMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)
		const sessionMock = n.mock("__session", session).set()
		const itemMock = n.mock("__item", item).set()
		dl.manageDownloadsForSession(sessionMock)
		sessionMock.callbacks["will-download"]({}, itemMock)
		o(desktopUtilsMock.nonClobberingFilename.callCount).equals(1)
		o(itemMock.savePath).equals("/a/download/path/nonClobbering")

		itemMock.callbacks["done"]({}, 'completed')
		o(electronMock.shell.openItem.callCount).equals(1)
		o(electronMock.shell.openItem.args[0]).equals("/a/download/path")

		// make sure nothing failed
		o(electronMock.dialog.showMessageBox.callCount).equals(0)
	})

	o("two downloads, open two filemanagers", done => {
		const {electronMock, desktopUtilsMock, confMock, netMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)
		const sessionMock = n.mock("__session", session).set()
		const itemMock = n.mock("__item", item).set()
		dl.manageDownloadsForSession(sessionMock)

		sessionMock.callbacks["will-download"]({}, itemMock)
		o(desktopUtilsMock.nonClobberingFilename.callCount).equals(1)
		o(itemMock.savePath).equals("/a/download/path/nonClobbering")

		itemMock.callbacks["done"]({}, 'completed')
		o(electronMock.shell.openItem.callCount).equals(1)
		o(electronMock.shell.openItem.args[0]).equals("/a/download/path")

		setTimeout(() => {
			sessionMock.callbacks["will-download"]({}, itemMock)
			o(desktopUtilsMock.nonClobberingFilename.callCount).equals(2)
			o(itemMock.savePath).equals("/a/download/path/nonClobbering")

			itemMock.callbacks["done"]({}, 'completed')
			o(electronMock.shell.openItem.callCount).equals(2)
			o(electronMock.shell.openItem.args[0]).equals("/a/download/path")

			// make sure nothing failed
			o(electronMock.dialog.showMessageBox.callCount).equals(0)
			done()
		}, 60)
	})

	o("only open one file manager for successive downloads", () => {
		const {electronMock, desktopUtilsMock, confMock, netMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)
		const sessionMock = n.mock("__session", session).set()
		const itemMock = n.mock("__item", item).set()
		const itemMock2 = n.mock("__item", item).set()
		dl.manageDownloadsForSession(sessionMock)
		sessionMock.callbacks["will-download"]({}, itemMock)
		sessionMock.callbacks["will-download"]({}, itemMock2)
		itemMock.callbacks["done"]({}, 'completed')
		itemMock2.callbacks["done"]({}, 'completed')

		o(electronMock.shell.openItem.callCount).equals(1)
		o(electronMock.shell.openItem.args[0]).equals("/a/download/path")

		// make sure nothing failed
		o(electronMock.dialog.showMessageBox.callCount).equals(0)
	})

	o("download interrupted shows error box", () => {
		const {electronMock, desktopUtilsMock, confMock, netMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)
		const sessionMock = n.mock("__session", session).set()
		const itemMock = n.mock("__item", item).set()
		dl.manageDownloadsForSession(sessionMock)
		sessionMock.callbacks["will-download"]({}, itemMock)
		o(desktopUtilsMock.nonClobberingFilename.callCount).equals(1)
		o(itemMock.savePath).equals("/a/download/path/nonClobbering")

		itemMock.callbacks["done"]({}, 'interrupted')

		o(electronMock.shell.openItem.callCount).equals(0)
		o(electronMock.dialog.showMessageBox.callCount).equals(1)
	})

	o("downloadNative", done => {
		const {electronMock, desktopUtilsMock, confMock, netMock, fsMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)
		const res = new netMock.Response(200)
		const dlPromise = dl.downloadNative("some://url/file", "nativelyDownloadedFile", {header1: "foo", header2: "bar"})
		netMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
		res.callbacks["data"](Buffer.from("data1"))
		res.callbacks["data"](Buffer.from("data2"))
		res.callbacks["end"]()
		dlPromise.then(() => {
			o(netMock.request.callCount).equals(1)
			o(netMock.request.args.length).equals(2)
			o(netMock.request.args[0]).equals("some://url/file")
			o(netMock.request.args[1]).deepEquals({
				method: 'GET',
				headers: {header1: 'foo', header2: 'bar'},
				timeout: 20000
			})
			o(netMock.ClientRequest.mockedInstances.length).equals(1)
			o(fsMock.writeFile.callCount).equals(1)
			o(fsMock.writeFile.args.length).equals(3)
			o(fsMock.writeFile.args[0]).equals('/some/path/tuta/nativelyDownloadedFile')
			o(Buffer.from("data1data2").includes(fsMock.writeFile.args[1])).equals(true)
			o(fsMock.writeFile.args[1].length).equals(Buffer.from("data1data2").length)
			o(fsMock.writeFile.args[2]).deepEquals({encoding: 'binary'})
		}).then(() => done())
	})
})
