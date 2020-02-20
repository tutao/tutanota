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
		manager = new AlarmNotificationsManager(keyStoreFacade, sseStorage, crypto, systemAlarmFacade);

		when(crypto.aesDecrypt(any(), anyString())).thenAnswer((Answer<byte[]>) invocation -> ((String) invocation.getArgument(1)).getBytes());
		when(sseStorage.getPushIdentifierSessionKey(pushIdentifierElementId)).thenReturn(pushIdentifierKey);
	}

	@Test
	public void testUnscheduleAlarms() throws UnrecoverableEntryException, KeyStoreException, CryptoError {
		String singleAlarmIdentifier = "singleAlarmIdentifier";
		String repeatingAlarmIdentifier = "repeatingAlarmIdentifier";

		AlarmNotification alarmNotification = createAlarmNotification(singleAlarmIdentifier, null, null, null
		);
		RepeatRule repeatRule = new RepeatRule("1", "1", "Europe/Berlin", String.valueOf(EndType.COUNT.ordinal()), "2");
		AlarmNotification repeatingAlarmNotification = createAlarmNotification(repeatingAlarmIdentifier, null, null, repeatRule
		);
		AlarmNotification anotherUserAlarm = createAlarmNotification("someIdentifeir", null, null, null);
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
	public void testScheduleSingleNotTooFar() {
		String notFarIdentifier = "notFar";
		Date startDate = new Date(System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(20));
		AlarmNotification notTooFarSingle = createAlarmNotification(notFarIdentifier, startDate, null, null);

		manager.scheduleNewAlarms(singletonList(notTooFarSingle));

		Date alarmtime = AlarmModel.calculateAlarmTime(startDate, null, AlarmTrigger.TEN_MINUTES);
		verify(systemAlarmFacade).scheduleAlarmOccurrenceWithSystem(alarmtime, 0, notFarIdentifier, "summary", startDate, userId);
	}

	@Test
	public void testNotScheduleSingleTooFar() {
		String identifier = "tooFar";
		Date startDate = new Date(System.currentTimeMillis() + AlarmNotificationsManager.TIME_IN_THE_FUTURE_LIMIT_MS + TimeUnit.MINUTES.toMillis(20));
		AlarmNotification tooFarSingle = createAlarmNotification(identifier, startDate, null, null);

		manager.scheduleNewAlarms(singletonList(tooFarSingle));

		verify(systemAlarmFacade, never()).scheduleAlarmOccurrenceWithSystem(any(), anyInt(), any(), any(), any(), any());
	}

	@Test
	public void someAreTooFarRepeating() {
		String identifier = "notTooFarR";
		Date startDate = new Date(System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1));
		RepeatRule repeatRule = new RepeatRule(String.valueOf(RepeatPeriod.WEEKLY.value()), "1", "Europe/Berlin", null, null);
		AlarmNotification alarmNotification = createAlarmNotification(identifier, startDate, null, repeatRule);

		manager.scheduleNewAlarms(singletonList(alarmNotification));

		// It should stop after the second one because it would be too far into the future otherwise.
		// This test case assumes 2W border for future events. It's the only one which makes sense with our reminders anyway.

		// |_|______|_|______|_|______|
		// s n     s+1 n+1  s+2 n+2   s+3
		// s - event start, n - now. s+2 is before n+2 so it will occur but s+3 is already too far
		verify(systemAlarmFacade, times(2)).scheduleAlarmOccurrenceWithSystem(any(), anyInt(), any(), eq("summary"), any(), eq(userId));
	}


	@NonNull
	private AlarmNotification createAlarmNotification(String alarmIdentifier, @Nullable Date startDate, @Nullable Date endDate,
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
