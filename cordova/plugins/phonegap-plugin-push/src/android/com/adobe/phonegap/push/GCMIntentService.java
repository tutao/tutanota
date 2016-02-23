package com.adobe.phonegap.push;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;
import android.text.Html;
import android.util.Log;

import com.google.android.gms.gcm.GcmListenerService;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Random;

@SuppressLint("NewApi")
public class GCMIntentService extends GcmListenerService implements PushConstants {

    private static final String LOG_TAG = "PushPlugin_GCMIntentService";
    private static HashMap<Integer, ArrayList<String>> messageMap = new HashMap<Integer, ArrayList<String>>();

    public void setNotification(int notId, String message){
        ArrayList<String> messageList = messageMap.get(notId);
        if(messageList == null) {
            messageList = new ArrayList<String>();
            messageMap.put(notId, messageList);
        }

        if(message.isEmpty()){
            messageList.clear();
        }else{
            messageList.add(message);
        }
    }

    @Override
    public void onMessageReceived(String from, Bundle extras) {
        Log.d(LOG_TAG, "onMessage - from: " + from);

        if (extras != null) {

            SharedPreferences prefs = getApplicationContext().getSharedPreferences(PushPlugin.COM_ADOBE_PHONEGAP_PUSH, Context.MODE_PRIVATE);
            boolean forceShow = prefs.getBoolean(FORCE_SHOW, false);

            extras = normalizeExtras(extras);

            // if we are in the foreground and forceShow is `false` only send data
            if (!forceShow && PushPlugin.isInForeground()) {
                Log.d(LOG_TAG, "foreground");
                extras.putBoolean(FOREGROUND, true);
                PushPlugin.sendExtras(extras);
            }
            // if we are in the foreground and forceShow is `true`, force show the notification if the data has at least a message or title
            else if (forceShow && PushPlugin.isInForeground()) {
                Log.d(LOG_TAG, "foreground force");
                extras.putBoolean(FOREGROUND, true);

                showNotificationIfPossible(getApplicationContext(), extras);
            }
            // if we are not in the foreground always send notification if the data has at least a message or title
            else {
                Log.d(LOG_TAG, "background");
                extras.putBoolean(FOREGROUND, false);

                showNotificationIfPossible(getApplicationContext(), extras);
            }
        }
    }

    /*
     * Change a values key in the extras bundle
     */
    private void replaceKey(String oldKey, String newKey, Bundle extras, Bundle newExtras) {
        Object value = extras.get(oldKey);
        if ( value != null ) {
            if (value instanceof String) {
                newExtras.putString(newKey, (String) value);
            } else if (value instanceof Boolean) {
                newExtras.putBoolean(newKey, (Boolean) value);
            } else if (value instanceof Number) {
                newExtras.putDouble(newKey, ((Number) value).doubleValue());
            } else {
                newExtras.putString(newKey, String.valueOf(value));
            }
        }
    }

    /*
     * Replace alternate keys with our canonical value
     */
    private String normalizeKey(String key) {
        if (key.equals(BODY) || key.equals(ALERT) || key.equals(GCM_NOTIFICATION_BODY)) {
            return MESSAGE;
        } else if (key.equals(MSGCNT) || key.equals(BADGE)) {
            return COUNT;
        } else if (key.equals(SOUNDNAME)) {
            return SOUND;
        } else if (key.startsWith(GCM_NOTIFICATION)) {
            return key.substring(GCM_NOTIFICATION.length()+1, key.length());
        } else if (key.startsWith(GCM_N)) {
            return key.substring(GCM_N.length()+1, key.length());
        } else if (key.startsWith(UA_PREFIX)) {
            key = key.substring(UA_PREFIX.length()+1, key.length());
            return key.toLowerCase();
        } else {
            return key;
        }
    }

