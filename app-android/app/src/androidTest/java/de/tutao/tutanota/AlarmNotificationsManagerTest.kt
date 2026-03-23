package de.tutao.tutanota

import de.tutao.tutanota.alarms.AlarmNotificationsManager
import de.tutao.tutanota.alarms.SystemAlarmFacade
import de.tutao.tutanota.push.LocalNotificationsFacade
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CryptoError
import de.tutao.tutashared.DateProvider
import de.tutao.tutashared.IdTupleCustom
import de.tutao.tutashared.OperationType
import de.tutao.tutashared.alarms.AlarmInterval
import de.tutao.tutashared.alarms.AlarmIntervalUnit
import de.tutao.tutashared.alarms.AlarmModel
import de.tutao.tutashared.alarms.AlarmModel.calculateAlarmTime
import de.tutao.tutashared.alarms.EncryptedAlarmInfo
import de.tutao.tutashared.alarms.EncryptedAlarmNotification
import de.tutao.tutashared.alarms.EncryptedAlarmNotificationEntity
import de.tutao.tutashared.alarms.EncryptedRepeatRule
import de.tutao.tutashared.alarms.EndType
import de.tutao.tutashared.alarms.RepeatPeriod
import de.tutao.tutashared.alarms.toEntity
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.toBase64
import org.junit.Before
import org.junit.Test
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.Mockito
import org.mockito.invocation.InvocationOnMock
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.stubbing.Answer
import java.security.KeyStoreException
import java.security.UnrecoverableEntryException
import java.time.Duration
import java.time.Instant
import java.util.Calendar
import java.util.Date
import java.util.TimeZone


class AlarmNotificationsManagerTest {
	private lateinit var manager: AlarmNotificationsManager

	private lateinit var systemAlarmFacade: SystemAlarmFacade
	private lateinit var sseStorage: SseStorage
	private lateinit var crypto: AndroidNativeCryptoFacade

	private val userId = "userId"
	private val pushIdentifierElementId = "elementId"
	private val pushIdentifierKey = "pushIdentifierKey".toByteArray()

	private val fakeDateProvider: FakeDateProvider = FakeDateProvider(Instant.parse("2026-03-23T10:00:00Z"))
	private val timeZone: TimeZone = TimeZone.getTimeZone("Europe/Berlin")

	@Before
	@Throws(CryptoError::class, UnrecoverableEntryException::class, KeyStoreException::class)
	fun setUp() {
		systemAlarmFacade = Mockito.mock(SystemAlarmFacade::class.java)
		sseStorage = Mockito.mock(SseStorage::class.java)
		crypto = Mockito.mock(AndroidNativeCryptoFacade::class.java)

		manager = AlarmNotificationsManager(
			sseStorage,
			crypto,
			systemAlarmFacade,
			Mockito.mock(LocalNotificationsFacade::class.java),
			fakeDateProvider,
			timeZone
		)
		Mockito.`when`(crypto.aesDecryptBase64String(any(), Mockito.anyString()))
			.thenAnswer(Answer { invocation: InvocationOnMock -> (invocation.getArgument<Any>(1) as String).toByteArray() } as Answer<ByteArray>)
		Mockito.`when`(sseStorage.getPushIdentifierSessionKey(pushIdentifierElementId)).thenReturn(pushIdentifierKey)
		Mockito.`when`(sseStorage.getReceiveCalendarNotificationConfig(any())).thenReturn(true)
	}

	@Test
	@Throws(UnrecoverableEntryException::class, KeyStoreException::class, CryptoError::class)
	fun testUnscheduleAlarms() {
		val singleAlarmIdentifier = "singleAlarmIdentifier"
		val repeatingAlarmIdentifier = "repeatingAlarmIdentifier"
		val alarmNotification = createEncryptedAlarmNotification(userId, singleAlarmIdentifier, null, null, null)
		val repeatRule =
			EncryptedRepeatRule(
				"1",
				"1",
				"Europe/Berlin",
				EndType.COUNT.ordinal.toString(),
				"2",
				emptyList(),
				emptyList()
			)
		val repeatingAlarmNotification = createEncryptedAlarmNotification(
			userId, repeatingAlarmIdentifier, null, null, repeatRule
		)
		val anotherUserAlarm = createEncryptedAlarmNotification("anotherUserId", "someIdentifeir", null, null, null)
		val alarms = ArrayList<EncryptedAlarmNotificationEntity>()
		alarms.add(alarmNotification.toEntity())
		alarms.add(repeatingAlarmNotification.toEntity())
		alarms.add(anotherUserAlarm.toEntity())
		Mockito.`when`(sseStorage.readAlarmNotifications()).thenReturn(alarms)
		manager.unscheduleAlarms(userId)
		Mockito.verify(systemAlarmFacade).cancelAlarm(singleAlarmIdentifier, 0)
		Mockito.verify(systemAlarmFacade).cancelAlarm(repeatingAlarmIdentifier, 0)
		Mockito.verify(systemAlarmFacade).cancelAlarm(repeatingAlarmIdentifier, 1)
		Mockito.verifyNoMoreInteractions(systemAlarmFacade)
		Mockito.verify(sseStorage).deleteAlarmNotification(singleAlarmIdentifier)
		Mockito.verify(sseStorage).deleteAlarmNotification(repeatingAlarmIdentifier)
	}

