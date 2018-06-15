package de.tutao.tutanota.push;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.RingtoneManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.R;
import de.tutao.tutanota.Utils;

public final class PushNotificationService extends Service {

    private static final String TAG = "PushNotificationService";
    private static final int NOTIFICATION_ID = 341;

    private final LooperThread looperThread = new LooperThread(this::connect);
    private final SseStorage sseStorage = new SseStorage(this);
    private final AtomicReference<HttpURLConnection> httpsURLConnectionRef =
            new AtomicReference<>(null);
    private final Crypto crypto = new Crypto(this);
    private SseInfo connectedSseInfo;
    private ConnectivityManager connectivityManager;

    public PushNotificationService() {
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);

        registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                HttpURLConnection connection = httpsURLConnectionRef.get();
                if (!hasNetworkConnection()) {
                    if (connection != null) {
                        connection.disconnect();
                    }
                } else {
                    if (connection == null) {
                        reschedule(0);
                    }
                }
            }
        }, new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Received start");
        HttpURLConnection connection = httpsURLConnectionRef.get();
        if (this.looperThread.isAlive()) {
            Log.d(TAG, "Reconnect onStartCommand");
            if (connection != null
                    && this.connectedSseInfo != null
                    && !this.connectedSseInfo.equals(sseStorage.getSseInfo())) {
                connection.disconnect();
            }else {
                this.looperThread.getHandler().post(this::connect);
            }
        } else {
            Log.d(TAG, "Starting looperThread");
            looperThread.start();
        }
        return Service.START_STICKY;
    }

    private void connect() {
        Log.d(TAG, "Starting SSE connection");
        Random random = new Random();
        BufferedReader reader = null;
        SseInfo sseInfo = sseStorage.getSseInfo();
        if (sseInfo == null) {
            Log.d(TAG, "sse info not available skip reconnect");
            return;
        }
        this.connectedSseInfo = sseInfo;


        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        Uri notificatoinUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        try {
            URL url = new URL(sseInfo.getSseOrigin() + "/sse?_body=" + requestJson(sseInfo));
            HttpURLConnection httpsURLConnection = (HttpURLConnection) url.openConnection();
            this.httpsURLConnectionRef.set(httpsURLConnection);
            httpsURLConnection.setRequestProperty("Content-Type", "application/json");
            httpsURLConnection.setRequestProperty("Connection", "Keep-Alive");
            httpsURLConnection.setRequestProperty("Keep-Alive", "header");
            httpsURLConnection.setRequestProperty("Connection", "close");
            httpsURLConnection.setRequestProperty("Accept", "text/event-stream");
            httpsURLConnection.setRequestMethod("GET");
            //httpsURLConnection.setConnectTimeout(70000);
            httpsURLConnection.setReadTimeout((int) TimeUnit.SECONDS.toMillis(15));
            InputStream inputStream = new BufferedInputStream(httpsURLConnection.getInputStream());
            reader = new BufferedReader(new InputStreamReader(inputStream));
            String event;
            while ((event = reader.readLine()) != null) {
                if (!event.startsWith("data: ")) {
                    continue;
                }
                event = event.substring(6);
                if (event.matches("^[0-9]{1,}$"))
                    continue;

                Notification notification = new Notification.Builder(this)
                        .setContentTitle(event)
                        .setSmallIcon(R.drawable.ic_status)
                        .setSound(notificatoinUri)
                        .setVibrate(new long[]{3000})
                        .build();
                //noinspection ConstantConditions
                notificationManager.notify(NOTIFICATION_ID, notification);
            }
        } catch (Exception ignored) {
            HttpURLConnection httpURLConnection = httpsURLConnectionRef.get();
            try {
                // we get not authorized for the stored identifier and user ids, so remove them
                if (httpURLConnection != null && httpURLConnection.getResponseCode() == 403) {
                    Log.e(TAG, "not authorized to connect, disable reconnect");
                    sseStorage.clear();
                    return;
                }
            } catch (IOException e) {
                // ignore Exception when getting status code.
            }
            int delay = random.nextInt(15) + 15;
            Log.e(TAG, "error opening sse, rescheduling after " + delay, ignored);
            reschedule(delay);
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

    private void reschedule(int delay) {
        looperThread.getHandler().postDelayed(this::connect,
                TimeUnit.SECONDS.toMillis(delay));
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
}

final class LooperThread extends Thread {

    private Handler handler;
    private Runnable initRunnable;

    LooperThread(Runnable initRunnable) {
        this.initRunnable = initRunnable;
    }

    @Override
    public void run() {
        Looper.prepare();
        handler = new Handler();
        handler.post(initRunnable);
        Looper.loop();
    }

    public Handler getHandler() {
        return handler;
    }
}