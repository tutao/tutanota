package de.tutao.tutanota.push;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
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
import android.support.annotation.Nullable;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.R;
import de.tutao.tutanota.Utils;

public final class PushNotificationService extends Service {

    protected static final String TAG = "PushNotificationService";
    private static final int ONGOING_NOTIFICATION_ID = 342;
    private static final String SSE_INFO_EXTRA = "sseInfo";
    public static final String NOTIFICATION_DISMISSED_ADDR_EXTRA = "notificationDismissed";

    private final LooperThread looperThread = new LooperThread(this::connect);
    private final SseStorage sseStorage = new SseStorage(this);
    private final AtomicReference<HttpURLConnection> httpsURLConnectionRef =
            new AtomicReference<>(null);
    private final Crypto crypto = new Crypto(this);
    private volatile SseInfo connectedSseInfo;
    private ConnectivityManager connectivityManager;

    private final Map<String, Integer> aliasNotification = new ConcurrentHashMap<>();

    public static Intent startIntent(Context context, @Nullable SseInfo sseInfo) {
        Intent intent = new Intent(context, PushNotificationService.class);
        if (sseInfo != null) {
            intent.putExtra(SSE_INFO_EXTRA, sseInfo.toJSON());
        }
        return intent;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        this.connectedSseInfo = sseStorage.getSseInfo();
        looperThread.start();

        registerReceiver(new BroadcastReceiver() {
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
        }, new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION));

        Notification notification = new Notification.Builder(this)
                .setContentTitle("Tutanota notification service")
                .setSmallIcon(R.drawable.ic_status)
                .setPriority(Notification.PRIORITY_MIN)
                .build();

        startForeground(ONGOING_NOTIFICATION_ID, notification);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Received onStartCommand");