	@Test
	fun testScheduleSingleNotTooFar() {
		val notFarIdentifier = "notFar"
		val startDate = Date.from(fakeDateProvider.now.plus(Duration.ofMinutes(20)))
		val notTooFarSingle = createEncryptedAlarmNotification(userId, notFarIdentifier, startDate, null, null)
		manager.scheduleNewAlarms(listOf(notTooFarSingle), null)
		val alarmtime = calculateAlarmTime(startDate, null, AlarmInterval(AlarmIntervalUnit.MINUTE, 10))
		Mockito.verify(systemAlarmFacade)
			.scheduleAlarmOccurrenceWithSystem(alarmtime, 0, notFarIdentifier, "summary", startDate, userId)
	}

	@Test
	fun testNotScheduleSingleTooFar() {
		val identifier = "tooFar"
		val startDate = Date.from(
			fakeDateProvider.now.plusMillis(AlarmNotificationsManager.TIME_IN_THE_FUTURE_LIMIT_MS)
				.plus(Duration.ofMinutes(20))
		)

		val tooFarSingle = createEncryptedAlarmNotification(userId, identifier, startDate, null, null)
		manager.scheduleNewAlarms(listOf(tooFarSingle), null)
		Mockito.verify(systemAlarmFacade, Mockito.never())
			.scheduleAlarmOccurrenceWithSystem(any(), anyInt(), any(), any(), any(), any())
	}

	@Test
	fun someAreTooFarRepeating() {
		val identifier = "notTooFarR"
		val startDate = Date.from(fakeDateProvider.now.minus(Duration.ofDays(1)))
		val repeatRule =
			EncryptedRepeatRule(
				RepeatPeriod.WEEKLY.value().toString(),
				"1",
				"Europe/Berlin",
				"0",
				"0",
				emptyList(),
				emptyList()
			)
		val alarmNotification = createEncryptedAlarmNotification(userId, identifier, startDate, null, repeatRule)
		manager.scheduleNewAlarms(listOf(alarmNotification), null)

		// It should stop after the second one because it would be too far into the future otherwise.
		// This test case assumes 2W border for future events. It's the only one which makes sense with our reminders anyway.

		// |_|______|_|______|_|______|
		// s n     s+1 n+1  s+2 n+2   s+3
		// s - event start, n - now. s+2 is before n+2 so it will occur but s+3 is already too far
		Mockito.verify(systemAlarmFacade, Mockito.times(2))
			.scheduleAlarmOccurrenceWithSystem(any(), anyInt(), any(), eq("summary"), any(), eq(userId))
	}

	@Test
	fun testNotScheduleAlarmForMailAppWithReceiveCalendarNotificationsFalse() {
		Mockito.`when`(sseStorage.getReceiveCalendarNotificationConfig(any())).thenReturn(false)
		val identifier = "newAlarm"
		val startDate = Date()
		val alarmNotifications = createEncryptedAlarmNotification(userId, identifier, startDate, null, null)
		manager.scheduleNewAlarms(listOf(alarmNotifications), null)
		Mockito.verify(systemAlarmFacade, Mockito.never())
			.scheduleAlarmOccurrenceWithSystem(any(), anyInt(), any(), any(), any(), any())
	}

