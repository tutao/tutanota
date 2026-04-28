//
//  AlarmManagerTest.swift.swift
//  calendar
//
//  Created by Tutao GmbH on 20.04.26.
//
import Combine
import Mockable
import Testing
import TutanotaSharedFramework

struct AlarmManagerTestWithMocks {

	let userId1 = "userId1"
	let userId2 = "userId2"
	let sseInfo: SSEInfo

	init() { sseInfo = SSEInfo(pushIdentifier: "pushIdentifier", sseOrigin: "sseorigin.com", userIds: [userId1, userId2]) }

	// This test case has room for improvement
	@Test func rescheduleAlarms_deletes_alarms_that_are_encrypted_with_invalid_int_values() {

		let alarmPersistorMock = MockAlarmPersistor()
		let alarmCryptorMock = MockAlarmCryptor()
		let alarmSchedulerMock = MockAlarmScheduler()
		let alarmCalculatorMock = MockAlarmCalculator()

		let validEncryptedAlarmNotification: EncryptedAlarmNotification
		let brokenEncryptedAlarmNotification: EncryptedAlarmNotification

		var alarmManager: AlarmManager = AlarmManager(
			alarmPersistor: alarmPersistorMock,
			alarmCryptor: alarmCryptorMock,
			alarmScheduler: alarmSchedulerMock,
			alarmCalculator: alarmCalculatorMock
		)

		validEncryptedAlarmNotification = EncryptedAlarmNotification(
			operation: .Create,
			summary: "",
			eventStart: "",
			eventEnd: "",
			alarmInfo: EncryptedAlarmInfo(alarmIdentifier: "identifier", trigger: "1D"),
			repeatRule: nil,
			notificationSessionKeys: [],
			user: ""
		)

		brokenEncryptedAlarmNotification = EncryptedAlarmNotification(
			operation: .Create,
			summary: "",
			eventStart: "",
			eventEnd: "",
			alarmInfo: EncryptedAlarmInfo(alarmIdentifier: "", trigger: ""),
			repeatRule: nil,
			notificationSessionKeys: [],
			user: ""
		)

		// given an alarm encrypted with an invalid endValue in its repeat rule

		given(alarmCalculatorMock).futureAlarmOccurrences(acrossAlarms: .value([]), upToForEach: .any, upToOverall: .any).willReturn([])

		// when decrypting the alarm
		let validAlarmNotification = makeAlarm(eventStartAt: Date(), trigger: "1D", repeatRule: nil, identifier: "identifier", userID: "")

		given(alarmPersistorMock).alarms.willReturn([brokenEncryptedAlarmNotification, validEncryptedAlarmNotification])
		given(alarmPersistorMock).store(alarms: .any).willReturn()

		given(alarmCryptorMock).decrypt(alarm: .value(brokenEncryptedAlarmNotification)).willThrow(SimpleStringConversionError())
		given(alarmCryptorMock).decrypt(alarm: .value(validEncryptedAlarmNotification)).willReturn(validAlarmNotification)

		given(alarmCalculatorMock).futureAlarmOccurrences(acrossAlarms: .any, upToForEach: .any, upToOverall: .any).willReturn([])

		alarmManager.rescheduleAlarms()

		// then the alarm will not be scheduled in the persistor
		verify(alarmPersistorMock).store(alarms: .value([validEncryptedAlarmNotification])).called(.once)
	}
}
