/*
    Copyright 2013-2014 appPlant UG

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

package de.appplant.cordova.plugin.localnotification;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Calendar;
import java.util.Date;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.app.AlarmManager;
import android.content.Context;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.StrictMode;
import android.os.StrictMode.ThreadPolicy;

/**
 * Class that helps to store the options that can be specified per alarm.
 */
public class Options {

    private JSONObject options = new JSONObject();
    private String packageName = null;
    private long interval      = 0;

    Options (Activity activity) {
        packageName = activity.getPackageName();
    }

    Options (Context context) {
        packageName = context.getPackageName();
    }

    /**
     * Parses the given properties
     */
    public Options parse (JSONObject options) {
        String repeat = options.optString("repeat");

        this.options = options;

        if (repeat.equalsIgnoreCase("secondly")) {
            interval = 1000;
        } if (repeat.equalsIgnoreCase("minutely")) {
            interval = AlarmManager.INTERVAL_FIFTEEN_MINUTES / 15;
        } if (repeat.equalsIgnoreCase("hourly")) {
            interval = AlarmManager.INTERVAL_HOUR;
        } if (repeat.equalsIgnoreCase("daily")) {
            interval = AlarmManager.INTERVAL_DAY;
        } else if (repeat.equalsIgnoreCase("weekly")) {
            interval = AlarmManager.INTERVAL_DAY*7;
        } else if (repeat.equalsIgnoreCase("monthly")) {
            interval = AlarmManager.INTERVAL_DAY*31; // 31 days
        } else if (repeat.equalsIgnoreCase("yearly")) {
            interval = AlarmManager.INTERVAL_DAY*365;
        } else {
            try {
                interval = Integer.parseInt(repeat) * 60000;
            } catch (Exception e) {};
        }

        return this;
    }

    /**
     * Set new time according to interval
     */
    public Options moveDate () {
        try {
            options.put("date", (getDate() + interval) / 1000);
        } catch (JSONException e) {}

        return this;
    }

    /**
     * Returns options as JSON object
     */
    public JSONObject getJSONObject() {
        return options;
    }

    /**
     * Returns time in milliseconds when notification is scheduled to fire
     */
    public long getDate() {
        return options.optLong("date", 0) * 1000;
    }

    /**
     * Returns time as calender
     */
    public Calendar getCalendar () {
        Calendar calendar = Calendar.getInstance();

        calendar.setTime(new Date(getDate()));

        return calendar;
    }

    /**
     * Returns the notification's message
     */
    public String getMessage () {
        return options.optString("message", "");
    }

    /**
     * Returns the notification's title
     */
    public String getTitle () {
        return options.optString("title", "");
    }

    /**
     * Returns the path of the notification's sound file
     */
    public Uri getSound () {
        String sound = options.optString("sound", null);

        if (sound != null) {
            try {
                int soundId = (Integer) RingtoneManager.class.getDeclaredField(sound).get(Integer.class);

                return RingtoneManager.getDefaultUri(soundId);
            } catch (Exception e) {
                return Uri.parse(sound);
            }
        }

        return null;
    }

    /**
     * Returns the icon's ID
     */
    public Bitmap getIcon () {
        String icon = options.optString("icon", "icon");
        Bitmap bmp = null;

        if (icon.startsWith("http")) {
            bmp = getIconFromURL(icon);
        } else if (icon.startsWith("file://")) {
            bmp = getIconFromURI(icon);
        }

        if (bmp == null) {
            bmp = getIconFromRes(icon);
        }

        return bmp;
    }

    /**
     * Returns the small icon's ID
     */
    public int getSmallIcon () {
        int resId       = 0;
        String iconName = options.optString("smallIcon", "");

        resId = getIconValue(packageName, iconName);

        if (resId == 0) {
            resId = getIconValue("android", iconName);
        }

        if (resId == 0) {
            resId = getIconValue(packageName, "icon");
        }

        return options.optInt("smallIcon", resId);
    }

    /**
     * Returns notification repetition interval (daily, weekly, monthly, yearly)
     */
    public long getInterval () {
        return interval;
    }

    /**
     * Returns notification badge number
     */
    public int getBadge () {
        return options.optInt("badge", 0);
    }

    /**
     * Returns PluginResults' callback ID
     */
    public String getId () {
        return options.optString("id", "0");
    }

    /**
     * Returns whether notification is cancelled automatically when clicked.
     */
    public Boolean getAutoCancel () {
        return options.optBoolean("autoCancel", false);
    }

    /**
     * Returns whether the notification is ongoing (uncancellable). Android only.
     */
    public Boolean getOngoing () {
        return options.optBoolean("ongoing", false);
    }

    /**
     * Returns additional data as string
     */
    public String getJSON () {
        return options.optString("json", "");
    }

    /**
     * @return
     *      The notification color for LED
     */
   public int getColor () {
        String hexColor = options.optString("led", "000000");
        int aRGB        = Integer.parseInt(hexColor,16);

        aRGB += 0xFF000000;

        return aRGB;
    }

    /**
     * Returns numerical icon Value
     *
     * @param {String} className
     * @param {String} iconName
     */
    private int getIconValue (String className, String iconName) {
        int icon = 0;

        try {
            Class<?> klass  = Class.forName(className + ".R$drawable");

            icon = (Integer) klass.getDeclaredField(iconName).get(Integer.class);
        } catch (Exception e) {}

        return icon;
    }

    /**
     * Converts an resource to Bitmap.
     *
     * @param icon
     *      The resource name
     * @return
     *      The corresponding bitmap
     */
    private Bitmap getIconFromRes (String icon) {
        Resources res = LocalNotification.context.getResources();
        int iconId = 0;

        iconId = getIconValue(packageName, icon);

        if (iconId == 0) {
            iconId = getIconValue("android", icon);
        }

        if (iconId == 0) {
            iconId = android.R.drawable.ic_menu_info_details;
        }

        Bitmap bmp = BitmapFactory.decodeResource(res, iconId);

        return bmp;
    }

    /**
     * Converts an Image URL to Bitmap.
     *
     * @param src
     *      The external image URL
     * @return
     *      The corresponding bitmap
     */
    private Bitmap getIconFromURL (String src) {
        Bitmap bmp = null;
        ThreadPolicy origMode = StrictMode.getThreadPolicy();

        try {
            URL url = new URL(src);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            StrictMode.ThreadPolicy policy =
                    new StrictMode.ThreadPolicy.Builder().permitAll().build();

            StrictMode.setThreadPolicy(policy);

            connection.setDoInput(true);
            connection.connect();

            InputStream input = connection.getInputStream();

            bmp = BitmapFactory.decodeStream(input);
        } catch (Exception e) {
            e.printStackTrace();
        }

        StrictMode.setThreadPolicy(origMode);

        return bmp;
    }

    /**
     * Converts an Image URI to Bitmap.
     *
     * @param src
     *      The internal image URI
     * @return
     *      The corresponding bitmap
     */
    private Bitmap getIconFromURI (String src) {
        AssetManager assets = LocalNotification.context.getAssets();
        Bitmap bmp = null;

        try {
            String path = src.replace("file:/", "www");
            InputStream input = assets.open(path);

            bmp = BitmapFactory.decodeStream(input);
        } catch (IOException e) {
            e.printStackTrace();
        }

        return bmp;
    }
}
