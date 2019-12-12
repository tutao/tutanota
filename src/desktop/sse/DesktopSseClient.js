// @flow

import {app} from 'electron'
import {base64ToBase64Url, stringToUtf8Uint8Array, uint8ArrayToBase64} from "../../api/common/utils/Encoding"
import {SseError} from "../../api/common/error/SseError"
import {downcast, neverNull, randomIntFromInterval} from "../../api/common/utils/Utils"
import type {DesktopNotifier} from '../DesktopNotifier.js'
import type {WindowManager} from "../DesktopWindowManager.js"
import type {DesktopConfigHandler} from "../DesktopConfigHandler"
import {NotificationResult} from "../DesktopConstants"
import {PreconditionFailedError} from "../../api/common/error/RestError"
import {FileNotFoundError} from "../../api/common/error/FileNotFoundError"
import type {DesktopAlarmScheduler} from "./DesktopAlarmScheduler"
import type {DesktopNetworkClient} from "../DesktopNetworkClient"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"

export type SseInfo = {|
	identifier: string,
	sseOrigin: string,
	userIds: Array<string>
|}

// how long should we wait to retry after failing to get a response?
let INITIAL_CONNECT_TIMEOUT: number
let MAX_CONNECT_TIMEOUT: number

export class DesktopSseClient {
	_conf: DesktopConfigHandler
	_wm: WindowManager
	_notifier: DesktopNotifier
	_alarmScheduler: DesktopAlarmScheduler;
	_net: DesktopNetworkClient;
	_crypto: DesktopCryptoFacade;

	_connectedSseInfo: ?SseInfo;
	_connection: ?ClientRequest;
	_readTimeoutInSeconds: number;
	_connectTimeoutInSeconds: number;
	_nextReconnect: ?TimeoutID;
	_tryToReconnect: boolean;
	_lastProcessedChangeTime: number;

	constructor(conf: DesktopConfigHandler, notifier: DesktopNotifier, wm: WindowManager, alarmScheduler: DesktopAlarmScheduler, net: DesktopNetworkClient, desktopCrypto: DesktopCryptoFacade) {
		this._conf = conf
		this._wm = wm
		this._notifier = notifier
		this._alarmScheduler = alarmScheduler
		this._net = net
		this._crypto = desktopCrypto

		INITIAL_CONNECT_TIMEOUT = this._conf.get("initialSseConnectTimeoutInSeconds")
		MAX_CONNECT_TIMEOUT = this._conf.get("maxSseConnectTimeoutInSeconds")
		this._connectedSseInfo = conf.getDesktopConfig('pushIdentifier')
		this._readTimeoutInSeconds = conf.getDesktopConfig('heartbeatTimeoutInSeconds')
		if (typeof this._readTimeoutInSeconds !== 'number' || Number.isNaN(this._readTimeoutInSeconds)) {
			this._readTimeoutInSeconds = 30
			conf.setDesktopConfig('heartbeatTimeoutInSeconds', 30)
		}
		this._connectTimeoutInSeconds = INITIAL_CONNECT_TIMEOUT
		this._tryToReconnect = false
		this._lastProcessedChangeTime = 0
		app.on('will-quit', () => {
			this._cleanup()
			clearTimeout(neverNull(this._nextReconnect))
			this._tryToReconnect = false
		})
	}

	start() {
		this._tryToReconnect = true
		this._reschedule(1)
	}

	storePushIdentifier(identifier: string, userId: string, sseOrigin: string): Promise<void> {
		console.log("storing push identifier", identifier.substring(0, 3))
		let userIds
		if (!this._connectedSseInfo) {
			userIds = [userId]
		} else {
			userIds = this._connectedSseInfo.userIds
			if (!userIds.includes(userId)) {
				userIds.push(userId)
			} else {
				return Promise.resolve()
			}
		}
		const sseInfo = {identifier, sseOrigin, userIds}
		return this._conf.setDesktopConfig('pushIdentifier', sseInfo)
		           .then(() => {
			           this._connectedSseInfo = sseInfo
			           if (this._connection) {
				           this._connection.abort()
				           this._reschedule(INITIAL_CONNECT_TIMEOUT)
			           }
		           })
	}

	getPushIdentifier(): ?string {
		const pushIdentifier = this._conf.getDesktopConfig('pushIdentifier')
		return pushIdentifier
			? pushIdentifier.identifier
			: null
	}

