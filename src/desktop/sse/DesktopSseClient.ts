import type { App } from "electron"
import type { TimeoutSetter } from "@tutao/tutanota-utils"
import {
	assertNotNull,
	base64ToBase64Url,
	filterInt,
	neverNull,
	randomIntFromInterval,
	remove,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
} from "@tutao/tutanota-utils"
import type { DesktopNotifier } from "../DesktopNotifier"
import { NotificationResult } from "../DesktopNotifier"
import type { WindowManager } from "../DesktopWindowManager"
import type { DesktopConfig } from "../config/DesktopConfig"
import { FileNotFoundError } from "../../api/common/error/FileNotFoundError"
import type { NativeAlarmScheduler } from "./DesktopAlarmScheduler"
import type { DesktopNetworkClient } from "../net/DesktopNetworkClient.js"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { typeModels } from "../../api/entities/sys/TypeModels"
import type { DesktopAlarmStorage } from "./DesktopAlarmStorage"
import type { LanguageViewModelType } from "../../misc/LanguageViewModel"
import type { NotificationInfo } from "../../api/entities/sys/TypeRefs.js"
import { handleRestError, NotAuthenticatedError, NotAuthorizedError, ServiceUnavailableError, TooManyRequestsError } from "../../api/common/error/RestError"
import { TutanotaError } from "../../api/common/error/TutanotaError"
import { log } from "../DesktopLog"
import { BuildConfigKey, DesktopConfigEncKey, DesktopConfigKey } from "../config/ConfigKeys"
import http from "node:http"
import { EncryptedAlarmNotification } from "../../native/common/EncryptedAlarmNotification.js"

export type SseInfo = {
	identifier: string
	sseOrigin: string
	userIds: Array<string>
}
const MISSED_NOTIFICATION_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days

const TAG = "[DesktopSseClient]"

export class DesktopSseClient {
	private readonly _app: App
	private readonly _conf: DesktopConfig
	private readonly _wm: WindowManager
	private readonly _notifier: DesktopNotifier
	private readonly _alarmScheduler: NativeAlarmScheduler
	private readonly _net: DesktopNetworkClient
	private readonly _alarmStorage: DesktopAlarmStorage
	private readonly _delayHandler: TimeoutSetter
	private readonly _lang: LanguageViewModelType
	private readonly _crypto: DesktopNativeCryptoFacade
	private _connectedSseInfo: SseInfo | null = null
	private _connection: http.ClientRequest | null = null
	_readTimeoutInSeconds!: number
	_nextReconnect: TimeoutID | null
	private _tryToReconnect: boolean
	private _lastProcessedChangeTime: number
	private _reconnectAttempts: number
	// We use this promise for queueing processing of notifications. There could be a smarter queue which clears all downloads older than
	// the response.
	_handlingPushMessage: Promise<any>

