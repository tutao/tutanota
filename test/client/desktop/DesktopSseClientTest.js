// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"
import {numberRange} from '../../../src/api/common/utils/ArrayUtils.js'

o.spec("DesktopSseClient Test", () => {
    o.beforeEach(n.enable)
    o.afterEach(n.disable)
    o.specTimeout(6000)
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
        setDesktopConfig: (key: string, val: any) => {
        },
        get: (key: string) => {
            switch (key) {
                case 'initialSseConnectTimeoutInSeconds':
                    return 1
                case 'maxSseConnectTimeoutInSeconds':
                    return 10
                default:
                    throw new Error(`unexpected get key ${key}`)
            }
        }
    }

    const electron = {
        app: {
            callbacks: {},
            on: function (ev: string, cb: ()=>void) {
                this.callbacks[ev] = cb
                return n.spyify(electron.app)
            },
            getAppPath: () => "/app/path/",
        },
        net: {}
    }

    const notifier = {
        submitGroupedNotification: () => {
        }
    }

    const wm = {
        ipc: {},
        dl: {},
        getAll: () => {
            return [
                {
                    id: 1,
                    isFocused: () => true,
                    getUserId: () => "notYourId",
                    userInfo: {userId: "myId", mailAddress: "a@b.c"}
                }
            ]

        }
    }

    const crypto = {
        randomBytes: (len) => {
            const array = Uint8Array.from(numberRange(0, len - 1))
            return Buffer.from(array)
        }
    }

    const http = {
        request: () => {
            return new http.ClientRequest()
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
                setEncoding: function () {
                }
            },
            statics: {}
        })
    }

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

    o("start, connect, shutdown", done => {
        const {electronMock, confMock, notifierMock, wmMock, httpMock} = standardMocks()
        const {DesktopSseClient} = n.subject('../../src/desktop/DesktopSseClient.js')
        const sse = new DesktopSseClient(confMock, notifierMock, wmMock)

        sse.start()

        //wait for first and second connection attempt
        setTimeout(() => {
            o(httpMock.request.callCount).equals(2) // we timed out once
            o(httpMock.request.args[0]).equals('http://here.there/sse?_body=%7B%22_format%22%3A%220%22%2C%22identifier%22%3A%22identifier%22%2C%22userIds%22%3A%5B%7B%22_id%22%3A%22AAECAw%22%2C%22value%22%3A%22id1%22%7D%2C%7B%22_id%22%3A%22AAECAw%22%2C%22value%22%3A%22id2%22%7D%5D%7D')
            const res = new httpMock.Response(200)
            httpMock.ClientRequest.mockedInstances[1].callbacks['response'](res)
            o(sse._nextReconnect).notEquals(undefined)
            o(res.setEncoding.callCount).equals(1)
            o(res.setEncoding.args[0]).equals('utf8')

            //store new timeout value
            res.callbacks['data']("data: heartbeatTimeout:42")
            o(confMock.setDesktopConfig.callCount).equals(1)
            o(confMock.setDesktopConfig.args[0]).equals("heartbeatTimeoutInSeconds")
            o(confMock.setDesktopConfig.args[1]).equals(42)

            //check for reschedule on heartbeat
            let oldTimeout = sse._nextReconnect
            res.callbacks['data']("")
            o(sse._nextReconnect).notEquals(oldTimeout)

            // reschedule on connection close
            oldTimeout = sse._nextReconnect
            res.callbacks["close"]()
            o(sse._nextReconnect).notEquals(oldTimeout)

            //done
            res.callbacks['data']("data: heartbeatTimeout:1")
            electronMock.app.callbacks['will-quit']()
            o(httpMock.ClientRequest.mockedInstances[1].abort.callCount).equals(1)
            done()
        }, 3300)
    })

    o("reschedule on heartbeat timeout", done => {
        const {electronMock, confMock, notifierMock, wmMock, httpMock} = standardMocks()
        const {DesktopSseClient} = n.subject('../../src/desktop/DesktopSseClient.js')
        const sse = new DesktopSseClient(confMock, notifierMock, wmMock)
        let res = new httpMock.Response(200)
        let oldTimeout
        sse.start()

        setTimeout(() => {
            httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
            res.callbacks['data']("data: heartbeatTimeout:1")
            oldTimeout = sse._nextReconnect
        }, 1000)

        // heartbeat times out...

        setTimeout(() => {
            // should have rescheduled
            o(sse._nextReconnect).notEquals(oldTimeout)

            //done
            electronMock.app.callbacks['will-quit']()
            done()
        }, 4000)
    })

    o("403 response causes deletion of userids", done => {
        const {electronMock, confMock, notifierMock, wmMock, httpMock} = standardMocks()
        const {DesktopSseClient} = n.subject('../../src/desktop/DesktopSseClient.js')
        const sse = new DesktopSseClient(confMock, notifierMock, wmMock)
        let res = new httpMock.Response(403)
        sse.start()

        setTimeout(() => {
            httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
        }, 1000)

        setTimeout(() => {
            o(confMock.setDesktopConfig.callCount).equals(1)
            o(confMock.setDesktopConfig.args[0]).equals("pushIdentifier")
            o(confMock.setDesktopConfig.args[1]).equals(null)

            // done
            res.callbacks['data']("data: heartbeatTimeout:1")
            electronMock.app.callbacks['will-quit']()
            done()
        }, 2000)
    })

    o("invalid heartbeatTimeout from server is not saved", done => {
        const {electronMock, confMock, notifierMock, wmMock, httpMock} = standardMocks()
        const {DesktopSseClient} = n.subject('../../src/desktop/DesktopSseClient.js')
        const sse = new DesktopSseClient(confMock, notifierMock, wmMock)
        let res = new httpMock.Response(200)
        sse.start()

        setTimeout(() => {
            httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
        }, 1000)

        setTimeout(() => {
            res.callbacks['data']("data: heartbeatTimeout:42")
            res.callbacks['data']("data: heartbeatTimeout:baz")
        }, 1500)

        setTimeout(() => {
            o(sse._readTimeoutInSeconds).equals(42)

            // done
            res.callbacks['data']("data: heartbeatTimeout:1")
            electronMock.app.callbacks['will-quit']()
            done()
        }, 1600)
    })

    o("reschedule after receiving pushMessages", done => {
        const {electronMock, confMock, notifierMock, wmMock, httpMock} = standardMocks()
        const {DesktopSseClient} = n.subject('../../src/desktop/DesktopSseClient.js')
        const sse = new DesktopSseClient(confMock, notifierMock, wmMock)
        let res = new httpMock.Response(200)
        let oldTimeout
        sse.start()

        setTimeout(() => {
            httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
            res.callbacks['data']("data: heartbeatTimeout:1")
            oldTimeout = sse._nextReconnect
            res.callbacks["data"](`data: ${JSON.stringify({
                title: "pm-title",
                confirmationId: "confId",
                notificationInfos: []
            })}`)
        }, 1000)

        setTimeout(() => {
            // should have rescheduled
            o(sse._nextReconnect).notEquals(oldTimeout)
            //done
            electronMock.app.callbacks['will-quit']()
            done()
        }, 4000)
    })

    o("invalid pushMessages from server prevents reschedule", done => {
        const {electronMock, confMock, notifierMock, wmMock, httpMock} = standardMocks()
        const {DesktopSseClient} = n.subject('../../src/desktop/DesktopSseClient.js')
        const sse = new DesktopSseClient(confMock, notifierMock, wmMock)
        let res = new httpMock.Response(200)
        let oldTimeout
        sse.start()

        setTimeout(() => {
            httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
            res.callbacks['data']("data: heartbeatTimeout:3")
            oldTimeout = sse._nextReconnect
            res.callbacks["data"](`data: ${JSON.stringify({
                title: "pm-title"
            })}`)
            // should not have rescheduled
            o(sse._nextReconnect).equals(oldTimeout)
            //done
            electronMock.app.callbacks['will-quit']()
            done()
        }, 1000)
    })

    o("retry connection later if there is no sseInfo", done => {
        const {electronMock, notifierMock, wmMock, httpMock} = standardMocks()
        const confMock = n.mock("__conf", conf)
            .with({
                getDesktopConfig: (key: string) => {
                    switch (key) {
                        case 'pushIdentifier':
                            return null
                        case 'heartbeatTimeoutInSeconds':
                            return 30
                        default:
                            throw new Error(`unexpected getDesktopConfig key ${key}`)
                    }
                },
            }).set()
        const {DesktopSseClient} = n.subject('../../src/desktop/DesktopSseClient.js')
        const sse = new DesktopSseClient(confMock, notifierMock, wmMock)
        sse.start()
        const oldTimeout = sse._nextReconnect
        setTimeout(() => {
            o(sse._nextReconnect).notEquals(oldTimeout)

            //done
            electronMock.app.callbacks['will-quit']()
            done()
        }, 1000)
    })

    o("send notification for incoming pm", done => {
        const {electronMock, confMock, notifierMock, wmMock, httpMock} = standardMocks()
        const {DesktopSseClient} = n.subject('../../src/desktop/DesktopSseClient.js')
        const sse = new DesktopSseClient(confMock, notifierMock, wmMock)
        let res = new httpMock.Response(200)
        sse.start()

        setTimeout(() => {
            httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
            res.callbacks['data']("data: heartbeatTimeout:3")
            res.callbacks["data"](`data: ${JSON.stringify({
                title: "pm-title",
                confirmationId: "confId",
                notificationInfos: [
                    {
                        address: "me@here.com",
                        counter: 2,
                        userId: "someId"
                    }
                ]
            })}`)

            o(notifierMock.submitGroupedNotification.callCount).equals(1)
            o(notifierMock.submitGroupedNotification.args[0]).equals("pm-title")
            o(notifierMock.submitGroupedNotification.args[1]).equals("me@here.com (2)")
            o(notifierMock.submitGroupedNotification.args[2]).equals("someId")

            res.callbacks["data"](`data: ${JSON.stringify({
                title: "pm-title",
                confirmationId: "confId",
                notificationInfos: [
                    {
                        address: "me@here.com",
                        counter: 3,
                        userId: "someId"
                    },
                    {
                        address: "me2@here.com",
                        counter: 1,
                        userId: "someOtherId"
                    }
                ]
            })}`)

            o(notifierMock.submitGroupedNotification.callCount).equals(3)
            o(notifierMock.submitGroupedNotification.args[0]).equals("pm-title")
            o(notifierMock.submitGroupedNotification.args[1]).equals("me2@here.com (1)")
            o(notifierMock.submitGroupedNotification.args[2]).equals("someOtherId")

            //done
            res.callbacks['data']("data: heartbeatTimeout:1")
            electronMock.app.callbacks['will-quit']()
            done()
        }, 1500)
    })

    o("don't send notification for active window", done => {
        const {electronMock, confMock, notifierMock, wmMock, httpMock} = standardMocks()
        const {DesktopSseClient} = n.subject('../../src/desktop/DesktopSseClient.js')
        const sse = new DesktopSseClient(confMock, notifierMock, wmMock)
        let res = new httpMock.Response(200)
        sse.start()
        setTimeout(() => {
            httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
            res.callbacks['data']("data: heartbeatTimeout:3")
            res.callbacks["data"](`data: ${JSON.stringify({
                title: "pm-title",
                confirmationId: "confId",
                notificationInfos: [
                    {
                        address: "me@here.com",
                        counter: 2,
                        userId: "notYourId"
                    }
                ]
            })}`)

            o(notifierMock.submitGroupedNotification.callCount).equals(0)

            //done
            res.callbacks['data']("data: heartbeatTimeout:1")
            electronMock.app.callbacks['will-quit']()
            done()
        }, 1500)
    })

    o("throw errors on invalid pushMessage", () => {
        standardMocks()
        const {PushMessage} = n.subject('../../src/desktop/DesktopSseClient.js')

        o(() => PushMessage.fromJSON('[]')).throws("invalid push message title: undefined")
        o(() => PushMessage.fromJSON('{"title": 3}')).throws("invalid push message title: 3")
        o(() => PushMessage.fromJSON('{"title": false}')).throws("invalid push message title: false")
        o(() => PushMessage.fromJSON('{"title": []}')).throws("invalid push message title: ")
        o(() => PushMessage.fromJSON('{"title": {}}')).throws("invalid push message title: [object Object]")
        o(() => PushMessage.fromJSON('{"title": "this is a title"}')).notThrows("invalid push message title: this is a title")

        o(() => PushMessage.fromJSON('{"title": "t"}')).throws("invalid confirmation id: undefined")
        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":3}')).throws("invalid confirmation id: 3")
        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":false}')).throws("invalid confirmation id: false")
        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":[]}')).throws("invalid confirmation id: ")
        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":{}}')).throws("invalid confirmation id: [object Object]")
        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":"c"}')).notThrows("invalid confirmation id: c")

        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":"c"}')).throws("invalid notificationInfos: undefined")
        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":"c", "notificationInfos":3}')).throws("invalid notificationInfos: 3")
        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":"c", "notificationInfos":false}')).throws("invalid notificationInfos: false")
        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":"c", "notificationInfos":{}}')).throws("invalid notificationInfos: [object Object]")
        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":"c", "notificationInfos":"hello"}')).throws("invalid notificationInfos: hello")
        o(() => PushMessage.fromJSON('{"title": "t", "confirmationId":"c", "notificationInfos":[]}')).notThrows("invalid notificationInfos: ")

        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {address: "a@b.c", userId: "userId"}
            ]
        }))).throws("invalid counter: undefined")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: "hello", address: "a@b.c", userId: "userId"}
            ]
        }))).throws("invalid counter: hello")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: false, address: "a@b.c", userId: "userId"}
            ]
        }))).throws("invalid counter: false")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: {}, address: "a@b.c", userId: "userId"}
            ]
        }))).throws("invalid counter: [object Object]")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: [], address: "a@b.c", userId: "userId"}
            ]
        }))).throws("invalid counter: ")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: "a@b.c", userId: "userId"}
            ]
        }))).notThrows("invalid counter: 3")

        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, userId: "userId"}
            ]
        }))).throws("invalid address: undefined")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: "a@.c", userId: "userId"}
            ]
        }))).throws("invalid address: a@.c")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: [], userId: "userId"}
            ]
        }))).throws("invalid address: ")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: {}, userId: "userId"}
            ]
        }))).throws("invalid address: [object Object]")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: false, userId: "userId"}
            ]
        }))).throws("invalid address: false")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: 3, userId: "userId"}
            ]
        }))).throws("invalid address: 3")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: "a@b.c", userId: "userId"}
            ]
        }))).notThrows("invalid address: a@b.c")

        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: "a@b.c"}
            ]
        }))).throws("invalid userId: undefined")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: "a@b.c", userId: []}
            ]
        }))).throws("invalid userId: ")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: "a@b.c", userId: {}}
            ]
        }))).throws("invalid userId: [object Object]")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: "a@b.c", userId: false}
            ]
        }))).throws("invalid userId: false")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: "a@b.c", userId: 3}
            ]
        }))).throws("invalid userId: 3")
        o(() => PushMessage.fromJSON(JSON.stringify({
            title: "t",
            confirmationId: "id",
            notificationInfos: [
                {counter: 3, address: "a@b.c", userId: "userId"}
            ]
        }))).notThrows("invalid userId: userId")

    })
})
