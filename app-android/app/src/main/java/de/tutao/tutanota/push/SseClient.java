package de.tutao.tutanota.push;

import android.util.Log;

import androidx.annotation.NonNull;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.NetworkUtils;
import de.tutao.tutanota.Utils;
import de.tutao.tutanota.data.SseInfo;

public class SseClient {
	private static final String TAG = "SSE";
	public static final int RECONNECTION_ATTEMPTS = 3;

	private final Crypto crypto;
	private final NetworkObserver networkObserver;
	private final SseListener sseListener;
	private final SseStorage sseStorage;

	private volatile SseInfo connectedSseInfo;
	private volatile long timeoutInSeconds = 90;
	private int failedConnectionAttempts = 0;

	private final AtomicReference<HttpURLConnection> httpsURLConnectionRef = new AtomicReference<>(null);
	private final LooperThread looperThread = new LooperThread(this::connect);

	SseClient(Crypto crypto, SseStorage sseStorage, NetworkObserver networkObserver, SseListener sseListener) {
		this.crypto = crypto;
		this.networkObserver = networkObserver;
		this.sseListener = sseListener;
		this.sseStorage = sseStorage;

		looperThread.start();

		networkObserver.setNetworkConnectivityListener(connected -> {
			HttpURLConnection connection = httpsURLConnectionRef.get();
			if (connected && connection == null) {
				Log.d(TAG, "ConnectionRef not available, schedule connect because of network state change");
				reschedule(0);
			}
		});
	}

	private void reschedule(int delayInSeconds) {
		if (looperThread.getHandler() != null) {
			looperThread.getHandler().postDelayed(this::connect, TimeUnit.SECONDS.toMillis(delayInSeconds));
		} else {
			Log.d(TAG, "looper thread is starting, skip additional reschedule");
		}
	}

	public void restartConnectionIfNeeded(@NonNull SseInfo sseInfo) {
		SseInfo oldConnectedInfo = this.connectedSseInfo;
		this.connectedSseInfo = sseInfo;

		HttpURLConnection connection = httpsURLConnectionRef.get();
		if (connection == null) {
			Log.d(TAG, "ConnectionRef not available, schedule connect");
			reschedule(0);
		} else if (oldConnectedInfo == null
				|| !oldConnectedInfo.getPushIdentifier().equals(sseInfo.getPushIdentifier())
				|| !oldConnectedInfo.getSseOrigin().equals(sseInfo.getSseOrigin())) {
			// If pushIdentifier or SSE origin have changed for some reason, restart the connect.
			// If user IDs have changed, do not restart, if current user is invalid we have either oldConnectedInfo
			Log.d(TAG, "ConnectionRef available, but SseInfo has changed, call disconnect to reschedule connection");
			connection.disconnect();
		} else {
			Log.d(TAG, "ConnectionRef available, do nothing");
		}
	}

