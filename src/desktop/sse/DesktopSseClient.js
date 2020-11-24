// @flow

import type {App} from "electron"
import {base64ToBase64Url, stringToUtf8Uint8Array, uint8ArrayToBase64} from "../../api/common/utils/Encoding"
import {neverNull, noOp, randomIntFromInterval} from "../../api/common/utils/Utils"
import type {DesktopNotifier} from '../DesktopNotifier.js'
import type {WindowManager} from "../DesktopWindowManager.js"
import type {DesktopConfig} from "../config/DesktopConfig"
import {DesktopConfigKey} from "../config/DesktopConfig"
import {NotificationResult} from "../DesktopConstants"
import {FileNotFoundError} from "../../api/common/error/FileNotFoundError"
import type {DesktopAlarmScheduler} from "./DesktopAlarmScheduler"
import type {DesktopNetworkClient} from "../DesktopNetworkClient"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {_TypeModel as MissedNotificationTypeModel} from "../../api/entities/sys/MissedNotification"
import type {DesktopAlarmStorage} from "./DesktopAlarmStorage"
import type {LanguageViewModelType} from "../../misc/LanguageViewModel"
import type {NotificationInfo} from "../../api/entities/sys/NotificationInfo"
import {remove} from "../../api/common/utils/ArrayUtils"
import {Mode} from "../../api/Env"
import {handleRestError, NotAuthenticatedError, NotAuthorizedError} from "../../api/common/error/RestError"
import {TutanotaError} from "../../api/common/error/TutanotaError"

export type SseInfo = {|
	identifier: string,
	sseOrigin: string,
	userIds: Array<string>
|}

// how long should we wait to retry after failing to get a response?
let INITIAL_CONNECT_TIMEOUT: number
let MAX_CONNECT_TIMEOUT: number

const MISSED_NOTIFICATION_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days

const log: ((...args: any) => void) = env.mode === Mode.Test ? noOp : console.log.bind(console)

export class DesktopSseClient {
	_app: App;
	_conf: DesktopConfig
	_wm: WindowManager
	_notifier: DesktopNotifier
	_alarmScheduler: DesktopAlarmScheduler;
	_net: DesktopNetworkClient;
	_alarmStorage: DesktopAlarmStorage
	_delayHandler: typeof setTimeout
	_lang: LanguageViewModelType
	_crypto: DesktopCryptoFacade;

	_connectedSseInfo: ?SseInfo;
	_connection: ?ClientRequest;
	_readTimeoutInSeconds: number;
	_connectTimeoutInSeconds: number;
	_nextReconnect: ?TimeoutID;
	_tryToReconnect: boolean;
	_lastProcessedChangeTime: number;
	// We use this promise for queueing processing of notifications. There could be a smarter queue which clears all downloads older than
	// the response.
	_handlingPushMessage: Promise<*>;


	constructor(app: App, conf: DesktopConfig, notifier: DesktopNotifier, wm: WindowManager, alarmScheduler: DesktopAlarmScheduler,
	            net: DesktopNetworkClient, desktopCrypto: DesktopCryptoFacade, alarmStorage: DesktopAlarmStorage,
	            lang: LanguageViewModelType, delayHandler: typeof setTimeout = setTimeout) {
		this._app = app
		this._conf = conf
		this._wm = wm
		this._notifier = notifier
		this._alarmScheduler = alarmScheduler
		this._net = net
		this._crypto = desktopCrypto
		this._alarmStorage = alarmStorage
		this._lang = lang
		this._delayHandler = delayHandler


		INITIAL_CONNECT_TIMEOUT = this._conf.getConst("initialSseConnectTimeoutInSeconds")
		MAX_CONNECT_TIMEOUT = this._conf.getConst("maxSseConnectTimeoutInSeconds")
		this._connectedSseInfo = conf.getVar('pushIdentifier')
		this._readTimeoutInSeconds = conf.getVar('heartbeatTimeoutInSeconds')
		if (typeof this._readTimeoutInSeconds !== 'number' || Number.isNaN(this._readTimeoutInSeconds)) {
			this._readTimeoutInSeconds = 30
			conf.setVar('heartbeatTimeoutInSeconds', 30)
		}
		this._connectTimeoutInSeconds = INITIAL_CONNECT_TIMEOUT
		this._tryToReconnect = false
		this._lastProcessedChangeTime = 0
		app.on('will-quit', () => {
			this._disconnect()
			clearTimeout(neverNull(this._nextReconnect))
			this._tryToReconnect = false
		})
		this._handlingPushMessage = Promise.resolve()
	}