    /*
     * Parse bundle into normalized keys.
     */
    private Bundle normalizeExtras(Bundle extras) {
        Log.d(LOG_TAG, "normalize extras");
        Iterator<String> it = extras.keySet().iterator();
        Bundle newExtras = new Bundle();

        while (it.hasNext()) {
            String key = it.next();

            Log.d(LOG_TAG, "key = " + key);

            // If normalizeKeythe key is "data" or "message" and the value is a json object extract
            // This is to support parse.com and other services. Issue #147 and pull #218
            if (key.equals(PARSE_COM_DATA) || key.equals(MESSAGE)) {
                Object json = extras.get(key);
                // Make sure data is json object stringified
                if ( json instanceof String && ((String) json).startsWith("{") ) {
                    Log.d(LOG_TAG, "extracting nested message data from key = " + key);
                    try {
                        // If object contains message keys promote each value to the root of the bundle
                        JSONObject data = new JSONObject((String) json);
                        if ( data.has(ALERT) || data.has(MESSAGE) || data.has(BODY) || data.has(TITLE) ) {
                            Iterator<String> jsonIter = data.keys();
                            while (jsonIter.hasNext()) {
                                String jsonKey = jsonIter.next();

                                Log.d(LOG_TAG, "key = data/" + jsonKey);

                                String value = data.getString(jsonKey);
                                jsonKey = normalizeKey(jsonKey);
                                newExtras.putString(jsonKey, value);
                            }
                        }
                    } catch( JSONException e) {
                        Log.e(LOG_TAG, "normalizeExtras: JSON exception");
                    }
                }
            } else if (key.equals(("notification"))) {
                Bundle value = extras.getBundle(key);
                Iterator<String> iterator = value.keySet().iterator();
                while (iterator.hasNext()) {
                    String notifkey = iterator.next();

                    Log.d(LOG_TAG, "notifkey = " + notifkey);
                    String newKey = normalizeKey(notifkey);
                    Log.d(LOG_TAG, "replace key " + notifkey + " with " + newKey);

                    newExtras.putString(newKey, value.getString(notifkey));
                }
                continue;
            }

            String newKey = normalizeKey(key);
            Log.d(LOG_TAG, "replace key " + key + " with " + newKey);
            replaceKey(key, newKey, extras, newExtras);

        } // while

        return newExtras;
    }

    private void showNotificationIfPossible (Context context, Bundle extras) {

        // Send a notification if there is a message or title, otherwise just send data
        String message = extras.getString(MESSAGE);
        String title = extras.getString(TITLE);
        String contentAvailable = extras.getString(CONTENT_AVAILABLE);

        Log.d(LOG_TAG, "message =[" + message + "]");
        Log.d(LOG_TAG, "title =[" + title + "]");
        Log.d(LOG_TAG, "contentAvailable =[" + contentAvailable + "]");

        if ((message != null && message.length() != 0) ||
                (title != null && title.length() != 0)) {

            Log.d(LOG_TAG, "create notification");

            createNotification(context, extras);
        }

        if ("1".equals(contentAvailable)) {
            Log.d(LOG_TAG, "send notification event");
            PushPlugin.sendExtras(extras);
        }
    }

