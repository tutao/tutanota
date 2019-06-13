// @flow
import n from "../nodemocker"
import o from "ospec/ospec.js"
import chalk from 'chalk'

o.spec("IPC tests", () => {
    n.startGroup(__filename, [
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
        './Utils'
    ])

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
        dialog: {
            showOpenDialog: (e, opts, cb) => {
                cb(["a", "list", "of", "paths"])
            }
        }
    }
    const conf = {
        getDesktopConfig: () => {
            return {
                dummy: "value"
            }
        },
        setDesktopConfig: () => Promise.resolve()
    }
    const notifier = {
        resolveGroupedNotification: () => {
        }
    }
    const sse = {
        getPushIdentifier: () => "agarbledmess",
        storePushIdentifier: () => Promise.resolve()
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
    const autoLauncher = {
        isAutoLaunchEnabled: () => "noDoNot",
        enableAutoLaunch: () => Promise.resolve(),
        disableAutoLaunch: () => Promise.resolve()
    }
    const workerProtocol = {
        errorToObj: (err) => console.log(chalk.red.bold("ERROR:"), err.message),
        objToError: () => "this is an error"
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
            autoLauncherMock: n.mock("./autolaunch/AutoLauncher", autoLauncher).set(),
            workerProtocolMock: n.mock("../api/common/WorkerProtocol", workerProtocol).set(),
        }
    }

    o("addWindow & init & removeWindow", done => {
        n.setPlatform('minix') // init sends platform
        const {electronMock, confMock, notifierMock, sockMock, sseMock, wmMock} = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        o(electronMock.ipcMain.on.callCount).equals(1)
        o(electronMock.ipcMain.on.args[0]).equals("42")
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))
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
            o(electronMock.ipcMain.removeAllListeners.callCount).equals(1)
            o(electronMock.ipcMain.removeAllListeners.args[0]).equals("42")
            let threw = false
            ipc.initialized(42)
                .catch(() => threw = true)
                .then(() => o(threw).equals(true))
                .then(() => done())
        }, 10)
    })

    o("sendRequest", done => {
        const {electronMock, confMock, notifierMock, sockMock, sseMock, wmMock} = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

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
            electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
                type: 'response',
                id: request.id,
                value: ["some-response-value"]
            }))
        }, 10)
    })

    o("sendRequest with requestError response", done => {
        const {electronMock, confMock, notifierMock, sockMock, sseMock, wmMock} = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

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
            electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
                type: 'requestError',
                error: "error object",
                id: request.id
            }))
        }, 10)
    })

    o("findInPage & stopFindInPage", done => {
        const {electronMock, confMock, notifierMock, sockMock, sseMock, wmMock} = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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

            electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
                type: "stopFindInPage",
                id: "id3",
                args: []
            }))

        }, 10)

        setTimeout(() => {
            o(windowMock.sendMessageToWebContents.callCount).equals(3)
            o(windowMock.sendMessageToWebContents.args[0]).equals(42)
            o(windowMock.stopFindInPage.callCount).equals(1)
            o(windowMock.stopFindInPage.args[0]).equals(undefined)
            done()
        }, 30)
    })

    o("findInPage on destroyed window doesn't error out", done => {
        const {electronMock, confMock, notifierMock, sockMock, sseMock, wmMock} = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

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
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
            desktopUtilsMock
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

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

    o("sendDesktopConfig", done => {
        const {
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
            desktopUtilsMock,
            autoLauncherMock
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "sendDesktopConfig",
            id: "id2",
            args: []
        }))

        o(desktopUtilsMock.checkIsMailtoHandler.callCount).equals(1)
        o(autoLauncherMock.isAutoLaunchEnabled.callCount).equals(1)

        setTimeout(() => {
            o(windowMock.sendMessageToWebContents.callCount).equals(2)
            o(windowMock.sendMessageToWebContents.args[0]).equals(42)
            o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
                id: 'id2',
                type: 'response',
                value: {
                    dummy: "value",
                    isMailtoHandler: "yesItIs",
                    runOnStartup: "noDoNot"
                }
            })
            done()
        }, 10)
    })

    o("openFileChooser", done => {
        const {
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        // open file dialog gets ignored
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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

            electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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
        const {
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        // open file dialog gets ignored
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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
        const {
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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
        const {
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        ipc.addWindow(1337) // this will not get returned if wmMock gets asked for it
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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
        const {
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
            autoLauncherMock
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "enableAutoLaunch",
            id: "id2",
            args: []
        }))

        setTimeout(() => {
            o(autoLauncherMock.enableAutoLaunch.callCount).equals(1)
            o(autoLauncherMock.enableAutoLaunch.length).equals(0)
            o(windowMock.sendMessageToWebContents.callCount).equals(2)
            o(windowMock.sendMessageToWebContents.args[0]).equals(42)
            o(windowMock.sendMessageToWebContents.args[1]).deepEquals({
                id: 'id2',
                type: 'response',
                value: undefined
            })

            electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
                type: "disableAutoLaunch",
                id: "id3",
                args: []
            }))

        }, 10)

        setTimeout(() => {
            o(autoLauncherMock.disableAutoLaunch.callCount).equals(1)
            o(autoLauncherMock.disableAutoLaunch.args.length).equals(0)
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
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
            errMock,
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "storePushIdentifierLocally",
            id: "id2",
            args: ["identifier", "userId", "getHttpOrigin()"]
        }))

        setTimeout(() => {
            o(sseMock.storePushIdentifier.callCount).equals(1)
            o(sseMock.storePushIdentifier.args[0]).equals("identifier")
            o(sseMock.storePushIdentifier.args[1]).equals("userId")
            o(sseMock.storePushIdentifier.args[2]).equals("getHttpOrigin()")
            o(sseMock.storePushIdentifier.args.length).equals(3)

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
        const {
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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
        const {
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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
        const {
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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

    o("invalid method invocation gets rejected", done => {
        const {
            electronMock,
            confMock,
            notifierMock,
            fsExtraMock,
            sockMock,
            sseMock,
            wmMock,
        } = standardMocks()
        const {IPC} = n.subject('../../src/desktop/IPC.js')
        const ipc = new IPC(confMock, notifierMock, sseMock, wmMock, sockMock)

        ipc.addWindow(42)
        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
            type: "init",
            id: "id",
            value: []
        }))

        electronMock.ipcMain.callbacks["42"]({}, JSON.stringify({
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
})