	start() {
		this._tryToReconnect = true
		this._reschedule(1)
	}

	storePushIdentifier(identifier: string, userId: string, sseOrigin: string): Promise<void> {
		log("storing push identifier", identifier.substring(0, 3))
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
		return this._conf.setVar('pushIdentifier', sseInfo)
		           .then(() => {
			           this._connectedSseInfo = sseInfo
			           if (this._connection) {
				           this._connection.abort()
				           this._reschedule(INITIAL_CONNECT_TIMEOUT)
			           }
		           })
	}

	getPushIdentifier(): ?SseInfo {
		return this._conf.getVar(DesktopConfigKey.pushIdentifier)
	}

	connect(): Promise<void> {
		if (!this._connectedSseInfo) {
			this._reschedule(10)
			log("sse info not available, skip reconnect")
			return Promise.resolve()
		}
		const sseInfo = this._connectedSseInfo
		if (this.hasNotificationTTLExpired()) {
			log("invalidating alarms on connect")
			return this.resetStoredState()
		}

		// now actually try to connect. cleaning up any old
		// connection because us getting here means we timed out or had an error
		this._connectTimeoutInSeconds = Math.min(this._connectTimeoutInSeconds * 2, MAX_CONNECT_TIMEOUT)
		this._reschedule(randomIntFromInterval(1, this._connectTimeoutInSeconds))
		this._disconnect()

		const userId = sseInfo.userIds[0]
		if (userId == null) {
			log("No user IDs, skip reconnect")
			return Promise.resolve()
		}
		const url = sseInfo.sseOrigin + "/sse?_body=" + this._requestJson(sseInfo.identifier, userId)
		log(
			"starting sse connection, identifier", sseInfo.identifier.substring(0, 3),
			'userIds', userId,
		)
		this._connection = this._net.request(url, {
			headers: {
				"Content-Type": "application/json",
				"Connection": "Keep-Alive",
				"Keep-Alive": "header",
				"Accept": "text/event-stream",
				"v": MissedNotificationTypeModel.version,
				"cv": this._app.getVersion(),
			},
			method: "GET"
		}).on('response', res => {
			log("established SSE connection")
			if (res.statusCode === 403) { // invalid userids
				log('sse: got NotAuthenticated, deleting userId')
				const sseInfo = this._removeUserId(userId)

				// If we don't remove _connectedSseInfo then timeout loop will restart connection automatiicaly
				if (sseInfo.userIds.length === 0) {
					log("No user ids, skipping reconnect")
					this._connectedSseInfo = null
					this._disconnect()
				}
			} else if (this._conf.getVar(DesktopConfigKey.lastMissedNotificationCheckTime) == null) {
				// We set default value for  the case when Push identifier was added but no notifications were received. Then more than
				// MISSED_NOTIFICATION_TTL has passed and notifications has expired.
				this._conf.setVar(DesktopConfigKey.lastMissedNotificationCheckTime, Date.now())
			}

			res.setEncoding('utf8')
			let resData = ""
			res.on('data', d => {
				// add new data to the buffer
				resData += d
				const lines = resData.split("\n")
				resData = lines.pop() // put the last line back into the buffer
				lines.forEach(l => this._processSseData(l, userId))
			}).on('close', () => {
				log('sse response closed')
				this._disconnect()
				this._connectTimeoutInSeconds = INITIAL_CONNECT_TIMEOUT
				this._reschedule(INITIAL_CONNECT_TIMEOUT)
			}).on('error', e => console.error('sse response error:', e))
		}).on(
			'information', e => log('sse information:', e.message)
		).on('connect', e => log('sse connect:', e.message)
		).on('error', e => console.error('sse error:', e.message)
		).end()

		return Promise.resolve()
	}

