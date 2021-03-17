package de.tutao.tutanota.push;

import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.NonNull;

import org.apache.commons.io.IOUtils;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

import de.tutao.tutanota.NetworkUtils;
import de.tutao.tutanota.R;
import de.tutao.tutanota.Utils;
import de.tutao.tutanota.alarms.AlarmNotification;
import de.tutao.tutanota.alarms.AlarmNotificationsManager;
import de.tutao.tutanota.data.SseInfo;

public class TutanotaNotificationsHandler {
	private static final String TAG = "TutanotaNotifications";
	private static final long MISSED_NOTIFICATION_TTL = TimeUnit.DAYS.toMillis(30);

	private final LocalNotificationsFacade localNotificationsFacade;
	private final SseStorage sseStorage;
	private final AlarmNotificationsManager alarmNotificationsManager;


	public TutanotaNotificationsHandler(LocalNotificationsFacade localNotificationsFacade, SseStorage sseStorage,
										AlarmNotificationsManager alarmNotificationsManager) {
		this.localNotificationsFacade = localNotificationsFacade;
		this.sseStorage = sseStorage;
		this.alarmNotificationsManager = alarmNotificationsManager;
	}

	public void onNewNotificationAvailable(SseInfo sseInfo) {
		Log.d(TAG, "onNewNotificationAvailable");
		if (sseInfo == null) {
			Log.d(TAG, "No stored SSE info");
			return;
		}
		MissedNotification missedNotification = downloadMissedNotification(sseInfo);
		if (missedNotification != null) {
			handleNotificationInfos(missedNotification.getNotificationInfos());
			if (missedNotification.getAlarmNotifications() != null) {
				handleAlarmNotifications(missedNotification.getAlarmNotifications());
			}
			sseStorage.setLastProcessedNotificationId(missedNotification.getLastProcessedNotificationId());
			sseStorage.setLastMissedNotificationCheckTime(new Date());
		}
	}

	public boolean onConnect() {
		if (hasNotificationTTLExpired()) {
			Log.d(TAG, "Notification TTL expired - resetting stored state");
			this.alarmNotificationsManager.unscheduleAlarms(null);
			this.sseStorage.clear();
			return false;
		}
		if (sseStorage.getLastMissedNotificationCheckTime() == null) {
			sseStorage.setLastMissedNotificationCheckTime(new Date());
		}
		return true;
	}

	private MissedNotification downloadMissedNotification(@NonNull SseInfo sseInfo) {
		int triesLeft = 3;
		// We try to download limited number of times. If it fails then  we are probably offline
		String userId;
		while (triesLeft > 0) {
			if (sseInfo.getUserIds().isEmpty()) {
				Log.i(TAG, "No users to download missed notification with");
				return null;
			}
			userId = sseInfo.getUserIds().iterator().next();
			try {
				Log.d(TAG, "Downloading missed notification with user id " + userId);
				return executeMissedNotificationDownload(sseInfo, userId);
			} catch (FileNotFoundException e) {
				Log.i(TAG, "MissedNotification is not found, ignoring: " + e.getMessage());
				return null;
			} catch (IOException e) {
				triesLeft--;
				Log.d(TAG, "Failed to download missed notification, tries left: " + triesLeft, e);
			} catch (IllegalArgumentException e) {
				Log.w(TAG, e);
				localNotificationsFacade.showErrorNotification(R.string.scheduleAlarmError_msg, e);
				return null;
			} catch (ServiceUnavailableException e) {
				Log.d(TAG, "ServiceUnavailable when downloading missed notification, waiting " +
						e.getSuspensionSeconds() + "s");
				try {
					Thread.sleep(TimeUnit.SECONDS.toMillis(e.getSuspensionSeconds()));
				} catch (InterruptedException ignored) {
				}
				// tries are not decremented and we don't return, we just wait and try again.
			} catch (ServerResponseException e) {
				triesLeft--;
				Log.w(TAG, e);
			} catch (ClientRequestException e) {
				if (e.code == ResponseCodes.NOT_AUTHENTICATED) {
					Log.i(TAG, "Not authenticated to download missed notification with user " + userId, e);
					// This will initiate reconnect so we don't have to try again here
					this.onNotAuthorized(userId);
				} else {
					Log.w(TAG, e);
				}
				return null;
			} catch (HttpException e) { // other HTTP exceptions, client ones
				Log.w(TAG, e);
				return null;
			}
		}
		return null;
	}

