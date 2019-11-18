package de.tutao.tutanota.push;

import android.app.Service;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.preference.PreferenceManager;
import android.support.annotation.Nullable;
import android.support.v4.app.ServiceCompat;
import android.text.TextUtils;
import android.util.Log;

import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.MainActivity;
import de.tutao.tutanota.Utils;
import de.tutao.tutanota.alarms.AlarmNotification;
import de.tutao.tutanota.alarms.AlarmNotificationsManager;

import static de.tutao.tutanota.Utils.atLeastOreo;

public final class PushNotificationService extends JobService {

	private static final String HEARTBEAT_TIMEOUT_IN_SECONDS_KEY = "heartbeatTimeoutInSeconds";
	private static final String TAG = "PushNotificationService";
	private static final String SSE_INFO_EXTRA = "sseInfo";
	public static final int RECONNECTION_ATTEMPTS = 3;

	private final LooperThread looperThread = new LooperThread(this::connect);
	private final SseStorage sseStorage = new SseStorage(this);
	private final AtomicReference<HttpURLConnection> httpsURLConnectionRef = new AtomicReference<>(null);
	private final Crypto crypto = new Crypto(this);
	private AlarmNotificationsManager alarmNotificationsManager;
	private volatile SseInfo connectedSseInfo;
	private volatile int timeoutInSeconds;
	private ConnectivityManager connectivityManager;
	private volatile JobParameters jobParameters;
	private long lastProcessedChangeTime = 0;
	private LocalNotificationsFacade localNotificationsFacade;
	private int failedConnectionAttempts = 0;

	private BroadcastReceiver networkReceiver;

	public static Intent startIntent(Context context, @Nullable SseInfo sseInfo, String sender) {
		Intent intent = new Intent(context, PushNotificationService.class);
		if (sseInfo != null) {
			intent.putExtra(SSE_INFO_EXTRA, sseInfo.toJSON());
		}
		intent.putExtra("sender", sender);
		return intent;
	}


	@Override
	public void onCreate() {
		super.onCreate();
		connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
		this.connectedSseInfo = sseStorage.getSseInfo();
		alarmNotificationsManager = new AlarmNotificationsManager(this, sseStorage);
		localNotificationsFacade = new LocalNotificationsFacade(this);
		looperThread.start();

		networkReceiver = new BroadcastReceiver() {
			@Override
			public void onReceive(Context context, Intent intent) {
				HttpURLConnection connection = httpsURLConnectionRef.get();
				if (!hasNetworkConnection()) {
					Log.d(TAG, "Network is DOWN");
				} else {
					Log.d(TAG, "Network is UP");
					if (connection == null) {
						Log.d(TAG, "ConnectionRef not available, schedule connect because of network state change");
						reschedule(0);
					}
				}
			}
		};
		registerReceiver(networkReceiver, new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION));

