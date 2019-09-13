// @flow
import o from "ospec"
import n from "../../nodemocker"
import {numberRange} from '../../../../src/api/common/utils/ArrayUtils.js'
import {AlarmInterval} from "../../../../src/api/common/TutanotaConstants"
import {downcast, neverNull, noOp} from "../../../../src/api/common/utils/Utils"
import * as url from "url"
import * as querystring from "querystring"
import {_TypeModel as MissedNotificationTypeModel, createMissedNotification} from "../../../../src/api/entities/sys/MissedNotification"
import type {TimeoutMock} from "../../../api/TestUtils"
import {makeTimeoutMock} from "../../../api/TestUtils"
import {DesktopSseClient} from "../../../../src/desktop/sse/DesktopSseClient"
import {DesktopConfigKey} from "../../../../src/desktop/config/ConfigKeys"
import type {DesktopConfig} from "../../../../src/desktop/config/DesktopConfig"
import type {DesktopNotifier} from "../../../../src/desktop/DesktopNotifier"
import type {WindowManager} from "../../../../src/desktop/DesktopWindowManager"
import type {DesktopAlarmScheduler} from "../../../../src/desktop/sse/DesktopAlarmScheduler"
import type {DesktopCryptoFacade} from "../../../../src/desktop/DesktopCryptoFacade"
import type {DesktopAlarmStorage} from "../../../../src/desktop/sse/DesktopAlarmStorage"
import type {LanguageViewModel} from "../../../../src/misc/LanguageViewModel"
import type {DesktopNetworkClient} from "../../../../src/desktop/DesktopNetworkClient"

