//
//  AlarmManagerTest.swift.swift
//  calendar
//
//  Created by Tutao GmbH on 20.04.26.
//
import Combine
import Mockingbird
import Testing
import TutanotaSharedFramework
import tutasdk

struct AlarmManagerTest {

	let userId1 = "userId1"
	let userId2 = "userId2"
	let sseInfo: SSEInfo

	init() {
		initMockingbird()
		sseInfo = SSEInfo(pushIdentifier: "pushIdentifier", sseOrigin: "sseorigin.com", userIds: [userId1, userId2])
	}

	// This test case has room for improvement
	@Test func rescheduleAlarms_deletes_alarms_that_are_encrypted_with_invalid_int_values() {

		var alarmPersistorMock = mock(AlarmPersistor.self)
		var alarmCryptorMock = mock(AlarmCryptor.self)
		var alarmSchedulerMock = mock(AlarmScheduler.self)
		var alarmCalculatorMock = mock(AlarmCalculator.self)

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
			alarmInfo: EncryptedAlarmInfo(alarmIdentifier: "", trigger: ""),
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

		given(alarmCalculatorMock.futureAlarmOccurrences(acrossAlarms: [], upToForEach: any(), upToOverall: any())).willReturn([])

		// when decrypting the alarm
		given(alarmPersistorMock.getAlarms()).willReturn([brokenEncryptedAlarmNotification])
		given(alarmCryptorMock.decrypt(alarm: brokenEncryptedAlarmNotification)).willThrow(SimpleStringConversionError.init())

		alarmManager.rescheduleAlarms()

		// then the alarm will not be scheduled in the persistor
		verify(alarmPersistorMock.store(alarms: [])).wasCalled(exactly(1))
	}
}