    public void createNotification(Context context, Bundle extras) {
        NotificationManager mNotificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        String appName = getAppName(this);
        String packageName = context.getPackageName();
        Resources resources = context.getResources();

        int notId = parseInt(NOT_ID, extras);
        Intent notificationIntent = new Intent(this, PushHandlerActivity.class);
        notificationIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        notificationIntent.putExtra(PUSH_BUNDLE, extras);
        notificationIntent.putExtra(NOT_ID, notId);

        int requestCode = new Random().nextInt();
        PendingIntent contentIntent = PendingIntent.getActivity(this, requestCode, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder mBuilder =
                new NotificationCompat.Builder(context)
                        .setWhen(System.currentTimeMillis())
                        .setContentTitle(extras.getString(TITLE))
                        .setTicker(extras.getString(TITLE))
                        .setContentIntent(contentIntent)
                        .setAutoCancel(true);

        SharedPreferences prefs = context.getSharedPreferences(PushPlugin.COM_ADOBE_PHONEGAP_PUSH, Context.MODE_PRIVATE);
        String localIcon = prefs.getString(ICON, null);
        String localIconColor = prefs.getString(ICON_COLOR, null);
        boolean soundOption = prefs.getBoolean(SOUND, true);
        boolean vibrateOption = prefs.getBoolean(VIBRATE, true);
        Log.d(LOG_TAG, "stored icon=" + localIcon);
        Log.d(LOG_TAG, "stored iconColor=" + localIconColor);
        Log.d(LOG_TAG, "stored sound=" + soundOption);
        Log.d(LOG_TAG, "stored vibrate=" + vibrateOption);

        /*
         * Notification Vibration
         */

        setNotificationVibration(extras, vibrateOption, mBuilder);

        /*
         * Notification Icon Color
         *
         * Sets the small-icon background color of the notification.
         * To use, add the `iconColor` key to plugin android options
         *
         */
        setNotificationIconColor(extras.getString("color"), mBuilder, localIconColor);

        /*
         * Notification Icon
         *
         * Sets the small-icon of the notification.
         *
         * - checks the plugin options for `icon` key
         * - if none, uses the application icon
         *
         * The icon value must be a string that maps to a drawable resource.
         * If no resource is found, falls
         *
         */
        setNotificationSmallIcon(context, extras, packageName, resources, mBuilder, localIcon);

        /*
         * Notification Large-Icon
         *
         * Sets the large-icon of the notification
         *
         * - checks the gcm data for the `image` key
         * - checks to see if remote image, loads it.
         * - checks to see if assets image, Loads It.
         * - checks to see if resource image, LOADS IT!
         * - if none, we don't set the large icon
         *
         */
        setNotificationLargeIcon(extras, packageName, resources, mBuilder);

        /*
         * Notification Sound
         */
        if (soundOption) {
            setNotificationSound(context, extras, mBuilder);
        }

        /*
         *  LED Notification
         */
        setNotificationLedColor(extras, mBuilder);

        /*
         *  Priority Notification
         */
        setNotificationPriority(extras, mBuilder);

        /*
         * Notification message
         */
        setNotificationMessage(notId, extras, mBuilder);

        /*
         * Notification count
         */
        setNotificationCount(extras, mBuilder);

        /*
         * Notification add actions
         */
        createActions(extras, mBuilder, resources, packageName);

        mNotificationManager.notify(appName, notId, mBuilder.build());
    }

    private void createActions(Bundle extras, NotificationCompat.Builder mBuilder, Resources resources, String packageName) {
        Log.d(LOG_TAG, "create actions");
        String actions = extras.getString(ACTIONS);
        if (actions != null) {
            try {
                JSONArray actionsArray = new JSONArray(actions);
                for (int i=0; i < actionsArray.length(); i++) {
                    Log.d(LOG_TAG, "adding action");
                    JSONObject action = actionsArray.getJSONObject(i);
                    Log.d(LOG_TAG, "adding callback = " + action.getString(CALLBACK));
                    Intent intent = new Intent(this, PushHandlerActivity.class);
                    intent.putExtra(CALLBACK, action.getString(CALLBACK));
                    intent.putExtra(PUSH_BUNDLE, extras);
                    PendingIntent pIntent = PendingIntent.getActivity(this, i, intent, PendingIntent.FLAG_UPDATE_CURRENT);

                    mBuilder.addAction(resources.getIdentifier(action.getString(ICON), DRAWABLE, packageName),
                            action.getString(TITLE), pIntent);
                }
            } catch(JSONException e) {
                // nope
            }
        }
    }

    private void setNotificationCount(Bundle extras, NotificationCompat.Builder mBuilder) {
        String msgcnt = extras.getString(MSGCNT);
        if (msgcnt == null) {
            msgcnt = extras.getString(BADGE);
        }
        if (msgcnt != null) {
            mBuilder.setNumber(Integer.parseInt(msgcnt));
        }
    }

    private void setNotificationVibration(Bundle extras, Boolean vibrateOption, NotificationCompat.Builder mBuilder) {
        String vibrationPattern = extras.getString(VIBRATION_PATTERN);
        if (vibrationPattern != null) {
            String[] items = vibrationPattern.replaceAll("\\[", "").replaceAll("\\]", "").split(",");
            long[] results = new long[items.length];
            for (int i = 0; i < items.length; i++) {
                try {
                    results[i] = Long.parseLong(items[i].trim());
                } catch (NumberFormatException nfe) {}
            }
            mBuilder.setVibrate(results);
        } else {
            if (vibrateOption) {
                mBuilder.setDefaults(Notification.DEFAULT_VIBRATE);
            }
        }
    }

    private void setNotificationMessage(int notId, Bundle extras, NotificationCompat.Builder mBuilder) {
        String message = extras.getString(MESSAGE);

        String style = extras.getString(STYLE, STYLE_TEXT);
        if(STYLE_INBOX.equals(style)) {
            setNotification(notId, message);

            mBuilder.setContentText(message);

            ArrayList<String> messageList = messageMap.get(notId);
            Integer sizeList = messageList.size();
            if (sizeList > 1) {
                String sizeListMessage = sizeList.toString();
                String stacking = sizeList + " more";
                if (extras.getString(SUMMARY_TEXT) != null) {
                    stacking = extras.getString(SUMMARY_TEXT);
                    stacking = stacking.replace("%n%", sizeListMessage);
                }
                NotificationCompat.InboxStyle notificationInbox = new NotificationCompat.InboxStyle()
                        .setBigContentTitle(extras.getString(TITLE))
                        .setSummaryText(stacking);

                for (int i = messageList.size() - 1; i >= 0; i--) {
                    notificationInbox.addLine(Html.fromHtml(messageList.get(i)));
                }

                mBuilder.setStyle(notificationInbox);
            } else {
                NotificationCompat.BigTextStyle bigText = new NotificationCompat.BigTextStyle();
                if (message != null) {
                    bigText.bigText(message);
                    bigText.setBigContentTitle(extras.getString(TITLE));
                    mBuilder.setStyle(bigText);
                }
            }
        } else if (STYLE_PICTURE.equals(style)) {
            setNotification(notId, "");

            NotificationCompat.BigPictureStyle bigPicture = new NotificationCompat.BigPictureStyle();
            bigPicture.bigPicture(getBitmapFromURL(extras.getString(PICTURE)));
            bigPicture.setBigContentTitle(extras.getString(TITLE));
            bigPicture.setSummaryText(extras.getString(SUMMARY_TEXT));

            mBuilder.setContentTitle(extras.getString(TITLE));
            mBuilder.setContentText(message);

            mBuilder.setStyle(bigPicture);
        } else {
            setNotification(notId, "");

            NotificationCompat.BigTextStyle bigText = new NotificationCompat.BigTextStyle();

            if (message != null) {
                mBuilder.setContentText(Html.fromHtml(message));

                bigText.bigText(message);
                bigText.setBigContentTitle(extras.getString(TITLE));

                String summaryText = extras.getString(SUMMARY_TEXT);
                if (summaryText != null) {
                    bigText.setSummaryText(summaryText);
                }

                mBuilder.setStyle(bigText);
            }
            /*
            else {
                mBuilder.setContentText("<missing message content>");
            }
            */
        }
    }

    private void setNotificationSound(Context context, Bundle extras, NotificationCompat.Builder mBuilder) {
        String soundname = extras.getString(SOUNDNAME);
        if (soundname == null) {
            soundname = extras.getString(SOUND);
        }
        if (SOUND_RINGTONE.equals(soundname)) {
            mBuilder.setSound(android.provider.Settings.System.DEFAULT_RINGTONE_URI);
        } else if (soundname != null && !soundname.contentEquals(SOUND_DEFAULT)) {
            Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE
                    + "://" + context.getPackageName() + "/raw/" + soundname);
            Log.d(LOG_TAG, sound.toString());
            mBuilder.setSound(sound);
        } else {
            mBuilder.setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI);
        }
    }

    private void setNotificationLedColor(Bundle extras, NotificationCompat.Builder mBuilder) {
        String ledColor = extras.getString(LED_COLOR);
        if (ledColor != null) {
            // Converts parse Int Array from ledColor
            String[] items = ledColor.replaceAll("\\[", "").replaceAll("\\]", "").split(",");
            int[] results = new int[items.length];
            for (int i = 0; i < items.length; i++) {
                try {
                    results[i] = Integer.parseInt(items[i].trim());
                } catch (NumberFormatException nfe) {}
            }
            if (results.length == 4) {
                mBuilder.setLights(Color.argb(results[0], results[1], results[2], results[3]), 500, 500);
            } else {
                Log.e(LOG_TAG, "ledColor parameter must be an array of length == 4 (ARGB)");
            }
        }
    }

    private void setNotificationPriority(Bundle extras, NotificationCompat.Builder mBuilder) {
        String priorityStr = extras.getString(PRIORITY);
        if (priorityStr != null) {
            try {
                Integer priority = Integer.parseInt(priorityStr);
                if (priority >= NotificationCompat.PRIORITY_MIN && priority <= NotificationCompat.PRIORITY_MAX) {
                    mBuilder.setPriority(priority);
                } else {
                    Log.e(LOG_TAG, "Priority parameter must be between -2 and 2");
                }
            } catch (NumberFormatException e) {
                e.printStackTrace();
            }
        }
    }

    private void setNotificationLargeIcon(Bundle extras, String packageName, Resources resources, NotificationCompat.Builder mBuilder) {
        String gcmLargeIcon = extras.getString(IMAGE); // from gcm
        if (gcmLargeIcon != null) {
            if (gcmLargeIcon.startsWith("http://") || gcmLargeIcon.startsWith("https://")) {
                mBuilder.setLargeIcon(getBitmapFromURL(gcmLargeIcon));
                Log.d(LOG_TAG, "using remote large-icon from gcm");
            } else {
                AssetManager assetManager = getAssets();
                InputStream istr;
                try {
                    istr = assetManager.open(gcmLargeIcon);
                    Bitmap bitmap = BitmapFactory.decodeStream(istr);
                    mBuilder.setLargeIcon(bitmap);
                    Log.d(LOG_TAG, "using assets large-icon from gcm");
                } catch (IOException e) {
                    int largeIconId = 0;
                    largeIconId = resources.getIdentifier(gcmLargeIcon, DRAWABLE, packageName);
                    if (largeIconId != 0) {
                        Bitmap largeIconBitmap = BitmapFactory.decodeResource(resources, largeIconId);
                        mBuilder.setLargeIcon(largeIconBitmap);
                        Log.d(LOG_TAG, "using resources large-icon from gcm");
                    } else {
                        Log.d(LOG_TAG, "Not setting large icon");
                    }
                }
            }
        }
    }

    private void setNotificationSmallIcon(Context context, Bundle extras, String packageName, Resources resources, NotificationCompat.Builder mBuilder, String localIcon) {
        int iconId = 0;
        String icon = extras.getString(ICON);
        if (icon != null) {
            iconId = resources.getIdentifier(icon, DRAWABLE, packageName);
            Log.d(LOG_TAG, "using icon from plugin options");
        }
        else if (localIcon != null) {
            iconId = resources.getIdentifier(localIcon, DRAWABLE, packageName);
            Log.d(LOG_TAG, "using icon from plugin options");
        }
        if (iconId == 0) {
            Log.d(LOG_TAG, "no icon resource found - using application icon");
            iconId = context.getApplicationInfo().icon;
        }
        mBuilder.setSmallIcon(iconId);
    }

    private void setNotificationIconColor(String color, NotificationCompat.Builder mBuilder, String localIconColor) {
        int iconColor = 0;
        if (color != null) {
            try {
                iconColor = Color.parseColor(color);
            } catch (IllegalArgumentException e) {
                Log.e(LOG_TAG, "couldn't parse color from android options");
            }
        }
        else if (localIconColor != null) {
            try {
                iconColor = Color.parseColor(localIconColor);
            } catch (IllegalArgumentException e) {
                Log.e(LOG_TAG, "couldn't parse color from android options");
            }
        }
        if (iconColor != 0) {
            mBuilder.setColor(iconColor);
        }
    }

    public Bitmap getBitmapFromURL(String strURL) {
        try {
            URL url = new URL(strURL);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.connect();
            InputStream input = connection.getInputStream();
            return BitmapFactory.decodeStream(input);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    private static String getAppName(Context context) {
        CharSequence appName =  context.getPackageManager().getApplicationLabel(context.getApplicationInfo());
        return (String)appName;
    }

    private int parseInt(String value, Bundle extras) {
        int retval = 0;

        try {
            retval = Integer.parseInt(extras.getString(value));
        }
        catch(NumberFormatException e) {
            Log.e(LOG_TAG, "Number format exception - Error parsing " + value + ": " + e.getMessage());
        }
        catch(Exception e) {
            Log.e(LOG_TAG, "Number format exception - Error parsing " + value + ": " + e.getMessage());
        }

        return retval;
    }
}