o.spec("DesktopSseClient Test", function () {
	const identifier = 'identifier'
	const userIds = ["id1", "id2"]

	let conf
	let net
	let electronMock: $Exports<'electron'>
	let confMock: DesktopConfig
	let notifierMock: DesktopNotifier
	let wmMock: WindowManager
	let netMock: DesktopNetworkClient
	let alarmSchedulerMock: DesktopAlarmScheduler
	let cryptoMock: DesktopCryptoFacade
	let alarmStorageMock: DesktopAlarmStorage
	let timeoutMock: TimeoutMock
	let langMock: LanguageViewModel


	o.beforeEach(function () {
		conf = {
			removeListener: (key: string, cb: ()=>void) => n.spyify(conf),
			on: (key: string) => n.spyify(conf),
			getVar: (key: string) => {
				switch (key) {
					case 'pushIdentifier':
						return {
							identifier: identifier,
							sseOrigin: 'http://here.there',
							userIds: userIds.slice()
						}
					case 'heartbeatTimeoutInSeconds':
						return 30

					case 'lastMissedNotificationCheckTime':
						return null

					case 'lastProcessedNotificationId':
						return null
					default:
						throw new Error(`unexpected getVar key ${key}`)
				}
			},
			setVar: (key: string, val: any) => {
			},
			getConst: (key: string) => {
				switch (key) {
					case 'initialSseConnectTimeoutInSeconds':
						return 1
					case 'maxSseConnectTimeoutInSeconds':
						return 10
					default:
						throw new Error(`unexpected getConst key ${key}`)
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
				getVersion: () => "x.y.z"
			},
			net: {}
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

		const alarmScheduler = {
			handleAlarmNotification: () => {},
			unscheduleAllAlarms: () => {}
		}

		const crypto = {
			generateId: () => "an_id"
		}

		const lang = {
			get: (key: string) => {
				return key
			}
		}

		net = {
			request: function (url, params) {
				return new net.ClientRequest(url, params)
			},
			ClientRequest: n.classify({
				prototype: {
					requestUrl: null,
					requestParams: null,
					constructor(url, requestParams) {
						this.requestUrl = url
						this.requestParams = requestParams
					},
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
					setEncoding: function (enc) {
					},
					destroy: function () {},
					headers: {},
				},
				statics: {}
			})
		}
		const notifier = {
			submitGroupedNotification: () => {
			},
			showOneShot: () => {}
		}

		electronMock = n.mock("electron", electron).set()
		confMock = n.mock("__conf", conf).set()
		notifierMock = n.mock("../DesktopNotifier", notifier).set()
		wmMock = n.mock('__wm', wm).set()
		netMock = n.mock("__net", net).set()
		alarmStorageMock = n.mock("__alarmStorage", {
			removePushIdentifierKeys: () => {}
		}).set()
		cryptoMock = downcast(crypto)
		alarmSchedulerMock = n.mock('__alarmScheduler', alarmScheduler).set()
		timeoutMock = makeTimeoutMock()
		langMock = n.mock('__lang', lang).set()
	})

	o("start, connect, shutdown", async function () {
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)

		sse.start()
		timeoutMock.next()
		await Promise.resolve()
		timeoutMock.next()
		await Promise.resolve()

		//wait for first and second connection attempt
		o(netMock.request.callCount).equals(2) // we timed out once

		const requestUrl = url.parse(netMock.request.args[0])
		o(requestUrl.pathname).equals("/sse")
		const requestBody = JSON.parse(querystring.parse(neverNull(requestUrl.query))._body)
		o(requestBody).deepEquals({
			_format: '0',
			identifier,
			userIds: [{_id: "an_id", value: userIds[0]}],
		})

		const res = new net.Response(200)
		net.ClientRequest.mockedInstances[1].callbacks['response'](res)
		o(sse._nextReconnect).notEquals(undefined)
		o(res.setEncoding.callCount).equals(1)
		o(res.setEncoding.args[0]).equals('utf8')

		//store new timeout value
		res.callbacks['data']("data: heartbeatTimeout:42\n")
		o(confMock.setVar.calls[1].args).deepEquals([DesktopConfigKey.heartbeatTimeoutInSeconds, 42])

		//check for reschedule on heartbeat
		let oldTimeout = sse._nextReconnect
		res.callbacks['data']("\n")
		o(sse._nextReconnect).notEquals(oldTimeout)

		// reschedule on connection close
		oldTimeout = sse._nextReconnect
		res.callbacks["close"]()
		o(sse._nextReconnect).notEquals(oldTimeout)

		//done
		res.callbacks['data']("data: heartbeatTimeout:1\n")
		downcast(electronMock.app).callbacks['will-quit']()
		o(net.ClientRequest.mockedInstances[1].abort.callCount).equals(1)
	})

	o("reschedule on heartbeat timeout", async function () {
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)
		let res = new net.Response(200)
		let oldTimeout
		sse.start()
		timeoutMock.next()
		await Promise.resolve()

		net.ClientRequest.mockedInstances[0].callbacks['response'](res)
		res.callbacks['data']("data: heartbeatTimeout:1")
		oldTimeout = sse._nextReconnect

		// heartbeat times out...
		timeoutMock.next()
		await Promise.resolve()

		// should have rescheduled
		o(sse._nextReconnect).notEquals(oldTimeout)

		//done
		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("403 response causes deletion of userid", async function () {
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)
		const res = new net.Response(403)
		sse.start()
		timeoutMock.next()
		await Promise.delay(5)
		net.ClientRequest.mockedInstances[0].callbacks['response'](res)
		await Promise.resolve()
		o(confMock.setVar.args[0]).equals("pushIdentifier")
		o(confMock.setVar.args[1]).deepEquals({
			identifier,
			sseOrigin: 'http://here.there',
			userIds: ['id2'],
		})
		o(alarmSchedulerMock.unscheduleAllAlarms.calls[0].args).deepEquals(['id1'])
		o(sse._nextReconnect).notEquals(null)

		// done
		res.callbacks['data']("data: heartbeatTimeout:1\n")
		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("invalid heartbeatTimeout from server is not saved", async function () {
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)
		let res = new net.Response(200)
		sse.start()
		timeoutMock.next()
		await Promise.resolve()
		net.ClientRequest.mockedInstances[0].callbacks['response'](res)

		await Promise.resolve()
		res.callbacks['data']("data: heartbeatTimeout:42\n")
		res.callbacks['data']("data: heartbeatTimeout:baz\n")

		await Promise.delay(10)
		o(sse._readTimeoutInSeconds).equals(42)

		// done
		res.callbacks['data']("data: heartbeatTimeout:1")
		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("reschedule after receiving pushMessages", async function () {
		const timeoutSpy: any = n.spyify(timeoutMock)
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutSpy)
		let res = new net.Response(200)
		sse.start()
		o(timeoutSpy.callCount).equals(1)
		timeoutSpy.next()
		await Promise.resolve()
		o(timeoutSpy.callCount).equals(2)
		net.ClientRequest.mockedInstances[0].callbacks['response'](res)
		res.callbacks['data']("data: heartbeatTimeout:1\n")
		res.callbacks["data"]("data: notification\n")

		// await Promise.resolve()
		o(timeoutSpy.callCount).equals(3)
		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("invalid pushMessages from server prevents reschedule", async function () {
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)
		let res = new net.Response(200)
		let oldTimeout
		sse.start()
		timeoutMock.next()
		await Promise.resolve()

		net.ClientRequest.mockedInstances[0].callbacks['response'](res)
		res.callbacks['data']("data: heartbeatTimeout:3\n")
		oldTimeout = sse._nextReconnect
		res.callbacks["data"](`data: ${JSON.stringify({
			title: "invalid"
		})}`)
		// should not have rescheduled
		o(sse._nextReconnect).equals(oldTimeout)
		//done
		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("retry connection later if there is no sseInfo", async function () {
		const confMock = n.mock("__conf", conf)
		                  .with({
			                  getVar: (key: string) => {
				                  switch (key) {
					                  case 'pushIdentifier':
						                  return null
					                  case 'heartbeatTimeoutInSeconds':
						                  return 30
					                  default:
						                  throw new Error(`unexpected getVar key ${key}`)
				                  }
			                  },
		                  }).set()
		const timeoutSpy = o.spy(timeoutMock)

		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutSpy)
		sse.start()
		o(timeoutSpy.args[1]).equals(1000)
		timeoutMock.next()
		await Promise.resolve()
		o(timeoutSpy.args[1]).equals(10 * 1000)
	})

	o("send notification for incoming pm", async function () {
		let setVars = {}
		const confMock = n.mock("__conf", conf)
		                  .with({
			                  getVar: (key: string) => {
				                  switch (key) {
					                  case 'pushIdentifier':
						                  return {
							                  identifier: 'identifier',
							                  sseOrigin: 'http://here.there',
							                  userIds: ["id1", "id2"]
						                  }
					                  case 'heartbeatTimeoutInSeconds':
						                  return 30
					                  case DesktopConfigKey.lastProcessedNotificationId:
						                  return lastProcessedId
					                  case DesktopConfigKey.lastMissedNotificationCheckTime:
						                  return null
					                  default:
						                  throw new Error(`unexpected getVar key ${key}`)
				                  }
			                  },
			                  setVar(k, v) {
				                  setVars[k] = v
			                  },
		                  }).set()
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)
		const lastProcessedId = 'ab2c'
		let sseConnectResponse = new net.Response(200)
		sse.start()
		timeoutMock.next()
		await Promise.resolve()
		const sseConnectRequest = net.ClientRequest.mockedInstances[0]
		const clientRequest = url.parse(sseConnectRequest.requestUrl)
		o(clientRequest.pathname).equals("/sse")
		sseConnectRequest.callbacks['response'](sseConnectResponse)
		sseConnectResponse.callbacks['data']("data: heartbeatTimeout:3\n")
		sseConnectResponse.callbacks['data'](`data: notification\n`)
		await Promise.delay(5)
		o(setVars[DesktopConfigKey.heartbeatTimeoutInSeconds]).equals(3)

		await Promise.resolve()
		const missedNotificationRequest = net.ClientRequest.mockedInstances[1]
		o(missedNotificationRequest.requestParams.headers.lastProcessedNotificationId).equals(lastProcessedId)
		const missedNotification = {
			confirmationId: "confId",
			changeTime: "2345678901234",
			notificationInfos: [
				{
					mailAddress: "me@here.com",
					counter: 2,
					userId: "someId"
				}
			],
			alarmNotifications: [],
			lastProcessedNotificationId: '1',
		}
		const missedNotificationResponse = new net.Response(200)
		missedNotificationRequest.callbacks['response'](missedNotificationResponse)
		missedNotificationResponse.callbacks['data'](JSON.stringify(missedNotification))
		missedNotificationResponse.callbacks['end']()
		sseConnectResponse.callbacks['data'](`data: notification\n`)

		await Promise.resolve()
		o(confMock.setVar.calls[2].args).deepEquals([DesktopConfigKey.lastProcessedNotificationId, '1'])
		o(notifierMock.submitGroupedNotification.callCount).equals(1)
		o(notifierMock.submitGroupedNotification.args[0]).equals("pushNewMail_msg")
		o(notifierMock.submitGroupedNotification.args[1]).equals("me@here.com (2)")
		o(notifierMock.submitGroupedNotification.args[2]).equals("someId")

		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("don't send notification for active window", async function () {
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)
		let res = new net.Response(200)
		sse.start()
		timeoutMock.next()
		await Promise.resolve()

		net.ClientRequest.mockedInstances[0].callbacks['response'](res)
		res.callbacks['data']("data: heartbeatTimeout:3\n")
		o(notifierMock.submitGroupedNotification.callCount).equals(0)
		res.callbacks['data'](`data: ${JSON.stringify({
			title: "pm-title",
			confirmationId: "confId-aw",
			hasAlarmNotifications: false,
			changeTime: "2345678901234",
			notificationInfos: [
				{
					address: "me@here.com",
					counter: 2,
					userId: "notYourId"
				}
			]
		})}\n`)

		o(notifierMock.submitGroupedNotification.callCount).equals(0)

		//done
		res.callbacks['data']("data: heartbeatTimeout:1\n")
		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("download missed notification", async function () {
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)
		let sseResponse = new net.Response(200)
		sse.start()
		timeoutMock.next()

		await Promise.resolve()
		const sseRequest = net.ClientRequest.mockedInstances[0]
		sseRequest.callbacks['response'](sseResponse)
		sseResponse.callbacks['data']("data: heartbeatTimeout:3\n")
		sseResponse.callbacks['data'](`data: notification\n`)

		await Promise.resolve()

		let missedNotificationResponse = new net.Response(200)
		o(netMock.request.callCount).equals(2)
		o(netMock.request.args[0]).equals("http://here.there/rest/sys/missednotification/aWRlbnRpZmllcg")
		o(netMock.request.args[1]).deepEquals({
			method: 'GET',
			headers: {
				userIds: 'id1',
				v: MissedNotificationTypeModel.version,
				cv: electronMock.app.getVersion()
			},
			timeout: 20000
		})


		const missedNotification = {
			alarmNotifications: [
				{
					eventStart: new Date('2019-10-08T09:38:14.835Z'),
					eventEnd: new Date('2019-10-08T09:38:14.900Z'),
					operation: "0",
					summary: "this is a summary",
					alarmInfo: {alarmIdentifier: "alarmId", trigger: AlarmInterval.FIVE_MINUTES},
					notificationSessionKeys: [
						{
							pushIdentifierSessionEncSessionKey: Uint8Array.from(numberRange(0, 255)),
							pushIdentifier: ["idpart1", "idpart2"]
						}
					],
					repeatRule: null,
					user: "id1"
				}
			],
			notificationInfos: [
				{
					mailAddress: "id1@tuta.io",
					userId: "id1",
					counter: 42
				}
			],
			changeTime: "2345678901234",
			confirmationId: "missedNotificationConfId"
		}

		const missedNotificationRequest = net.ClientRequest.mockedInstances[1]
		missedNotificationRequest.callbacks['response'](missedNotificationResponse)
		missedNotificationResponse.callbacks['data'](`${JSON.stringify(missedNotification)}\n`)
		missedNotificationResponse.callbacks['end']()

		await sse._handlingPushMessage

		o(notifierMock.submitGroupedNotification.callCount).equals(1)
		o(notifierMock.submitGroupedNotification.args.length).equals(4)
		o(notifierMock.submitGroupedNotification.args[0]).equals("pushNewMail_msg")
		o(notifierMock.submitGroupedNotification.args[1]).equals("id1@tuta.io (42)")
		o(notifierMock.submitGroupedNotification.args[2]).equals("id1")
		o(typeof notifierMock.submitGroupedNotification.args[3]).equals('function')

		o(alarmSchedulerMock.handleAlarmNotification.callCount).equals(1)
		o(alarmSchedulerMock.handleAlarmNotification.args.length).equals(1)
		o(alarmSchedulerMock.handleAlarmNotification.args[0]).deepEquals({
			eventStart: '2019-10-08T09:38:14.835Z',
			eventEnd: '2019-10-08T09:38:14.900Z',
			operation: "0",
			summary: "this is a summary",
			alarmInfo: {alarmIdentifier: "alarmId", trigger: AlarmInterval.FIVE_MINUTES},
			notificationSessionKeys: [
				{
					pushIdentifierSessionEncSessionKey: Object.assign({}, downcast(numberRange(0, 255))),
					pushIdentifier: ["idpart1", "idpart2"]
				}
			],
			repeatRule: null,
			user: "id1"
		})

		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("download nonexistent missed notification", async function () {
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)
		let res = new net.Response(200)
		sse.start()
		timeoutMock.next()
		await Promise.resolve()

		net.ClientRequest.mockedInstances[0].callbacks['response'](res)
		res.callbacks['data']("data: heartbeatTimeout:3\n")
		res.callbacks['data'](`data: notification\n`)
		await Promise.resolve()
		// wait for missedNotification request to be sent...
		let missedNotificationResponse = new net.Response(200)
		net.ClientRequest.mockedInstances[1].callbacks['response'](missedNotificationResponse)
		missedNotificationResponse.callbacks["data"](JSON.stringify(createMissedNotification()) + "\n")

		await Promise.resolve()
		o(notifierMock.submitGroupedNotification.callCount).equals(0)
		o(alarmSchedulerMock.handleAlarmNotification.callCount).equals(0)
		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("download missed notification with 401", async function () {
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)
		let res = new net.Response(200)
		sse.start()
		timeoutMock.next()
		await Promise.resolve()

		net.ClientRequest.mockedInstances[0].callbacks['response'](res)
		res.callbacks['data']("data: heartbeatTimeout:3\n")
		res.callbacks['data'](`data: notification\n`)
		await Promise.resolve()
		// wait for missedNotification request to be sent...
		let missedNotificationResponse = new net.Response(401)
		net.ClientRequest.mockedInstances[1].callbacks['response'](missedNotificationResponse)

		await sse._handlingPushMessage.catch(noOp)

		o(notifierMock.submitGroupedNotification.callCount).equals(0)
		o(alarmSchedulerMock.handleAlarmNotification.callCount).equals(0)
		o(confMock.setVar.calls[2].args).deepEquals([
			'pushIdentifier', {
				identifier,
				sseOrigin: 'http://here.there',
				userIds: ['id2'],
			}
		])
		o(alarmSchedulerMock.unscheduleAllAlarms.calls[0].args).deepEquals(['id1'])
		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("error code on downloadMissedNotification", async function () {
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutMock)
		const sseResponse = new net.Response(200)
		sse.start()
		timeoutMock.next()
		await Promise.delay(8)

		net.ClientRequest.mockedInstances[0].callbacks['response'](sseResponse)
		sseResponse.callbacks['data']("data: heartbeatTimeout:3\n")
		sseResponse.callbacks['data'](`data: notification\n`)

		// wait for missedNotification request to be sent...
		await Promise.delay(1)
		let missedNotificationResponse = new net.Response(1234)
		net.ClientRequest.mockedInstances[1].callbacks['response'](missedNotificationResponse)
		o(net.ClientRequest.mockedInstances[1].abort.callCount).equals(1)
		o(missedNotificationResponse.destroy.callCount).equals(1)

		await Promise.delay(1)
		o(netMock.request.callCount).equals(2)
		o(notifierMock.showOneShot.callCount).equals(1)
		o(notifierMock.showOneShot.args.length).equals(1)
		o(notifierMock.showOneShot.args[0]).deepEquals({title: "Failed to handle PushMessage"})

		downcast(electronMock.app).callbacks['will-quit']()
	})

	o("invalidateAlarms", async function () {
		const lastNotificationCheckTime = Date.now() - 1000 * 60 * 60 * 24 * 31 // 31 day
		const sseInfo = {identifier, userIds, origin: 'origin'}
		const confMock = n.mock("__conf", conf)
		                  .with({
			                  getVar: (key: string) => {
				                  switch (key) {
					                  case 'pushIdentifier':
						                  return sseInfo
					                  case 'heartbeatTimeoutInSeconds':
						                  return 30
					                  case DesktopConfigKey.lastMissedNotificationCheckTime:
						                  return String(lastNotificationCheckTime)
					                  default:
						                  throw new Error(`unexpected getVar key ${key}`)
				                  }
			                  },
		                  }).set()
		const timeoutSpy = o.spy(timeoutMock)
		const sse = new DesktopSseClient(electronMock.app, confMock, notifierMock, wmMock, alarmSchedulerMock, netMock, cryptoMock,
			alarmStorageMock, langMock, timeoutSpy)
		sse.start()
		timeoutMock.next()
		await Promise.delay(10)

		o(alarmSchedulerMock.unscheduleAllAlarms.callCount).equals(1)
		o(confMock.setVar.calls.map(c => c.args)).deepEquals([
			[DesktopConfigKey.lastMissedNotificationCheckTime, null],
			[DesktopConfigKey.pushIdentifier, {identifier, userIds: [], origin: sseInfo.origin}]
		])
		o(alarmStorageMock.removePushIdentifierKeys.callCount).equals(1)
		o(timeoutSpy.callCount).equals(1)
	})
})
