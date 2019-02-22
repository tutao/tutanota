// @flow

import {conf} from "./DesktopConfigHandler"
import {app} from 'electron'
import crypto from 'crypto'
import http from 'http'
import https from 'https'
import {base64ToBase64Url} from "../api/common/utils/Encoding"
import {SseError} from "../api/common/error/SseError"
import {isMailAddress} from "../misc/FormatValidator"
import {neverNull, randomIntFromInterval} from "../api/common/utils/Utils"
import {notifier} from './DesktopNotifier.js'
import {wm} from "./DesktopWindowManager.js"
import {NotificationResult} from "./DesktopNotifier"

export type SseInfo = {|
	identifier: string,
	sseOrigin: string,
	userIds: Array<string>
|}

// how long should we wait to retry after failing to get a response?
const INITIAL_CONNECT_TIMEOUT = 60
const MAX_CONNECT_TIMEOUT = 2400

class DesktopSseClient {
	_connectedSseInfo: ?SseInfo;
	_connection: ?ClientRequest;
	_readTimeoutInSeconds: number;
	_connectTimeoutInSeconds: number;
	_nextReconnect: ?TimeoutID;
	_tryToReconnect: boolean;

	constructor() {
		this._connectedSseInfo = conf.getDesktopConfig('pushIdentifier')
		this._readTimeoutInSeconds = conf.getDesktopConfig('heartbeatTimeoutInSeconds')
		this._connectTimeoutInSeconds = INITIAL_CONNECT_TIMEOUT
		this._tryToReconnect = true
		this._reschedule(1)

		app.on('will-quit', () => {
			this._cleanup()
			this._tryToReconnect = false
		})
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
			}
		}
		const sseInfo = {identifier, sseOrigin, userIds}
		return conf.setDesktopConfig('pushIdentifier', sseInfo)
		           .then(() => {
			           this._connectedSseInfo = sseInfo
			           if (this._connection) {
				           this._connection.abort()
				           this._reschedule(INITIAL_CONNECT_TIMEOUT)
			           }
		           })
	}

	getPushIdentifier(): ?string {
		const pushIdentifier = conf.getDesktopConfig('pushIdentifier')
		return pushIdentifier
			? pushIdentifier.identifier
			: null
	}

	clear() {
		conf.setDesktopConfig('pushIdentifier', null)
	}

	connect() {
		this._reschedule(10)
		if (!this._connectedSseInfo) {
			console.log("sse info not available, skip reconnect")
			return
		}
		const sseInfo = this._connectedSseInfo

		// now actually try to connect
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
				                       conf.setDesktopConfig('pushIdentifier', null)
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
			                          .on('error', e => console.log('sse response error:', e))
		                       })
		                       .on('information', e => console.log('sse information:', e))
		                       .on('connect', e => console.log('sse connect:', e))
		                       .on('error', e => console.log('sse error:', e))
		                       .end()
	}

	_processSseData(data: string) {
		if (!data.startsWith("data")) {
			console.log('sse heartbeat')
			this._reschedule()
			return
		}
		data = data.substring(6) // throw away 'data: '
		if (data.startsWith('heartbeatTimeout')) {
			this._readTimeoutInSeconds = Number(data.split(':')[1])
			conf.setDesktopConfig('heartbeatTimeoutInSeconds', this._readTimeoutInSeconds)
			this._reschedule()
			return
		}

		const pushMessages: Array<PushMessage> = data
			.split('\ndata: ')
			.map(p => {
				try {
					return PushMessage.fromJSON(p)
				} catch (e) {
					console.log("failed to parse push message from json:", e, "\n\noffending json:\n", p)
				}
			})
			.filter(Boolean)

		if (pushMessages.length === 0) {
			//no reschedule, something went wrong with the events sent from the server
			return
		}

		if (this._connectedSseInfo) {
			pushMessages.forEach(pm =>
				this._sendConfirmation(neverNull(this._connectedSseInfo).identifier, pm.confirmationId)
			)
		}

		pushMessages.map(pm => pm.notificationInfos.forEach(ni => {
			const w = wm.getAll().find(w => w.getUserId() === ni.userId)
			if (w && w.isVisible()) {
				// no need for notification if user is looking right at the window
				return
			}
			notifier.submitGroupedNotification(
				pm.title,
				`${ni.address} (${ni.counter})`,
				ni.userId,
				res => {
					if (res === NotificationResult.Click) {
						wm.openMailBox({userId: ni.userId, mailAddress: ni.address})
					}
				}
			)
		}))
		this._reschedule()
	}

	_sendConfirmation(pushIdentifier: string, confirmationId: string) {
		if (!this._connectedSseInfo) {
			return
		}
		const confirmUrl = this._connectedSseInfo.sseOrigin
			+ "/sse?pushIdentifier="
			+ encodeURIComponent(pushIdentifier)
			+ "&confirmationId="
			+ encodeURIComponent(confirmationId)

		this._getProtocolModule().request(confirmUrl, {method: "DELETE"})
		    .on('response', res => console.log('push message confirmation response code:', res.statusCode))
		    .on('error', e => console.log("failed to send push message confirmation:", e))
		    .end()
	}

	_cleanup() {
		if (this._connection) {
			this._connection.abort()
			this._connection = null
		}
	}

	_reschedule(delay?: number) {
		delay = delay ? delay : Math.floor(this._readTimeoutInSeconds * 1.2)
		console.log('scheduling to reconnect sse in', delay, 'seconds')
		// clearTimeout doesn't care about undefined or null, but flow still complains
		clearTimeout(neverNull(this._nextReconnect))
		if (!this._tryToReconnect) return
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


	constructor(title: string, confirmationId: string, notificationInfos: Array<NotificationInfo>) {
		this.title = title;
		this.confirmationId = confirmationId;
		this.notificationInfos = notificationInfos;
	}

	static fromJSON(json: string): PushMessage {
		const obj = JSON.parse(json)
		if ('string' !== typeof obj.title) throw new SseError(`invalid push message title: ${obj.title}`)
		if ('string' !== typeof obj.confirmationId) throw new SseError(`invalid confirmation id: ${obj.confirmationId}`)
		if (!Array.isArray(obj.notificationInfos)) throw new SseError(`invalid notificationInfos: ${obj.notificationInfos}`)
		obj.notificationInfos.forEach(notificationInfo => {
			if ('string' !== typeof notificationInfo.address
				|| !isMailAddress(notificationInfo.address, true)) {
				throw new SseError(`invalid address: ${notificationInfo.address}`)
			}
			if ('number' !== typeof notificationInfo.counter) throw new SseError(`invalid counter: ${notificationInfo.counter}`)
			if ('string' !== typeof notificationInfo.userId) throw new SseError(`invalid userId: ${notificationInfo.userId}`)
		})

		return new PushMessage(obj.title, obj.confirmationId, obj.notificationInfos)
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

export const sse = new DesktopSseClient()