	constructor(
		app: App,
		conf: DesktopConfig,
		notifier: DesktopNotifier,
		wm: WindowManager,
		alarmScheduler: NativeAlarmScheduler,
		net: DesktopNetworkClient,
		desktopCrypto: DesktopNativeCryptoFacade,
		alarmStorage: DesktopAlarmStorage,
		lang: LanguageViewModelType,
		delayHandler: TimeoutSetter = setTimeout,
	) {
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
		app.on("will-quit", () => {
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
		log.debug(TAG, "storing push identifier")
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

		const sseInfo = {
			identifier,
			sseOrigin,
			userIds,
		}
		return this._conf.setVar(DesktopConfigEncKey.sseInfo, sseInfo).then(() => {
			this._connectedSseInfo = sseInfo
		})
	}

	async removeUser(userId: string): Promise<void> {
		await this._removeUserId(userId)
	}

	/**
	 * return the stored SseInfo if we can decrypt one.
	 * If not, we'll assume that all stored
	 * pushIdentifierSessionKeys, AlarmNotifications and set Alarms are invalid.
	 * @returns {Promise<?SseInfo>}
	 */
	async getSseInfo(): Promise<SseInfo | null> {
		const sseInfo: SseInfo | null = await this._conf.getVar(DesktopConfigEncKey.sseInfo)

		if (this._tryToReconnect && sseInfo == null) {
			log.warn(TAG, "sseInfo corrupted or not present, making sure pushEncSessionKeys and scheduled alarms are cleared")
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

			log.debug(TAG, "sse info not available, skip reconnect")
			return Promise.resolve()
		}

		const sseInfo = this._connectedSseInfo

		if (await this.hasNotificationTTLExpired()) {
			log.debug(TAG, "invalidating alarms on connect")
			return this.resetStoredState()
		}

		const initialConnectTimeoutSeconds = await this._conf.getConst(BuildConfigKey.initialSseConnectTimeoutInSeconds)
		const maxConnectTimeoutSeconds = await this._conf.getConst(BuildConfigKey.maxSseConnectTimeoutInSeconds)
		// double the connection timeout with each attempt to connect, capped by maxConnectTimeoutSeconds
		const connectionTimeoutInSeconds = Math.min(initialConnectTimeoutSeconds * Math.pow(2, this._reconnectAttempts), maxConnectTimeoutSeconds)
		this._reconnectAttempts++

		this._reschedule(randomIntFromInterval(1, connectionTimeoutInSeconds))

		this._disconnect()

		const userId = sseInfo.userIds[0]

		if (userId == null) {
			log.debug(TAG, "No user IDs, skip reconnect")
			return Promise.resolve()
		}

		const url = this.getSseUrl(sseInfo, userId)
		log.debug(TAG, "starting sse connection")
		this._connection = this._net.request(url, {
			headers: {
				"Content-Type": "application/json",
				Connection: "Keep-Alive",
				"Keep-Alive": "header",
				Accept: "text/event-stream",
				v: typeModels.MissedNotification.version,
				cv: this._app.getVersion(),
			},
			method: "GET",
		})
		this._connection
			.on("socket", (s) => {
				// We add this listener purely as a workaround for some problem with net module.
				// The problem is that sometimes request gets stuck after handshake - does not process unless some event
				// handler is called (and it works more reliably with console.log()).
				// This makes the request magically unstuck, probably console.log does some I/O and/or socket things.
				s.on("lookup", () => log.debug("lookup sse request"))
			})
			.on("response", async (res) => {
				this._reconnectAttempts = 1
				log.debug("established SSE connection with code", res.statusCode)

				if (res.statusCode === 403 || res.statusCode === 401) {
					// invalid userids
					log.debug("sse: got NotAuthenticated or NotAuthorized, deleting userId")
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

				res.setEncoding("utf8")
				let resData = ""
				res.on("data", (d) => {
					// add new data to the buffer
					resData += d
					const lines = resData.split("\n")
					resData = lines.pop() ?? "" // put the last line back into the buffer

					for (const l of lines) {
						this._processSseData(l, userId)
					}
				})
					.on("close", () => {
						log.debug("sse response closed")

						this._disconnect()

						this._reschedule(initialConnectTimeoutSeconds)
					})
					.on("error", (e) => console.error("sse response error:", e))
			})
			.on("information", (e) => log.debug(TAG, "sse information"))
			.on("connect", (e) => log.debug(TAG, "sse connect:"))
			.on("error", (e) => console.error("sse error:", e.message))
			.end()
		return Promise.resolve()
	}

	async _removeUserId(userId: string): Promise<SseInfo | null> {
		log.debug(TAG, "Removing user", userId)
		this._alarmScheduler.unscheduleAllAlarms(userId)

		const sseInfo: SseInfo | null = await this.getSseInfo()

		if (sseInfo) {
			remove(sseInfo.userIds, userId)
			await this._conf.setVar(DesktopConfigEncKey.sseInfo, sseInfo)
			this._connectedSseInfo = sseInfo
		}

		return sseInfo
	}

	_processSseData(data: string, userId: string): void {
		if (!data.startsWith("data")) {
			log.debug(TAG, "sse heartbeat", this._readTimeoutInSeconds)

			this._reschedule()

			return
		}

		data = data.trim()
		if (data.length < 7) return
		data = data.substring(6)

		// check for heartbeat settings
		if (data.startsWith("heartbeatTimeout:")) {
			log.debug(TAG, "received new timeout:", data)
			const newTimeout = Number(data.split(":")[1])

			if (typeof newTimeout === "number" && !Number.isNaN(newTimeout)) {
				this._readTimeoutInSeconds = newTimeout

				this._conf.setVar(DesktopConfigKey.heartbeatTimeoutInSeconds, newTimeout)
			} else {
				log.error(TAG, "got invalid heartbeat timeout from server")
			}

			this._reschedule()

			return
		}

		if (data === "notification") {
			this._handlePushMessage(userId)
				.then(() => this._reschedule())
				.catch(async (e) => {
					if (e instanceof NotAuthenticatedError || e instanceof NotAuthorizedError) {
						log.error(TAG, "Not authorized or not authenticated")
						// Reset the queue so that the previous error will not be handled again
						await this._removeUserId(userId)
						this._handlingPushMessage = Promise.resolve()

						this._disconnect()
					} else {
						log.error(TAG, "failed to handle push message:", e)

						this._notifier.showOneShot({
							title: "Failed to handle PushMessage",
						})
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
		log.debug(TAG, "last missed notification check:", {
			lastMissedNotificationCheckTime,
		})
		return lastMissedNotificationCheckTime && Date.now() - lastMissedNotificationCheckTime > MISSED_NOTIFICATION_TTL
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
		log.debug(TAG, "Resetting stored state")
		const tryToReconnect = this._tryToReconnect
		this._tryToReconnect = false

		this._reschedule() // deletes reschedule timeout

		await Promise.all([
			this._alarmScheduler.unscheduleAllAlarms(),
			this._conf.setVar(DesktopConfigKey.lastMissedNotificationCheckTime, null),
			this._conf.setVar(DesktopConfigKey.lastProcessedNotificationId, null),
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
		const process = () =>
			this._downloadMissedNotification(userId)
				.then((mn) => {
					this._conf.setVar(DesktopConfigKey.lastProcessedNotificationId, mn.lastProcessedNotificationId)

					this._conf.setVar(DesktopConfigKey.lastMissedNotificationCheckTime, Date.now())

					if (mn.notificationInfos && mn.notificationInfos.length === 0 && mn.alarmNotifications && mn.alarmNotifications.length === 0) {
						log.debug(TAG, "MissedNotification is empty")
					} else {
						for (const ni of mn.notificationInfos as Array<NotificationInfo>) {
							this._handleNotificationInfo(this._lang.get("pushNewMail_msg"), ni)
						}
						for (const an of mn.alarmNotifications as Array<EncryptedAlarmNotification>) {
							this._alarmScheduler.handleAlarmNotification(an)
						}
					}
				})
				.catch((e) => {
					if (e instanceof FileNotFoundError) {
						log.debug(TAG, "MissedNotification 404:", e)
					} else if (e instanceof ServiceUnavailableError) {
					} else {
						throw e
					}
				})

		this._handlingPushMessage = this._handlingPushMessage.then(process, (e) => {
			if (e instanceof NotAuthenticatedError) {
				throw e
			} else {
				log.debug(TAG, "Error while downloading missed notification", e)
				return process()
			}
		})
		return this._handlingPushMessage
	}

	_handleNotificationInfo(title: string, ni: NotificationInfo): void {
		const w = this._wm.getAll().find((w) => w.getUserId() === ni.userId)

		if (w && w.isFocused()) {
			// no need for notification if user is looking right at the window
			return
		}

		this._notifier.submitGroupedNotification(title, `${ni.mailAddress} (${ni.counter})`, ni.userId, (res) => {
			if (res === NotificationResult.Click) {
				this._wm.openMailBox({
					userId: ni.userId,
					mailAddress: ni.mailAddress,
				})
			}
		})
	}

	_downloadMissedNotification(userId: string): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const fail = (req: http.ClientRequest, res: http.IncomingMessage | null, e: TutanotaError | null) => {
				if (res) {
					res.destroy()
				}

				req.abort()
				reject(e)
			}

			const url = this.makeAlarmNotificationUrl(assertNotNull(this._connectedSseInfo))

			log.debug(TAG, "downloading missed notification")
			const headers: Record<string, string> = {
				userIds: userId,
				v: typeModels.MissedNotification.version,
				cv: this._app.getVersion(),
			}
			const lastProcessedId = await this._conf.getVar(DesktopConfigKey.lastProcessedNotificationId)

			if (lastProcessedId) {
				headers["lastProcessedNotificationId"] = lastProcessedId
			}

			const req: http.ClientRequest = this._net
				.request(url, {
					method: "GET",
					headers,
					// this defines the timeout for the connection attempt, not for waiting for the servers response after a connection was made
					timeout: 20000,
				})
				.on("timeout", () => {
					log.debug(TAG, "Missed notification download timeout")
					req.abort()
				})
				.on("socket", (s) => {
					// We add this listener purely as a workaround for some problem with net module.
					// The problem is that sometimes request gets stuck after handshake - does not process unless some event
					// handler is called (and it works more reliably with console.log()).
					// This makes the request magically unstuck, probably console.log does some I/O and/or socket things.
					s.on("lookup", () => log.debug(TAG, "lookup"))
				})
				.on("response", (res) => {
					log.debug(TAG, "missed notification response", res.statusCode)

					if (
						(res.statusCode === ServiceUnavailableError.CODE || TooManyRequestsError.CODE) &&
						(res.headers["retry-after"] || res.headers["suspension-time"])
					) {
						// headers are lowercased, see https://nodejs.org/api/http.html#http_message_headers
						const time = filterInt((res.headers["retry-after"] ?? res.headers["suspension-time"]) as string)
						log.debug(TAG, `ServiceUnavailable when downloading missed notification, waiting ${time}s`)
						res.destroy()
						req.abort()

						this._delayHandler(() => {
							this._downloadMissedNotification(userId).then(resolve, reject)
						}, time * 1000)

						return
					} else if (res.statusCode !== 200) {
						const tutanotaError = handleRestError(neverNull(res.statusCode), url, res.headers["Error-Id"] as string, null)
						fail(req, res, tutanotaError)
						return
					}

					res.setEncoding("utf8")
					let resData = ""
					res.on("data", (chunk) => {
						resData += chunk
					})
						.on("end", () => {
							try {
								resolve(JSON.parse(resData))
							} catch (e) {
								fail(req, res, e)
							}
						})
						.on("close", () => log.debug(TAG, "dl missed notification response closed"))
						.on("error", (e) => fail(req, res, e))
				})
				.on("error", (e) => fail(req, null, e))
			req.end()
		})
	}

	/** public for testing */
	makeAlarmNotificationUrl(sseInfo: SseInfo): string {
		const { identifier, sseOrigin } = sseInfo
		const customId = uint8ArrayToBase64(stringToUtf8Uint8Array(identifier))
		const url = new URL(sseOrigin)
		url.pathname = "rest/sys/missednotification/" + base64ToBase64Url(customId)
		return url.toString()
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

		if (typeof delaySeconds !== "number" || Number.isNaN(delaySeconds)) {
			console.error("invalid reschedule delay, setting to 10")
			delaySeconds = 10
		}

		log.debug(TAG, "scheduling to check sse in", delaySeconds, "seconds")
		this._nextReconnect = this._delayHandler(() => this.connect(), delaySeconds * 1000)
	}

	_requestJson(identifier: string, userId: string): string {
		return JSON.stringify({
			_format: "0",
			identifier: identifier,
			userIds: [
				{
					_id: this._crypto.generateId(4),
					value: userId,
				},
			],
		})
	}

	/** public for testing */
	getSseUrl(sseInfo: SseInfo, userId: string): string {
		const url = new URL(sseInfo.sseOrigin)
		url.pathname = "sse"
		url.searchParams.append("_body", this._requestJson(sseInfo.identifier, userId))
		return url.toString()
	}
}