	@Test
	fun simple_all_day_event_alarm_1_day_before_is_at_midnight_in_local_time_zone() {
		// GIVEN an all day event with no repeat rule
		// Test dates must be valid all day dates. Also must be far enough in the future to have a valid
		// alarm 24 hours before the event because AlarmNotificationsManager.schedule compares using
		// newly generated Date()
		val allDayStartDateUtc =
			AlarmModel.getAllDayDateUTC(Date.from(fakeDateProvider.now.plus(Duration.ofDays(3))), timeZone)
		val allDayEndDateUtc = Date.from(allDayStartDateUtc.toInstant().plus(Duration.ofDays(1)))

		val encryptedAlarmNotification =
			createEncryptedAlarmNotification(
				userId,
				"alarmId",
				allDayStartDateUtc,
				allDayEndDateUtc,
				null,
				"1D"
			)

		// WHEN creating an alarm 1 day in advance for the event
		manager.scheduleNewAlarms(listOf(encryptedAlarmNotification), null)

		// THEN the alarm will be scheduled correctly at 00:00 local time
		// Even though event has an All Day Date, the alarm must be at
		// start of day (00:00:00) in UTC+1, 1 day before the original event.
		// ZoneOffset.ofHours(1) designates UTC+1
		val expected1DayAlarmTime =
			AlarmModel.getAllDayDateLocal(Date.from(allDayStartDateUtc.toInstant().minus(Duration.ofDays(1))), timeZone)

		// verify system facade was called with the right time value (local 00:00:00)
		Mockito.verify(systemAlarmFacade)
			.scheduleAlarmOccurrenceWithSystem(eq(expected1DayAlarmTime), any(), any(), any(), any(), any())
	}

	@Test
	fun repeating_all_day_events_alarm_1_day_before_is_at_midnight_in_local_time_zone() {
		// Having a separate test for alarms with repeat rules is necessary because the
		// logic of converting all day dates to local dates is done separately
		// in 2 different if/else branches.
		val allDayStartDateUtc =
			AlarmModel.getAllDayDateUTC(Date.from(fakeDateProvider.now.plus(Duration.ofDays(3))), timeZone)
		val allDayEndDateUtc = Date.from(allDayStartDateUtc.toInstant().plus(Duration.ofDays(1)))

		val testAllDayRepeatRule = EncryptedRepeatRule(
			frequency = RepeatPeriod.WEEKLY.value().toString(),
			interval = "1",
			"Europe/Berlin",
			"0",
			"0",
			emptyList(),
			emptyList()
		)

		val encryptedAlarmNotification =
			createEncryptedAlarmNotification(
				userId,
				"alarmId",
				allDayStartDateUtc,
				allDayEndDateUtc,
				testAllDayRepeatRule,
				"1D"
			)

		val alarms = listOf(encryptedAlarmNotification)
		manager.scheduleNewAlarms(alarms, null)

		val expected1DayAlarmTime =
			AlarmModel.getAllDayDateLocal(Date.from(allDayStartDateUtc.toInstant().minus(Duration.ofDays(1))), timeZone)


		// verify system facade was called with the right time value (local 00:00:00)
		Mockito.verify(systemAlarmFacade)
			.scheduleAlarmOccurrenceWithSystem(eq(expected1DayAlarmTime), any(), any(), any(), any(), any())

	}

	private fun createEncryptedAlarmNotification(
		userId: String,
		alarmIdentifier: String,
		startDate: Date?,
		endDate: Date?,
		repeatRule: EncryptedRepeatRule?,
		alarmTriggerString: String = "10M"
	): EncryptedAlarmNotification {
		val encSessionKey = "encSessionKey".toByteArray()
		try {
			Mockito.`when`(crypto.decryptKey(arrayEq(pushIdentifierKey), arrayEq(encSessionKey)))
				.thenReturn(encSessionKey)
		} catch (cryptoError: CryptoError) {
			throw RuntimeException(cryptoError)
		}
		val notificationSessionKey = EncryptedAlarmNotificationEntity.NotificationSessionKey(
			IdTupleCustom("listId", pushIdentifierElementId),
			encSessionKey.toBase64()
		)
		val calendar = Calendar.getInstance()
		if (startDate != null) {
			calendar.time = startDate
		} else {
			calendar[Calendar.DATE] = calendar[Calendar.DATE] + 2
			calendar[Calendar.MILLISECOND] = 0
			calendar[Calendar.MINUTE] = 20
		}

		val start = calendar.timeInMillis.toString()

		calendar.add(Calendar.HOUR, 1)
		val end = calendar.timeInMillis.toString()

		return EncryptedAlarmNotification(
			operation = OperationType.CREATE,
			"summary",
			eventStart = start,
			eventEnd = endDate?.toInstant()?.toEpochMilli()?.toString() ?: end,
			alarmInfo = EncryptedAlarmInfo(
				alarmTriggerString, alarmIdentifier
			),
			repeatRule = repeatRule,
			listOf(notificationSessionKey),
			user = userId
		)
	}
}

private class FakeDateProvider(override val now: Instant) : DateProvider