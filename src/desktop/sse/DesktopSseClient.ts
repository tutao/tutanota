// @flow

import type {App} from "electron"
import type {TimeoutSetter} from "@tutao/tutanota-utils"
import {
	base64ToBase64Url,
	filterInt,
	neverNull,
	randomIntFromInterval,
	remove,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64
} from "@tutao/tutanota-utils"
import type {DesktopNotifier} from '../DesktopNotifier.js'
import type {WindowManager} from "../DesktopWindowManager.js"
import type {DesktopConfig} from "../config/DesktopConfig"
import {NotificationResult} from "../DesktopConstants"
import {FileNotFoundError} from "../../api/common/error/FileNotFoundError"
import type {DesktopAlarmScheduler} from "./DesktopAlarmScheduler"
import type {DesktopClientRequest, DesktopNetworkClient} from "../DesktopNetworkClient"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {_TypeModel as MissedNotificationTypeModel} from "../../api/entities/sys/MissedNotification"
import type {DesktopAlarmStorage} from "./DesktopAlarmStorage"
import type {LanguageViewModelType} from "../../misc/LanguageViewModel"
import type {NotificationInfo} from "../../api/entities/sys/NotificationInfo"
import {
	handleRestError,
	NotAuthenticatedError,
	NotAuthorizedError,
	ServiceUnavailableError,
	TooManyRequestsError
} from "../../api/common/error/RestError"
import {TutanotaError} from "../../api/common/error/TutanotaError"
import {log} from "../DesktopLog"
import {DesktopConfigEncKey, DesktopConfigKey} from "../config/ConfigKeys"

export type SseInfo = {|
	identifier: string,
	sseOrigin: string,
	userIds: Array<string>
|}

const MISSED_NOTIFICATION_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days

export class DesktopSseClient {
	_app: App;
	_conf: DesktopConfig
	_wm: WindowManager
	_notifier: DesktopNotifier
	_alarmScheduler: DesktopAlarmScheduler;
	_net: DesktopNetworkClient;
	_alarmStorage: DesktopAlarmStorage
	_delayHandler: TimeoutSetter
	_lang: LanguageViewModelType
	_crypto: DesktopCryptoFacade;

	_connectedSseInfo: ?SseInfo;
	_connection: ?http$ClientRequest<*>;
	_readTimeoutInSeconds: number;
	_nextReconnect: ?TimeoutID;
	_tryToReconnect: boolean;
	_lastProcessedChangeTime: number;
	_reconnectAttempts: number
	// We use this promise for queueing processing of notifications. There could be a smarter queue which clears all downloads older than
	// the response.
	_handlingPushMessage: Promise<*>;


	constructor(app: App, conf: DesktopConfig, notifier: DesktopNotifier, wm: WindowManager, alarmScheduler: DesktopAlarmScheduler,
	            net: DesktopNetworkClient, desktopCrypto: DesktopCryptoFacade, alarmStorage: DesktopAlarmStorage,
	            lang: LanguageViewModelType, delayHandler: TimeoutSetter = setTimeout) {
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
		this._reconnectAttempts = 1

		this._tryToReconnect = false
		this._lastProcessedChangeTime = 0
		app.on('will-quit', () => {
			this._disconnect()
			clearTimeout(neverNull(this._nextReconnect))
			this._tryToReconnect = false
		})
		this._handlingPushMessage = Promise.resolve()
	}

	async start() {
		this._tryToReconnect = true
		this._connectedSseInfo = await this.getSseInfo()
		this._readTimeoutInSeconds = await this._conf.getVar(DesktopConfigKey.heartbeatTimeoutInSeconds)
		this._reschedule(1)
	}

	storePushIdentifier(identifier: string, userId: string, sseOrigin: string): Promise<void> {
		log.debug("storing push identifier")
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
		return this._conf.setVar(DesktopConfigEncKey.sseInfo, sseInfo)
		           .then(() => {
			           this._connectedSseInfo = sseInfo
		           })
	}

	/**
	 * return the stored SseInfo if we can decrypt one.
	 * If not, we'll assume that all stored
	 * pushIdentifierSessionKeys, AlarmNotifications and set Alarms are invalid.
	 * @returns {Promise<?SseInfo>}
	 */
	async getSseInfo(): Promise<?SseInfo> {
		const sseInfo: ?SseInfo = await this._conf.getVar(DesktopConfigEncKey.sseInfo)
		if (this._tryToReconnect && sseInfo == null) {
			log.warn("sseInfo corrupted or not present, making sure pushEncSessionKeys and scheduled alarms are cleared")
			// we either never had a device identifier or we couldn't decrypt
			// the one we had. either way, any pushEncSessionKeys from conf
			// are probably useless now.
			// also, we shouldn't expect to be able to reschedule any of the
			// alarmNotifications that are in conf.json
			await this.resetStoredState()
			this._reschedule(1)
		}
		return sseInfo
	}

