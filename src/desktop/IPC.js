// @flow
import {dialog, ipcMain} from 'electron'
import type {WindowManager} from "./DesktopWindowManager.js"
import {err} from './DesktopErrorHandler.js'
import {defer} from '../api/common/utils/Utils.js'
import type {DeferredObject} from "../api/common/utils/Utils"
import {errorToObj, objToError} from "../api/common/WorkerProtocol"
import DesktopUtils from "../desktop/DesktopUtils"
import type {DesktopConfigHandler} from "./DesktopConfigHandler"
import {disableAutoLaunch, enableAutoLaunch, isAutoLaunchEnabled} from "./autolaunch/AutoLauncher"
import type {DesktopSseClient} from './DesktopSseClient.js'
import type {DesktopNotifier} from "./DesktopNotifier"
import type {Socketeer} from "./Socketeer"

/**
 * node-side endpoint for communication between the renderer thread and the node thread
 */
export class IPC {
    _conf: DesktopConfigHandler;
    _sse: DesktopSseClient;
    _wm: WindowManager;
    _notifier: DesktopNotifier;
    _sock: Socketeer;

    _initialized: Array<DeferredObject<void>>;
    _requestId: number = 0;
    _queue: { [string]: Function };

    constructor(conf: DesktopConfigHandler, notifier: DesktopNotifier, sse: DesktopSseClient, wm: WindowManager, sock: Socketeer) {
        this._conf = conf
        this._sse = sse
        this._wm = wm
        this._notifier = notifier
        this._sock = sock

        this._initialized = []
        this._queue = {}
    }

    _invokeMethod(windowId: number, method: NativeRequestType, args: Array<Object>): Promise<any> {
        const d = defer()

        switch (method) {
            case 'init':
                if (!this.initialized(windowId).isFulfilled()) {
                    this._initialized[windowId].resolve()
                }
                d.resolve(process.platform);
                break
            case 'findInPage':
                this.initialized(windowId).then(() => {
                    const w = this._wm.get(windowId)
                    if (w) {
                        w.findInPage(args).then(r => d.resolve(r))
                    } else {
                        d.resolve({numberOfMatches: 0, currentMatch: 0})
                    }
                })
                break
            case 'stopFindInPage':
                this.initialized(windowId).then(() => {
                    const w = this._wm.get(windowId)
                    if (w) {
                        w.stopFindInPage()
                    }
                })
                d.resolve()
                break
            case 'registerMailto':
                DesktopUtils
                    .registerAsMailtoHandler(true)
                    .then(() => {
                        d.resolve()
                    })
                    .catch(e => {
                        d.reject(e)
                    })
                break
            case 'unregisterMailto':
                DesktopUtils
                    .unregisterAsMailtoHandler(true)
                    .then(() => {
                        d.resolve()
                    })
                    .catch(e => {
                        d.reject(e)
                    })
                break
            case 'sendDesktopConfig':
                Promise.join(
                    DesktopUtils.checkIsMailtoHandler(),
                    isAutoLaunchEnabled(),
                    (isMailtoHandler, autoLaunchEnabled) => {
                        const config = this._conf.getDesktopConfig()
                        config.isMailtoHandler = isMailtoHandler
                        config.runOnStartup = autoLaunchEnabled
                        return config
                    }).then((config) => d.resolve(config))
                break
            case 'openFileChooser':
                if (args[1]) { // open folder dialog
                    dialog.showOpenDialog(null, {properties: ['openDirectory']}, paths => {
                        d.resolve(paths ? paths : [])
                    })
                } else { // open file
                    d.resolve([])
                }
                break
            case 'updateDesktopConfig':
                this._conf.setDesktopConfig('any', args[0]).then(() => d.resolve())
                break
            case 'openNewWindow':
                this._wm.newWindow(true)
                d.resolve()
                break
            case 'showWindow':
                this.initialized(windowId).then(() => {
                    const w = this._wm.get(windowId)
                    if (w) {
                        w.show()
                    }
                }).then(() => d.resolve())
                break
            case 'enableAutoLaunch':
                enableAutoLaunch().then(() => d.resolve())
                break
            case 'disableAutoLaunch':
                disableAutoLaunch().then(() => d.resolve())
                break
            case 'getPushIdentifier':
                const uInfo = {
                    userId: args[0].toString(),
                    mailAddress: args[1].toString()
                }
                // we know there's a logged in window
                //first, send error report if there is one
                err.sendErrorReport(windowId)
                    .then(() => {
                        const w = this._wm.get(windowId)
                        if (!w) return
                        w.setUserInfo(uInfo)
                        if (!w.isHidden()) {
                            this._notifier.resolveGroupedNotification(uInfo.userId)
                        }
                    })
                    .then(() => d.resolve(this._sse.getPushIdentifier()))
                break
            case 'storePushIdentifierLocally':
                this._sse.storePushIdentifier(args[0].toString(), args[1].toString(), args[2].toString())
                    .then(() => d.resolve())
                break
            case 'initPushNotifications':
                // no need to react, we start push service with node
                d.resolve()
                break
            case 'closePushNotifications':
                // TODO
                break
            case 'sendSocketMessage':
                this._sock.sendSocketMessage(args[0])
                d.resolve()
                break
            default:
                d.reject(new Error(`Invalid Method invocation: ${method}`))
                break
        }

        return d.promise
    }

    sendRequest(windowId: number, type: JsRequestType, args: Array<any>): Promise<Object> {
        return this.initialized(windowId).then(() => {
            const requestId = this._createRequestId();
            const request = {
                id: requestId,
                type: type,
                args: args,
            }
            const w = this._wm.get(windowId)
            if (w) {
                w.sendMessageToWebContents(windowId, request)
            }
            return Promise.fromCallback(cb => {
                this._queue[requestId] = cb
            });
        })
    }

    _createRequestId(): string {
        if (this._requestId >= Number.MAX_SAFE_INTEGER) {
            this._requestId = 0
        }
        return "desktop" + this._requestId++
    }

    initialized(windowId: number): Promise<void> {
        if (this._initialized[windowId]) {
            return this._initialized[windowId].promise
        } else {
            return Promise.reject(new Error("Tried to call ipc function on nonexistent window"))
        }
    }

    addWindow(id: number) {
        this._initialized[id] = defer()
        ipcMain.on(`${id}`, (ev: Event, msg: string) => {
            const request = JSON.parse(msg)
            if (request.type === "response") {
                this._queue[request.id](null, request.value);
            } else if (request.type === "requestError") {
                this._queue[request.id](objToError((request: any).error), null)
                delete this._queue[request.id]
            } else {
                const w = this._wm.get(id)
                this._invokeMethod(id, request.type, request.args)
                    .then(result => {
                        const response = {
                            id: request.id,
                            type: "response",
                            value: result,
                        }
                        if (w) w.sendMessageToWebContents(id, response)
                    })
                    .catch((e) => {
                        const response = {
                            id: request.id,
                            type: "requestError",
                            error: errorToObj(e),
                        }
                        if (w) w.sendMessageToWebContents(id, response)
                    })
            }
        })
    }

    removeWindow(id: number) {
        ipcMain.removeAllListeners(`${id}`)
        delete this._initialized[id]
    }
}