	private void connect() {
		Log.d(TAG, "Starting SSE connection");
		Random random = new Random();
		BufferedReader reader = null;
		if (connectedSseInfo == null) {
			Log.d(TAG, "sse info not available skip reconnect");
			return;
		}

		if (!this.sseListener.onStartingConnection()) {
			return;
		}
		this.timeoutInSeconds = this.sseStorage.getConnectTimeoutInSeconds();
		if (this.timeoutInSeconds == 0) {
			this.timeoutInSeconds = 90;
		}

		ConnectionData connectionData = prepareSSEConnection();
		try {
			HttpURLConnection httpURLConnection = this.openSseConnection(connectionData);
			reader = new BufferedReader(new InputStreamReader(new BufferedInputStream(httpURLConnection.getInputStream())));
			String event;
			Log.d(TAG, "SSE connection established, listening for events");
			boolean notifiedEstablishedConnection = true;
			while ((event = reader.readLine()) != null) {
				handleLine(event);
				if (notifiedEstablishedConnection) {
					this.sseListener.onConnectionEstablished();
					notifiedEstablishedConnection = false;
				}
			}
		} catch (Exception exception) {
			handleException(random, exception, connectionData.userId);
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

	private void handleException(Random random, Exception exception, String userId) {
		HttpURLConnection httpURLConnection = httpsURLConnectionRef.get();
		try {
			// we get not authorized for the stored identifier and user ids, so remove them
			if (httpURLConnection != null && httpURLConnection.getResponseCode() == 403) {
				Log.e(TAG, "not authorized to connect, disable reconnect for " + userId);
				sseListener.onNotAuthorized(userId);
				return;
			}
		} catch (IOException e) {
			// ignore Exception when getting status code.
		}
		int delayBoundary = (int) (timeoutInSeconds * 1.5);
		int delay = (random.nextInt((int) Math.abs(timeoutInSeconds)) + delayBoundary) / 2;

		failedConnectionAttempts++;
		if (failedConnectionAttempts > RECONNECTION_ATTEMPTS) {
			failedConnectionAttempts = 0;
			Log.e(TAG, "Too many failed connection attempts, will try to sync notifications next time system wakes app up");
			sseListener.onStoppingReconnectionAttempts();
		} else if (this.networkObserver.hasNetworkConnection()) {
			Log.e(TAG, "error opening sse, rescheduling after " + delay + ", failedConnectionAttempts: " + failedConnectionAttempts, exception);
			reschedule(delay);
		} else {
			Log.e(TAG, "network is not connected, do not reschedule ", exception);
			sseListener.onStoppingReconnectionAttempts();
		}
	}

	private void handleLine(String line) {
		failedConnectionAttempts = 0;

		if (!line.startsWith("data: ")) {
			Log.d(TAG, "heartbeat");
			return;
		}
		String data = line.substring(6);
		if (data.matches("^[0-9]+$"))
			return;

		if (data.startsWith("heartbeatTimeout:")) {
			timeoutInSeconds = Integer.parseInt(data.split(":")[1]);
			this.sseStorage.setConnectTimeoutInSeconds(timeoutInSeconds);
			sseListener.onConnectionEstablished();
			return;
		}
		this.sseListener.onMessage(data, this.connectedSseInfo);
		Log.d(TAG, "Executing jobFinished after receiving notifications");
	}

	private String requestJson(String pushIdentifier, String userId) {
		JSONObject jsonObject = new JSONObject();
		try {
			jsonObject.put("_format", "0");
			jsonObject.put("identifier", pushIdentifier);
			JSONArray jsonArray = new JSONArray();
			JSONObject userIdObject = new JSONObject();
			userIdObject.put("_id", generateId());
			userIdObject.put("value", userId);
			jsonArray.put(userIdObject);
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

	private ConnectionData prepareSSEConnection() {
		if (connectedSseInfo.getUserIds().isEmpty()) {
			throw new IllegalStateException("Push identifier but no user IDs");
		}
		String userId = connectedSseInfo.getUserIds().iterator().next();

		String json = requestJson(connectedSseInfo.getPushIdentifier(), userId);
		URL url;
		try {
			url = new URL(connectedSseInfo.getSseOrigin() + "/sse?_body=" + json);
		} catch (MalformedURLException e) {
			throw new RuntimeException(e);
		}
		return new ConnectionData(userId, url);
	}

	@NonNull
	private HttpURLConnection openSseConnection(ConnectionData connectionData) throws IOException {
		HttpURLConnection httpsURLConnection = (HttpURLConnection) connectionData.url.openConnection();
		this.httpsURLConnectionRef.set(httpsURLConnection);
		httpsURLConnection.setRequestMethod("GET");
		httpsURLConnection.setRequestProperty("Content-Type", "application/json");
		httpsURLConnection.setRequestProperty("Connection", "Keep-Alive");
		httpsURLConnection.setRequestProperty("Keep-Alive", "header");
		httpsURLConnection.setRequestProperty("Connection", "close");
		httpsURLConnection.setRequestProperty("Accept", "text/event-stream");
		NetworkUtils.addCommonHeaders(httpsURLConnection);

		httpsURLConnection.setConnectTimeout((int) TimeUnit.SECONDS.toMillis(5));
		httpsURLConnection.setReadTimeout((int) (TimeUnit.SECONDS.toMillis(timeoutInSeconds) * 1.2));
		return httpsURLConnection;
	}

	public void stopConnection() {
		HttpURLConnection connection = httpsURLConnectionRef.get();
		Log.d(TAG, "Disconnect sse client");
		if (connection != null) {
			connection.disconnect();
			// check in connect() prevents rescheduling new connection attempts
			this.connectedSseInfo = null;
		}
	}

	public interface SseListener {
		/**
		 * @return {@code true} to continue connecting
		 */
		boolean onStartingConnection();

		/**
		 * Will block reading from SSE until this returns
		 */
		void onMessage(String data, SseInfo sseInfo);

		void onConnectionEstablished();

		void onNotAuthorized(String userId);

		void onStoppingReconnectionAttempts();

	}

	private static final class ConnectionData {
		final String userId;
		final URL url;

		ConnectionData(String userId, URL url) {
			this.userId = userId;
			this.url = url;
		}
	}
}