	async connect(): Promise<void> {
		if (!this._connectedSseInfo) {
			this._reschedule(10)
			log.debug("sse info not available, skip reconnect")
			return Promise.resolve()
		}
		const sseInfo = this._connectedSseInfo
		if (await this.hasNotificationTTLExpired()) {
			log.debug("invalidating alarms on connect")
			return this.resetStoredState()
		}

		const initialConnectTimeoutSeconds = await this._conf.getConst("initialSseConnectTimeoutInSeconds")
		const maxConnectTimeoutSeconds = await this._conf.getConst("maxSseConnectTimeoutInSeconds")
		// double the connection timeout with each attempt to connect, capped by maxConnectTimeoutSeconds
		const connectionTimeoutInSeconds = Math.min(initialConnectTimeoutSeconds
			* Math.pow(2, this._reconnectAttempts), maxConnectTimeoutSeconds)
		this._reconnectAttempts++
		this._reschedule(randomIntFromInterval(1, connectionTimeoutInSeconds))
		this._disconnect()

		const userId = sseInfo.userIds[0]
		if (userId == null) {
			log.debug("No user IDs, skip reconnect")
			return Promise.resolve()
		}
		const url = sseInfo.sseOrigin + "/sse?_body=" + this._requestJson(sseInfo.identifier, userId)
		log.debug("starting sse connection")

		// webstorm seems to think that ClientRequest.end() returns void.
		// noinspection JSVoidFunctionReturnValueUsed
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
		}).on('socket', (s) => {
			// We add this listener purely as a workaround for some problem with net module.
			// The problem is that sometimes request gets stuck after handshake - does not process unless some event
			// handler is called (and it works more reliably with console.log()).
			// This makes the request magically unstuck, probably console.log does some I/O and/or socket things.
			s.on('lookup', () => log.debug("lookup sse request"))
		}).on('response', async res => {
			this._reconnectAttempts = 1
			log.debug("established SSE connection")
			if (res.statusCode === 403) { // invalid userids
				log.debug('sse: got NotAuthenticated, deleting userId')
				const sseInfo = await this._removeUserId(userId)

				// If we don't remove _connectedSseInfo then timeout loop will restart connection automatiicaly
				if (sseInfo && sseInfo.userIds.length === 0) {
					log.debug("No user ids, skipping reconnect")
					this._connectedSseInfo = null
					this._disconnect()
				}
			} else if ((await this._conf.getVar(DesktopConfigKey.lastMissedNotificationCheckTime)) == null) {
				// We set default value for  the case when Push identifier was added but no notifications were received. Then more than
				// MISSED_NOTIFICATION_TTL has passed and notifications has expired.
				await this._conf.setVar(DesktopConfigKey.lastMissedNotificationCheckTime, Date.now())
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
				log.debug('sse response closed')
				this._disconnect()
				this._reschedule(initialConnectTimeoutSeconds)
			}).on('error', e => console.error('sse response error:', e))
		}).on(
			'information', e => log.debug('sse information')
		).on('connect', e => log.debug('sse connect:')
		).on('error', e => console.error('sse error:', e.message)
		).end()

		return Promise.resolve()
	}

	async _removeUserId(userId: string): Promise<?SseInfo> {
		this._alarmScheduler.unscheduleAllAlarms(userId)
		const sseInfo: ?SseInfo = await this.getSseInfo()
		if (sseInfo) {
			remove(sseInfo.userIds, userId)
			await this._conf.setVar(DesktopConfigEncKey.sseInfo, sseInfo)
			this._connectedSseInfo = sseInfo
		}

		return sseInfo
	}

	_processSseData(data: string, userId: string): void {
		if (!data.startsWith("data")) {
			log.debug('sse heartbeat', this._readTimeoutInSeconds)
			this._reschedule()
			return
		}

		data = data.trim()
		if (data.length < 7) return
		data = data.substring(6)

		// check for heartbeat settings
		if (data.startsWith('heartbeatTimeout:')) {
			log.debug("received new timeout:", data)
			const newTimeout = Number(data.split(':')[1])
			if (typeof newTimeout === 'number' && !Number.isNaN(newTimeout)) {
				this._readTimeoutInSeconds = newTimeout
				this._conf.setVar('heartbeatTimeoutInSeconds', newTimeout)
			} else {
				log.error("got invalid heartbeat timeout from server")
			}
			this._reschedule()
			return
		}

		if (data === 'notification') {
			this._handlePushMessage(userId)
			    .then(() => this._reschedule())
			    .catch(async e => {
				    if (e instanceof NotAuthenticatedError || e instanceof NotAuthorizedError) {
					    // Reset the queue so that the previous error will not be handled again
					    await this._removeUserId(userId)
					    this._handlingPushMessage = Promise.resolve()
					    this._disconnect()
				    } else {
					    log.error("failed to handle push message:", e)
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
	async hasNotificationTTLExpired(): Promise<boolean> {
		const lastMissedNotificationCheckTime = await this._conf.getVar(DesktopConfigKey.lastMissedNotificationCheckTime)
		log.debug("last missed notification check:", {lastMissedNotificationCheckTime})
		return lastMissedNotificationCheckTime && (Date.now() - lastMissedNotificationCheckTime) > MISSED_NOTIFICATION_TTL
	}

	/**
	 * Reset state when TTL has expired or when we detect a problem
	 * with the stored sseInfo, keys or alarms.
	 *
	 * invalidates
	 * - the pushIdentifierKeys that are stored in conf.json
	 * - the userIds that are stored as part of the sseInfo in conf.json
	 * - the alarms set on any window
	 *  and then disconnects the sse
	 */
	async resetStoredState(): Promise<void> {
		log.debug("Resetting stored state")
		const tryToReconnect = this._tryToReconnect
		this._tryToReconnect = false
		this._reschedule() // deletes reschedule timeout
		await Promise.all([
			this._alarmScheduler.unscheduleAllAlarms(),
			this._conf.setVar(DesktopConfigKey.lastMissedNotificationCheckTime, null),
			this._conf.setVar(DesktopConfigKey.lastProcessedNotificationId, null)
		])
		await this._alarmStorage.removePushIdentifierKeys()
		const connectedSseInfo = this._connectedSseInfo
		if (connectedSseInfo) {
			connectedSseInfo.userIds = []
			await this._conf.setVar(DesktopConfigEncKey.sseInfo, connectedSseInfo)
		}
		await this._wm.invalidateAlarms()
		this._disconnect()
		this._connectedSseInfo = null
		this._tryToReconnect = tryToReconnect
	}

	_handlePushMessage(userId: string): Promise<void> {
		const process = () => this._downloadMissedNotification(userId)
		                          .then(mn => {
			                          this._conf.setVar(DesktopConfigKey.lastProcessedNotificationId, mn.lastProcessedNotificationId)
			                          this._conf.setVar(DesktopConfigKey.lastMissedNotificationCheckTime, Date.now())
			                          if (mn.notificationInfos && mn.notificationInfos.length === 0
				                          && mn.alarmNotifications && mn.alarmNotifications.length === 0) {
				                          log.debug("MissedNotification is empty")
			                          } else {
				                          mn.notificationInfos.forEach(ni => this._handleNotificationInfo(this._lang.get("pushNewMail_msg"), ni))
				                          mn.alarmNotifications.forEach(an => this._alarmScheduler.handleAlarmNotification(an))
			                          }
		                          })
		                          .catch(e => {
			                          if (e instanceof FileNotFoundError) {
				                          log.debug('MissedNotification 404:', e)
			                          } else if (e instanceof ServiceUnavailableError) {

			                          } else {
				                          throw e
			                          }
		                          })
		this._handlingPushMessage = this._handlingPushMessage
		                                .then(
			                                process,
			                                (e) => {
				                                if (e instanceof NotAuthenticatedError) {
					                                throw e
				                                } else {
					                                log.debug("Error while downloading missed notification", e)
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
		return new Promise(async (resolve, reject) => {
			const fail = (req: DesktopClientRequest, res: ?http$IncomingMessage<net$Socket>, e: ?TutanotaError) => {
				if (res) {
					res.destroy()
				}
				req.abort()
				reject(e)
			}

			const url = this._makeAlarmNotificationUrl()
			log.debug("downloading missed notification")
			const headers: {[string]: string} = {
				userIds: userId,
				v: MissedNotificationTypeModel.version,
				cv: this._app.getVersion(),
			}
			const lastProcessedId = await this._conf.getVar(DesktopConfigKey.lastProcessedNotificationId)
			if (lastProcessedId) {
				headers["lastProcessedNotificationId"] = lastProcessedId
			}

			// webstorm seems to think that ClientRequest.end() returns void.
			// noinspection JSVoidFunctionReturnValueUsed
			const req = this._net
			                .request(url, {
					                method: "GET",
					                headers,
					                // this defines the timeout for the connection attempt, not for waiting for the servers response after a connection was made
					                timeout: 20000
				                }
			                )
			                .on('timeout', () => {
				                log.debug("Missed notification download timeout")
				                req.abort()
			                })
			                .on('socket', (s) => {
				                // We add this listener purely as a workaround for some problem with net module.
				                // The problem is that sometimes request gets stuck after handshake - does not process unless some event
				                // handler is called (and it works more reliably with console.log()).
				                // This makes the request magically unstuck, probably console.log does some I/O and/or socket things.
				                s.on('lookup', () => log.debug("lookup"))
			                })
			                .on('response', res => {
				                log.debug("missed notification response", res.statusCode)
				                if ((res.statusCode === ServiceUnavailableError.CODE || TooManyRequestsError.CODE) &&
					                (res.headers["retry-after"] || res.headers["suspension-time"])
				                ) {
					                // headers are lowercased, see https://nodejs.org/api/http.html#http_message_headers
					                const time = filterInt(res.headers["retry-after"] || res.headers["suspension-time"])
					                log.debug(`ServiceUnavailable when downloading missed notification, waiting ${time}s`)

					                res.destroy()
					                req.abort()

					                this._delayHandler(() => {
						                this._downloadMissedNotification(userId).then(resolve, reject)
					                }, time * 1000)
					                return
				                } else if (res.statusCode !== 200) {
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
					                .on('close', () => log.debug("dl missed notification response closed"))
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
		log.debug('scheduling to check sse in', delaySeconds, 'seconds')
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