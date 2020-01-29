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
import java.util.Date;
import java.util.List;

import de.tutao.tutanota.AndroidKeyStoreFacade;
import de.tutao.tutanota.CryptoError;
import de.tutao.tutanota.Utils;
import de.tutao.tutanota.alarms.AlarmNotification;
import de.tutao.tutanota.data.AppDatabase;
import de.tutao.tutanota.data.UserInfo;


public class SseStorage {

	private static final String SSE_INFO_PREF = "sseInfo";
	private static final String TAG = SseStorage.class.getSimpleName();
	private static final String RECURRING_ALARMS_PREF_NAME = "RECURRING_ALARMS";
	private static final String LAST_PROCESSED_NOTIFICATION_ID = "lastProcessedNotificationId";
	private static final String LAST_MISSED_NOTIFICATION_CHECK_TIME = "'lastMissedNotificationCheckTime'";
	private static final String DEVICE_IDENTIFIER = "deviceIdentifier";
	private static final String SSE_ORIGIN = "sseOrigin";
	public static final String CONNECT_TIMEOUT_SEC = "connectTimeoutSec";

	private Context context;
	private final AppDatabase db;
	private final AndroidKeyStoreFacade keyStoreFacade;

	public SseStorage(Context context, AppDatabase db, AndroidKeyStoreFacade keyStoreFacade) {
		this.context = context;
		this.db = db;
		this.keyStoreFacade = keyStoreFacade;
		migrateSseInfoToDb();
	}

	private void migrateSseInfoToDb() {
		Log.d("SSEstorage", "Migrating SSE to the database");
		String sseInfoPref = getPrefs().getString(SSE_INFO_PREF, null);
		/*if (sseInfoPref != null) {
			SseInfo sseInfo = SseInfo.fromJson(sseInfoPref);
			db.sseInfoDao().storeSseInfo(sseInfo);
			getPrefs().edit().remove(sseInfoPref).apply();
		}*/

		this.getPrefs().edit().remove(SSE_INFO_PREF).apply();
	}


	/*public LiveData<SseInfo> observeSseInfo() {
		return db.sseInfoDao().observeSseInfo();
	}*/

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

	private SharedPreferences getPrefs() {
		return PreferenceManager.getDefaultSharedPreferences(context);
	}

	public void storePushIdentifierSessionKey(String userId, String pushIdentiferId,
											  String pushIdentifierSessionKeyB64) throws KeyStoreException, CryptoError {
		byte[] deviceEncSessionKey = this.keyStoreFacade.encryptKey(Utils.base64ToBytes(pushIdentifierSessionKeyB64));
		this.db.userInfoDao().insertUserInfo(new UserInfo(userId, pushIdentiferId, deviceEncSessionKey));
	}


	public byte[] getPushIdentifierSessionKey(String pushIdentiferId) throws UnrecoverableEntryException, KeyStoreException, CryptoError {
		UserInfo userInfo = this.db.userInfoDao().getUserInfoByPushIdentifier(pushIdentiferId);
		if (userInfo == null) {
			return null;
		}
		return this.keyStoreFacade.decryptKey(userInfo.getDeviceEncPushIdentifierKey());
	}

	public LiveData<List<UserInfo>> observiceUserInfo() {
		return this.db.userInfoDao().observeUserInfos();
	}

	/**
	 * For migration
	 */
	private File getKeysFile() {
		return new File(context.getFilesDir(), "keys.json");
	}

	/**
	 * For migration
	 */
	private JSONObject getKeysJson(File file) throws IOException {
		JSONObject keyMapJson;
		if (file.createNewFile()) {
			keyMapJson = new JSONObject();
		} else {
			try (FileInputStream fis = new FileInputStream(file)) {
				String jsonString = IOUtils.toString(fis, StandardCharsets.UTF_8);
				if (jsonString.isEmpty()) {
					keyMapJson = new JSONObject();
				} else {
					try {
						keyMapJson = new JSONObject(jsonString);
					} catch (JSONException e) {
						Log.w(TAG, "Failed to read keys file", e);
						keyMapJson = new JSONObject();
					}
				}
			}
		}
		return keyMapJson;
	}

	public List<AlarmNotification> readAlarmNotifications() {
		return db.getAlarmInfoDao().getAlarmNotifications();
	}

	/**
	 * For migration
	 */
	public List<AlarmNotification> readAlarmNotificationsFromJSON() {
		String jsonString = PreferenceManager.getDefaultSharedPreferences(context)
				.getString(RECURRING_ALARMS_PREF_NAME, "[]");
		ArrayList<AlarmNotification> alarmInfos = new ArrayList<>();
		try {
			JSONArray jsonArray = new JSONArray(jsonString);
			for (int i = 0; i < jsonArray.length(); i++) {
				alarmInfos.add(AlarmNotification.fromJson(jsonArray.getJSONObject(i)));
			}
		} catch (JSONException e) {
			alarmInfos = new ArrayList<>();
		}
		return alarmInfos;
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

}