        if (intent != null && intent.hasExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA)) {
            String notificationId = intent.getStringExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA);
            if (notificationId != null) {
                aliasNotification.remove(notificationId);
            }
            return START_STICKY;
        }

        SseInfo sseInfo = null;
        if (intent != null && intent.hasExtra(SSE_INFO_EXTRA)) {
            sseInfo = SseInfo.fromJson(intent.getStringExtra(SSE_INFO_EXTRA));
        }

        if (sseInfo == null) {
            sseInfo = sseStorage.getSseInfo();
        }
        SseInfo oldConnectedInfo = this.connectedSseInfo;
        this.connectedSseInfo = sseInfo;

        Log.d(TAG, "current sseInfo: " + connectedSseInfo);
        Log.d(TAG, "stored sseInfo: " + oldConnectedInfo);

        HttpURLConnection connection = httpsURLConnectionRef.get();
        if (connection == null) {
            Log.d(TAG, "ConnectionRef not available, schedule connect");
            this.reschedule(0);
        } else if (connectedSseInfo != null && !connectedSseInfo.equals(oldConnectedInfo)) {
            Log.d(TAG, "ConnectionRef available, but SseInfo has changed, call disconnect to reschedule connection");
            connection.disconnect();
        } else {
            Log.d(TAG, "ConnectionRef available, do nothing");
        }
        return Service.START_STICKY;
    }

    private void connect() {
        Log.d(TAG, "Starting SSE connection");
        Random random = new Random();
        BufferedReader reader = null;
        if (connectedSseInfo == null) {
            Log.d(TAG, "sse info not available skip reconnect");
            return;
        }
        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        Uri notificatoinUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
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

            httpsURLConnection.setConnectTimeout((int) TimeUnit.SECONDS.toMillis(5));
            httpsURLConnection.setReadTimeout((int) TimeUnit.SECONDS.toMillis(15));
            InputStream inputStream = new BufferedInputStream(httpsURLConnection.getInputStream());
            reader = new BufferedReader(new InputStreamReader(inputStream));
            String event;
            Log.d(TAG, "SSE connection established, listening for events");
            while ((event = reader.readLine()) != null) {
                if (!event.startsWith("data: ")) {
                    continue;
                }
                event = event.substring(6);
                if (event.matches("^[0-9]{1,}$"))
                    continue;
                PushMessage pushMessage;
                try {
                    pushMessage = PushMessage.fromJson(event);
                } catch (JSONException e) {
                    Log.e(TAG, "Failed to parse notification message", e);
                    continue;
                }

                List<PushMessage.RecipientInfo> recipientInfos = pushMessage.getRecipientInfos();
                for (int i = 0; i < recipientInfos.size(); i++) {
                    PushMessage.RecipientInfo recipientInfo = recipientInfos.get(i);
                    Intent deleteIntent = new Intent(this, PushNotificationService.class);
                    int notificationId = recipientInfo.getAddress().hashCode();
                    deleteIntent.putExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA, recipientInfo.getAddress());

                    Integer counterPerAlias =
                            aliasNotification.get(recipientInfo.getAddress());
                    if (counterPerAlias == null) {
                        counterPerAlias = recipientInfo.getCounter();
                    } else {
                        counterPerAlias += recipientInfo.getCounter();
                    }
                    aliasNotification.put(recipientInfo.getAddress(), counterPerAlias);

                    Notification.Builder notificationBuilder = new Notification.Builder(this)
                            .setContentTitle(pushMessage.getTitle())
                            .setContentText(recipientInfo.getAddress())
                            .setNumber(counterPerAlias)
                            .setSmallIcon(R.drawable.ic_status)
                            .setDeleteIntent(PendingIntent.getService(this.getApplicationContext(), notificationId, deleteIntent, 0));
                    if (i == 0) {
                        notificationBuilder.setSound(notificatoinUri);
                        notificationBuilder.setVibrate(new long[]{3000});
                    }
                    //noinspection ConstantConditions
                    notificationManager.notify(notificationId, notificationBuilder.build());
                }
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

            if (this.hasNetworkConnection()) {
                Log.e(TAG, "error opening sse, rescheduling after " + delay, ignored);
                reschedule(delay);
            } else {
                Log.e(TAG, "network is not connected, do not reschedule ", ignored);
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
}

final class LooperThread extends Thread {

    private volatile Handler handler;
    private Runnable initRunnable;

    LooperThread(Runnable initRunnable) {
        this.initRunnable = initRunnable;
    }

    @Override
    public void run() {
        Log.d(PushNotificationService.TAG, "LooperThread is started");
        Looper.prepare();
        handler = new Handler();
        handler.post(initRunnable);
        Looper.loop();
    }

    public Handler getHandler() {
        return handler;
    }
}

final class PushMessage {

    private static final String TITLE_KEY = "title";
    private static final String ADDRESS_KEY = "address";
    private static final String COUNTER_KEY = "counter";
    private static final String NOTIFICATIONS_KEY  = "notificationInfos";

    private final String title;
    private final List<RecipientInfo> recipientInfos;

    public static PushMessage fromJson(String json) throws JSONException {
        JSONObject jsonObject = new JSONObject(json);
        String title = jsonObject.getString(TITLE_KEY);
        JSONArray recipientInfosJsonArray = jsonObject.getJSONArray(NOTIFICATIONS_KEY);
        List<RecipientInfo> recipientInfos = new ArrayList<>(recipientInfosJsonArray.length());
        for (int i = 0; i < recipientInfosJsonArray.length(); i++) {
            String address = recipientInfosJsonArray.getJSONObject(i).getString(ADDRESS_KEY);
            int counter = recipientInfosJsonArray.getJSONObject(i).getInt(COUNTER_KEY);
            recipientInfos.add(new RecipientInfo(address, counter));
        }
        return new PushMessage(title, recipientInfos);
    }

    private PushMessage(String title, List<RecipientInfo> recipientInfos) {
        this.title = title;
        this.recipientInfos = recipientInfos;
    }

    public String getTitle() {
        return title;
    }

    public List<RecipientInfo> getRecipientInfos() {
        return recipientInfos;
    }

    final static class RecipientInfo {
        private final String address;
        private final int counter;

        RecipientInfo(String address, int counter) {
            this.address = address;
            this.counter = counter;
        }

        public String getAddress() {
            return address;
        }

        public int getCounter() {
            return counter;
        }
    }
}