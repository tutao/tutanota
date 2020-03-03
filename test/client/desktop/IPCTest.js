// @flow
import n from "../nodemocker"
import o from "ospec/ospec.js"
import chalk from 'chalk'
import {defer} from "../../../src/api/common/utils/Utils"
import {DesktopConfigKey} from "../../../src/desktop/DesktopConfigHandler"

o.spec("IPC tests", () => {
	const CALLBACK_ID = "42"

	n.startGroup({
		group: __filename, allowables: [
			"../Env",
			'../api/common/utils/Utils.js',
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
		]
	})

	const electron = {
		ipcMain: {
			callbacks: {},
			removeAllListeners: function (ev) {
				delete this.callbacks[ev]
			},
			on: function (ev, cb) {
				this.callbacks[ev] = cb
				return this
			}
		},
		app: {
			quit: () => {},
		},
		dialog: {
			showOpenDialog: (e, opts) => Promise.resolve({filePaths: ["a", "list", "of", "paths"]})
		},
		shell: {
			openItem: file => file === "/file/to/open"
		}
	}
	const conf = {
		getDesktopConfig: () => {
			return {
				dummy: "value"
			}
		},
		setDesktopConfig: () => Promise.resolve(),
		listeners: {},
		on: function (key, listener) {
			this.listeners[key] = this.listeners[key] || []
			this.listeners[key].push(listener)
		},
	}
	const notifier = {
		resolveGroupedNotification: () => {
		}
	}
	const sse = {
		getPushIdentifier: () => ({identifier: "agarbledmess", userIds: ["userId1"]}),
		storePushIdentifier: () => Promise.resolve(),
		hasNotificationTTLExpired: () => false,
		connect: () => null,
	}
	let windowMock
	const wm = {
		get: id => id === 42 ? windowMock : null,
		newWindow: () => {
		}
	}
	const sock = {
		sendSocketMessage: () => {
		}
	}
	const err = {
		sendErrorReport: () => Promise.resolve()
	}
	const fs = {}
	const desktopUtils = {
		registerAsMailtoHandler: () => {
			return Promise.resolve()
		},
		unregisterAsMailtoHandler: () => {
			return Promise.resolve()
		},
		checkIsMailtoHandler: () => Promise.resolve("yesItIs")
	}
	const crypto = {
		aesDecryptFile: (key, file) => key === "decryption_key"
			? Promise.resolve(file)
			: Promise.reject("decryption error")
	}
	const dl = {
		downloadNative: (url, file) => file === "filename" ? Promise.resolve() : Promise.reject("DL error"),
		open: (file) => file === "/file/to/open" ? Promise.resolve() : Promise.reject("Could not open!")
	}
	const desktopIntegrator = {
		isAutoLaunchEnabled: () => "noDoNot",
		enableAutoLaunch: () => Promise.resolve(),
		disableAutoLaunch: () => Promise.resolve(),
		isIntegrated: () => Promise.resolve(true),
		integrate: () => Promise.resolve(),
		unintegrate: () => Promise.resolve(),
	}
	const workerProtocol = {
		errorToObj: (err) => console.log(chalk.red.bold("ERROR:"), err.message),
		objToError: () => "this is an error"
	}

	const alarmStorage = {
		storePushIdentifierSessionKey: () => {}
	}

	const utils = {
		noOp: () => {},
		downcast: a => a,
		defer: defer,
	}

	const standardMocks = () => {
		windowMock = n.mock("__window", {
			id: 42,
			sendMessageToWebContents: () => {
			},
			findInPage: () => {
				return {
					then: cb => cb({numberOfMatches: 37, currentMatch: 13})
				}
			},
			stopFindInPage: () => {

			},
			show: () => {
			},
			setSearchOverlayState: () => {},
			setUserInfo: () => {
			},
			isHidden: () => false
		}).set()
		return {
			electronMock: n.mock("electron", electron).set(),
			confMock: n.mock("__conf", conf).set(),
			notifierMock: n.mock("__notifier", notifier).set(),
			sseMock: n.mock("__sse", sse).set(),
			wmMock: n.mock("__wm", wm).set(),
			sockMock: n.mock("__sock", sock).set(),
			errMock: n.mock("./DesktopErrorHandler.js", {err}).set(),
			fsExtraMock: n.mock("fs-extra", fs).set(),
			desktopUtilsMock: n.mock("../desktop/DesktopUtils", desktopUtils).set(),
			desktopIntegratorMock: n.mock("./integration/DesktopIntegrator", desktopIntegrator).set(),
			workerProtocolMock: n.mock("../api/common/WorkerProtocol", workerProtocol).set(),
			alarmStorageMock: n.mock("__alarmStorage", alarmStorage).set(),
			cryptoMock: n.mock("./DesktopCryptoFacade", crypto).set(),
			dlMock: n.mock("__dl", dl).set(),
			utilsMock: n.mock("../api/common/utils/Utils", utils).set()
		}
	}

	const setUpWithWindowAndInit = () => {
		const sm = standardMocks()
		const {electronMock, confMock, notifierMock, sockMock, sseMock, wmMock, alarmStorageMock, cryptoMock, dlMock} = sm
		const {IPC} = n.subject('../../src/desktop/IPC.js')
		const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock, alarmStorageMock, cryptoMock, dlMock)

		ipc.addWindow(42)
		o(electronMock.ipcMain.on.callCount).equals(1)
		o(electronMock.ipcMain.on.args[0]).equals(CALLBACK_ID)
		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "init",
			id: "id",
			value: []
		}))

		return Object.assign({}, sm, {ipc})
	}

	o("addWindow & init & removeWindow", function (done) {
		n.setPlatform('minix') // init sends platform
		const {ipc, electronMock} = setUpWithWindowAndInit()
		o(ipc.initialized(42).isFulfilled()).equals(true)

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(1)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id',
				type: 'response',
				value: 'minix' // there it is
			})

			ipc.removeWindow(42)
			// one call to clear when adding window, one when removing
			o(electronMock.ipcMain.removeAllListeners.callCount).equals(1)
			o(electronMock.ipcMain.removeAllListeners.args[0]).equals(CALLBACK_ID)
			let threw = false
			ipc.initialized(42)
			   .catch(() => threw = true)
			   .then(() => o(threw).equals(true))
			   .then(() => done())
		}, 10)
	})

	o("sendRequest", done => {
		const {ipc, electronMock} = setUpWithWindowAndInit()

		ipc.sendRequest(42, 'some-request-type', ["nothing", "useful"])
		   .then((resp) => {
			   // IPC put the value into resolve
			   o(resp).deepEquals(["some-response-value"])
			   done()
		   })

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			const request = windowMock.sendMessageToWebContents.args[1]
			o(request.type).equals("some-request-type")
			o(request.args).deepEquals(["nothing", "useful"])

			//simulate the window answering
			electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
				type: 'response',
				id: request.id,
				value: ["some-response-value"]
			}))
		}, 10)
	})

	o("sendRequest with requestError response", done => {
		const {ipc, electronMock} = setUpWithWindowAndInit()

		ipc.sendRequest(42, 'some-request-type', ["nothing", "useful"])
		   .catch(Error, e => {
			   o(e.message).equals("this is an error")
			   done()
		   })

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			const request = windowMock.sendMessageToWebContents.args[1]
			o(request.type).equals("some-request-type")
			o(request.args).deepEquals(["nothing", "useful"])

			//simulate the window answering
			electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
				type: 'requestError',
				error: "error object",
				id: request.id
			}))
		}, 10)
	})

	o("findInPage, setSearchOverlayState & stopFindInPage", done => {
		const {electronMock} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "findInPage",
			id: "id2",
			args: ["hello"]
		}))

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.findInPage.callCount).equals(1)
			o(windowMock.findInPage.args[0]).deepEquals(["hello"])
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: {numberOfMatches: 37, currentMatch: 13}// there it is
			})

			electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
				type: "setSearchOverlayState",
				id: "id3",
				args: [true, false]
			}))

		}, 10)

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(3)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id3',
				type: 'response',
				value: undefined
			})
			o(windowMock.setSearchOverlayState.callCount).equals(1)
			o(windowMock.setSearchOverlayState.args[0]).equals(true)
			o(windowMock.setSearchOverlayState.args[1]).equals(false)

			electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
				type: "stopFindInPage",
				id: "id4",
				args: []
			}))

		}, 20)

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(4)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.stopFindInPage.callCount).equals(1)
			o(windowMock.stopFindInPage.args[0]).equals(undefined)
			done()
		}, 30)
	})

	o("findInPage on destroyed window doesn't error out", done => {
		const {ipc, electronMock} = setUpWithWindowAndInit()

		ipc.addWindow(1337)
		electronMock.ipcMain.callbacks["1337"]({}, JSON.stringify({
			type: "init",
			id: "id",
			value: []
		}))

		electronMock.ipcMain.callbacks["1337"]({}, JSON.stringify({
			type: "findInPage",
			id: "id2",
			args: ["hello"]
		}))

		setTimeout(() => {
			electronMock.ipcMain.callbacks["1337"]({}, JSON.stringify({
				type: "stopFindInPage",
				id: "id3",
				args: []
			}))

		}, 10)

		setTimeout(() => {
			done()
		}, 30)
	})

	o("register & unregister mailto", done => {
		const {
			ipc,
			electronMock,
			desktopUtilsMock,
		} = setUpWithWindowAndInit()

		ipc.addWindow(1337)
		electronMock.ipcMain.callbacks["1337"]({}, JSON.stringify({
			type: "init",
			id: "id",
			value: []
		}))

		electronMock.ipcMain.callbacks["1337"]({}, JSON.stringify({
			type: "registerMailto",
			id: "id2",
			args: []
		}))

		o(desktopUtilsMock.registerAsMailtoHandler.callCount).equals(1)
		o(desktopUtilsMock.registerAsMailtoHandler.args[0]).equals(true)
		setTimeout(() => {
			electronMock.ipcMain.callbacks["1337"]({}, JSON.stringify({
				type: "unregisterMailto",
				id: "id3",
				args: []
			}))

			o(desktopUtilsMock.unregisterAsMailtoHandler.callCount).equals(1)
			o(desktopUtilsMock.registerAsMailtoHandler.args[0]).equals(true)
			done()
		}, 10)
	})

	o("integrate & unintegrate desktop", done => {
		const {
			ipc,
			electronMock,
			desktopIntegratorMock,
		} = setUpWithWindowAndInit()

		ipc.addWindow(1337)
		electronMock.ipcMain.callbacks["1337"]({}, JSON.stringify({
			type: "init",
			id: "id",
			value: []
		}))

		electronMock.ipcMain.callbacks["1337"]({}, JSON.stringify({
			type: "integrateDesktop",
			id: "id2",
			args: []
		}))

		o(desktopIntegratorMock.integrate.callCount).equals(1)
		o(desktopIntegratorMock.integrate.args[0]).equals(undefined)
		setTimeout(() => {
			electronMock.ipcMain.callbacks["1337"]({}, JSON.stringify({
				type: "unIntegrateDesktop",
				id: "id3",
				args: []
			}))

			o(desktopIntegratorMock.unintegrate.callCount).equals(1)
			o(desktopIntegratorMock.unintegrate.args[0]).equals(undefined)
			done()
		}, 10)
	})

	o("sendDesktopConfig", done => {
		const {
			electronMock,
			desktopUtilsMock,
			desktopIntegratorMock,
		} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "sendDesktopConfig",
			id: "id2",
			args: []
		}))

		o(desktopUtilsMock.checkIsMailtoHandler.callCount).equals(1)
		o(desktopIntegratorMock.isAutoLaunchEnabled.callCount).equals(1)

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: {
					dummy: "value",
					isMailtoHandler: "yesItIs",
					runOnStartup: "noDoNot",
					isIntegrated: true,
				}
			})
			done()
		}, 10)
	})

	o("openFileChooser", done => {
		const {electronMock} = setUpWithWindowAndInit()

		// open file dialog gets ignored
		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "openFileChooser",
			id: "id2",
			args: [false]
		}))

		o(electronMock.dialog.showOpenDialog.callCount).equals(0)

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: []
			})

			electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
				type: "openFileChooser",
				id: "id3",
				args: [true, true]
			}))

		}, 10)

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(3)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id3',
				type: 'response',
				value: ["a", "list", "of", "paths"]
			})

			done()
		}, 20)
	})

	o("updateDesktopConfig", done => {
		const {electronMock, confMock} = setUpWithWindowAndInit()

		// open file dialog gets ignored
		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "updateDesktopConfig",
			id: "id2",
			args: [{more: "stuff"}]
		}))

		o(confMock.setDesktopConfig.callCount).equals(1)
		o(confMock.setDesktopConfig.args[0]).equals("any")
		o(confMock.setDesktopConfig.args[1]).deepEquals({
			more: "stuff"
		})

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: undefined
			})
			done()
		}, 10)
	})

	o("openNewWindow", done => {
		const {electronMock, wmMock} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "openNewWindow",
			id: "id2",
			args: []
		}))

		o(wmMock.newWindow.callCount).equals(1)
		o(wmMock.newWindow.args[0]).equals(true)
		o(wmMock.newWindow.args.length).equals(1)

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: undefined
			})
			done()
		}, 10)
	})

	o("showWindow", done => {
		const {ipc, electronMock} = setUpWithWindowAndInit()

		ipc.addWindow(1337) // this will not get returned if wmMock gets asked for it

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "showWindow",
			id: "id2",
			args: []
		}))

		// this one will get ignored because the window went AWOL
		electronMock.ipcMain.callbacks["1337"]({}, JSON.stringify({
			type: "showWindow",
			id: "id3",
			args: []
		}))

		setTimeout(() => {
			o(windowMock.show.callCount).equals(1)
			o(windowMock.show.args.length).equals(0)
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: undefined
			})
			done()
		}, 10)
	})

	o("enableAutoLaunch & disableAutoLaunch", done => {
		const {electronMock, desktopIntegratorMock} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "enableAutoLaunch",
			id: "id2",
			args: []
		}))

		setTimeout(() => {
			o(desktopIntegratorMock.enableAutoLaunch.callCount).equals(1)
			o(desktopIntegratorMock.enableAutoLaunch.length).equals(0)
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: undefined
			})

			electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
				type: "disableAutoLaunch",
				id: "id3",
				args: []
			}))

		}, 10)

		setTimeout(() => {
			o(desktopIntegratorMock.disableAutoLaunch.callCount).equals(1)
			o(desktopIntegratorMock.disableAutoLaunch.args.length).equals(0)
			o(windowMock.sendMessageToWebContents.callCount).equals(3)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id3',
				type: 'response',
				value: undefined
			})

			done()
		}, 20)
	})

	o("getPushIdentifier", done => {
		const {
			electronMock,
			notifierMock,
			errMock,
		} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "getPushIdentifier",
			id: "id2",
			args: ["idFromWindow", "mailAddressFromWindow"]
		}))

		setTimeout(() => {
			o(errMock.err.sendErrorReport.callCount).equals(1)
			o(errMock.err.sendErrorReport.args[0]).equals(42)
			o(errMock.err.sendErrorReport.args.length).equals(1)

			o(windowMock.isHidden.callCount).equals(1)
			o(windowMock.isHidden.args.length).equals(0)

			o(notifierMock.resolveGroupedNotification.callCount).equals(1)
			o(notifierMock.resolveGroupedNotification.args[0]).equals("idFromWindow")
			o(notifierMock.resolveGroupedNotification.args.length).equals(1)

			o(windowMock.setUserInfo.callCount).equals(1)
			o(windowMock.setUserInfo.args[0]).deepEquals({
				userId: "idFromWindow",
				mailAddress: "mailAddressFromWindow"
			})
			o(windowMock.setUserInfo.args.length).equals(1)

			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: 'agarbledmess'
			})
			done()
		}, 10)
	})

	o("storePushIdentifierLocally", done => {
		const {
			electronMock,
			sseMock,
			alarmStorageMock,
		} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "storePushIdentifierLocally",
			id: "id2",
			args: ["identifier", "userId", "getHttpOrigin()", "pushIdentifierElementId", "skB64"]
		}))

		setTimeout(() => {
			o(sseMock.storePushIdentifier.callCount).equals(1)
			o(sseMock.storePushIdentifier.args[0]).equals("identifier")
			o(sseMock.storePushIdentifier.args[1]).equals("userId")
			o(sseMock.storePushIdentifier.args[2]).equals("getHttpOrigin()")
			o(sseMock.storePushIdentifier.args[3]).equals(undefined)
			o(sseMock.storePushIdentifier.args.length).equals(3)

			o(alarmStorageMock.storePushIdentifierSessionKey.callCount).equals(1)

			o(alarmStorageMock.storePushIdentifierSessionKey.args[0]).equals("pushIdentifierElementId")
			o(alarmStorageMock.storePushIdentifierSessionKey.args[1]).equals("skB64")

			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: undefined
			})
			done()
		}, 10)
	})

	o("initPushNotifications", done => {
		const {electronMock} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "initPushNotifications",
			id: "id2",
			args: []
		}))

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: undefined
			})
			done()
		}, 10)
	})

	o("closePushNotifications", done => {
		const {electronMock} = setUpWithWindowAndInit()
		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "closePushNotifications",
			id: "id2",
			args: []
		}))

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: undefined
			})
			done()
		}, 10)
	})

	o("sendSocketMessage", done => {
		const {electronMock, sockMock} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "sendSocketMessage",
			id: "id2",
			args: ["thisIsASocketMessage"]
		}))

		setTimeout(() => {
			o(sockMock.sendSocketMessage.callCount).equals(1)
			o(sockMock.sendSocketMessage.args[0]).equals("thisIsASocketMessage")
			o(sockMock.sendSocketMessage.args.length).equals(1)

			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'response',
				value: undefined
			})
			done()
		}, 10)
	})

	o("closeApp", done => {
		const {electronMock} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
			type: "closeApp",
			id: "id2",
			args: []
		}))

		setTimeout(() => {
			o(electronMock.app.quit.callCount).equals(1)
			done()
		}, 10)
	})

	o("open", done => {
		const {electronMock, dlMock} = setUpWithWindowAndInit()

		setTimeout(() => {
			electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
				type: "open",
				id: "id2",
				args: ["/file/to/open", "text/plain"]
			}))
		}, 10)

		setTimeout(() => {
			o(dlMock.open.callCount).equals(1)
			o(dlMock.open.args[0]).equals("/file/to/open")

			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args).deepEquals([42, {id: 'id2', type: 'response', value: undefined}])

			electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
				type: "open",
				id: "id3",
				args: ["/some/invalid/path", "text/plain"]
			}))

		}, 20)

		setTimeout(() => {
			o(dlMock.open.callCount).equals(2)
			o(dlMock.open.args[0]).equals("/some/invalid/path")
			o(windowMock.sendMessageToWebContents.callCount).equals(3)
			o(windowMock.sendMessageToWebContents.args).deepEquals([42, {id: 'id3', type: 'requestError', error: undefined}])
			done()
		}, 30)
	})

	o("download", done => {
		const {electronMock, dlMock} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "download",
			id: "id2",
			args: ["url://file/to/download", "filename", {one: "somevalue", two: "anothervalue"}]
		}))

		setTimeout(() => {
			o(dlMock.downloadNative.callCount).equals(1)
			o(dlMock.downloadNative.args).deepEquals(['url://file/to/download', 'filename', {one: 'somevalue', two: 'anothervalue'}])
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args).deepEquals([42, {id: 'id2', type: 'response', value: undefined}])

			electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
				type: "download",
				id: "id3",
				args: ["url://file/to/download", "invalid", {one: "somevalue", two: "anothervalue"}]
			}))
		}, 10)

		setTimeout(() => {
			o(dlMock.downloadNative.callCount).equals(2)
			o(dlMock.downloadNative.args).deepEquals(['url://file/to/download', 'invalid', {one: 'somevalue', two: 'anothervalue'}])
			o(windowMock.sendMessageToWebContents.callCount).equals(3)
			o(windowMock.sendMessageToWebContents.args).deepEquals([42, {id: 'id3', type: 'requestError', error: undefined}])
			done()
		}, 20)
	})

	o("aesDecryptFile", done => {
			const {electronMock, cryptoMock} = setUpWithWindowAndInit()

			electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
				type: "aesDecryptFile",
				id: "id2",
				args: ["decryption_key", "/a/path/to/a/blob"]
			}))

			setTimeout(() => {
				o(cryptoMock.aesDecryptFile.callCount).equals(1)
				o(cryptoMock.aesDecryptFile.args).deepEquals(['decryption_key', '/a/path/to/a/blob'])

				o(windowMock.sendMessageToWebContents.callCount).equals(2)
				o(windowMock.sendMessageToWebContents.args).deepEquals([42, {id: 'id2', type: 'response', value: '/a/path/to/a/blob'}])
				electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
					type: "aesDecryptFile",
					id: "id3",
					args: ["invalid_decryption_key", "/a/path/to/a/blob"]
				}))
			}, 10)

			setTimeout(() => {
				o(cryptoMock.aesDecryptFile.callCount).equals(2)
				o(cryptoMock.aesDecryptFile.args).deepEquals(['invalid_decryption_key', '/a/path/to/a/blob'])

				o(windowMock.sendMessageToWebContents.callCount).equals(3)
				o(windowMock.sendMessageToWebContents.args).deepEquals([42, {id: 'id3', type: 'requestError', error: undefined}])
				done()
			}, 20)
		}
	)

	o("invalid method invocation gets rejected", done => {
		const {electronMock} = setUpWithWindowAndInit()

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "invalid",
			id: "id2",
			args: [1, 2, 3]
		}))

		setTimeout(() => {
			o(windowMock.sendMessageToWebContents.callCount).equals(2)
			o(windowMock.sendMessageToWebContents.args[0]).equals(42)
			o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
				id: 'id2',
				type: 'requestError',
				error: undefined
			})
			done()
		}, 10)
	})

	o("invalidate alarms", async function () {
		const {confMock} = setUpWithWindowAndInit()
		await Promise.resolve()
		const sseInfo = {userIds: []}
		confMock.listeners[DesktopConfigKey.pushIdentifier][0](sseInfo)

		await Promise.resolve()
		o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
			id: 'desktop0',
			type: 'invalidateAlarms',
			args: []
		})
	})

	o("unload", function () {
		const {ipc, electronMock} = setUpWithWindowAndInit()
		o(ipc.initialized(CALLBACK_ID).isFulfilled()).equals(true)

		electronMock.ipcMain.callbacks[CALLBACK_ID]({}, JSON.stringify({
			type: "unload",
			id: "id2",
			args: []
		}))

		o(ipc.initialized(CALLBACK_ID).isFulfilled()).equals(false)
	})
})
