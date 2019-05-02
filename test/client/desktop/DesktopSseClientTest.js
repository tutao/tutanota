// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"

o.spec("DesktopSseClient Test", () => {
    o.beforeEach(n.enable)
    o.afterEach(n.disable)

    n.allow([
        '../api/Env',
        '../misc/FormatValidator',
        '../api/common/utils/StringUtils',
        '../api/common/error/SseError',
        '../api/common/utils/Encoding'
    ])

    const conf = {
        removeListener: (key: string, cb: ()=>void) => n.spyify(conf),
        on: (key: string) => n.spyify(conf),
        getDesktopConfig: (key: string) => {
            switch (key) {
                case 'pushIdentifier':
                    return {
                        identifier: 'identifier',
                        sseOrigin: 'http://here.there',
                        userIds: ["id1", "id2"]
                    }
                case 'heartbeatTimeoutInSeconds':
                    return 30
                default:
                    throw new Error(`unexpected getDesktopConfig key ${key}`)
            }
        },
        get: (key: string) => {
            switch (key) {
                case 'initialSseConnectTimeoutInSeconds':
                    return 10
                case 'maxSseConnectTimeoutInSeconds':
                    return 1200
                default:
                    throw new Error(`unexpected get key ${key}`)
            }
        }
    }

    const electron = {
        app: {
            callbacks: [],
            on: function (ev: string, cb: ()=>void) {
                this.callbacks[ev] = cb
                return n.spyify(electron.app)
            },
            getAppPath: () => "/app/path/",
        },
        net: {}
    }

    const notifier = {}

    const wm = {
        ipc: {},
        dl: {},
    }

    const crypto = {}
    const http = {}

    const standardMocks = () => {
        // node modules
        const electronMock = n.mock("electron", electron).set()
        const httpMock = n.mock("http", http).set()
        const httpsMock = n.mock("https", http).set()
        const cryptoMock = n.mock("crypto", crypto).set()

        // our modules
        const notifierMock = n.mock("./DesktopNotifier.js", notifier).set()
        // const desktopTrayMock = n.mock("./DesktopTray.js", {DesktopTray: {getIcon: () => "this is an icon"}}).set()
        // const langMock = n.mock("./DesktopLocalizationProvider.js", lang).set()

        // instances
        const confMock = n.mock("__conf", conf).set()
        const wmMock = n.mock('__wm', wm).set()

        return {
            electronMock,
            confMock,
            notifierMock,
            wmMock,
            httpMock,
            httpsMock,
            cryptoMock
        }
    }

    o("construction", () => {
        const {electronMock, confMock, notifierMock, wmMock} = standardMocks()

        const {DesktopSseClient} = n.subject('../../src/desktop/DesktopSseClient.js')
        const sse = new DesktopSseClient(confMock, notifierMock, wmMock)

        o(electronMock.app.on.callCount).equals(1)
    })
})