	connect() {
		if (!this._connectedSseInfo) {
			this._reschedule(10)
			console.log("sse info not available, skip reconnect")
			return
		}
		const sseInfo = this._connectedSseInfo

		// now actually try to connect. cleaning up any old
		// connection because us getting here means we timed out or had an error
		this._connectTimeoutInSeconds = Math.min(this._connectTimeoutInSeconds * 2, MAX_CONNECT_TIMEOUT)
		this._reschedule(randomIntFromInterval(1, this._connectTimeoutInSeconds))
		this._cleanup()

		const url = sseInfo.sseOrigin + "/sse?_body=" + requestJson(sseInfo)
		console.log(
			"starting sse connection, identifier", sseInfo.identifier.substring(0, 3),
			'userIds', sseInfo.userIds
		)
		this._connection = this._net.request(url, {
			headers: {
				"Content-Type": "application/json",
				"Connection": "Keep-Alive",
				"Keep-Alive": "header",
				"Accept": "text/event-stream"
			},
			method: "GET"
		}).on('response', res => {
			console.log("established SSE connection")
			if (res.statusCode === 403) { // invalid userids
				console.log('sse: got 403, deleting identifier')
				this._connectedSseInfo = null
				this._conf.setDesktopConfig('pushIdentifier', null)
				this._cleanup()
			}
			res.setEncoding('utf8')
			let resData = ""
			res.on('data', d => {
				// add new data to the buffer
				resData += d
				const lines = resData.split("\n")
				resData = lines.pop() // put the last line back into the buffer
				lines.forEach(l => this._processSseData(l))
			}).on('close', () => {
				console.log('sse response closed')
				this._cleanup()
				this._connectTimeoutInSeconds = INITIAL_CONNECT_TIMEOUT
				this._reschedule(INITIAL_CONNECT_TIMEOUT)
			}).on('error', e => console.error('sse response error:', e))
		}).on(
			'information', e => console.log('sse information:', e.message)
		).on('connect', e => console.log('sse connect:', e.message)
		).on('error', e => console.error('sse error:', e.message)
		).end()
	}

	_processSseData(data: string): void {
		if (!data.startsWith("data")) {
			console.log('sse heartbeat')
			this._reschedule()
			return
		}

		data = data.trim()
		if (data.length < 7) return
		data = data.substring(6)

		// check for heartbeat settings
		if (data.startsWith('heartbeatTimeout:')) {
			console.log("received new timeout:", data)
			const newTimeout = Number(data.split(':')[1])
			if (typeof newTimeout === 'number' && !Number.isNaN(newTimeout)) {
				this._readTimeoutInSeconds = newTimeout
				this._conf.setDesktopConfig('heartbeatTimeoutInSeconds', newTimeout)
			} else {
				console.error("got invalid heartbeat timeout from server")
			}
			this._reschedule()
			return
		}
		// it's a PushMessage
		let pm: PushMessage
		try {
			pm = PushMessage.fromJSON(data)
		} catch (e) {
			console.error("failed to parse push message from json:", e, "\n\noffending json:\n", data)
			return
		}
		this._handlePushMessage(pm)
		    .then(() => this._reschedule())
		    .catch(e => {
			    console.error("failed to handle push message:", e)
			    this._notifier.showOneShot({title: "Failed to handle PushMessage"})
		    })
	}

	_handlePushMessage(pm: PushMessage, failedToConfirm: boolean = false): Promise<void> {

		if (this._lastProcessedChangeTime >= parseInt(pm.changeTime)) {
			console.warn("already processed notification, ignoring: " + this._lastProcessedChangeTime)
			return Promise.resolve()
		}

		let notificationInfos: Array<NotificationInfo>
		let changeTime: string
		let confirmationId: string
		let alarmNotifications: Array<AlarmNotification>

		return Promise
			.resolve()
			.then(() => (failedToConfirm || pm.hasAlarmNotifications)
				? this._downloadMissedNotification()
				: downcast(Promise.resolve(pm)))
			.then(mn => {
				notificationInfos = mn.notificationInfos
				changeTime = mn.changeTime
				confirmationId = mn.confirmationId
				alarmNotifications = mn.alarmNotifications || []
			})
			.then(() => console.log("scheduling confirmation for", confirmationId))
			.then(() => this._sendConfirmation(confirmationId, changeTime))
			.then(() => {
				this._lastProcessedChangeTime = parseInt(changeTime)
				notificationInfos.forEach(ni => this._handleNotificationInfo(pm.title, ni))
				alarmNotifications.forEach(an => this._alarmScheduler.handleAlarmNotification(an))
			})
			.catch(PreconditionFailedError, () => this._handlePushMessage(pm, true))
			.catch(FileNotFoundError, e => console.log('404:', e))
	}

	_handleNotificationInfo(title: string, ni: NotificationInfo): void {
		const w = this._wm.getAll().find(w => w.getUserId() === ni.userId)
		if (w && w.isFocused()) {
			// no need for notification if user is looking right at the window
			return
		}
		this._notifier.submitGroupedNotification(
			title,
			`${ni.address} (${ni.counter})`,
			ni.userId,
			res => {
				if (res === NotificationResult.Click) {
					this._wm.openMailBox({userId: ni.userId, mailAddress: ni.address})
				}
			}
		)
	}

