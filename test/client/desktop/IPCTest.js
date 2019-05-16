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
        }
    }
    const conf = {}
    const notifier = {}
    const sse = {}
    let windowMock
    const wm = {
        get: () => windowMock
    }
    const sock = {}
    const err = {}
    const fs = {}
    const desktopUtils = {}
    const autoLauncher = {}
    const workerProtocol = {
        errorToObj: (err) => console.log(chalk.red.bold("ERROR:"), err.message),
        objToError: () => "this is an error"
    }

    const standardMocks = () => {
        windowMock = n.mock("__window", {
            id: 42,
            sendMessageToWebContents: () => {
            }
        }).set()
        return {
            electronMock: n.mock("electron", electron).set(),
            confMock: n.mock("__conf", conf).set(),
            notifierMock: n.mock("__notifier", notifier).set(),
            sseMock: n.mock("__sse", sse).set(),
            wmMock: n.mock("__wm", wm).set(),
            sockMock: n.mock("__sock", sock).set(),
            errMock: n.mock("./DesktopErrorHandler.js", err).set(),
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
})
