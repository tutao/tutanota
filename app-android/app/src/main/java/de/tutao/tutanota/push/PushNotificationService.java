package de.tutao.tutanota.push;

import android.annotation.TargetApi;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.NetworkRequest;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.preference.PreferenceManager;
import android.provider.Settings;
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
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.MainActivity;
import de.tutao.tutanota.R;
import de.tutao.tutanota.Utils;

public final class PushNotificationService extends JobService {

    protected static final String TAG = "PushNotificationService";
    private static final int ONGOING_NOTIFICATION_ID = 342;
    private static final String SSE_INFO_EXTRA = "sseInfo";
    public static final String NOTIFICATION_DISMISSED_ADDR_EXTRA = "notificationDismissed";
    public static final String HEARTBEAT_TIMEOUT_IN_SECONDS_KEY = "heartbeatTimeoutInSeconds";
    public static final String SERVICE_NOTIFICATION_CHANNEL_ID = "service";
    public static final String EMAIL_NOTIFICATION_CHANNEL_ID = "notifications";
    public static final long[] VIBRATION_PATTERN = {100, 200, 100, 200};

    private final LooperThread looperThread = new LooperThread(this::connect);
    private final SseStorage sseStorage = new SseStorage(this);
    private final AtomicReference<HttpURLConnection> httpsURLConnectionRef =
            new AtomicReference<>(null);
    private final Crypto crypto = new Crypto(this);
    private volatile SseInfo connectedSseInfo;
    private volatile int timeoutInSeconds;
    private ConnectivityManager connectivityManager;

    private final Map<String, Integer> aliasNotification = new ConcurrentHashMap<>();

    private final BlockingQueue<Runnable> confirmationWorkQueue = new LinkedBlockingQueue<>();

    private final ThreadPoolExecutor confirmationThreadPool = new ThreadPoolExecutor(
            2, // initial pool size
            2, // max pool size
            1, // keep alive time
            TimeUnit.SECONDS,
            confirmationWorkQueue);

    public static Intent startIntent(Context context, @Nullable SseInfo sseInfo, String sender) {
        Intent intent = new Intent(context, PushNotificationService.class);
        if (sseInfo != null) {
            intent.putExtra(SSE_INFO_EXTRA, sseInfo.toJSON());
        }
        intent.putExtra("sender", sender);
        return intent;
    }


    public static Intent notificationDismissedIntent(Context context, String emailAddress, String sender) {
        Intent deleteIntent = new Intent(context, PushNotificationService.class);
        deleteIntent.putExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA, emailAddress);
        deleteIntent.putExtra("sender", sender);
        return deleteIntent;
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

