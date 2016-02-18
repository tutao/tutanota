/*
 * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */

package de.appplant.cordova.plugin.notification;

import android.app.AlarmManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.net.Uri;
import android.support.v4.app.NotificationCompat;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Date;

/**
 * Wrapper around the JSON object passed through JS which contains all
 * possible option values. Class provides simple readers and more advanced
 * methods to convert independent values into platform specific values.
 */
public class Options {

    // Key name for bundled extras
    static final String EXTRA = "NOTIFICATION_OPTIONS";

    // The original JSON object
    private JSONObject options = new JSONObject();

    // Repeat interval
    private long interval = 0;

    // Application context
    private final Context context;

    // Asset util instance
    private final AssetUtil assets;


    /**
     * Constructor
     *
     * @param context
     *      Application context
     */
    public Options(Context context){
    	this.context = context;
        this.assets  = AssetUtil.getInstance(context);
    }

    /**
     * Parse given JSON properties.
     *
     * @param options
     *      JSON properties
     */
    public Options parse (JSONObject options) {
        this.options = options;

        parseInterval();
        parseAssets();

        return this;
    }

    /**
     * Parse repeat interval.
     */
    private void parseInterval() {
        String every = options.optString("every").toLowerCase();

        if (every.isEmpty()) {
            interval = 0;
        } else
        if (every.equals("second")) {
            interval = 1000;
        } else
        if (every.equals("minute")) {
            interval = AlarmManager.INTERVAL_FIFTEEN_MINUTES / 15;
        } else
        if (every.equals("hour")) {
            interval = AlarmManager.INTERVAL_HOUR;
        } else
        if (every.equals("day")) {
            interval = AlarmManager.INTERVAL_DAY;
        } else
        if (every.equals("week")) {
            interval = AlarmManager.INTERVAL_DAY * 7;
        } else
        if (every.equals("month")) {
            interval = AlarmManager.INTERVAL_DAY * 31;
        } else
        if (every.equals("quarter")) {
            interval = AlarmManager.INTERVAL_HOUR * 2190;
        } else
        if (every.equals("year")) {
            interval = AlarmManager.INTERVAL_DAY * 365;
        } else {
            try {
                interval = Integer.parseInt(every) * 60000;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * Parse asset URIs.
     */
    private void parseAssets() {

        if (options.has("iconUri") && !options.optBoolean("updated"))
            return;

        Uri iconUri  = assets.parse(options.optString("icon", "icon"));
        Uri soundUri = assets.parseSound(options.optString("sound", null));

        try {
            options.put("iconUri", iconUri.toString());
            options.put("soundUri", soundUri.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    /**
     * Application context.
     */
    public Context getContext () {
        return context;
    }

    /**
     * Wrapped JSON object.
     */
    JSONObject getDict () {
        return options;
    }

    /**
     * Text for the local notification.
     */
    public String getText() {
        return options.optString("text", "");
    }

    /**
     * Repeat interval (day, week, month, year, aso.)
     */
    public long getRepeatInterval() {
        return interval;
    }

    /**
     * Badge number for the local notification.
     */
    public int getBadgeNumber() {
        return options.optInt("badge", 0);
    }

    /**
     * ongoing flag for local notifications.
     */
    public Boolean isOngoing() {
        return options.optBoolean("ongoing", false);
    }

    /**
     * autoClear flag for local notifications.
     */
    public Boolean isAutoClear() {
        return options.optBoolean("autoClear", false);
    }

    /**
     * ID for the local notification as a number.
     */
    public Integer getId() {
        return options.optInt("id", 0);
    }

    /**
     * ID for the local notification as a string.
     */
    public String getIdStr() {
        return getId().toString();
    }

    /**
     * Trigger date.
     */
    public Date getTriggerDate() {
        return new Date(getTriggerTime());
    }

    /**
     * Trigger date in milliseconds.
     */
    public long getTriggerTime() {
        return options.optLong("at", 0) * 1000;
    }

    /**
     * Title for the local notification.
     */
    public String getTitle() {
        String title = options.optString("title", "");

        if (title.isEmpty()) {
            title = context.getApplicationInfo().loadLabel(
                    context.getPackageManager()).toString();
        }

        return title;
    }

    /**
     * @return
     *      The notification color for LED
     */
    public int getLedColor() {
        String hex = options.optString("led", null);

        if (hex == null) {
            return NotificationCompat.DEFAULT_LIGHTS;
        }

        int aRGB = Integer.parseInt(hex, 16);

        return aRGB + 0xFF000000;
    }

    /**
     * @return
     *      The notification background color for the small icon
     *      Returns null, if no color is given.
     */
    public int getColor() {
        String hex = options.optString("color", null);

        if (hex == null) {
            return NotificationCompat.COLOR_DEFAULT;
        }

        int aRGB = Integer.parseInt(hex, 16);

        return aRGB + 0xFF000000;
    }

    /**
     * Sound file path for the local notification.
     */
    public Uri getSoundUri() {
        Uri uri = null;

        try{
            uri = Uri.parse(options.optString("soundUri"));
        } catch (Exception e){
            e.printStackTrace();
        }

        return uri;
    }

    /**
     * Icon bitmap for the local notification.
     */
    public Bitmap getIconBitmap() {
        Bitmap bmp;

        try {
            Uri uri = Uri.parse(options.optString("iconUri"));
            bmp = assets.getIconFromUri(uri);
        } catch (Exception e){
            e.printStackTrace();
            bmp = assets.getIconFromDrawable("icon");
        }

        return bmp;
    }

    /**
     * Icon resource ID for the local notification.
     */
    public int getIcon () {
        String icon = options.optString("icon", "");

        int resId = assets.getResIdForDrawable(icon);

        if (resId == 0) {
            resId = getSmallIcon();
        }

        if (resId == 0) {
            resId = android.R.drawable.ic_popup_reminder;
        }

        return resId;
    }

    /**
     * Small icon resource ID for the local notification.
     */
    public int getSmallIcon () {
        String icon = options.optString("smallIcon", "");

        return assets.getResIdForDrawable(icon);
    }

    /**
     * JSON object as string.
     */
    public String toString() {
        return options.toString();
    }

}
