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
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.ServiceCompat;
import android.text.TextUtils;
import android.util.Log;

import org.apache.commons.io.IOUtils;
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
import java.nio.charset.StandardCharsets;
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

import de.tutao.tutanota.alarms.AlarmNotificationsManager;
import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.MainActivity;
import de.tutao.tutanota.R;
import de.tutao.tutanota.Utils;

import static de.tutao.tutanota.Utils.atLeastOreo;

public final class PushNotificationService extends JobService {

    protected static final String TAG = "PushNotificationService";
    private static final String SSE_INFO_EXTRA = "sseInfo";
    public static final String NOTIFICATION_DISMISSED_ADDR_EXTRA = "notificationDismissed";
    public static final String HEARTBEAT_TIMEOUT_IN_SECONDS_KEY = "heartbeatTimeoutInSeconds";
    public static final String EMAIL_NOTIFICATION_CHANNEL_ID = "notifications";
    private static final String PERSISTENT_NOTIFICATION_CHANNEL_ID = "service_intent";
    public static final long[] VIBRATION_PATTERN = {100, 200, 100, 200};
    public static final String NOTIFICATION_EMAIL_GROUP = "de.tutao.tutanota.email";
    public static final int SUMMARY_NOTIFICATION_ID = 45;

    private final LooperThread looperThread = new LooperThread(this::connect);
    private final SseStorage sseStorage = new SseStorage(this);
    private final AtomicReference<HttpURLConnection> httpsURLConnectionRef =
            new AtomicReference<>(null);
    private final Crypto crypto = new Crypto(this);
    private AlarmNotificationsManager alarmNotificationsManager;
    private volatile SseInfo connectedSseInfo;
    private volatile int timeoutInSeconds;
    private ConnectivityManager connectivityManager;
    private volatile JobParameters jobParameters;

    private final Map<String, LocalNotificationInfo> aliasNotification =
            new ConcurrentHashMap<>();

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


