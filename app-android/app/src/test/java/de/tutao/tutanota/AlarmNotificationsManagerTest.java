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
import java.util.HashMap;

import de.tutao.tutanota.alarms.AlarmInfo;
import de.tutao.tutanota.alarms.AlarmNotification;
import de.tutao.tutanota.alarms.AlarmNotificationsManager;
import de.tutao.tutanota.alarms.EndType;
import de.tutao.tutanota.alarms.RepeatRule;
import de.tutao.tutanota.alarms.SystemAlarmFacade;
import de.tutao.tutanota.push.SseStorage;

import static org.mockito.AdditionalMatchers.aryEq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
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

	@Before
	public void setUp() {
		systemAlarmFacade = mock(SystemAlarmFacade.class);
		sseStorage = mock(SseStorage.class);
		keyStoreFacade = mock(AndroidKeyStoreFacade.class);
		crypto = mock(Crypto.class);
		manager = new AlarmNotificationsManager(keyStoreFacade, sseStorage, crypto, systemAlarmFacade);
	}

	@Test
	public void testUnscheduleAlarms() throws UnrecoverableEntryException, KeyStoreException, CryptoError {
		String userId = "userId";
		String singleAlarmIdentifier = "singleAlarmIdentifier";
		String repeatingAlarmIdentifier = "repeatingAlarmIdentifier";

		String pushIdentifierElementId = "elementId";
		byte[] pushIdentifierKey = "pushIdentifierKey".getBytes();
		String encPushIdentifierKey = "encPushIdentifierKey";
		HashMap<String, String> pushIdentifierKeys = new HashMap<>();
		pushIdentifierKeys.put(pushIdentifierElementId, encPushIdentifierKey);
		when(crypto.aesDecrypt(any(), anyString())).thenAnswer((Answer<byte[]>) invocation -> ((String) invocation.getArgument(1)).getBytes());

		AlarmNotification alarmNotification = createAlarmNotification(userId, singleAlarmIdentifier, null, pushIdentifierElementId, pushIdentifierKey);
		RepeatRule repeatRule = new RepeatRule("1", "1", "Europe/Berlin", String.valueOf(EndType.COUNT.ordinal()), "2");
		AlarmNotification repeatingAlarmNotification = createAlarmNotification(userId, repeatingAlarmIdentifier, repeatRule, pushIdentifierElementId,
				pushIdentifierKey);
		AlarmNotification anotherUserAlarm = createAlarmNotification("anotherUserId", "someIdentifeir", null, "somePushId", new byte[0]);
		ArrayList<AlarmNotification> alarms = new ArrayList<>();
		alarms.add(alarmNotification);
		alarms.add(repeatingAlarmNotification);
		alarms.add(anotherUserAlarm);
		when(sseStorage.readAlarmNotifications()).thenReturn(alarms);
		when(sseStorage.getPushIdentifierSessionKey(pushIdentifierElementId)).thenReturn(pushIdentifierKey);

		manager.unscheduleAlarms(userId);

		verify(systemAlarmFacade).cancelAlarm(singleAlarmIdentifier, 0);
		verify(systemAlarmFacade).cancelAlarm(repeatingAlarmIdentifier, 0);
		verify(systemAlarmFacade).cancelAlarm(repeatingAlarmIdentifier, 1);
		verifyNoMoreInteractions(systemAlarmFacade);

		verify(sseStorage).deleteAlarmNotification(singleAlarmIdentifier);
		verify(sseStorage).deleteAlarmNotification(repeatingAlarmIdentifier);
	}

	@NonNull
	private AlarmNotification createAlarmNotification(String userId, String alarmIdentifier, @Nullable RepeatRule repeatRule, String pushIdentifierElementId,
													  byte[] pushIdentifierKey) throws CryptoError {
		byte[] encSessionKey = "encSessionKey".getBytes();
		when(crypto.decryptKey(aryEq(pushIdentifierKey), aryEq(encSessionKey))).thenReturn(encSessionKey);
		AlarmNotification.NotificationSessionKey notificationSessionKey = new AlarmNotification.NotificationSessionKey(
				new IdTuple("listId", pushIdentifierElementId),
				Utils.bytesToBase64(encSessionKey));
		Calendar calendar = Calendar.getInstance();
		calendar.set(Calendar.DATE, calendar.get(Calendar.DATE) + 2);
		calendar.set(Calendar.MILLISECOND, 0);
		calendar.set(Calendar.MINUTE, 20);
		String start = String.valueOf(calendar.getTimeInMillis());
		calendar.set(Calendar.HOUR, 1);
		String end = String.valueOf(calendar.getTimeInMillis());

		return new AlarmNotification(OperationType.CREATE, "summary", start, end, new AlarmInfo("10M", alarmIdentifier), repeatRule,
				notificationSessionKey, userId);
	}
}
