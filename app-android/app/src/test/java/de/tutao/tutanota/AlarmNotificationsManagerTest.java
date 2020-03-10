package de.tutao.tutanota;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.stubbing.Answer;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.security.KeyStoreException;
import java.security.UnrecoverableEntryException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

import de.tutao.tutanota.alarms.AlarmInfo;
import de.tutao.tutanota.alarms.AlarmModel;
import de.tutao.tutanota.alarms.AlarmNotification;
import de.tutao.tutanota.alarms.AlarmNotificationsManager;
import de.tutao.tutanota.alarms.AlarmTrigger;
import de.tutao.tutanota.alarms.EndType;
import de.tutao.tutanota.alarms.RepeatPeriod;
import de.tutao.tutanota.alarms.RepeatRule;
import de.tutao.tutanota.alarms.SystemAlarmFacade;
import de.tutao.tutanota.push.LocalNotificationsFacade;
import de.tutao.tutanota.push.SseStorage;

import static java.util.Collections.singletonList;
import static org.mockito.AdditionalMatchers.aryEq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@RunWith(RobolectricTestRunner.class)
@Config(manifest = Config.NONE)
public class AlarmNotificationsManagerTest {

	AlarmNotificationsManager manager;
	private SystemAlarmFacade systemAlarmFacade;
	private SseStorage sseStorage;
	private AndroidKeyStoreFacade keyStoreFacade;
	private Crypto crypto;
	String userId = "userId";
	String pushIdentifierElementId = "elementId";
	byte[] pushIdentifierKey = "pushIdentifierKey".getBytes();

	@Before
	public void setUp() throws CryptoError, UnrecoverableEntryException, KeyStoreException {
		systemAlarmFacade = mock(SystemAlarmFacade.class);
		sseStorage = mock(SseStorage.class);
		keyStoreFacade = mock(AndroidKeyStoreFacade.class);
		crypto = mock(Crypto.class);
		manager = new AlarmNotificationsManager(sseStorage, crypto, systemAlarmFacade, mock(LocalNotificationsFacade.class));

		when(crypto.aesDecrypt(any(), anyString())).thenAnswer((Answer<byte[]>) invocation -> ((String) invocation.getArgument(1)).getBytes());
		when(sseStorage.getPushIdentifierSessionKey(pushIdentifierElementId)).thenReturn(pushIdentifierKey);
	}

	@Test
	public void testUnscheduleAlarms() throws UnrecoverableEntryException, KeyStoreException, CryptoError {
		String singleAlarmIdentifier = "singleAlarmIdentifier";
		String repeatingAlarmIdentifier = "repeatingAlarmIdentifier";

		AlarmNotification alarmNotification = createAlarmNotification(userId, singleAlarmIdentifier, null, null, null);
		RepeatRule repeatRule = new RepeatRule("1", "1", "Europe/Berlin", String.valueOf(EndType.COUNT.ordinal()), "2");
		AlarmNotification repeatingAlarmNotification = createAlarmNotification(userId, repeatingAlarmIdentifier, null, null, repeatRule
		);
		AlarmNotification anotherUserAlarm = createAlarmNotification("anotherUserId", "someIdentifeir", null, null, null);
		ArrayList<AlarmNotification> alarms = new ArrayList<>();
		alarms.add(alarmNotification);
		alarms.add(repeatingAlarmNotification);
		alarms.add(anotherUserAlarm);
		when(sseStorage.readAlarmNotifications()).thenReturn(alarms);

		manager.unscheduleAlarms(userId);

		verify(systemAlarmFacade).cancelAlarm(singleAlarmIdentifier, 0);
		verify(systemAlarmFacade).cancelAlarm(repeatingAlarmIdentifier, 0);
		verify(systemAlarmFacade).cancelAlarm(repeatingAlarmIdentifier, 1);
		verifyNoMoreInteractions(systemAlarmFacade);

		verify(sseStorage).deleteAlarmNotification(singleAlarmIdentifier);
		verify(sseStorage).deleteAlarmNotification(repeatingAlarmIdentifier);
	}

	@Test
	public void testScheduleSingle() {
		String notFarIdentifier = "notFar";
		Date startDate = new Date(System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(20));
		AlarmNotification notTooFarSingle = createAlarmNotification(userId, notFarIdentifier, startDate, null, null);

		when(sseStorage.readAlarmNotifications()).thenReturn(singletonList(notTooFarSingle));
		manager.reScheduleAlarms();

		Date alarmtime = AlarmModel.calculateAlarmTime(startDate, null, AlarmTrigger.TEN_MINUTES);
		verify(systemAlarmFacade).scheduleAlarmOccurrenceWithSystem(alarmtime, 0, notFarIdentifier, "summary", startDate, userId);
	}

	@Test
	public void scheduleOnlyAlarmLimit() {
		Calendar cal = Calendar.getInstance();
		cal.add(Calendar.DATE, 1);
		Date now = cal.getTime();
		List<AlarmNotification> alarms = new ArrayList<>();
		for (int i = 0; i < 300; i++) {
			cal.add(Calendar.MINUTE, 1);
			alarms.add(createAlarmNotification(userId, "alarm_" + i, cal.getTime(), null, null));
		}
		when(sseStorage.readAlarmNotifications()).thenReturn(alarms);
		manager.reScheduleAlarms();

		for (int i = 0; i < AlarmNotificationsManager.ALARM_LIMIT; i++) {
			AlarmNotification alarm = alarms.get(i);
			verify(systemAlarmFacade).scheduleAlarmOccurrenceWithSystem(any(), eq(0), eq(alarm.getAlarmInfo().getIdentifier()), eq(alarm.getSummary()), any(),
					eq(userId));
		}
		verify(systemAlarmFacade, never()).scheduleAlarmOccurrenceWithSystem(any(), anyInt(),
				eq(alarms.get(AlarmNotificationsManager.ALARM_LIMIT).getAlarmInfo().getIdentifier()), any(), any(), eq(userId));
	}

