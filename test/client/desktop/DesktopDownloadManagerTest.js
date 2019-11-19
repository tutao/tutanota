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
		}
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
			confMock: n.mock("__conf", conf).set(),
			electronMock: n.mock("electron", electron).set(),
			fsMock: n.mock("fs", fs).set(),
			desktopUtilsMock: n.mock("./DesktopUtils", desktopUtils).set(),
			langMock: n.mock('../misc/LanguageViewModel', lang).set()
		}
	}

	o("no default download path => do nothing", () => {
		const {electronMock} = standardMocks()
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
		const dl = new DesktopDownloadManager(confMock)
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
		const {electronMock, desktopUtilsMock, confMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock)
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
		const {electronMock, desktopUtilsMock, confMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock)
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
		const {electronMock, desktopUtilsMock, confMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock)
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
		const {electronMock, desktopUtilsMock, confMock} = standardMocks()
		const {DesktopDownloadManager} = n.subject('../../src/desktop/DesktopDownloadManager.js')
		const dl = new DesktopDownloadManager(confMock)
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
})