	_removeUserId(userId: string): SseInfo {
		this._alarmScheduler.unscheduleAllAlarms(userId)
		const sseInfo: SseInfo = this._conf.getVar('pushIdentifier')
		remove(sseInfo.userIds, userId)
		this._conf.setVar("pushIdentifier", sseInfo)
		this._connectedSseInfo = sseInfo
		return sseInfo
	}

	_processSseData(data: string, userId: string): void {
		if (!data.startsWith("data")) {
			log('sse heartbeat')
			this._reschedule()
			return
		}

		data = data.trim()
		if (data.length < 7) return
		data = data.substring(6)

		// check for heartbeat settings
		if (data.startsWith('heartbeatTimeout:')) {
			log("received new timeout:", data)
			const newTimeout = Number(data.split(':')[1])
			if (typeof newTimeout === 'number' && !Number.isNaN(newTimeout)) {
				this._readTimeoutInSeconds = newTimeout
				this._conf.setVar('heartbeatTimeoutInSeconds', newTimeout)
			} else {
				console.error("got invalid heartbeat timeout from server")
			}
			this._reschedule()
			return
		}

		if (data === 'notification') {
			this._handlePushMessage(userId)
			    .then(() => this._reschedule())
			    .catch(e => {
				    if (e instanceof NotAuthenticatedError || e instanceof NotAuthorizedError) {
					    // Reset the queue so that the previous error will not be handled again
					    this._handlingPushMessage = Promise.resolve()
					    this._removeUserId(userId)
					    this._disconnect()
				    } else {
					    console.error("failed to handle push message:", e)
					    this._notifier.showOneShot({title: "Failed to handle PushMessage"})
				    }
			    })
		}


	}

	/**
	 * We remember the last time we connected or fetched missed notification and if since the last time we did the the TTL time has
	 * expired, we certainly missed some updates.
	 * We need to unschedule all alarms and to tell web part that we would like alarms to be scheduled all over.
	 */
	hasNotificationTTLExpired(): boolean {
		const lastMissedNotificationCheckTime = this._conf.getVar(DesktopConfigKey.lastMissedNotificationCheckTime)
		log("last missed notification check:", {lastMissedNotificationCheckTime})
		return lastMissedNotificationCheckTime && (Date.now() - lastMissedNotificationCheckTime) > MISSED_NOTIFICATION_TTL
	}

	/**
	 * Reset state when TTL has expired,
	 */
	resetStoredState(): Promise<void> {
		log("Resetting stored state")
		return Promise
			.all([
				this._alarmScheduler.unscheduleAllAlarms(),
				this._conf.setVar(DesktopConfigKey.lastMissedNotificationCheckTime, null),
			])
			.then(() => this._alarmStorage.removePushIdentifierKeys())
			.then(() => {
				const connectedSseInfo = this._connectedSseInfo
				if (connectedSseInfo) {
					connectedSseInfo.userIds = []
					return this._conf.setVar(DesktopConfigKey.pushIdentifier, connectedSseInfo)
				}
			})
			.then(() => {
				this._disconnect()
				this._connectedSseInfo = null
			})
	}

	_handlePushMessage(userId: string): Promise<void> {
		const process = () => this._downloadMissedNotification(userId)
		                          .then(mn => {
			                          this._conf.setVar(DesktopConfigKey.lastProcessedNotificationId, mn.lastProcessedNotificationId)
			                          this._conf.setVar(DesktopConfigKey.lastMissedNotificationCheckTime, Date.now())
			                          if (mn.notificationInfos && mn.notificationInfos.length === 0
				                          && mn.alarmNotifications && mn.alarmNotifications.length === 0) {
				                          log("MissedNotification is empty")
			                          } else {
				                          mn.notificationInfos.forEach(ni => this._handleNotificationInfo(this._lang.get("pushNewMail_msg"), ni))
				                          mn.alarmNotifications.forEach(an => this._alarmScheduler.handleAlarmNotification(an))
			                          }
		                          })
		                          .catch(FileNotFoundError, e => log('404:', e))
		this._handlingPushMessage = this._handlingPushMessage.then(process, (e) => {
			if (e instanceof NotAuthenticatedError) {
				throw e
			} else {
				log("Error while downloading missed notification", e)
				return process()
			}
		})
		return this._handlingPushMessage
	}

