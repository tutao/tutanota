// @flow
import o from "ospec/ospec.js"
import n from '../../nodemocker'
import {EndType, RepeatPeriod} from "../../../../src/api/common/TutanotaConstants"
import {MAX_SAFE_DELAY} from "../../../../src/desktop/sse/DesktopAlarmScheduler"
import {downcast} from "../../../../src/api/common/utils/Utils"

const START_DATE = new Date(2019, 9, 10, 14).getTime()
const oldTimezone = process.env.TZ

o.before(() => process.env.TZ = 'Europe/Berlin')
o.after(() => process.env.TZ = oldTimezone)

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
	], 2000)

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

	const timeProvider = n.classify({
		prototype: {
			constructor: function (maxExecutions = Infinity) {
				this.timeouts = []
				this.executedTimeouts = []
				this.deletedTimeouts = []
				this.currentId = 0
				this.currentTime = START_DATE
			},
			setTimeout: function (what, when) {
				this.timeouts.push({what, when: when + this.currentTime, id: this.currentId++})
				this.timeouts.sort((a, b) => a.when - b.when)
				return this.currentId
			},
			clearTimeout: function (id) {
				const index = this.timeouts.findIndex(toi => toi.id === id)
				if (index === -1) return
				const to = this.timeouts.splice(index, 1)[0]
				this.deletedTimeouts.push({id: to.id, when: to.when})
			},
			now: function () {return this.currentTime},
			tickOnce: function () {
				this.currentTime += 15
				if (this.timeouts.length === 0) return false
				const to = this.timeouts.shift()
				this.currentTime = to.when
				to.what()
				this.executedTimeouts.push({id: to.id, when: to.when})
				return true
			},
			tickAll: function () {
				while (this.tickOnce()) ;
			}
		},
		statics: {}
	})

	const alarmNotification = {}
	const wm = {}
	const notifier = {
		submitGroupedNotification: () => {
			console.log("show notification!")
		}
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
		const timeProviderMock = new timeProvider()
		const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, timeProviderMock)

		o(alarmStorageMock.getScheduledAlarms.callCount).equals(1)
		setTimeout(() => {
			o(alarmStorageMock.storeScheduledAlarms.callCount).equals(1)
			o(alarmStorageMock.storeScheduledAlarms.args.length).equals(1)
			o(alarmStorageMock.storeScheduledAlarms.args[0]).deepEquals({})

			o(notifierMock.submitGroupedNotification.callCount).equals(0)

			o(timeProviderMock.setTimeout.callCount).equals(0)
			done()
		}, 1000)
	})

	o("schedule at most MAX_OCCURRENCES alarms", done => {
		const {wmMock, notifierMock, alarmStorageMock} = standardMocks()
		const {DesktopAlarmScheduler} = n.subject("../../src/desktop/sse/DesktopAlarmScheduler.js")
		const timeProviderMock = new timeProvider(Infinity, 30)
		const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, timeProviderMock)

		const an = createAlarmNotification({
			startTime: new Date(2019, 9, 20, 10),
			endTime: new Date(2019, 9, 20, 12),
			trigger: "5M",
			endType: EndType.Never,
			endValue: null,
			frequency: RepeatPeriod.DAILY,
			interval: '1',
		})
		const delAn = createDeleteAlarmNotification(an.alarmInfo.alarmIdentifier)

		scheduler.handleAlarmNotification(an)

		setTimeout(() => {
			o(alarmStorageMock.storeScheduledAlarms.callCount).equals(1)
			o(alarmStorageMock.storeScheduledAlarms.args.length).equals(1)
			o(alarmStorageMock.storeScheduledAlarms.args[0][an.alarmInfo.alarmIdentifier].an).deepEquals(an)

			o(notifierMock.submitGroupedNotification.callCount).equals(0)

			o(timeProviderMock.setTimeout.callCount).equals(10)

			scheduler.handleAlarmNotification(delAn)
		}, 10)

		setTimeout(() => {
			o(alarmStorageMock.storeScheduledAlarms.callCount).equals(2)
			o(alarmStorageMock.storeScheduledAlarms.args.length).equals(1)
			o(alarmStorageMock.storeScheduledAlarms.args[0]).deepEquals({})

			o(notifierMock.submitGroupedNotification.callCount).equals(0)
			o(timeProviderMock.setTimeout.callCount).equals(10)
			o(timeProviderMock.clearTimeout.callCount).equals(10)
			done()
		}, 20)
	})

	o("schedule intermediate timeout for events too far in the future", done => {
		const {wmMock, notifierMock, alarmStorageMock} = standardMocks()
		const {DesktopAlarmScheduler} = n.subject("../../src/desktop/sse/DesktopAlarmScheduler.js")
		const timeProviderMock = new timeProvider()
		const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, timeProviderMock)

		const an = createAlarmNotification({
			startTime: new Date(2020, 9, 20, 10),
			endTime: new Date(2020, 9, 20, 12),
			trigger: "5M"
		})
		scheduler.handleAlarmNotification(an)
		setTimeout(() => {
			o(timeProviderMock.setTimeout.callCount).equals(1)
			o(timeProviderMock.timeouts[0].when).equals(START_DATE + MAX_SAFE_DELAY)
			done()
		}, 10)
	})

	o("don't schedule alarms for occurrences in the past", done => {
		const {wmMock, notifierMock, alarmStorageMock} = standardMocks()
		const {DesktopAlarmScheduler} = n.subject("../../src/desktop/sse/DesktopAlarmScheduler.js")
		const timeProviderMock = new timeProvider()
		const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, timeProviderMock)

		const an = createAlarmNotification({
			startTime: new Date(2017, 9, 20, 10),
			endTime: new Date(2017, 9, 20, 12),
			trigger: "5M"
		})
		scheduler.handleAlarmNotification(an)
		setTimeout(() => {
			o(timeProviderMock.setTimeout.callCount).equals(0)
			done()
		}, 10)
	})

	o("show notification for alarm and reschedule next occurrence", done => {
		const {wmMock, notifierMock, alarmStorageMock} = standardMocks()
		const {DesktopAlarmScheduler} = n.subject("../../src/desktop/sse/DesktopAlarmScheduler.js")
		const timeProviderMock = new timeProvider()
		const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, timeProviderMock)

		const an = createAlarmNotification({
			startTime: mkDate('Oct 20 2019 10:00'),
			endTime: mkDate('Oct 20 2019 12:00'),
			trigger: "5M",
			endType: EndType.Never,
			endValue: null,
			frequency: RepeatPeriod.ANNUALLY,
			interval: '1'
		})
		scheduler.handleAlarmNotification(an)

		setTimeout(() => {
			const notifyTime = mkDate('Oct 20 2019 09:55').getTime()
			timeProviderMock.tickOnce()
			o(timeProviderMock.setTimeout.callCount).equals(2)
			o(timeProviderMock.clearTimeout.callCount).equals(1)
			o(timeProviderMock.executedTimeouts[0].when).equals(notifyTime)
			o(timeProviderMock.timeouts.length).equals(1)
			o(timeProviderMock.timeouts[0].when).equals(notifyTime + MAX_SAFE_DELAY)
			done()
		}, 10)
	})

	o("handle multiple events", done => {
		const {wmMock, notifierMock, alarmStorageMock} = standardMocks()
		const {DesktopAlarmScheduler} = n.subject("../../src/desktop/sse/DesktopAlarmScheduler.js")
		const timeProviderMock = new timeProvider()
		const scheduler = new DesktopAlarmScheduler(wmMock, notifierMock, alarmStorageMock, timeProviderMock)

		const an1 = createAlarmNotification({
			startTime: new Date(2019, 9, 20, 10),
			endTime: new Date(2019, 9, 20, 12),
			trigger: "5M",
			endType: EndType.Never,
			endValue: null,
			frequency: RepeatPeriod.ANNUALLY,
			interval: '1'
		})

		const an2 = createAlarmNotification({
			startTime: new Date(2019, 9, 20, 10),
			endTime: new Date(2019, 9, 20, 12),
			trigger: "5M",
			endType: EndType.Never,
			endValue: null,
			frequency: RepeatPeriod.ANNUALLY,
			interval: '1'
		})

		const an3 = createDeleteAlarmNotification(an1.alarmInfo.alarmIdentifier)
		scheduler.handleAlarmNotification(an1)
		setTimeout(() => {
			scheduler.handleAlarmNotification(an2)
		}, 10)

		setTimeout(() => {
			o(timeProviderMock.setTimeout.callCount).equals(2)
			scheduler.handleAlarmNotification(an3)
		}, 20)

		setTimeout(() => {
			o(timeProviderMock.setTimeout.callCount).equals(2)
			o(timeProviderMock.clearTimeout.callCount).equals(1)
			o(timeProviderMock.clearTimeout.args[0]).equals(1)
			done()
		}, 30)

	})

	o("alarm occurrences", () => {
		standardMocks()
		const {occurrenceIterator} = n.subject("../../src/desktop/sse/DesktopAlarmScheduler.js")

		// test EndType.Count
		testOccurrenceArray(occurrenceIterator, {
			startTime: mkDate('Oct 20 2019 10:00'),
			endTime: mkDate('Oct 20 2019 12:00'),
			trigger: "5M",
			endType: EndType.Count,
			endValue: 7,
			frequency: RepeatPeriod.DAILY,
			interval: '1'
		}, [
			mkDate('Oct 20 2019 10:00'),
			mkDate('Oct 21 2019 10:00'),
			mkDate('Oct 22 2019 10:00'),
			mkDate('Oct 23 2019 10:00'),
			mkDate('Oct 24 2019 10:00'),
			mkDate('Oct 25 2019 10:00'),
			mkDate('Oct 26 2019 10:00')
		].map(d => d.toISOString()))

		testOccurrenceArray(occurrenceIterator, {
			startTime: mkDate('Oct 20 2019 10:00'),
			endTime: mkDate('Oct 21 2019 12:00'),
			trigger: "5M",
			endType: EndType.Count,
			endValue: 7,
			frequency: RepeatPeriod.DAILY,
			interval: '1'
		}, [
			mkDate('Oct 20 2019 10:00'),
			mkDate('Oct 21 2019 10:00'),
			mkDate('Oct 22 2019 10:00'),
			mkDate('Oct 23 2019 10:00'),
			mkDate('Oct 24 2019 10:00'),
			mkDate('Oct 25 2019 10:00'),
			mkDate('Oct 26 2019 10:00')
		].map(d => d.toISOString()))

		testOccurrenceArray(occurrenceIterator, {
			startTime: mkDate('Oct 20 2019 10:00'),
			endTime: mkDate('Oct 21 2019 12:00'),
			trigger: "5M",
			endType: EndType.Count,
			endValue: 7,
			frequency: RepeatPeriod.DAILY,
			interval: '2'
		}, [
			mkDate('Oct 20 2019 10:00'),
			mkDate('Oct 22 2019 10:00'),
			mkDate('Oct 24 2019 10:00'),
			mkDate('Oct 26 2019 10:00'),
			mkDate('Oct 28 2019 10:00'),
			mkDate('Oct 30 2019 10:00'),
			mkDate('Nov 01 2019 10:00')
		].map(d => d.toISOString()))

		testOccurrenceArray(occurrenceIterator, {
			startTime: mkDate('Oct 20 2019 10:00'),
			endTime: mkDate('Oct 21 2019 12:00'),
			trigger: "5M",
			endType: EndType.Count,
			endValue: 7,
			frequency: RepeatPeriod.WEEKLY,
			interval: '1'
		}, [
			mkDate('Oct 20 2019 10:00'),
			mkDate('Oct 27 2019 10:00'),
			mkDate('Nov 03 2019 10:00'),
			mkDate('Nov 10 2019 10:00'),
			mkDate('Nov 17 2019 10:00'),
			mkDate('Nov 24 2019 10:00'),
			mkDate('Dec 01 2019 10:00')
		].map(d => d.toISOString()))

		testOccurrenceArray(occurrenceIterator, {
			startTime: mkDate('Oct 31 2019 10:00'),
			endTime: mkDate('Nov 1 2019 12:00'),
			trigger: "5M",
			endType: EndType.Count,
			endValue: 7,
			frequency: RepeatPeriod.MONTHLY,
			interval: '1'
		}, [
			mkDate('Oct 31 2019 10:00'),
			mkDate('Nov 30 2019 10:00'),
			mkDate('Dec 31 2019 10:00'),
			mkDate('Jan 31 2020 10:00'),
			mkDate('Feb 29 2020 10:00'),
			mkDate('Mar 31 2020 10:00'),
			mkDate('Apr 30 2020 10:00')
		].map(d => d.toISOString()))

		testOccurrenceArray(occurrenceIterator, {
			startTime: mkDate('Feb 29 2020 10:00'),
			endTime: mkDate('Mar 1 2020 12:00'),
			trigger: "5M",
			endType: EndType.Count,
			endValue: 7,
			frequency: RepeatPeriod.ANNUALLY,
			interval: '1'
		}, [
			mkDate('Feb 29 2020 10:00'),
			mkDate('Feb 28 2021 10:00'),
			mkDate('Feb 28 2022 10:00'),
			mkDate('Feb 28 2023 10:00'),
			mkDate('Feb 29 2024 10:00'),
			mkDate('Feb 28 2025 10:00'),
			mkDate('Feb 28 2026 10:00')
		].map(d => d.toISOString()))

		//test EndType.UntilDate
		testOccurrenceArray(occurrenceIterator, {
			startTime: mkDate('Oct 20 2019 10:00'),
			endTime: mkDate('Oct 20 2019 12:00'),
			trigger: "5M",
			endType: EndType.UntilDate,
			endValue: new Date(2019, 9, 23).getTime().toString(),
			frequency: RepeatPeriod.DAILY,
			interval: '1'
		}, [
			mkDate('Oct 20 2019 10:00'),
			mkDate('Oct 21 2019 10:00'),
			mkDate('Oct 22 2019 10:00')
		].map(d => d.toISOString()))

		testOccurrenceArray(occurrenceIterator, {
			startTime: mkDate('Feb 29 2020 10:00'),
			endTime: mkDate('Mar 1 2020 12:00'),
			trigger: "5M",
			endType: EndType.UntilDate,
			endValue: new Date(2020, 2, 28).getTime().toString(),
			frequency: RepeatPeriod.WEEKLY,
			interval: '1'
		}, [
			mkDate('Feb 29 2020 10:00'),
			mkDate('Mar 07 2020 10:00'),
			mkDate('Mar 14 2020 10:00'),
			mkDate('Mar 21 2020 10:00')
		].map(d => d.toISOString()))

		testOccurrenceArray(occurrenceIterator, {
			startTime: new Date(2020, 1, 29, 10),
			endTime: new Date(2020, 2, 1, 12),
			trigger: "5M",
			endType: EndType.UntilDate,
			endValue: new Date(2020, 5, 29).getTime().toString(),
			frequency: RepeatPeriod.MONTHLY,
			interval: '1'
		}, [
			mkDate('Feb 29 2020 10:00'),
			mkDate('Mar 29 2020 10:00'),
			mkDate('Apr 29 2020 10:00'),
			mkDate('May 29 2020 10:00')
		].map(d => d.toISOString()))

		testOccurrenceArray(occurrenceIterator, {
			startTime: mkDate('Feb 29 2020 10:00'),
			endTime: mkDate('Mar 1 2020 12:00'),
			trigger: "5M",
			endType: EndType.UntilDate,
			endValue: mkDate('Jun 29 2025').getTime().toString(),
			frequency: RepeatPeriod.ANNUALLY,
			interval: '1'
		}, [
			mkDate('Feb 29 2020 10:00'),
			mkDate('Feb 28 2021 10:00'),
			mkDate('Feb 28 2022 10:00'),
			mkDate('Feb 28 2023 10:00'),
			mkDate('Feb 29 2024 10:00'),
			mkDate('Feb 28 2025 10:00')
		].map(d => d.toISOString()))

		// non-repeating
		testOccurrenceArray(occurrenceIterator, {
			startTime: mkDate('Feb 29 2020 10:00'),
			endTime: mkDate('Mar 1 2020 12:00'),
			trigger: "5M",
			endType: null,
		}, [mkDate('Feb 29 2020 10:00').toISOString()])
	})
})

