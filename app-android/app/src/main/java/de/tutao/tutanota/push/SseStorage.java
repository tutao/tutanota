package de.tutao.tutanota.push;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.annotation.WorkerThread;
import androidx.lifecycle.LiveData;

import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.KeyStoreException;
import java.security.UnrecoverableEntryException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import de.tutao.tutanota.AndroidKeyStoreFacade;
import de.tutao.tutanota.CryptoError;
import de.tutao.tutanota.Utils;
import de.tutao.tutanota.alarms.AlarmNotification;
import de.tutao.tutanota.data.AppDatabase;
import de.tutao.tutanota.data.PushIdentifierKey;
import de.tutao.tutanota.data.SseInfo;
import de.tutao.tutanota.data.User;


public class SseStorage {
	private static final String LAST_PROCESSED_NOTIFICATION_ID = "lastProcessedNotificationId";
	private static final String LAST_MISSED_NOTIFICATION_CHECK_TIME = "'lastMissedNotificationCheckTime'";
	private static final String DEVICE_IDENTIFIER = "deviceIdentifier";
	private static final String SSE_ORIGIN = "sseOrigin";
	public static final String CONNECT_TIMEOUT_SEC = "connectTimeoutSec";

	private final AppDatabase db;
	private final AndroidKeyStoreFacade keyStoreFacade;

	public SseStorage(AppDatabase db, AndroidKeyStoreFacade keyStoreFacade) {
		this.db = db;
		this.keyStoreFacade = keyStoreFacade;
	}

	@Nullable
	public String getPushIdentifier() {
		return db.keyValueDao().getString(DEVICE_IDENTIFIER);
	}


	public void storePushIdentifier(String identifier, String sseOrigin) {
		db.keyValueDao().putString(DEVICE_IDENTIFIER, identifier);
		db.keyValueDao().putString(SSE_ORIGIN, sseOrigin);
	}

	public void clear() {
		setLastMissedNotificationCheckTime(null);

		db.userInfoDao().clear();
		db.getAlarmInfoDao().clear();
	}

	public void storePushIdentifierSessionKey(String userId, String pushIdentiferId,
											  String pushIdentifierSessionKeyB64) throws KeyStoreException, CryptoError {
		byte[] deviceEncSessionKey = this.keyStoreFacade.encryptKey(Utils.base64ToBytes(pushIdentifierSessionKeyB64));
		this.db.userInfoDao().insertPushIdentifierKey(new PushIdentifierKey(pushIdentiferId, deviceEncSessionKey));
		this.db.userInfoDao().insertUser(new User(userId));
	}


	public byte[] getPushIdentifierSessionKey(String pushIdentiferId) throws UnrecoverableEntryException, KeyStoreException, CryptoError {
		PushIdentifierKey userInfo = this.db.userInfoDao().getPushIdentifierKey(pushIdentiferId);
		if (userInfo == null) {
			return null;
		}
		return this.keyStoreFacade.decryptKey(userInfo.getDeviceEncPushIdentifierKey());
	}

	public LiveData<List<User>> observeUsers() {
		return this.db.userInfoDao().observeUsers();
	}

	public List<AlarmNotification> readAlarmNotifications() {
		return db.getAlarmInfoDao().getAlarmNotifications();
	}

	public void insertAlarmNotification(AlarmNotification alarmNotification) {
		db.getAlarmInfoDao().insertAlarmNotification(alarmNotification);
	}

	public void deleteAlarmNotification(String alarmIdetifier) {
		db.getAlarmInfoDao().deleteAlarmNotification(alarmIdetifier);
	}

	@Nullable
	@WorkerThread
	public String getLastProcessedNotificationId() {
		return db.keyValueDao().getString(LAST_PROCESSED_NOTIFICATION_ID);
	}

	@WorkerThread
	public void setLastProcessedNotificationId(String id) {
		db.keyValueDao().putString(LAST_PROCESSED_NOTIFICATION_ID, id);
	}

	@Nullable
	@WorkerThread
	public Date getLastMissedNotificationCheckTime() {
		long value = db.keyValueDao().getLong(LAST_MISSED_NOTIFICATION_CHECK_TIME);
		if (value == 0) {
			return null;
		}
		return new Date(value);
	}

	@WorkerThread
	public void setLastMissedNotificationCheckTime(@Nullable Date date) {
		db.keyValueDao().putLong(LAST_MISSED_NOTIFICATION_CHECK_TIME, date == null ? 0L : date.getTime());
	}

	public String getSseOrigin() {
		return this.db.keyValueDao().getString(SSE_ORIGIN);
	}

	public long getConnectTimeoutInSeconds() {
		return db.keyValueDao().getLong(CONNECT_TIMEOUT_SEC);
	}

	public void setConnectTimeoutInSeconds(long connectTimeout) {
		db.keyValueDao().putLong(CONNECT_TIMEOUT_SEC, connectTimeout);
	}

	public void removeUser(String userId) {
		this.db.userInfoDao().deleteUser(userId);
	}

	public List<User> getUsers() {
		return this.db.userInfoDao().getUsers();
	}
}