	_sendConfirmation(confirmationId: string, changeTime: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this._connectedSseInfo) {
				reject("no connectedSseInfo, can't send confirmation")
				return
			}
			const confirmUrl = this._makeAlarmNotificationUrl()
			this._net.request(confirmUrl, {
				method: "DELETE",
				headers: {confirmationId, changeTime}
			}).on('response', res => {
				console.log('push message confirmation response code:', res.statusCode)
				if (res.statusCode === 200) {
					resolve()
				} else if (res.statusCode === 412) {
					reject(new PreconditionFailedError(""))
				} else if (res.statusCode === 404) {
					console.log("tried to confirm outdated or nonexistent missedNotification")
					resolve()
				} else {
					reject(`failure response for confirmation for Id ${confirmationId}: ${res.statusCode}`)
				}
			}).on('error', e => {
				console.error("failed to send push message confirmation:", e.message)
				reject(e)
			}).end()
		})
	}

	_downloadMissedNotification(): Promise<MissedNotification> {
		return new Promise((resolve, reject) => {
			const fail = (req: ClientRequest, res: ?http$IncomingMessage, e: ?Error | ?string) => {
				if (res) {
					res.destroy()
				}
				req.abort()
				reject(e)
			}

			console.log("downloading missed notification")
			const url = this._makeAlarmNotificationUrl()
			const req = this._net.request(url, {
				method: "GET",
				headers: {"userIds": neverNull(this._connectedSseInfo).userIds.join(",")},
				// this defines the timeout for the connection attempt, not for waiting for the servers response after a connection was made
				timeout: 20000
			}).on('response', res => {
				if (res.statusCode === 404) {
					fail(req, res, new FileNotFoundError("no missed notification"))
					return
				}
				if (res.statusCode !== 200) {
					fail(req, res, `error during missedNotification retrieval, got ${res.statusCode}`)
					return
				}
				res.setEncoding('utf8')

				let resData = ''
				res.on('data', chunk => {
					resData += chunk
				}).on('end', () => {
					try {
						const mn = MissedNotification.fromJSON(resData)
						resolve(mn)
					} catch (e) {
						fail(req, res, e)
					}
				})
				   .on('close', () => console.log("dl missed notification response closed"))
				   .on('error', e => fail(req, res, e))
			}).on('error', e => fail(req, null, e)).end()
		})
	}

	_makeAlarmNotificationUrl(): string {
		const customId = uint8ArrayToBase64(stringToUtf8Uint8Array(neverNull(this._connectedSseInfo).identifier))
		return neverNull(this._connectedSseInfo).sseOrigin
			+ "/rest/sys/missednotification/A/"
			+ base64ToBase64Url(customId)
	}

	_cleanup() {
		if (this._connection) {
			this._connection.abort()
			this._connection = null
		}
	}

	_reschedule(delay?: number) {
		clearTimeout(neverNull(this._nextReconnect))
		if (!this._tryToReconnect) return
		delay = delay ? delay : Math.floor(this._readTimeoutInSeconds * 1.2)
		if (typeof delay !== 'number' || Number.isNaN(delay)) {
			console.error("invalid reschedule delay, setting to 10")
			delay = 10
		}
		console.log('scheduling to reconnect sse in', delay, 'seconds')
		// clearTimeout doesn't care about undefined or null, but flow still complains
		this._nextReconnect = setTimeout(() => this.connect(), delay * 1000)
	}
}

export class PushMessage {
	title: string;
	notificationInfos: Array<NotificationInfo>;
	confirmationId: string;
	hasAlarmNotifications: boolean;
	changeTime: string;


	constructor(title: string, confirmationId: string, notificationInfos: Array<NotificationInfo>, hasAlarmNotifications: boolean, changeTime: string) {
		this.title = title;
		this.confirmationId = confirmationId;
		this.notificationInfos = notificationInfos;
		this.hasAlarmNotifications = hasAlarmNotifications;
		this.changeTime = changeTime
	}

	static fromJSON(json: string): PushMessage {
		let obj
		try {
			obj = JSON.parse(json)
		} catch (e) {
			throw new SseError(`push message type error: ${e.message}`)
		}
		return new PushMessage(obj.title, obj.confirmationId, obj.notificationInfos, obj.hasAlarmNotifications, obj.changeTime)
	}
}

export class MissedNotification {
	alarmNotifications: Array<AlarmNotification>;
	notificationInfos: Array<NotificationInfo>;
	changeTime: string;
	confirmationId: string;

	constructor(alarmNotifications: Array<AlarmNotification>, notificationInfos: Array<NotificationInfo>, confirmationId: string, changeTime: string) {
		this.alarmNotifications = alarmNotifications;
		this.notificationInfos = notificationInfos;
		this.confirmationId = confirmationId;
		this.changeTime = changeTime
	}

	static fromJSON(json: string): MissedNotification {
		let obj
		try {
			obj = JSON.parse(json)
		} catch (e) {
			throw new SseError(`missed notification type error: ${e.message}`)
		}
		return new MissedNotification(obj.alarmNotifications, obj.notificationInfos, obj.confirmationId, obj.changeTime)
	}
}

export type NotificationInfo = {|
	address: string,
	counter: number,
	userId: string
|}

function requestJson(sseInfo: SseInfo): string {
	return encodeURIComponent(JSON.stringify({
			"_format": '0',
			"identifier": sseInfo.identifier,
			"userIds": sseInfo.userIds.map(userId => {
				return {"_id": DesktopCryptoFacade.generateId(4), "value": userId}
			})
		}
	))
}