function mkDate(str) {
	return new Date(Date.parse(str))
}

function testOccurrenceArray(occurrenceIterator, anOpts, expectedOccurrences) {
	const an = createAlarmNotification(anOpts)
	an[Symbol.iterator] = occurrenceIterator
	const occurrences = []
	for (const occurrence of downcast(an)) {
		occurrences.push(occurrence.toISOString())
	}
	o(occurrences).deepEquals(expectedOccurrences)
}

let alarmIdCounter = 0

function createAlarmNotification(opts: any) {
	const {startTime, endTime, trigger, endType, endValue, frequency, interval} = opts
	alarmIdCounter++
	const an = {
		_id: `scheduledAlarmId${alarmIdCounter}`,
		eventStart: startTime,
		eventEnd: endTime,
		operation: "0",
		summary: `summary${alarmIdCounter}`,
		alarmInfo: {
			_id: `alarmInfoId1${alarmIdCounter}`,
			alarmIdentifier: `alarmIdentifier${alarmIdCounter}`,
			trigger,
			calendarRef: {
				_id: `calendarRefId${alarmIdCounter}`,
				elementId: `calendarRefElementId${alarmIdCounter}`,
				listId: `calendarRefListId${alarmIdCounter}`
			}
		},
		notificationSessionKeys: [
			{
				_id: `notificationSessionKeysId${alarmIdCounter}`,
				pushIdentifierSessionEncSessionKey: `pushIdentifierSessionEncSessionKey${alarmIdCounter}`,
				pushIdentifier: [
					`pushIdentifier${alarmIdCounter}Part1`,
					`pushIdentifier${alarmIdCounter}Part2`
				]
			}
		],
		repeatRule: endType ? {
			_id: `repeatRuleId${alarmIdCounter}`,
			endType,
			endValue,
			frequency,
			interval
		} : null,
		user: "userId1"
	}
	return an
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

