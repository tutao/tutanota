// @flow
import {ipcMain} from 'electron'
import {MainWindow} from './MainWindow'
import {defer} from '../api/common/utils/Utils.js'
import type {DeferredObject} from "../api/common/utils/Utils"
import {errorToObj} from "../api/common/WorkerProtocol"
import DesktopUtils from "../desktop/DesktopUtils"

/**
 * node-side endpoint for communication between the renderer thread and the node thread
 */
class IPC {
	_initialized: DeferredObject<void>;
	_requestId: number = 0;
	_queue: {[string]: Function};
	_window: MainWindow;

	_send = () => console.log("ipc not initialized!")
	_on = () => console.log("ipc not initialized!")
	_once = () => console.log("ipc not initialized!")

	constructor() {
		this._initialized = defer()
		this._queue = {}
	}

	init(window: MainWindow) {
		if (this.initialized().isFulfilled()) {
			this._initialized = defer()
		}
		this._send = (...args: any) => window._browserWindow.webContents.send.apply(window._browserWindow.webContents, args)
		this._on = (...args: any) => ipcMain.on.apply(ipcMain, args)
		this._once = (...args: any) => ipcMain.once.apply(ipcMain, args)
		this._window = window

		ipcMain.on('show-window', () => {
			window.show()
		})

		/**
		 * main communication channel between renderer and node thread.
		 * see WorkerProtocol.js and NativeWrapper.js
		 */
		ipcMain.on('protocol-message', (ev: Event, msg: string) => {
			this._handleMessage(JSON.parse(msg))
		})

		this._initialized.promise.then(() => {
			window._browserWindow.webContents.send('print-argv', process.argv)
		})
	}

	_handleMessage(request: Object) {
		if (request.type === "response") {
			this._queue[request.id](request.value);
		} else {
			this._invokeMethod(request.type, request.args)
			    .then(result => {
				    this.sendResponse(request, result);
			    })
			    .catch((e) => {
				    this._sendErrorResponse(request, e)
			    })
		}
	}

	_invokeMethod(method: NativeRequestType, args: Array<Object>): Promise<any> {
		const d = defer()

		switch (method) {
			case 'init':
				if (!this._initialized.promise.isFulfilled()) {
					this._initialized.resolve()
				}
				d.resolve(process.platform);
				break
			case 'changeZoomFactor':
				this._initialized.promise.then(() => {
					this._window.changeZoomFactor((args[0]: any))
				})
				d.resolve()
				break
			case 'findInPage':
				this._window.findInPage(args)
				d.resolve()
				break
			case 'stopFindInPage':
				this._window.stopFindInPage()
				d.resolve()
				break
			case 'registerMailto':
				DesktopUtils
					.registerAsMailtoHandler(true)
					.then(() => {
						d.resolve()
					})
					.catch(e => {
						d.reject(new Error('mailto unregistration failed'))
					})
				break
			case 'unregisterMailto':
				DesktopUtils
					.unregisterAsMailtoHandler(true)
					.then(() => {
						d.resolve()
					})
					.catch(e => {
						d.reject(new Error('mailto registration failed'))
					})
				break
			case 'checkMailto':
				DesktopUtils
					.checkIsMailtoHandler()
					.then(v => d.resolve(v))
				break
			default:
				d.reject(new Error(`Invalid Method invocation: ${method}`))
				break
		}

		return d.promise
	}

	sendRequest(type: JsRequestType, args: Array<any>): Promise<Object> {
		const requestId = this._createRequestId();
		const request = {
			id: requestId,
			type: type,
			args: args,
		}

		this._postMessage(request)
		const d = defer()
		this._queue[requestId] = d.resolve;
		return d.promise;
	}

	_createRequestId(): string {
		if (this._requestId >= Number.MAX_SAFE_INTEGER) {
			this._requestId = 0
		}
		return "desktop" + this._requestId++
	}

	sendResponse(request: Object, value: Object) {
		const response = {
			id: request.id,
			type: "response",
			value: value,
		}
		this.send('protocol-message', response)
	}

	_sendErrorResponse(request: Object, ex: Error): void {
		const response = {
			id: request.id,
			type: "requestError",
			error: errorToObj(ex),
		}

		this._postMessage(response);
	}

	_postMessage(msg: Object) {
		this.send('protocol-message', msg)
	}

	send(...args: any) {
		return this._send.apply(this, args)
	}

	on(...args: any) {
		return this._on.apply(this, args)
	}

	once(...args: any) {
		return this._on.apply(this, args)
	}

	initialized(): Promise<void> {
		return this._initialized.promise
	}
}

export const ipc = new IPC()