	_handleNotificationInfo(title: string, ni: NotificationInfo): void {
		const w = this._wm.getAll().find(w => w.getUserId() === ni.userId)
		if (w && w.isFocused()) {
			// no need for notification if user is looking right at the window
			return
		}
		this._notifier.submitGroupedNotification(
			title,
			`${ni.mailAddress} (${ni.counter})`,
			ni.userId,
			res => {
				if (res === NotificationResult.Click) {
					this._wm.openMailBox({userId: ni.userId, mailAddress: ni.mailAddress})
				}
			}
		)
	}


	_downloadMissedNotification(userId: string): Promise<any> {
		return new Promise((resolve, reject) => {
			const fail = (req: ClientRequest, res: ?http$IncomingMessage<net$Socket>, e: ?TutanotaError) => {
				if (res) {
					res.destroy()
				}
				req.abort()
				reject(e)
			}

			const url = this._makeAlarmNotificationUrl()
			log("downloading missed notification with user", userId)
			const headers: {[string]: string} = {
				userIds: userId,
				v: MissedNotificationTypeModel.version,
				cv: this._app.getVersion(),
			}
			if (this._conf.getVar(DesktopConfigKey.lastProcessedNotificationId)) {
				headers["lastProcessedNotificationId"] = this._conf.getVar(DesktopConfigKey.lastProcessedNotificationId)
			}
			const req = this._net
			                .request(url, {
					                method: "GET",
					                headers,
					                // this defines the timeout for the connection attempt, not for waiting for the servers response after a connection was made
					                timeout: 20000
				                }
			                )
			                .on('timeout', () => {
				                log("Missed notification download timeout")
				                req.abort()
			                })
			                .on('socket', (s) => {
				                // We add this listener purely as a workaround for some problem with net module.
				                // The problem is that sometimes request gets stuck after handshake - does not process unless some event
				                // handler is called (and it works more reliably with console.log()).
				                // This makes the request magically unstuck, probably console.log does some I/O and/or socket things.
				                s.on('lookup', () => log("lookup"))
			                })
			                .on('response', res => {
				                log("missed notification response", res.statusCode)
				                if (res.statusCode !== 200) {
					                const tutanotaError = handleRestError(res.statusCode, url, res.headers["Error-Id"], null)
					                fail(req, res, tutanotaError)
					                return
				                }
				                res.setEncoding('utf8')

				                let resData = ''
				                res
					                .on('data', chunk => {resData += chunk})
					                .on('end', () => {
						                try {
							                resolve(JSON.parse(resData))
						                } catch (e) {
							                fail(req, res, e)
						                }
					                })
					                .on('close', () => log("dl missed notification response closed"))
					                .on('error', e => fail(req, res, e))
			                })
			                .on('error', e => fail(req, null, e))
			                .end()
		})
	}

	_makeAlarmNotificationUrl(): string {
		const customId = uint8ArrayToBase64(stringToUtf8Uint8Array(neverNull(this._connectedSseInfo).identifier))
		return neverNull(this._connectedSseInfo).sseOrigin + "/rest/sys/missednotification/" + base64ToBase64Url(customId)
	}

	_disconnect() {
		if (this._connection) {
			this._connection.abort()
			this._connection = null
		}
	}

	_reschedule(delaySeconds?: number) {
		clearTimeout(neverNull(this._nextReconnect))
		if (!this._tryToReconnect) return
		delaySeconds = delaySeconds ? delaySeconds : Math.floor(this._readTimeoutInSeconds * 1.2)
		if (typeof delaySeconds !== 'number' || Number.isNaN(delaySeconds)) {
			console.error("invalid reschedule delay, setting to 10")
			delaySeconds = 10
		}
		log('scheduling to check sse in', delaySeconds, 'seconds')
		// clearTimeout doesn't care about undefined or null, but flow still complains
		this._nextReconnect = this._delayHandler(() => this.connect(), delaySeconds * 1000)
	}

	_requestJson(identifier: string, userId: string): string {
		return encodeURIComponent(JSON.stringify({
				_format: '0',
				identifier: identifier,
				userIds: [{"_id": this._crypto.generateId(4), "value": userId}]
			}
		))
	}
}