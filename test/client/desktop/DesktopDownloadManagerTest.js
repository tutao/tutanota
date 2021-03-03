// @flow
import o from "ospec"
import n from "../nodemocker"
import {DesktopDownloadManager} from "../../../src/desktop/DesktopDownloadManager"
import {lang} from "../../../src/misc/LanguageViewModel"
// $FlowIgnore[untyped-import]
import en from "../../../src/translations/en"

const DEFAULT_DOWNLOAD_PATH = "/a/download/path/"
lang.init({en})

o.spec("DesktopDownloadManagerTest", function () {
	let conf
	let session
	let item
	let WriteStream
	let fs
	const standardMocks = () => {
		conf = {
			removeListener: (key: string, cb: ()=>void) => n.spyify(conf),
			on: (key: string) => n.spyify(conf),
			getVar: (key: string) => {
				switch (key) {
					case "defaultDownloadPath":
						return DEFAULT_DOWNLOAD_PATH
					default:
						throw new Error(`unexpected getVar key ${key}`)
				}
			},
			setVar: (key: string, val: any) => {
			},
			getConst: (key: string) => {
				switch (key) {
					case "fileManagerTimeout":
						return 30
					default:
						throw new Error(`unexpected getConst key ${key}`)
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

		session = {
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

		item = {
			callbacks: {},
			savePath: "NOT SET!",
			on: function (ev, cb) {
				this.callbacks[ev] = cb
				return this
			},
			getFilename: () => "/this/is/a-file?.name",
		}

		WriteStream = n.classify({
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

		fs = {
			readdirSync: (path) => [],
			closeSync: () => {
			},
			openSync: () => {
			},
			mkdir: () => Promise.resolve(),
			writeFile: () => Promise.resolve(),
			createWriteStream: () => new WriteStream(),
			existsSync: (path) => path === DEFAULT_DOWNLOAD_PATH,
			mkdirSync: () => {},
			promises: {
				unlink: () => Promise.resolve()
			}
		}

		const lang = {
			get: (key) => key
		}
		const desktopUtils = {
			touch: (path) => {},
		}

		return {
			netMock: n.mock("__net", net).set(),
			confMock: n.mock("__conf", conf).set(),
			electronMock: n.mock("electron", electron).set(),
			fsMock: n.mock("fs-extra", fs).set(),
			desktopUtilsMock: n.mock("./DesktopUtils", desktopUtils).set(),
			langMock: n.mock('../misc/LanguageViewModel', lang).set()
		}
	}

	function makeMockedDownloadManager({electronMock, desktopUtilsMock, confMock, netMock, fsMock, langMock}) {
		return new DesktopDownloadManager(confMock, netMock, desktopUtilsMock, fsMock, electronMock)
	}

	o("no default download path => don't assign save path", async function () {
		const mocks = standardMocks()
		mocks.confMock = n.mock("__conf", conf).with({
			getVar: (key) => {
				switch (key) {
					case "defaultDownloadPath":
						return null
					default:
						throw new Error(`unexpected getVar key ${key}`)
				}
			}
		}).set()

		const dl = makeMockedDownloadManager(mocks)
		const sessionMock = n.mock("__session", session).set()
		dl.manageDownloadsForSession(sessionMock)
		o(sessionMock.removeAllListeners.callCount).equals(1)
		o(sessionMock.removeAllListeners.args[0]).equals("will-download")
		o(sessionMock.on.callCount).equals(1)
		o(sessionMock.on.args[0]).equals("will-download")
		const itemMock = n.spyify({on: () => {}})
		sessionMock.callbacks["will-download"](undefined, itemMock)
		o(itemMock.on.callCount).equals(1)
		o(mocks.electronMock.dialog.showMessageBox.callCount).equals(0)
	})

	o("with default download path", async function () {
		const mocks = standardMocks()

		const dl = makeMockedDownloadManager(mocks)
		const sessionMock = n.mock("__session", session).set()
		const itemMock = n.mock("__item", item).set()
		dl.manageDownloadsForSession(sessionMock)
		sessionMock.callbacks["will-download"]({}, itemMock)
		o(itemMock.savePath).equals("/a/download/path/a-file_.name")

		itemMock.callbacks["done"]({}, 'completed')
		o(mocks.electronMock.shell.openPath.callCount).equals(1)
		o(mocks.electronMock.shell.openPath.args[0]).equals("/a/download/path")

		// make sure nothing failed
		o(mocks.electronMock.dialog.showMessageBox.callCount).equals(0)
	})

	o("with default download path but it doesn't exist", async function () {
		const mocks = standardMocks()
		mocks.fsMock = n.mock("fs-extra", fs).with({
			existsSync: () => false,
		}).set()

		const dl = makeMockedDownloadManager(mocks)
		const sessionMock = n.mock("__session", session).set()
		dl.manageDownloadsForSession(sessionMock)
		o(sessionMock.removeAllListeners.callCount).equals(1)
		o(sessionMock.removeAllListeners.args[0]).equals("will-download")
		o(sessionMock.on.callCount).equals(1)
		o(sessionMock.on.args[0]).equals("will-download")
		const itemMock = n.spyify({on: () => {}})
		sessionMock.callbacks["will-download"](undefined, itemMock)
		o(mocks.electronMock.dialog.showMessageBox.callCount).equals(0)
	})

	o("two downloads, open two filemanagers", async function () {
		const mocks = standardMocks()

		const dl = makeMockedDownloadManager(mocks)
		const sessionMock = n.mock("__session", session).set()
		const itemMock = n.mock("__item", item).set()
		dl.manageDownloadsForSession(sessionMock)

		sessionMock.callbacks["will-download"]({}, itemMock)
		o(itemMock.savePath).equals("/a/download/path/a-file_.name")

		itemMock.callbacks["done"]({}, 'completed')
		o(mocks.electronMock.shell.openPath.callCount).equals(1)
		o(mocks.electronMock.shell.openPath.args[0]).equals("/a/download/path")

		await Promise.delay(60)
		sessionMock.callbacks["will-download"]({}, itemMock)
		o(itemMock.savePath).equals("/a/download/path/a-file_.name")

		itemMock.callbacks["done"]({}, 'completed')
		o(mocks.electronMock.shell.openPath.callCount).equals(2)
		o(mocks.electronMock.shell.openPath.args[0]).equals("/a/download/path")

		// make sure nothing failed
		o(mocks.electronMock.dialog.showMessageBox.callCount).equals(0)
	})

	o("only open one file manager for successive downloads", async function () {
		const mocks = standardMocks()
		const dl = makeMockedDownloadManager(mocks)
		const sessionMock = n.mock("__session", session).set()
		const itemMock = n.mock("__item", item).set()
		const itemMock2 = n.mock("__item", item).set()
		dl.manageDownloadsForSession(sessionMock)
		sessionMock.callbacks["will-download"]({}, itemMock)
		sessionMock.callbacks["will-download"]({}, itemMock2)
		itemMock.callbacks["done"]({}, 'completed')
		itemMock2.callbacks["done"]({}, 'completed')

		o(mocks.electronMock.shell.openPath.callCount).equals(1)
		o(mocks.electronMock.shell.openPath.args[0]).equals("/a/download/path")

		// make sure nothing failed
		o(mocks.electronMock.dialog.showMessageBox.callCount).equals(0)
	})

	o("download interrupted shows error box", async function () {
		const mocks = standardMocks()
		const dl = makeMockedDownloadManager(mocks)
		const sessionMock = n.mock("__session", session).set()
		const itemMock = n.mock("__item", item).set()
		dl.manageDownloadsForSession(sessionMock)
		sessionMock.callbacks["will-download"]({}, itemMock)
		o(itemMock.savePath).equals("/a/download/path/a-file_.name")

		itemMock.callbacks["done"]({}, 'interrupted')

		o(mocks.electronMock.shell.openPath.callCount).equals(0)
		o(mocks.electronMock.dialog.showMessageBox.callCount).equals(1)
	})

	o("downloadNative, no error", async function () {
		const mocks = standardMocks()
		const dl = makeMockedDownloadManager(mocks)
		const res = new mocks.netMock.Response(200)
		const dlPromise = dl.downloadNative("some://url/file", "nativelyDownloadedFile", {v: "foo", accessToken: "bar"})
		// delay so that dl can set up it's callbacks on netMock before we try to access them
		await Promise.delay(5)
		mocks.netMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
		const ws = WriteStream.mockedInstances[0]
		ws.callbacks['finish']()
		await dlPromise
		o(mocks.netMock.request.callCount).equals(1)
		o(mocks.netMock.request.args.length).equals(2)
		o(mocks.netMock.request.args[0]).equals("some://url/file")
		o(mocks.netMock.request.args[1]).deepEquals({
			method: 'GET',
			headers: {v: "foo", accessToken: "bar"},
			timeout: 20000
		})
		o(mocks.netMock.ClientRequest.mockedInstances.length).equals(1)
		o(mocks.fsMock.createWriteStream.callCount).equals(1)
		o(mocks.fsMock.createWriteStream.args.length).equals(2)
		o(mocks.fsMock.createWriteStream.args[0]).equals('/some/path/tutanota/download/nativelyDownloadedFile')
		o(mocks.fsMock.createWriteStream.args[1]).deepEquals({emitClose: true})

		o(res.pipe.callCount).equals(1)
		o(res.pipe.args[0]).deepEquals(ws)
	})

	o("downloadNative, error gets cleaned up", async function () {
		const mocks = standardMocks()

		const dl = makeMockedDownloadManager(mocks)
		const res = new mocks.netMock.Response(404)
		const dlPromise = dl.downloadNative("some://url/file", "nativelyDownloadedFile", {v: "foo", accessToken: "bar"})
		await Promise.delay(5)
		mocks.netMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
		const ws = WriteStream.mockedInstances[0]
		ws.callbacks['finish']()
		return dlPromise
			.then(() => o("").equals(3))
			.catch(e => {
				o(e).equals(404)
				o(mocks.fsMock.createWriteStream.callCount).equals(1)
				o(ws.on.callCount).equals(2)
				o(ws.removeAllListeners.callCount).equals(2)
				o(ws.removeAllListeners.args[0]).equals('close')
				o(mocks.fsMock.promises.unlink.callCount).equals(1)
			})
	})

	o("open", async function () {
		const mocks = standardMocks()

		const dl = makeMockedDownloadManager(mocks)

		return dl.open("/some/folder/file").then(() => {

			o(mocks.electronMock.shell.openPath.callCount).equals(1)
			o(mocks.electronMock.shell.openPath.args.length).equals(1)
			o(mocks.electronMock.shell.openPath.args[0]).equals("/some/folder/file")
		})
		         .then(() => dl.open("invalid"))
		         .then(() => o(false).equals(true))
		         .catch(() => {
			         o(mocks.electronMock.shell.openPath.callCount).equals(2)
			         o(mocks.electronMock.shell.openPath.args.length).equals(1)
			         o(mocks.electronMock.shell.openPath.args[0]).equals("invalid")
		         })
	})

	o("open on windows", async function () {
		n.setPlatform("win32")
		const mocks = standardMocks()
		const dl = makeMockedDownloadManager(mocks)
		await dl.open("exec.exe")
		o(mocks.electronMock.dialog.showMessageBox.callCount).equals(1)
		o(mocks.electronMock.shell.openPath.callCount).equals(0)
	})
})