        if (atLeastOreo()) {
            createNotificationChannels();
        }
//        prepareNotifications();
    }

    private void prepareNotifications() {
        Notification.Builder ongoingNotificationBuilder;
        if (atLeastOreo()) {
            ongoingNotificationBuilder = new Notification.Builder(this,
                    SERVICE_NOTIFICATION_CHANNEL_ID);
        } else {
            ongoingNotificationBuilder = new Notification.Builder(this)
                    .setPriority(Notification.PRIORITY_MIN);
        }

        Intent serviceNotificationIntent;
        if (atLeastOreo()) {
            serviceNotificationIntent = new Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName())
                    .putExtra(Settings.EXTRA_CHANNEL_ID, SERVICE_NOTIFICATION_CHANNEL_ID);
        } else {
            // TODO make support page/screen
            serviceNotificationIntent = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://tutanota.uservoice.com/knowledgebase"));
        }

        Notification ongoingNotification = ongoingNotificationBuilder
                .setContentTitle("Tutanota notification service")
                .setContentText("Tap me to learn how to hide me")
                .setSmallIcon(R.drawable.ic_status)
                .setContentIntent(PendingIntent.getActivity(this, 1, serviceNotificationIntent, 0, null))
                .build();

        startForeground(ONGOING_NOTIFICATION_ID, ongoingNotification);
    }

    private boolean atLeastOreo() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
    }

    @TargetApi(Build.VERSION_CODES.O)
    private void createNotificationChannels() {
//        NotificationChannel serviceChannel = new NotificationChannel(
//                SERVICE_NOTIFICATION_CHANNEL_ID, "Service notification",
//                NotificationManager.IMPORTANCE_LOW);
//        serviceChannel.setShowBadge(false);
//        serviceChannel.enableVibration(false);
//        serviceChannel.enableLights(false);
//        serviceChannel.setDescription("Set my importance to Low to see me less");
//        getNotificationManager().createNotificationChannel(serviceChannel);

        NotificationChannel notificationsChannel = new NotificationChannel(
                EMAIL_NOTIFICATION_CHANNEL_ID, getString(R.string.notificationChannelEmail_label),
                NotificationManager.IMPORTANCE_DEFAULT);
        notificationsChannel.setShowBadge(true);
        Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        AudioAttributes att = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_UNKNOWN)
                .build();
        notificationsChannel.setSound(ringtoneUri, att);
        notificationsChannel.setVibrationPattern(VIBRATION_PATTERN);
        notificationsChannel.enableLights(true);
        notificationsChannel.setLightColor(Color.RED);
        getNotificationManager().createNotificationChannel(notificationsChannel);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Received onStartCommand, sender: "
                + (intent == null ? null : intent.getStringExtra("sender")));

        if (intent != null && intent.hasExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA)) {
            String dissmessAddr = intent.getStringExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA);
            if (dissmessAddr != null) {
                aliasNotification.remove(dissmessAddr);
            }
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
            confirmationThreadPool.execute(connection::disconnect);
        } else {
            Log.d(TAG, "ConnectionRef available, do nothing");
        }
    }

    @Override
    public boolean onStartJob(JobParameters params) {
        Log.d(TAG, "onStartJob");
        restartConnectionIfNeeded(null);
        return false; // All job is done in this thread. Release wakelock
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
        NotificationManager notificationManager = getNotificationManager();

        Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
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
                if (!event.startsWith("data: ")) {
                    continue;
                }
                event = event.substring(6);
                if (event.matches("^[0-9]{1,}$"))
                    continue;

                if (event.startsWith("heartbeatTimeout:")) {
                    timeoutInSeconds = Integer.parseInt(event.split(":")[1]);
                    PreferenceManager.getDefaultSharedPreferences(this).edit()
                            .putInt(HEARTBEAT_TIMEOUT_IN_SECONDS_KEY, timeoutInSeconds).apply();
                    continue;
                }

                PushMessage pushMessage;
                try {
                    pushMessage = PushMessage.fromJson(event);
                } catch (JSONException e) {
                    Log.e(TAG, "Failed to parse notification message", e);
                    continue;
                }

                List<PushMessage.NotificationInfo> notificationInfos = pushMessage.getNotificationInfos();
                for (int i = 0; i < notificationInfos.size(); i++) {
                    PushMessage.NotificationInfo notificationInfo = notificationInfos.get(i);
                    Intent deleteIntent = new Intent(this, PushNotificationService.class);
                    int notificationId = Math.abs(notificationInfo.getAddress().hashCode());
                    deleteIntent.putExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA, notificationInfo.getAddress());

                    Integer counterPerAlias =
                            aliasNotification.get(notificationInfo.getAddress());
                    if (counterPerAlias == null) {
                        counterPerAlias = notificationInfo.getCounter();
                    } else {
                        counterPerAlias += notificationInfo.getCounter();
                    }
                    aliasNotification.put(notificationInfo.getAddress(), counterPerAlias);

                    Log.d(TAG, "Event: " + event);

                    Intent openMailboxIntent = new Intent(this, MainActivity.class);
                    openMailboxIntent.setAction(MainActivity.OPEN_USER_MAILBOX_ACTION);
                    openMailboxIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_MAILADDRESS_KEY, notificationInfo.getAddress());
                    openMailboxIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, notificationInfo.getUserId());


                    Notification.Builder notificationBuilder;
                    if (atLeastOreo()) {
                         notificationBuilder =
                                 new Notification.Builder(this, EMAIL_NOTIFICATION_CHANNEL_ID);
                    } else {
                         notificationBuilder = new Notification.Builder(this)
                                 .setLights(getResources().getColor(R.color.colorPrimary), 1000, 1000);
                    }
                    notificationBuilder.setContentTitle(pushMessage.getTitle())
                            .setColor(getResources().getColor(R.color.colorPrimary))
                            .setContentText(notificationInfo.getAddress())
                            .setNumber(counterPerAlias)
                            .setSmallIcon(R.drawable.ic_status)
                            .setDeleteIntent(PendingIntent.getService(
                                    this.getApplicationContext(),
                                    notificationId,
                                    deleteIntent,
                                    0))
                            .setContentIntent(PendingIntent.getActivity(
                                    this,
                                    notificationId,
                                    openMailboxIntent,
                                    PendingIntent.FLAG_UPDATE_CURRENT))
                            .setAutoCancel(true);

                    if (i == 0) {
                        notificationBuilder.setSound(ringtoneUri);
                        notificationBuilder.setVibrate(VIBRATION_PATTERN);
                    }
                    //noinspection ConstantConditions
                    notificationManager.notify(notificationId, notificationBuilder.build());

                    Log.d(TAG, "Scheduling confirmation for " + connectedSseInfo.getPushIdentifier());
                    confirmationThreadPool.execute(
                            () -> sendConfirmation(connectedSseInfo.getPushIdentifier(), pushMessage));
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
            int delayBoundary = (int) (timeoutInSeconds * 1.5);
            int delay = (random.nextInt(timeoutInSeconds) + delayBoundary) / 2;

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

    private NotificationManager getNotificationManager() {
        return (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    }

    private void sendConfirmation(String pushIdentifier, PushMessage pushMessage) {
        Log.d(TAG, "Sending confirmation");
        URL confirmUrl;
        try {
            confirmUrl = new URL(connectedSseInfo.getSseOrigin() + "/sse?confirmationId=" +
                    URLEncoder.encode(pushMessage.getConfirmationId(), "UTF-8")
                    + "&pushIdentifier=" + URLEncoder.encode(pushIdentifier, "UTF-8"));
        } catch (MalformedURLException e) {
            Log.w(TAG, "Confirmation URL is malformed", e);
            return;
        } catch (UnsupportedEncodingException ignored) {
            return;
        }
        try {
            HttpURLConnection httpURLConnection = (HttpURLConnection) confirmUrl.openConnection();
            httpURLConnection.setRequestMethod("DELETE");
            httpURLConnection.setConnectTimeout((int) TimeUnit.SECONDS.toMillis(5));
            Log.d(TAG, "Confirmation: opening connection " + confirmUrl);
            httpURLConnection.connect();
            int responseCode = httpURLConnection.getResponseCode();
            Log.d(TAG, "Confirmation response code " + responseCode);
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
    private static final String USER_ID_KEY = "userId";
    private static final String NOTIFICATIONS_KEY = "notificationInfos";
    private static final String CONFIRMATION_ID_KEY = "confirmationId";

    private final String title;
    private final String confirmationId;
    private final List<NotificationInfo> notificationInfos;

    public static PushMessage fromJson(String json) throws JSONException {
        JSONObject jsonObject = new JSONObject(json);
        String title = jsonObject.getString(TITLE_KEY);
        String confirmationId = jsonObject.getString(CONFIRMATION_ID_KEY);
        JSONArray recipientInfosJsonArray = jsonObject.getJSONArray(NOTIFICATIONS_KEY);
        List<NotificationInfo> notificationInfos = new ArrayList<>(recipientInfosJsonArray.length());
        for (int i = 0; i < recipientInfosJsonArray.length(); i++) {
            JSONObject itemObject = recipientInfosJsonArray.getJSONObject(i);
            String address = itemObject.getString(ADDRESS_KEY);
            int counter = itemObject.getInt(COUNTER_KEY);
            String userId = itemObject.getString(USER_ID_KEY);
            notificationInfos.add(new NotificationInfo(address, counter, userId));
        }
        return new PushMessage(title, confirmationId, notificationInfos);
    }

    private PushMessage(String title, String confirmationId,
                        List<NotificationInfo> notificationInfos) {
        this.title = title;
        this.confirmationId = confirmationId;
        this.notificationInfos = notificationInfos;
    }

    public String getTitle() {
        return title;
    }

    public List<NotificationInfo> getNotificationInfos() {
        return notificationInfos;
    }

    public String getConfirmationId() {
        return confirmationId;
    }

    final static class NotificationInfo {
        private final String address;
        private final int counter;
        private String userId;

        NotificationInfo(String address, int counter, String userId) {
            this.address = address;
            this.counter = counter;
            this.userId = userId;
        }

        public String getAddress() {
            return address;
        }

        public int getCounter() {
            return counter;
        }

        public String getUserId() {
            return userId;
        }
    }

}
