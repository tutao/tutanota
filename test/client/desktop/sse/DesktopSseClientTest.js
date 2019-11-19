// @flow
import o from "ospec/ospec.js"
import n from "../../nodemocker"
import {numberRange} from '../../../../src/api/common/utils/ArrayUtils.js'
import {AlarmInterval} from "../../../../src/api/common/TutanotaConstants"
import {downcast} from "../../../../src/api/common/utils/Utils"

const SUBJECT_LOCATION = '../../src/desktop/sse/DesktopSseClient.js'

o.spec("DesktopSseClient Test", () => {
	n.startGroup(
		{
			group: __filename, allowables: [
				'../api/Env',
				"../DesktopConstants",
				'../misc/FormatValidator',
				'../api/common/utils/StringUtils',
				'../../api/common/error/SseError',
				'../../api/common/error/RestError',
				'../../api/common/error/FileNotFoundError',
				'../../api/common/utils/Encoding',
				'../error/CryptoError',
				'./TutanotaError',
				'./StringUtils',
				'./TutanotaError',
				'../misc/FormatValidator',
				'../api/common/utils/StringUtils',
				'../../api/common/utils/Utils',
				'../TutanotaConstants',
				'./utils/Utils',
				'../EntityFunctions',
				'./utils/Encoding',
				'./EntityConstants',
				'./utils/Utils',
				'./utils/ArrayUtils',
				'./Utils',
				'./MapUtils',
				'./Utils',
			], timeout: 6000
		})

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
		},
		showOneShot: () => {}
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
		handleAlarmNotification: () => {}
	}

	const crypto = {
		randomBytes: (len) => {
			const array = Uint8Array.from(numberRange(0, len - 1))
			return Buffer.from(array)
		}
	}

	const http = {
		request: url => {
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
				setEncoding: function (enc) {
				},
				destroy: function () {}
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
		const notifierMock = n.mock("../DesktopNotifier", notifier).set()

		// instances
		const confMock = n.mock("__conf", conf).set()
		const wmMock = n.mock('__wm', wm).set()
		const alarmSchedulerMock = n.mock('__alarmScheduler', alarmScheduler).set()

		return {
			electronMock,
			confMock,
			notifierMock,
			wmMock,
			alarmSchedulerMock,
			httpMock,
			httpsMock,
			cryptoMock,
		}
	}

	o("construction", () => {
		const {electronMock, confMock, notifierMock, wmMock, alarmSchedulerMock} = standardMocks()

		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)

		o(electronMock.app.on.callCount).equals(1)
	})

	o("start, connect, shutdown", done => {
		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)

		sse.start()

		//wait for first and second connection attempt
		setTimeout(() => {
			o(httpMock.request.callCount).equals(2) // we timed out once
			o(httpMock.request.args[0])
				.equals('http://here.there/sse?_body=%7B%22_format%22%3A%220%22%2C%22identifier%22%3A%22identifier%22%2C%22userIds%22%3A%5B%7B%22_id%22%3A%22AAECAw%22%2C%22value%22%3A%22id1%22%7D%2C%7B%22_id%22%3A%22AAECAw%22%2C%22value%22%3A%22id2%22%7D%5D%7D')
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
		}, 2500)
	})

	o("reschedule on heartbeat timeout", done => {
		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
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
		const {electronMock, confMock, notifierMock, httpMock, wmMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
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
		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
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
		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
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
		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
		let res = new httpMock.Response(200)
		let oldTimeout
		sse.start()

		setTimeout(() => {
			httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
			res.callbacks['data']("data: heartbeatTimeout:3")
			oldTimeout = sse._nextReconnect
			res.callbacks["data"](`data: ${JSON.stringify({
				title: "invalid"
			})}`)
			// should not have rescheduled
			o(sse._nextReconnect).equals(oldTimeout)
			//done
			electronMock.app.callbacks['will-quit']()
			done()
		}, 1000)
	})

	o("retry connection later if there is no sseInfo", done => {
		const {electronMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
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
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
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
		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
		let res = new httpMock.Response(200)
		sse.start()

		setTimeout(() => {
			httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
			res.callbacks['data']("data: heartbeatTimeout:3")
			res.callbacks['data'](`data: ${JSON.stringify({
				title: "pm-title",
				confirmationId: "confId",
				changeTime: "2345678901234",
				notificationInfos: [
					{
						address: "me@here.com",
						counter: 2,
						userId: "someId"
					}
				]
			})}`)
		}, 1500)

		setTimeout(() => {
			const confRes = new httpMock.Response(200)
			httpMock.ClientRequest.mockedInstances[1].callbacks['response'](confRes)
		}, 2000)

		setTimeout(() => {

			o(notifierMock.submitGroupedNotification.callCount).equals(1)
			o(notifierMock.submitGroupedNotification.args[0]).equals("pm-title")
			o(notifierMock.submitGroupedNotification.args[1]).equals("me@here.com (2)")
			o(notifierMock.submitGroupedNotification.args[2]).equals("someId")

			res.callbacks["data"](`data: ${JSON.stringify({
				title: "pm-title",
				confirmationId: "confId",
				changeTime: "3345678901234",
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
		}, 2200)

		setTimeout(() => {
			const confRes = new httpMock.Response(200)
			httpMock.ClientRequest.mockedInstances[2].callbacks['response'](confRes)
		}, 2300)

		setTimeout(() => {
			o(notifierMock.submitGroupedNotification.callCount).equals(3)
			o(notifierMock.submitGroupedNotification.args[0]).equals("pm-title")
			o(notifierMock.submitGroupedNotification.args[1]).equals("me2@here.com (1)")
			o(notifierMock.submitGroupedNotification.args[2]).equals("someOtherId")

			//done
			res.callbacks['data']("data: heartbeatTimeout:1")
		}, 2500)

		setTimeout(() => {
			electronMock.app.callbacks['will-quit']()
			done()
		}, 3000)
	})

	o("don't send notification for active window", done => {
		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
		let res = new httpMock.Response(200)
		sse.start()
		setTimeout(() => {
			httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
			res.callbacks['data']("data: heartbeatTimeout:3")
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
			})}`)

			o(notifierMock.submitGroupedNotification.callCount).equals(0)

			//done
			res.callbacks['data']("data: heartbeatTimeout:1")
			electronMock.app.callbacks['will-quit']()
		}, 1500)

		setTimeout(() => {
			done()
		}, 2500)
	})

	o("ignore outdated pm", done => {
		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
		let res = new httpMock.Response(200)
		sse.start()
		setTimeout(() => {
			httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res) // TODO!
			res.callbacks['data']("data: heartbeatTimeout:3")
			res.callbacks['data'](`data: ${JSON.stringify({
				title: "pm-title-outdated",
				confirmationId: "confId-outdated",
				hasAlarmNotifications: false,
				changeTime: "-10",
				notificationInfos: [
					{
						address: "you@there.com",
						counter: 22,
						userId: "anId"
					}
				]
			})}`)
		}, 1500)

		setTimeout(() => {
			o(httpMock.request.callCount).equals(1)
			o(notifierMock.submitGroupedNotification.callCount).equals(0)

			//done
			res.callbacks['data']("data: heartbeatTimeout:1")
			electronMock.app.callbacks['will-quit']()
		}, 1500)

		setTimeout(() => {
			done()
		}, 2500)
	})

	o("download missed notification", done => {
		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
		let res = new httpMock.Response(200)
		sse.start()

		setTimeout(() => {
			httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
			res.callbacks['data']("data: heartbeatTimeout:3")
			res.callbacks['data'](`data: ${JSON.stringify({
				title: "pm-title-hasAlarmNotifications",
				confirmationId: "hasAlarmNotificationConfId",
				hasAlarmNotifications: true,
				changeTime: "2345678901234",
				notificationInfos: []
			})}`)
		}, 1200)

		// wait for missedNotification request to be sent...
		setTimeout(() => {
			let res2 = new httpMock.Response(200)

			o(httpMock.request.callCount).equals(2)
			o(httpMock.request.args[0]).equals("http://here.there/rest/sys/missednotification/A/aWRlbnRpZmllcg")
			o(httpMock.request.args[1]).deepEquals({
				method: 'GET',
				headers: {userIds: 'id1,id2'},
				timeout: 20000
			})
			httpMock.ClientRequest.mockedInstances[1].callbacks['response'](res2)
			res2.callbacks['data'](JSON.stringify({
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
						address: "id1@tuta.io",
						userId: "id1",
						counter: 42
					}
				],
				changeTime: "2345678901234",
				confirmationId: "missedNotificationConfId"
			}))
			res2.callbacks['end']()
		}, 1210)

		// wait for confirmation to be sent...
		setTimeout(() => {
			let res3 = new httpMock.Response(200)
			o(httpMock.request.callCount).equals(3)
			o(httpMock.request.args[0]).equals("http://here.there/rest/sys/missednotification/A/aWRlbnRpZmllcg")
			o(httpMock.request.args[1]).deepEquals({
				method: "DELETE",
				headers: {changeTime: "2345678901234", confirmationId: "missedNotificationConfId"}
			})
			httpMock.ClientRequest.mockedInstances[2].callbacks['response'](res3)
		}, 1220)

		// check notificationInfo/alarmInfo handling
		setTimeout(() => {
			o(notifierMock.submitGroupedNotification.callCount).equals(1)
			o(notifierMock.submitGroupedNotification.args.length).equals(4)
			o(notifierMock.submitGroupedNotification.args[0]).equals("pm-title-hasAlarmNotifications")
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
		}, 1230)

		//done
		setTimeout(() => {
			res.callbacks['data']("data: heartbeatTimeout:1")
			electronMock.app.callbacks['will-quit']()
		}, 2000)

		setTimeout(() => {
			done()
		}, 2500)
	})

	o("download nonexistent missed notification", done => {

		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
		let res = new httpMock.Response(200)
		sse.start()

		setTimeout(() => {
			httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
			res.callbacks['data']("data: heartbeatTimeout:3")
			res.callbacks['data'](`data: ${JSON.stringify({
				title: "pm-title-hasAlarmNotifications-404",
				confirmationId: "hasAlarmNotificationConfId-404",
				hasAlarmNotifications: true,
				changeTime: "2345678901234",
				notificationInfos: []
			})}`)
		}, 1200)

		// wait for missedNotification request to be sent...
		setTimeout(() => {
			let res2 = new httpMock.Response(404)
			httpMock.ClientRequest.mockedInstances[1].callbacks['response'](res2)
			o(httpMock.ClientRequest.mockedInstances[1].abort.callCount).equals(1)
			o(res2.destroy.callCount).equals(1)
		}, 1210)

		// no confirmation sent
		setTimeout(() => {
			o(httpMock.request.callCount).equals(2)
			o(notifierMock.showOneShot.callCount).equals(0)
		}, 1220)

		//done
		setTimeout(() => {
			res.callbacks['data']("data: heartbeatTimeout:1")
			electronMock.app.callbacks['will-quit']()
		}, 2000)

		setTimeout(() => {
			done()
		}, 2500)
	})

	o("error code on downloadMissedNotification ", done => {

		const {electronMock, confMock, notifierMock, wmMock, httpMock, alarmSchedulerMock} = standardMocks()
		const {DesktopSseClient} = n.subject(SUBJECT_LOCATION)
		const sse = new DesktopSseClient(confMock, notifierMock, wmMock, alarmSchedulerMock)
		let res = new httpMock.Response(200)
		sse.start()

		setTimeout(() => {
			httpMock.ClientRequest.mockedInstances[0].callbacks['response'](res)
			res.callbacks['data']("data: heartbeatTimeout:3")
			res.callbacks['data'](`data: ${JSON.stringify({
				title: "pm-title-hasAlarmNotifications-1234",
				confirmationId: "hasAlarmNotificationConfId-1234",
				hasAlarmNotifications: true,
				changeTime: "2345678901234",
				notificationInfos: []
			})}`)
		}, 1200)

		// wait for missedNotification request to be sent...
		setTimeout(() => {
			let res2 = new httpMock.Response(1234)
			httpMock.ClientRequest.mockedInstances[1].callbacks['response'](res2)
			o(httpMock.ClientRequest.mockedInstances[1].abort.callCount).equals(1)
			o(res2.destroy.callCount).equals(1)
		}, 1210)

		// no confirmation sent
		setTimeout(() => {
			o(httpMock.request.callCount).equals(2)
			o(notifierMock.showOneShot.callCount).equals(1)
			o(notifierMock.showOneShot.args.length).equals(1)
			o(notifierMock.showOneShot.args[0]).deepEquals({title: "Failed to handle PushMessage"})
		}, 1220)

		//done
		setTimeout(() => {
			res.callbacks['data']("data: heartbeatTimeout:1")
			electronMock.app.callbacks['will-quit']()
		}, 2000)

		setTimeout(() => {
			done()
		}, 2500)
	})
})