		if (atLeastOreo()) {
			localNotificationsFacade.createNotificationChannels();
			Log.d(TAG, "Starting foreground");
			startForeground(1, localNotificationsFacade.makeConnectionNotification());
		}
	}


	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		Log.d(TAG, "Received onStartCommand, sender: " + (intent == null ? null : intent.getStringExtra("sender")));

		if (intent != null && intent.hasExtra(LocalNotificationsFacade.NOTIFICATION_DISMISSED_ADDR_EXTRA)) {
			ArrayList<String> dissmissAddrs =
					intent.getStringArrayListExtra(LocalNotificationsFacade.NOTIFICATION_DISMISSED_ADDR_EXTRA);
			localNotificationsFacade.notificationDismissed(dissmissAddrs, intent.getBooleanExtra(MainActivity.IS_SUMMARY_EXTRA, false));
			return START_STICKY;
		}

		SseInfo sseInfo = null;
		if (intent != null && intent.hasExtra(SSE_INFO_EXTRA)) {
			sseInfo = SseInfo.fromJson(intent.getStringExtra(SSE_INFO_EXTRA));
		}

		restartConnectionIfNeeded(sseInfo);
		return Service.START_STICKY;
	}

	private void restartConnectionIfNeeded(@Nullable SseInfo sseInfo) {
		if (sseInfo == null) {
			sseInfo = sseStorage.getSseInfo();
		}

		SseInfo oldConnectedInfo = this.connectedSseInfo;
		if (sseInfo == null) {
			// fix case when both:
			// 1. SSE info is null in the intent (e.g. PeriodicJobRestartService)
			// 2. SSE info is null in the SharedPrefs (it is not synchronized between processes yet)
			Log.d(TAG, "Could not get sse info, using the old one");
			stopForeground(true);
		} else {
			this.connectedSseInfo = sseInfo;
		}

		Log.d(TAG, "current sseInfo: " + connectedSseInfo);
		Log.d(TAG, "stored sseInfo: " + oldConnectedInfo);

		HttpURLConnection connection = httpsURLConnectionRef.get();
		if (connection == null) {
			Log.d(TAG, "ConnectionRef not available, schedule connect");
			this.reschedule(0);
		} else if (connectedSseInfo != null && !connectedSseInfo.equals(oldConnectedInfo)) {
			Log.d(TAG, "ConnectionRef available, but SseInfo has changed, call disconnect to reschedule connection");
			Log.d(TAG, "Executing scheduled disconnect");
			connection.disconnect();
		} else {
			Log.d(TAG, "ConnectionRef available, do nothing");
		}
	}

	@Override
	public boolean onStartJob(JobParameters params) {
		Log.d(TAG, "onStartJob");
		restartConnectionIfNeeded(null);
		jobParameters = params;
		alarmNotificationsManager.reScheduleAlarms();
		return true;
	}

	@Override
	public boolean onStopJob(JobParameters params) {
		Log.d(TAG, "The job is finished");
		return true;
	}

	private void connect() {
		Log.d(TAG, "Starting SSE connection");
		Random random = new Random();
		BufferedReader reader = null;
		if (connectedSseInfo == null) {
			Log.d(TAG, "sse info not available skip reconnect");
			return;
		}

		try {
			URL url = new URL(connectedSseInfo.getSseOrigin() + "/sse?_body=" + requestJson(connectedSseInfo));
			HttpURLConnection httpsURLConnection = (HttpURLConnection) url.openConnection();
			this.httpsURLConnectionRef.set(httpsURLConnection);
			httpsURLConnection.setRequestProperty("Content-Type", "application/json");
			httpsURLConnection.setRequestProperty("Connection", "Keep-Alive");
			httpsURLConnection.setRequestProperty("Keep-Alive", "header");
			httpsURLConnection.setRequestProperty("Connection", "close");
			httpsURLConnection.setRequestProperty("Accept", "text/event-stream");
			httpsURLConnection.setRequestMethod("GET");

			timeoutInSeconds = PreferenceManager.getDefaultSharedPreferences(this)
					.getInt(HEARTBEAT_TIMEOUT_IN_SECONDS_KEY, 30);
			httpsURLConnection.setConnectTimeout((int) TimeUnit.SECONDS.toMillis(5));
			httpsURLConnection.setReadTimeout((int) (TimeUnit.SECONDS.toMillis(timeoutInSeconds) * 1.2));

			InputStream inputStream = new BufferedInputStream(httpsURLConnection.getInputStream());
			reader = new BufferedReader(new InputStreamReader(inputStream));
			String event;
			Log.d(TAG, "SSE connection established, listening for events");
			while ((event = reader.readLine()) != null) {
				Log.d(TAG, "Stopping foreground");
				failedConnectionAttempts = 0;
				ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);

				if (!event.startsWith("data: ")) {
					Log.d(TAG, "heartbeat");
					continue;
				}
				event = event.substring(6);
				Log.d(TAG, "Event: " + event);
				if (event.matches("^[0-9]+$"))
					continue;

				if (event.startsWith("heartbeatTimeout:")) {
					timeoutInSeconds = Integer.parseInt(event.split(":")[1]);
					PreferenceManager.getDefaultSharedPreferences(this).edit()
							.putInt(HEARTBEAT_TIMEOUT_IN_SECONDS_KEY, timeoutInSeconds).apply();
					scheduleJobFinish();
					continue;
				}

				handlePushNotification(event);
				Log.d(TAG, "Executing jobFinished after receiving notifications");
				finishJobIfNeeded();
			}
		} catch (Exception exception) {
			HttpURLConnection httpURLConnection = httpsURLConnectionRef.get();
			try {
				// we get not authorized for the stored identifier and user ids, so remove them
				if (httpURLConnection != null && httpURLConnection.getResponseCode() == 403) {
					Log.e(TAG, "not authorized to connect, disable reconnect");
					sseStorage.clear();
					finishJobIfNeeded();
					stopForeground(true);
					return;
				}
			} catch (IOException e) {
				// ignore Exception when getting status code.
			}
			int delayBoundary = (int) (timeoutInSeconds * 1.5);
			int delay = (random.nextInt(timeoutInSeconds) + delayBoundary) / 2;

			failedConnectionAttempts++;
			if (failedConnectionAttempts > RECONNECTION_ATTEMPTS) {
				failedConnectionAttempts = 0;
				Log.e(TAG, "Too many failed connection attempts, will try to sync notifications next time system wakes app up");
				finishJobIfNeeded();
				stopForeground(true);
			} else if (this.hasNetworkConnection()) {
				Log.e(TAG, "error opening sse, rescheduling after " + delay + ", failedConnectionAttempts: " + failedConnectionAttempts, exception);
				reschedule(delay);
			} else {
				Log.e(TAG, "network is not connected, do not reschedule ", exception);
			}
		} finally {
			if (reader != null) {
				try {
					reader.close();
				} catch (IOException ignored) {
				}
			}
			httpsURLConnectionRef.set(null);
		}
	}

	private void handlePushNotification(String event) throws IOException {
		PushMessage pushMessage;
		try {
			pushMessage = PushMessage.fromJson(event);
		} catch (JSONException e) {
			throw new RuntimeException(e);
		}
		if (lastProcessedChangeTime >= Long.parseLong(pushMessage.getChangeTime())) {
			Log.d(TAG, "Already processed notificaiton, ignoring: " + lastProcessedChangeTime);
			return;
		}
		List<PushMessage.NotificationInfo> notificationInfos;
		String changeTime;
		String confirmationId;
		List<AlarmNotification> alarmNotifications;
		boolean failedToConfirm = false;
		while (true) {
			if (failedToConfirm || pushMessage.hasAlarmNotifications()) {
				try {
					MissedNotification missedNotification = downloadMissedNotification();
					notificationInfos = missedNotification.getNotificationInfos();
					changeTime = missedNotification.getChangeTime();
					confirmationId = missedNotification.getConfirmationId();
					alarmNotifications = missedNotification.getAlarmNotifications();
				} catch (FileNotFoundException e) {
					Log.i(TAG, "MissedNotificaiton is not found, ignoring: " + e.getMessage());
					return;
				} catch (IllegalArgumentException e) {
					Log.w(TAG, e);
					localNotificationsFacade.showErrorNotification();
					return;
				}
			} else {
				notificationInfos = pushMessage.getNotificationInfos();
				changeTime = pushMessage.getChangeTime();
				confirmationId = pushMessage.getConfirmationId();
				alarmNotifications = null;
			}
			Log.d(TAG, "Scheduling confirmation for " + connectedSseInfo.getPushIdentifier());
			try {
				sendConfirmation(confirmationId, changeTime);
			} catch (PreconditionFailedException e) {
				failedToConfirm = true;
				// try again until we don't get up-to-date notification
				continue;
			}
			break;
		}
		this.lastProcessedChangeTime = Long.parseLong(changeTime);

		handleNotificationInfos(pushMessage, notificationInfos);
		if (alarmNotifications != null) {
			handleAlarmNotifications(alarmNotifications);
		}
	}

	private void handleAlarmNotifications(List<AlarmNotification> alarmNotifications) {
		this.alarmNotificationsManager.scheduleNewAlarms(alarmNotifications);
	}

	private MissedNotification downloadMissedNotification() throws IllegalArgumentException, IOException {
		try {
			URL url = makeAlarmNotificationUrl();
			HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();

			urlConnection.setConnectTimeout(30 * 1000);
			urlConnection.setReadTimeout(20 * 1000);

			urlConnection.setRequestProperty("userIds", TextUtils.join(",", connectedSseInfo.getUserIds()));

			try (InputStream inputStream = urlConnection.getInputStream()) {
				String responseString = IOUtils.toString(inputStream, StandardCharsets.UTF_8);
				Log.d(TAG, "Missed notifications response:\n" + responseString);
				return MissedNotification.fromJson(new JSONObject(responseString));
			}
		} catch (MalformedURLException | JSONException e) {
			throw new RuntimeException(e);
		}
	}

	private URL makeAlarmNotificationUrl() throws MalformedURLException {
		String customId = Utils.base64ToBase64Url(Utils.bytesToBase64(connectedSseInfo.getPushIdentifier().getBytes(StandardCharsets.UTF_8)));
		return new URL(connectedSseInfo.getSseOrigin() +
				"/rest/sys/missednotification/A/" + customId);
	}

	private void handleNotificationInfos(PushMessage pushMessage,
										 List<PushMessage.NotificationInfo> notificationInfos) {
		localNotificationsFacade.sendEmailNotifications(pushMessage.getTitle(), notificationInfos);
	}

	private void scheduleJobFinish() {
		if (jobParameters != null) {
			new Thread(() -> {
				Log.d(TAG, "Scheduling jobFinished");
				try {
					Thread.sleep(15000);
				} catch (InterruptedException ignored) {
				}
				Log.d(TAG, "Executing scheduled jobFinished");
				finishJobIfNeeded();
			}, "FinishJobThread");
		}
	}

	private void finishJobIfNeeded() {
		if (jobParameters != null) {
			jobFinished(jobParameters, true);
			jobParameters = null;
		}
	}


	private void sendConfirmation(String confirmationId, String changeTime) throws PreconditionFailedException {
		Log.d(TAG, "Sending confirmation");
		try {
			URL confirmUrl = makeAlarmNotificationUrl();
			HttpURLConnection httpURLConnection = (HttpURLConnection) confirmUrl.openConnection();
			httpURLConnection.setRequestMethod("DELETE");
			httpURLConnection.setConnectTimeout((int) TimeUnit.SECONDS.toMillis(5));
			httpURLConnection.setRequestProperty("confirmationId", confirmationId);
			httpURLConnection.setRequestProperty("changeTime", changeTime);
			Log.d(TAG, "Confirmation: opening connection " + confirmUrl);
			httpURLConnection.connect();
			int responseCode = httpURLConnection.getResponseCode();
			if (responseCode == 412) {
				throw new PreconditionFailedException();
			}
			Log.d(TAG, "Confirmation response code " + responseCode);
		} catch (MalformedURLException e) {
			throw new RuntimeException(e);
		} catch (IOException e) {
			Log.e(TAG, "Failed to send confirmation");
		}
	}

	private void reschedule(int delayInSeconds) {
		if (looperThread.getHandler() != null) {
			looperThread.getHandler().postDelayed(this::connect,
					TimeUnit.SECONDS.toMillis(delayInSeconds));
		} else {
			Log.d(TAG, "looper thread is starting, skip additional reschedule");
		}
	}

	private boolean hasNetworkConnection() {
		NetworkInfo networkInfo = connectivityManager.getActiveNetworkInfo();
		return networkInfo != null && networkInfo.isConnectedOrConnecting();
	}

	private String requestJson(SseInfo sseInfo) {
		JSONObject jsonObject = new JSONObject();
		try {
			jsonObject.put("_format", "0");
			jsonObject.put("identifier", sseInfo.getPushIdentifier());
			JSONArray jsonArray = new JSONArray();
			for (String userId : sseInfo.getUserIds()) {
				JSONObject userIdObject = new JSONObject();
				userIdObject.put("_id", generateId());
				userIdObject.put("value", userId);
				jsonArray.put(userIdObject);
			}
			jsonObject.put("userIds", jsonArray);
			return URLEncoder.encode(jsonObject.toString(), "UTF-8");
		} catch (JSONException | UnsupportedEncodingException e) {
			throw new RuntimeException(e);
		}
	}

	private String generateId() {
		byte[] bytes = new byte[4];
		crypto.getRandomizer().nextBytes(bytes);
		return Utils.base64ToBase64Url(Utils.bytesToBase64(bytes));
	}

	@Override
	public void onDestroy() {
		Log.d(TAG, "onDestroy");
		unregisterReceiver(networkReceiver);
		super.onDestroy();
	}
}