    public static Intent notificationDismissedIntent(Context context,
                                                     ArrayList<String> emailAddresses,
                                                     String sender,
                                                     boolean isSummary) {
        Intent deleteIntent = new Intent(context, PushNotificationService.class);
        deleteIntent.putStringArrayListExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA, emailAddresses);
        deleteIntent.putExtra("sender", sender);
        deleteIntent.putExtra(MainActivity.IS_SUMMARY_EXTRA, isSummary);
        return deleteIntent;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        this.connectedSseInfo = sseStorage.getSseInfo();
        alarmNotificationsManager = new AlarmNotificationsManager(this, sseStorage);
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
            Log.d(TAG, "Starting foreground");
            startForeground(1, new NotificationCompat
                    .Builder(this, PERSISTENT_NOTIFICATION_CHANNEL_ID)
                    .setContentTitle("Notification service")
                    .setSmallIcon(R.drawable.ic_status)
                    .build());
        }
    }

    @TargetApi(Build.VERSION_CODES.O)
    private void createNotificationChannels() {
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
        notificationsChannel.setShowBadge(true);
        getNotificationManager().createNotificationChannel(notificationsChannel);

        NotificationChannel serviceNotificationChannel = new NotificationChannel(
                PERSISTENT_NOTIFICATION_CHANNEL_ID, "Notification service",
                NotificationManager.IMPORTANCE_LOW);
        getNotificationManager().createNotificationChannel(serviceNotificationChannel);


    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Received onStartCommand, sender: "
                + (intent == null ? null : intent.getStringExtra("sender")));

        if (intent != null && intent.hasExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA)) {
            ArrayList<String> dissmissAddrs =
                    intent.getStringArrayListExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA);
            if (intent.getBooleanExtra(MainActivity.IS_SUMMARY_EXTRA, false)) {
                // If the user clicked on summary directly, reset counter for all notifications
                aliasNotification.clear();
            } else {
                if (dissmissAddrs != null) {
                    for (String addr : dissmissAddrs) {
                        aliasNotification.remove(addr);
                    }
                }
            }
            if (aliasNotification.isEmpty()) {
                getNotificationManager().cancel(SUMMARY_NOTIFICATION_ID);
            } else {
                boolean allAreZero = true;
                for (LocalNotificationInfo info : aliasNotification.values()) {
                    if (info.counter > 1) {
                        allAreZero = false;
                        break;
                    }
                }
                if (allAreZero) {
                    getNotificationManager().cancel(SUMMARY_NOTIFICATION_ID);
                } else {
                    for (LocalNotificationInfo info : aliasNotification.values()) {
                        if (info.counter > 0) {
                            sendSummaryNotification(getNotificationManager(),
                                    info.message, info.notificationInfo);
                        }
                    }
                }
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
            confirmationThreadPool.execute(() -> {
                Log.d(TAG, "Executing scheduled disconnect");
                connection.disconnect();
            });
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
        NotificationManager notificationManager = getNotificationManager();

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

                PushMessage pushMessage;
                try {
                    pushMessage = PushMessage.fromJson(event);
                } catch (JSONException e) {
                    Log.e(TAG, "Failed to parse notification message", e);
                    continue;
                }

                List<PushMessage.NotificationInfo> notificationInfos = pushMessage.getNotificationInfos();

                handleNotificationInfos(notificationManager, pushMessage, notificationInfos);
                handleAlarmNotifications(pushMessage.hasAlarmNotifications());

                Log.d(TAG, "Scheduling confirmation for " + connectedSseInfo.getPushIdentifier());
                confirmationThreadPool.execute(
                        () -> sendConfirmation(connectedSseInfo.getPushIdentifier(), pushMessage));
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
                    return;
                }
            } catch (IOException e) {
                // ignore Exception when getting status code.
            }
            int delayBoundary = (int) (timeoutInSeconds * 1.5);
            int delay = (random.nextInt(timeoutInSeconds) + delayBoundary) / 2;

            if (this.hasNetworkConnection()) {
                Log.e(TAG, "error opening sse, rescheduling after " + delay, exception);
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

    private void handleAlarmNotifications(boolean hasAlarmNotifications) {
        if (!hasAlarmNotifications) {
            return;
        }
        try {
            String base64UrlId = Utils.base64ToBase64Url(connectedSseInfo.getPushIdentifier());

            URL url = new URL(connectedSseInfo.getSseOrigin() +
                    "/rest/sys/missednotification/A/" + base64UrlId);
            HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();

            urlConnection.setConnectTimeout(30);
            urlConnection.setReadTimeout(20);

            urlConnection.setRequestProperty("userIds", TextUtils.join(",", connectedSseInfo.getUserIds()));
            InputStream inputStream = urlConnection.getInputStream();
            String responseString = IOUtils.toString(inputStream, StandardCharsets.UTF_8);
            Log.d(TAG, "Missed notifications response:\n" + responseString);
            MissedNotification missedNotification = MissedNotification.fromJson(new JSONObject(responseString));


            this.alarmNotificationsManager
                    .scheduleNewAlarms(missedNotification.getAlarmNotifications());
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void handleNotificationInfos(NotificationManager notificationManager, PushMessage pushMessage, List<PushMessage.NotificationInfo> notificationInfos) {
        for (int i = 0; i < notificationInfos.size(); i++) {
            PushMessage.NotificationInfo notificationInfo = notificationInfos.get(i);

            LocalNotificationInfo counterPerAlias =
                    aliasNotification.get(notificationInfo.getAddress());
            if (counterPerAlias == null) {
                counterPerAlias = new LocalNotificationInfo(
                        pushMessage.getTitle(),
                        notificationInfo.getCounter(), notificationInfo);
            } else {
                counterPerAlias = counterPerAlias.incremented(notificationInfo.getCounter());
            }
            aliasNotification.put(notificationInfo.getAddress(), counterPerAlias);

            int notificationId = notificationId(notificationInfo.getAddress());


            NotificationCompat.Builder notificationBuilder =
                    new NotificationCompat.Builder(this, EMAIL_NOTIFICATION_CHANNEL_ID)
                            .setLights(getResources().getColor(R.color.colorPrimary), 1000, 1000);
            ArrayList<String> addresses = new ArrayList<>();
            addresses.add(notificationInfo.getAddress());
            notificationBuilder.setContentTitle(pushMessage.getTitle())
                    .setColor(getResources().getColor(R.color.colorPrimary))
                    .setContentText(notificationContent(notificationInfo.getAddress()))
                    .setNumber(counterPerAlias.counter)
                    .setSmallIcon(R.drawable.ic_status)
                    .setDeleteIntent(this.intentForDelete(addresses))
                    .setContentIntent(intentOpenMailbox(notificationInfo, false))
                    .setGroup(NOTIFICATION_EMAIL_GROUP)
                    .setAutoCancel(true)
                    .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_SUMMARY);

            notificationManager.notify(notificationId, notificationBuilder.build());

            sendSummaryNotification(notificationManager, pushMessage.getTitle(),
                    notificationInfo);

        }
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

    private int notificationId(String address) {
        return Math.abs(1 + address.hashCode());
    }

    private void sendSummaryNotification(NotificationManager notificationManager,
                                         String title,
                                         PushMessage.NotificationInfo notificationInfo) {
        int summaryCounter = 0;
        ArrayList<String> addresses = new ArrayList<>();
        NotificationCompat.InboxStyle inboxStyle = new NotificationCompat.InboxStyle();

        for (Map.Entry<String, LocalNotificationInfo> entry : aliasNotification.entrySet()) {
            int count = entry.getValue().counter;
            if (count > 0) {
                summaryCounter += count;
                inboxStyle.addLine(notificationContent(entry.getKey()));
                addresses.add(entry.getKey());
            }
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, EMAIL_NOTIFICATION_CHANNEL_ID)
                .setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL);

        Notification notification = builder.setContentTitle(title)
                .setContentText(notificationContent(notificationInfo.getAddress()))
                .setSmallIcon(R.drawable.ic_status)
                .setGroup(NOTIFICATION_EMAIL_GROUP)
                .setGroupSummary(true)
                .setColor(getResources().getColor(R.color.colorPrimary))
                .setNumber(summaryCounter)
                .setStyle(inboxStyle)
                .setContentIntent(intentOpenMailbox(notificationInfo, true))
                .setDeleteIntent(intentForDelete(addresses))
                .setAutoCancel(true)
                .setDefaults(NotificationCompat.DEFAULT_SOUND | NotificationCompat.DEFAULT_VIBRATE)
                .build();
        notificationManager.notify(SUMMARY_NOTIFICATION_ID, notification);
    }

    private PendingIntent intentForDelete(ArrayList<String> addresses) {
        Intent deleteIntent = new Intent(this, PushNotificationService.class);
        deleteIntent.putStringArrayListExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA, addresses);
        return PendingIntent.getService(
                this.getApplicationContext(),
                notificationId("dismiss" + TextUtils.join("+", addresses)),
                deleteIntent,
                PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private PendingIntent intentOpenMailbox(PushMessage.NotificationInfo notificationInfo,
                                            boolean isSummary) {
        Intent openMailboxIntent = new Intent(this, MainActivity.class);
        openMailboxIntent.setAction(MainActivity.OPEN_USER_MAILBOX_ACTION);
        openMailboxIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_MAILADDRESS_KEY,
                notificationInfo.getAddress());
        openMailboxIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY,
                notificationInfo.getUserId());
        openMailboxIntent.putExtra(MainActivity.IS_SUMMARY_EXTRA, isSummary);
        return PendingIntent.getActivity(
                this,
                notificationId(notificationInfo.getAddress() + "@isSummary" + isSummary),
                openMailboxIntent,
                PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @NonNull
    private String notificationContent(String address) {
        return aliasNotification.get(address).counter + " " + address;
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

final class LocalNotificationInfo {
    final String message;
    final int counter;
    final PushMessage.NotificationInfo notificationInfo;

    LocalNotificationInfo(String message, int counter, PushMessage.NotificationInfo notificationInfo) {
        this.message = message;
        this.counter = counter;
        this.notificationInfo = notificationInfo;
    }

    LocalNotificationInfo incremented(int by) {
        return new LocalNotificationInfo(message, counter + by, notificationInfo);
    }
}

