// @flow

import type {DesktopConfigHandler} from "./DesktopConfigHandler"
import {app} from 'electron'
import crypto from 'crypto'
import http from 'http'
import https from 'https'
import {base64ToBase64Url, stringToUtf8Uint8Array, uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {SseError} from "../api/common/error/SseError"
import {isMailAddress} from "../misc/FormatValidator"
import {downcast, neverNull, randomIntFromInterval} from "../api/common/utils/Utils"
import type {DesktopNotifier} from './DesktopNotifier.js'
import type {WindowManager} from "./DesktopWindowManager.js"
import DesktopUtils from "./DesktopUtils"
import {NotificationResult} from "./DesktopNotifier"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {FileNotFoundError} from "../api/common/error/FileNotFoundError"

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

	_connectedSseInfo: ?SseInfo;
	_connection: ?ClientRequest;
	_readTimeoutInSeconds: number;
	_connectTimeoutInSeconds: number;
	_nextReconnect: ?TimeoutID;
	_tryToReconnect: boolean;
	_lastProcessedChangeTime: number;

	constructor(conf: DesktopConfigHandler, notifier: DesktopNotifier, wm: WindowManager) {
		this._conf = conf
		this._wm = wm
		this._notifier = notifier

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

	storePushIdentifier(identifier: string, userId: string, sseOrigin: string, pushIdentifierElementId: string, skB64: string): Promise<void> {
		console.log("storing push identifier", identifier.substring(0, 3))
		let userIds
		if (!this._connectedSseInfo) {
			userIds = [userId]
		} else {
			userIds = this._connectedSseInfo.userIds
			if (!userIds.includes(userId)) {
				userIds.push(userId)
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

	clear() {
		this._conf.setDesktopConfig('pushIdentifier', null)
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
		this._connection = this._getProtocolModule()
		                       .request(url, {
			                       headers: {
				                       "Content-Type": "application/json",
				                       "Connection": "Keep-Alive",
				                       "Keep-Alive": "header",
				                       "Accept": "text/event-stream"
			                       },
			                       method: "GET",
		                       })
		                       .on('response', res => {
			                       if (res.statusCode === 403) { // invalid userids
				                       console.log('sse: got 403, deleting identifier')
				                       this._connectedSseInfo = null
				                       this._conf.setDesktopConfig('pushIdentifier', null)
				                       this._cleanup()
			                       }
			                       res.setEncoding('utf8')
			                       res.on('data', d => this._processSseData(d))
			                          .on('close', () => {
				                          console.log('sse response closed')
				                          this._cleanup()
				                          this._connectTimeoutInSeconds = INITIAL_CONNECT_TIMEOUT
				                          this._reschedule(INITIAL_CONNECT_TIMEOUT)
			                          })
			                          .on('error', e => console.error('sse response error:', e))
		                       })
		                       .on('information', e => console.log('sse information:', e.message))
		                       .on('connect', e => console.log('sse connect:', e.message))
		                       .on('error', e => console.error('sse error:', e.message))
		                       .end()
	}

	_processSseData(data: string): void {
		if (!data.startsWith("data")) {
			console.log('sse heartbeat')
			this._reschedule()
			return
		}

		/**
		 * split data at newlines, sometimes there are multiple data packets in the
		 * same event, even a mix of heartbeat and PushMessages
		 */
		data.split('\n')
		    .map(dp => dp.trim())
		    .filter(dp => dp.length > 6)
		    .map(dp => dp.substring(6))
		    .forEach(dp => {
			    // check for heartbeat settings
			    if (dp.startsWith('heartbeatTimeout:')) {
				    console.log("received new timeout:", dp)
				    const newTimeout = Number(dp.split(':')[1])
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
			    console.log(dp)
			    let pm: PushMessage
			    try {
				    pm = PushMessage.fromJSON(dp)
			    } catch (e) {
				    console.error("failed to parse push message from json:", e, "\n\noffending json:\n", dp)
				    return
			    }
			    this._handlePushMessage(pm)
			        .then(() => this._reschedule())
			        .catch(e => {
				        console.error("failed to handle push message:", e)
				        this._notifier.showOneShot({title: "Failed to handle PushMessage"})
			        })
		    })
	}

	_handlePushMessage(pm: PushMessage, failedToConfirm: boolean = false): Promise<void> {
		return new Promise(resolve => {
			if (this._lastProcessedChangeTime >= parseInt(pm.changeTime)) {
				console.warn("already processed notification, ignoring: " + this._lastProcessedChangeTime)
				resolve()
			}
			let notificationInfos: Array<NotificationInfo>
			let changeTime: string
			let confirmationId: string
			let alarmNotifications: Array<AlarmNotification>

			let p: Promise<MissedNotification> = failedToConfirm || pm.hasAlarmNotifications
				? this._downloadMissedNotification()
				: Promise.resolve(downcast<MissedNotification>(pm))

			p.then(mn => {
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
				 alarmNotifications.forEach(an => this._handleAlarmNotification(an))
			 })
			 .catch(PreconditionFailedError, () => this._handlePushMessage(pm, true))
			 .catch(FileNotFoundError, console.log)
			resolve(p.then(() => {}))
		})
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

	_handleAlarmNotification(an: AlarmNotification): void {
		// schedule, save, etc etc
	}

	_sendConfirmation(confirmationId: string, changeTime: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this._connectedSseInfo) {
				reject("no connectedSseInfo, can't send confirmation")
				return
			}
			const confirmUrl = this._makeAlarmNotificationUrl()
			this._getProtocolModule().request(confirmUrl, {
				method: "DELETE",
				headers: {confirmationId, changeTime}
			}).on('response', res => {
				console.log('push message confirmation response code:', res.statusCode)
				if (res.statusCode === 200) {
					resolve()
				} else if (res.statusCode === 412) {
					reject(new PreconditionFailedError(""))
				} else {
					reject(`failure response for confirmation: ${res.statusCode}`)
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
			const req = this._getProtocolModule()
			                .request(url, {
				                method: "GET",
				                headers: {"userIds": neverNull(this._connectedSseInfo).userIds.join(",")}
			                })
			                .on('response', res => {
				                if (res.statusCode === 404) {
					                fail(req, res, new FileNotFoundError("no missed notification"))
				                }
				                if (res.statusCode !== 200) {
					                fail(req, res, `error during missedNotification retrieval, got ${res.statusCode}`)
					                return
				                }
				                res.setEncoding('utf8')
				                res.on('data', data => {
					                try {
						                const mn = MissedNotification.fromJSON(data)
						                resolve(mn)
					                } catch (e) {
						                fail(req, res, e)
					                }
				                })
				                   .on('close', () => console.log("dl missed notification response closed"))
				                   .on('error', e => fail(req, res, e))
			                })
			                .on('error', e => fail(req, null, e))
			                .end()
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

	/**
	 * http can't do https, https can't do http. saves typing while testing locally.
	 */
	_getProtocolModule(): typeof http | typeof https {
		return neverNull(this._connectedSseInfo).sseOrigin.startsWith('http:') ? http : https
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
		const obj = JSON.parse(json)
		try {
			DesktopUtils.checkDataFormat(obj, {
				title: {type: 'string'},
				confirmationId: {type: 'string'},
				hasAlarmNotifications: {type: 'boolean'},
				changeTime: {type: 'string', assert: v => !isNaN(parseInt(v))},
				notificationInfos: [
					{
						address: {type: 'string', assert: v => isMailAddress(v, true)},
						counter: {type: 'number', assert: v => v > 0},
						userId: {type: 'string'}
					}
				]
			})
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
		const obj = JSON.parse(json)
		console.log(obj)
		try {
			obj.alarmNotifications.forEach(an => an.notificationSessionKeys.forEach(nfsk => console.warn(nfsk)))
			DesktopUtils.checkDataFormat(obj, {
				_format: {type: 'string'},
				_id: [{type: 'string'}],
				_ownerEncSessionKey: {type: 'string', optional: true},
				_ownerGroup: {type: 'string'},
				_permissions: {type: 'string'},
				changeTime: {type: 'string', assert: v => !isNaN(parseInt(v))},
				confirmationId: {type: 'string'},
				alarmNotifications: [
					{
						_id: {type: 'string'},
						eventEnd: {type: 'string'},
						eventStart: {type: 'string'},
						operation: {type: 'string'},
						summary: {type: 'string'},
						alarmInfo: {
							_id: {type: 'string'},
							alarmIdentifier: {type: 'string'},
							trigger: {type: 'string'},
							calendarRef: {
								_id: {type: 'string'},
								elementId: {type: 'string'},
								listId: {type: 'string'}
							}
						},
						notificationSessionKeys: [
							{
								_id: {type: 'string'},
								pushIdentifierSessionEncSessionKey: {type: 'string'},
								pushIdentifier: [{type: 'string'}],
							}
						],
						repeatRule: {
							_id: {type: 'string'},
							endType: {type: 'string'},
							endValue: {type: 'string', optional: true},
							frequency: {type: 'string'},
							interval: {type: 'string'},
							timeZone: {type: 'string'},
						},
						user: {type: 'string'}
					}
				],
				notificationInfos: [{address: {type: 'string'}, counter: {type: 'number'}, userId: {type: 'string'}}]
			})
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
				return {"_id": generateId(4), "value": userId}
			})
		}
	))
}

function generateId(byteLength: number): string {
	return base64ToBase64Url(crypto.randomBytes(byteLength).toString('base64'))
}