	@Test
	public void scheduleOnlyAlarmLimitRepeating() {
		Calendar cal = Calendar.getInstance();
		cal.add(Calendar.DATE, 1);
		Date now = cal.getTime();
		List<AlarmNotification> alarms = new ArrayList<>();
		for (int i = 0; i < 300; i++) {
			cal.add(Calendar.DATE, 1);
			cal.add(Calendar.MINUTE, 1); // so that it's easier to sort
			RepeatRule repeatRule = new RepeatRule(String.valueOf(RepeatPeriod.DAILY.value()), "1", "Europe/Berlin", null, null);
			alarms.add(createAlarmNotification(userId, "alarm_" + i, cal.getTime(), null, repeatRule));
		}
		when(sseStorage.readAlarmNotifications()).thenReturn(alarms);
		manager.reScheduleAlarms();

		verify(systemAlarmFacade, times(10)).scheduleAlarmOccurrenceWithSystem(any(), anyInt(), eq(alarms.get(0).getAlarmInfo().getIdentifier()), any(), any(),
				eq(userId));
		// first 10 days we add one event so that we get n? = 1 + 2 + .. + 10 = 10 * (10 + 1) / 2 = 55
		// for later days (until near end) we will have 10 occurrences per day as we add and remove one. (180 - 55) / 10 = 12.5 more days
		// day   0 total    1 :  0
		// day   1 total    3 :  0  1
		// day   2 total    6 :  0  1  2
		// day   3 total   10 :  0  1  2  3
		// day   4 total   15 :  0  1  2  3  4
		// day   5 total   21 :  0  1  2  3  4  5
		// day   6 total   28 :  0  1  2  3  4  5  6
		// day   7 total   36 :  0  1  2  3  4  5  6  7
		// day   8 total   45 :  0  1  2  3  4  5  6  7  8
		// day   9 total   55 :  0  1  2  3  4  5  6  7  8  9
		// day  10 total   65 :     1  2  3  4  5  6  7  8  9 10
		// day  11 total   75 :        2  3  4  5  6  7  8  9 10 11
		// day  12 total   85 :           3  4  5  6  7  8  9 10 11 12
		// day  13 total   95 :              4  5  6  7  8  9 10 11 12 13
		// day  14 total  105 :                 5  6  7  8  9 10 11 12 13 14
		// day  15 total  115 :                    6  7  8  9 10 11 12 13 14 15
		// day  16 total  125 :                       7  8  9 10 11 12 13 14 15 16
		// day  17 total  135 :                          8  9 10 11 12 13 14 15 16 17
		// day  18 total  145 :                             9 10 11 12 13 14 15 16 17 18
		// day  19 total  155 :                               10 11 12 13 14 15 16 17 18 19
		// day  20 total  165 :                                  11 12 13 14 15 16 17 18 19 20
		// day  21 total  175 :                                     12 13 14 15 16 17 18 19 20 21
		// day  22 total  185 :                                        13 14 15 16 17 18 19 20 21 22
		verify(systemAlarmFacade, times(10)).scheduleAlarmOccurrenceWithSystem(any(), anyInt(), eq(alarms.get(13).getAlarmInfo().getIdentifier()), any(), any(),
				eq(userId));
		// The last one is already out
		verify(systemAlarmFacade, times(4)).scheduleAlarmOccurrenceWithSystem(any(), anyInt(), eq(alarms.get(18).getAlarmInfo().getIdentifier()), any(), any(),
				eq(userId));
		verify(systemAlarmFacade, never()).scheduleAlarmOccurrenceWithSystem(any(), anyInt(), eq(alarms.get(23).getAlarmInfo().getIdentifier()), any(), any(),
				eq(userId));
	}

	@NonNull
	private AlarmNotification createAlarmNotification(String userId, String alarmIdentifier, @Nullable Date startDate, @Nullable Date endDate,
													  @Nullable RepeatRule repeatRule) {
		byte[] encSessionKey = "encSessionKey".getBytes();
		try {
			when(crypto.decryptKey(aryEq(pushIdentifierKey), aryEq(encSessionKey))).thenReturn(encSessionKey);
		} catch (CryptoError cryptoError) {
			throw new RuntimeException(cryptoError);
		}
		AlarmNotification.NotificationSessionKey notificationSessionKey = new AlarmNotification.NotificationSessionKey(
				new IdTuple("listId", pushIdentifierElementId),
				Utils.bytesToBase64(encSessionKey));
		Calendar calendar = Calendar.getInstance();
		if (startDate != null) {
			calendar.setTime(startDate);
		} else {
			calendar.set(Calendar.DATE, calendar.get(Calendar.DATE) + 2);
			calendar.set(Calendar.MILLISECOND, 0);
			calendar.set(Calendar.MINUTE, 20);
		}
		String start = String.valueOf(calendar.getTimeInMillis());
		String end;
		if (endDate != null) {
			end = String.valueOf(endDate.getTime());
		} else {
			calendar.add(Calendar.HOUR, 1);
			end = String.valueOf(calendar.getTimeInMillis());
		}

		return new AlarmNotification(OperationType.CREATE, "summary", start, end, new AlarmInfo("10M", alarmIdentifier), repeatRule,
				notificationSessionKey, userId);
	}
}