	private MissedNotification executeMissedNotificationDownload(@NonNull SseInfo sseInfo, String userId) throws IllegalArgumentException, IOException, HttpException {
		try {
			URL url = makeAlarmNotificationUrl(sseInfo);
			HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();

			urlConnection.setConnectTimeout(30 * 1000);
			urlConnection.setReadTimeout(20 * 1000);

			urlConnection.setRequestProperty("userIds", userId);
			NetworkUtils.addCommonHeaders(urlConnection);
			String lastProcessedNotificationId = sseStorage.getLastProcessedNotificationId();
			if (lastProcessedNotificationId != null) {
				urlConnection.setRequestProperty("lastProcessedNotificationId", lastProcessedNotificationId);
			}

			int responseCode = urlConnection.getResponseCode();
			Log.d(TAG, "MissedNotification response code " + responseCode);

			handleResponseCode(urlConnection, responseCode);

			try (InputStream inputStream = urlConnection.getInputStream()) {
				String responseString = IOUtils.toString(inputStream, StandardCharsets.UTF_8);
				Log.d(TAG, "Loaded Missed notifications response");
				return MissedNotification.fromJson(new JSONObject(responseString));
			}
		} catch (MalformedURLException | JSONException e) {
			throw new RuntimeException(e);
		}
	}

	private void handleResponseCode(HttpURLConnection urlConnection, int responseCode)
			throws FileNotFoundException, ServerResponseException, ClientRequestException, ServiceUnavailableException {
		if (responseCode == 404) {
			throw new FileNotFoundException("Missed notification not found: " + 404);
		} else if (responseCode == ServiceUnavailableException.CODE) {
			String retryAfterHeader = urlConnection.getHeaderField("Retry-After");
			if (retryAfterHeader == null) {
				retryAfterHeader = urlConnection.getHeaderField("Suspension-Time");
			}
			int suspensionTime;
			try {
				suspensionTime = Integer.parseInt(retryAfterHeader);
			} catch (NumberFormatException e) {
				suspensionTime = 0;
			}
			throw new ServiceUnavailableException(suspensionTime);
		} else if (400 <= responseCode && responseCode < 500) {
			throw new ClientRequestException(responseCode);
		} else if (500 <= responseCode && responseCode <= 600) {
			throw new ServerResponseException(responseCode);
		}
	}

	private URL makeAlarmNotificationUrl(SseInfo sseInfo) throws MalformedURLException {
		String customId = Utils.base64ToBase64Url(Utils.bytesToBase64(sseInfo.getPushIdentifier().getBytes(StandardCharsets.UTF_8)));
		return new URL(sseInfo.getSseOrigin() + "/rest/sys/missednotification/" + customId);
	}

	private void handleNotificationInfos(List<PushMessage.NotificationInfo> notificationInfos) {
		// TODO: translate
		localNotificationsFacade.sendEmailNotifications(notificationInfos);
	}


	private void handleAlarmNotifications(List<AlarmNotification> alarmNotifications) {
		this.alarmNotificationsManager.scheduleNewAlarms(alarmNotifications);
	}

	/**
	 * We remember the last time we connected or fetched missed notification and if since the last time we did the the TTL time has
	 * expired, we certainly missed some updates.
	 * We need to unschedule all alarms and to tell web part that we would like alarms to be scheduled all over.
	 */
	public boolean hasNotificationTTLExpired() {
		Date lastMissedNotificationCheckTime = this.sseStorage.getLastMissedNotificationCheckTime();
		Log.d(TAG, "check lastMissedNotificationCheckTime: " + lastMissedNotificationCheckTime);
		return lastMissedNotificationCheckTime != null && (System.currentTimeMillis() - lastMissedNotificationCheckTime.getTime()) > MISSED_NOTIFICATION_TTL;
	}

	public void onNotAuthorized(String userId) {
		// If we get notAuthorized, then user removed push identifier and we should try the next one.
		// It will be done automatically when we remove the user from DB because there's already an observer for users
		// in PushNotificationService which restarts the connection.
		this.sseStorage.removeUser(userId);
		alarmNotificationsManager.unscheduleAlarms(userId);
		if (this.sseStorage.getUsers().isEmpty()) {
			alarmNotificationsManager.unscheduleAlarms(null);
			sseStorage.clear();
		}
	}

	static class ClientRequestException extends HttpException {
		ClientRequestException(int code) {
			super(code);
		}
	}

	static class ServerResponseException extends HttpException {
		ServerResponseException(int code) {
			super(code);
		}
	}

	static class ServiceUnavailableException extends HttpException {
		static final int CODE = 503;
		private final int suspensionSeconds;

		ServiceUnavailableException(int suspensionSeconds) {
			super(CODE);
			this.suspensionSeconds = suspensionSeconds;
		}

		public int getSuspensionSeconds() {
			return suspensionSeconds;
		}
	}

	static class HttpException extends Exception {
		final int code;

		HttpException(int code) {
			this.code = code;
		}
	}
}
