// @flow
import o from "ospec/ospec.js"
import n from '../../nodemocker'
import {clone} from "../../../../src/api/common/utils/Utils"

o.spec("DesktopAlarmSchedulerTest", () => {

	n.startGroup(__filename, [
		"./DesktopConstants", "../DesktopConstants",
		"../../api/common/TutanotaConstants", "../TutanotaConstants",
		"./utils/Utils",
		"./TutanotaError",
		"../EntityFunctions",
		"../../api/common/utils/Utils", "./Utils",
		"./utils/Encoding",
		"../error/CryptoError",
		"./StringUtils",
		"./MapUtils",
		"./utils/ArrayUtils", "../../api/common/utils/ArrayUtils",
		"./EntityConstants"
	])

	const lang = {
		lang: {get: key => key}
	}
	const instanceMapper = {
		decryptAndMapToInstance: (tm, an) => Promise.resolve(Object.assign({}, an))
	}
	const keyCryptoUtils = {
		decrypt256Key: arg => arg
	}
	const cryptoUtils = {
		uint8ArrayToBitArray: arg => arg,
	}
	const scheduleUtils = {
		timeouts: [],
		scheduleAction: function (what, when) {
			return setTimeout(() => {}, this.timeouts.length)
		}
	}
	const alarmNotification = {}
	const wm = {}
	const notifier = {
		submitGroupedNotification: () => {}
	}
	const alarmStorage = {
		storeScheduledAlarms: () => Promise.resolve(),
		resolvePushIdentifierSessionKey: () => Promise.resolve({piSk: "piSk", piSkEncSk: "piSkEncSk"}),
		getScheduledAlarms: () => [
			{
				_id: "scheduledAlarmId1",
				eventStart: new Date('2019-10-08T09:38:14.835Z'),
				eventEnd: new Date('2019-10-08T09:38:14.900Z'),
				operation: "0",
				summary: "summary1",
				alarmInfo: {
					_id: "alarmInfoId1",
					alarmIdentifier: "alarmIdentifier1",
					trigger: "5M",
					calendarRef: {
						_id: "calendarRefId1",
						elementId: "calendarRefElementId1",
						listId: "calendarRefListId1"
					}
				},
				notificationSessionKeys: [
					{
						_id: "notificationSessionKeysId1",
						pushIdentifierSessionEncSessionKey: "pushIdentifierSessionEncSessionKey1",
						pushIdentifier: [
							"pushIdentifierPart1",
							"pushIdentifierPart2"
						]
					}
				],
				repeatRule: null,
				user: "userId1"
			}
		]
	}

	const standardMocks = () => {
		// node modules

		// our modules
		const langMock = n.mock("../../misc/LanguageViewModel", lang).set()
		const instanceMapperMock = n.mock("../../api/worker/crypto/InstanceMapper", instanceMapper).set()
		const keyCryptoUtilsMock = n.mock("../../api/worker/crypto/KeyCryptoUtils", keyCryptoUtils).set()
		const cryptoUtilsMock = n.mock("../../api/worker/crypto/CryptoUtils", cryptoUtils).set()
		const alarmNotificationMock = n.mock("../../api/entities/sys/AlarmNotification", alarmNotification).set()

		// instances
		const wmMock = n.mock('__wm', wm).set()
		const notifierMock = n.mock("__notifier", notifier).set()
		const alarmStorageMock = n.mock("__alarmStorage", alarmStorage).with({
			getScheduledAlarms: () => []
		}).set()

		return {
			langMock,
			instanceMapperMock,
			keyCryptoUtilsMock,
			cryptoUtilsMock,
			alarmNotificationMock,
			wmMock,
			notifierMock,
			alarmStorageMock,
		}
	}

	o("init, retrieve stored alarms, deletion of outdated alarms", done => {
		const {wmMock, notifierMock} = standardMocks()
		const alarmStorageMock = n.mock("__alarmStorage", alarmStorage).set()
		const {DesktopAlarmScheduler} = n.subject("../../src/desktop/sse/DesktopAlarmScheduler.js")
		const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock)

		o(alarmStorageMock.getScheduledAlarms.callCount).equals(1)
		setTimeout(() => {
			o(alarmStorageMock.storeScheduledAlarms.callCount).equals(1)
			o(alarmStorageMock.storeScheduledAlarms.args.length).equals(1)
			o(alarmStorageMock.storeScheduledAlarms.args[0]).deepEquals({})

			o(notifierMock.submitGroupedNotification.callCount).equals(0)
			done()
		}, 10)
	})

	o("whoopwhoop", done => {
		const {wmMock, notifierMock, alarmStorageMock} = standardMocks()
		const {DesktopAlarmScheduler} = n.subject("../../src/desktop/sse/DesktopAlarmScheduler.js")
		const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock)

		done()
	})
})


function cloneAlarmNotificationWithNewTime(an, startTime, endTime) {
	const clonedAn = clone(an)
	clonedAn.eventStart = startTime
	clonedAn.eventEnd = endTime
	return clonedAn
}

function createDeleteAlarmNotification(alarmIdentifier: string) {
	return {
		"_id": "irrelevantAlarmNotificationId",
		"eventEnd": "",
		"eventStart": "",
		"operation": "2",
		"summary": "",
		"alarmInfo": {
			"_id": "irrelevantAlarmInfoId",
			alarmIdentifier,
			"trigger": "",
			"calendarRef": {
				"_id": "yZRX5A",
				"elementId": "irrelevantElementId",
				"listId": "irrelevantListId"
			}
		},
		"notificationSessionKeys": [],
		"repeatRule": null,
		"user": "someIrrelevantUserId"
	}
}

function createAlarmInfo(trigger: string) {
	return {
		_id: 'alarmInfoId',
		alarmIdentifier: 'alarmIdentifier',
		trigger: trigger,
		calendarRef: {
			_id: 'calendarRefId',
			elementId: 'elementId',
			listId: 'listId',
		},
	}
}

function createAlarmNotification(startTime: Date, endTime: Date) {
	const an = {}
	return an
}
