// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"

const DEFAULT_DOWNLOAD_PATH = "/a/download/path/"

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
			'./TutanotaError',
			'../api/common/error/FileOpenError'
		]
	})

	const conf = {
		removeListener: (key: string, cb: ()=>void) => n.spyify(conf),
		on: (key: string) => n.spyify(conf),
		getDesktopConfig: (key: string) => {
			switch (key) {
				case "defaultDownloadPath":
					return DEFAULT_DOWNLOAD_PATH
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
			showMessageBox: () => Promise.resolve({response: 1}),
		},
		shell: {
			openPath: (path) => Promise.resolve(path !== "invalid" ? "" : 'invalid path')
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
				destroy: function (e) {this.callbacks['error'](e)},
				pipe: function () {}
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

	const WriteStream = n.classify({
		prototype: {
			callbacks: {},
			on: function (ev, cb) {
				this.callbacks[ev] = cb
				return this
			},
			close: function () {
				this.callbacks['close']()
			},
			removeAllListeners: function (ev) {
				this.callbacks[ev] = () => {}
				return this
			},
			end: function () {
				this.callbacks['finish']()
			}
		}, statics: {}
	})

	const fs = {
		readdirSync: (path) => [],
		closeSync: () => {
		},
		openSync: () => {
		},
		mkdirp: () => Promise.resolve(),
		writeFile: () => Promise.resolve(),
		createWriteStream: () => new WriteStream(),
		existsSync: (path) => path === DEFAULT_DOWNLOAD_PATH,
		unlink: () => {
			return Promise.resolve()
		}
	}

	const lang = {
		lang: {
			get: (key) => key
		}
	}
	const desktopUtils = {
		nonClobberingFilename: (name) => "nonClobbering",
		touch: (path) => {},
		looksExecutable: p => p === "exec"
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

	o("no default download path => don't assign save path", () => {
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
		const itemMock = n.spyify({on: () => {}})
		sessionMock.callbacks["will-download"](undefined, itemMock)
		o(itemMock.on.callCount).equals(1)
		o(electronMock.dialog.showMessageBox.callCount).equals(0)
	})

	o("with default download path", function () {
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
		o(electronMock.shell.openPath.callCount).equals(1)
		o(electronMock.shell.openPath.args[0]).equals("/a/download/path")

		// make sure nothing failed
		o(electronMock.dialog.showMessageBox.callCount).equals(0)
	})

	o("with default download path but it doesn't exist", function () {
		const {electronMock, desktopUtilsMock, confMock, netMock} = standardMocks()
		n.mock("fs-extra", fs).with({
			existsSync: () => false,
		}).set()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)
		const sessionMock = n.mock("__session", session).set()
		dl.manageDownloadsForSession(sessionMock)
		o(sessionMock.removeAllListeners.callCount).equals(1)
		o(sessionMock.removeAllListeners.args[0]).equals("will-download")
		o(sessionMock.on.callCount).equals(1)
		o(sessionMock.on.args[0]).equals("will-download")
		const itemMock = n.spyify({on: () => {}})
		sessionMock.callbacks["will-download"](undefined, itemMock)
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
		o(electronMock.shell.openPath.callCount).equals(1)
		o(electronMock.shell.openPath.args[0]).equals("/a/download/path")

		setTimeout(() => {
			sessionMock.callbacks["will-download"]({}, itemMock)
			o(desktopUtilsMock.nonClobberingFilename.callCount).equals(2)
			o(itemMock.savePath).equals("/a/download/path/nonClobbering")

			itemMock.callbacks["done"]({}, 'completed')
			o(electronMock.shell.openPath.callCount).equals(2)
			o(electronMock.shell.openPath.args[0]).equals("/a/download/path")

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

		o(electronMock.shell.openPath.callCount).equals(1)
		o(electronMock.shell.openPath.args[0]).equals("/a/download/path")

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

		o(electronMock.shell.openPath.callCount).equals(0)
		o(electronMock.dialog.showMessageBox.callCount).equals(1)
	})

	o("downloadNative, no error", done => {
		const {electronMock, desktopUtilsMock, confMock, netMock, fsMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)
		const res = new netMock.Response(200)
		const dlPromise = dl.downloadNative("some://url/file", "nativelyDownloadedFile", {header1: "foo", header2: "bar"})
		netMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
		const ws = WriteStream.mockedInstances[0]
		ws.callbacks['finish']()
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
			o(fsMock.createWriteStream.callCount).equals(1)
			o(fsMock.createWriteStream.args.length).equals(2)
			o(fsMock.createWriteStream.args[0]).equals('/some/path/tuta/nativelyDownloadedFile')
			o(fsMock.createWriteStream.args[1]).deepEquals({emitClose: true})

			o(res.pipe.callCount).equals(1)
			o(res.pipe.args[0]).deepEquals(ws)

		}).then(() => done())
	})

	o("downloadNative, error gets cleaned up", done => {
		const {confMock, netMock, fsMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)
		const res = new netMock.Response(404)
		const dlPromise = dl.downloadNative("some://url/file", "nativelyDownloadedFile", {header1: "foo", header2: "bar"})
		netMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
		const ws = WriteStream.mockedInstances[0]
		ws.callbacks['finish']()
		dlPromise.then(() => o("").equals(3)).catch(e => {
			o(e).equals(404)
			o(fsMock.createWriteStream.callCount).equals(1)
			o(ws.on.callCount).equals(2)
			o(ws.removeAllListeners.callCount).equals(2)
			o(ws.removeAllListeners.args[0]).equals('close')
			o(fsMock.unlink.callCount).equals(1)
		}).then(() => done())
	})

	o("open", done => {
		const {electronMock, confMock, netMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)

		dl.open("/some/folder/file").then(() => {

			o(electronMock.shell.openPath.callCount).equals(1)
			o(electronMock.shell.openPath.args.length).equals(1)
			o(electronMock.shell.openPath.args[0]).equals("/some/folder/file")
		})
		  .then(() => dl.open("invalid"))
		  .then(() => o(false).equals(true))
		  .catch(() => {
			  o(electronMock.shell.openPath.callCount).equals(2)
			  o(electronMock.shell.openPath.args.length).equals(1)
			  o(electronMock.shell.openPath.args[0]).equals("invalid")
		  })
		  .then(() => done())
	})

	o("open on windows", done => {
		n.setPlatform("win32")
		const {electronMock, confMock, netMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock, netMock)

		dl.open("exec").then(() => {
			o(electronMock.dialog.showMessageBox.callCount).equals(1)
			o(electronMock.shell.openPath.callCount).equals(0)
			done()
		})
	})
})