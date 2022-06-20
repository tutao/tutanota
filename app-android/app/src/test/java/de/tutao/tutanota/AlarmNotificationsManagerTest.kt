package de.tutao.tutanota

import de.tutao.tutanota.alarms.*
import de.tutao.tutanota.alarms.AlarmModel.calculateAlarmTime
import de.tutao.tutanota.alarms.AlarmNotificationEntity.NotificationSessionKey
import de.tutao.tutanota.push.LocalNotificationsFacade
import de.tutao.tutanota.push.SseStorage
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.Mockito
import org.mockito.invocation.InvocationOnMock
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.stubbing.Answer
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.security.KeyStoreException
import java.security.UnrecoverableEntryException
import java.util.*
import java.util.concurrent.TimeUnit

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class AlarmNotificationsManagerTest {

	private lateinit var manager: AlarmNotificationsManager

	private lateinit var systemAlarmFacade: SystemAlarmFacade
	private lateinit var sseStorage: SseStorage
	private lateinit var crypto: Crypto

	private val userId = "userId"
	private val pushIdentifierElementId = "elementId"
	private val pushIdentifierKey = "pushIdentifierKey".toByteArray()

	@Before
	@Throws(CryptoError::class, UnrecoverableEntryException::class, KeyStoreException::class)
	fun setUp() {
		systemAlarmFacade = Mockito.mock(SystemAlarmFacade::class.java)
		sseStorage = Mockito.mock(SseStorage::class.java)
		crypto = Mockito.mock(Crypto::class.java)
		manager = AlarmNotificationsManager(sseStorage, crypto, systemAlarmFacade, Mockito.mock(LocalNotificationsFacade::class.java))
		Mockito.`when`(crypto.aesDecrypt(any(), Mockito.anyString())).thenAnswer(Answer { invocation: InvocationOnMock -> (invocation.getArgument<Any>(1) as String).toByteArray() } as Answer<ByteArray>)
		Mockito.`when`(sseStorage.getPushIdentifierSessionKey(pushIdentifierElementId)).thenReturn(pushIdentifierKey)
	}

	@Test
	@Throws(UnrecoverableEntryException::class, KeyStoreException::class, CryptoError::class)
	fun testUnscheduleAlarms() {
		val singleAlarmIdentifier = "singleAlarmIdentifier"
		val repeatingAlarmIdentifier = "repeatingAlarmIdentifier"
		val alarmNotification = createEncryptedAlarmNotification(userId, singleAlarmIdentifier, null, null)
		val repeatRule = EncryptedRepeatRule("1", "1", "Europe/Berlin", EndType.COUNT.ordinal.toString(), "2")
		val repeatingAlarmNotification = createEncryptedAlarmNotification(userId, repeatingAlarmIdentifier, null, repeatRule
		)
		val anotherUserAlarm = createEncryptedAlarmNotification("anotherUserId", "someIdentifeir", null, null)
		val alarms = ArrayList<AlarmNotificationEntity>()
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
		val startDate = Date(System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(20))
		val notTooFarSingle = createEncryptedAlarmNotification(userId, notFarIdentifier, startDate, null)
		manager.scheduleNewAlarms(listOf(notTooFarSingle))
		val alarmtime = calculateAlarmTime(startDate, null, AlarmTrigger.TEN_MINUTES)
		Mockito.verify(systemAlarmFacade).scheduleAlarmOccurrenceWithSystem(alarmtime, 0, notFarIdentifier, "summary", startDate, userId)
	}

	@Test
	fun testNotScheduleSingleTooFar() {
		val identifier = "tooFar"
		val startDate = Date(System.currentTimeMillis() + AlarmNotificationsManager.TIME_IN_THE_FUTURE_LIMIT_MS + TimeUnit.MINUTES.toMillis(20))
		val tooFarSingle = createEncryptedAlarmNotification(userId, identifier, startDate, null)
		manager.scheduleNewAlarms(listOf(tooFarSingle))
		Mockito.verify(systemAlarmFacade, Mockito.never()).scheduleAlarmOccurrenceWithSystem(any(), anyInt(), any(), any(), any(), any())
	}

	@Test
	fun someAreTooFarRepeating() {
		val identifier = "notTooFarR"
		val startDate = Date(System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1))
		val repeatRule = EncryptedRepeatRule(RepeatPeriod.WEEKLY.value().toString(), "1", "Europe/Berlin", "0", "0")
		val alarmNotification = createEncryptedAlarmNotification(userId, identifier, startDate, repeatRule)
		manager.scheduleNewAlarms(listOf(alarmNotification))

		// It should stop after the second one because it would be too far into the future otherwise.
		// This test case assumes 2W border for future events. It's the only one which makes sense with our reminders anyway.

		// |_|______|_|______|_|______|
		// s n     s+1 n+1  s+2 n+2   s+3
		// s - event start, n - now. s+2 is before n+2 so it will occur but s+3 is already too far
		Mockito.verify(systemAlarmFacade, Mockito.times(2)).scheduleAlarmOccurrenceWithSystem(any(), anyInt(), any(), eq("summary"), any(), eq(userId))
	}

	private fun createEncryptedAlarmNotification(userId: String, alarmIdentifier: String, startDate: Date?, repeatRule: EncryptedRepeatRule?): EncryptedAlarmNotification {
		val encSessionKey = "encSessionKey".toByteArray()
		try {
			Mockito.`when`(crypto.decryptKey(arrayEq(pushIdentifierKey), arrayEq(encSessionKey))).thenReturn(encSessionKey)
		} catch (cryptoError: CryptoError) {
			throw RuntimeException(cryptoError)
		}
		val notificationSessionKey = NotificationSessionKey(
				IdTuple("listId", pushIdentifierElementId),
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
				eventEnd = end,
				alarmInfo = EncryptedAlarmInfo("10M", alarmIdentifier),
				repeatRule = repeatRule,
				listOf(notificationSessionKey),
				user = userId)
	}
}