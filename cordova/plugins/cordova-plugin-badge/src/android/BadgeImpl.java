/*
 * Copyright (c) 2014-2015 by appPlant UG. All rights reserved.
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

package de.appplant.cordova.plugin.badge;

import android.content.Context;
import android.content.SharedPreferences;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;

import me.leolin.shortcutbadger.ShortcutBadger;

/**
 * Implementation of the badge interface methods.
 */
class BadgeImpl {

    /**
     * The name for the shared preferences key
     */
    protected static final String KEY = "badge";

    /**
     * Clears the badge of the app icon.
     *
     * @param ctx
     * The application context.
     */
    protected void clearBadge (Context ctx) {
        saveBadge(0, ctx);
        ShortcutBadger.removeCount(ctx);
    }

    /**
     * Retrieves the badge of the app icon.
     *
     * @param ctx
     * The application context.
     * @param callback
     * The function to be exec as the callback.
     */
    protected void getBadge (CallbackContext callback, Context ctx) {
        SharedPreferences settings = getSharedPreferences(ctx);
        int badge = settings.getInt(KEY, 0);
        PluginResult result;

        result = new PluginResult(PluginResult.Status.OK, badge);

        callback.sendPluginResult(result);
    }

    /**
     * Sets the badge of the app icon.
     *
     * @param args
     * The new badge number
     * @param ctx
     * The application context
     */
    protected void setBadge (JSONArray args, Context ctx) {
        int badge = args.optInt(0);

        saveBadge(badge, ctx);
        ShortcutBadger.applyCount(ctx, badge);
    }

    /**
     * Persist the badge of the app icon so that `getBadge` is able to return
     * the badge number back to the client.
     *
     * @param badge
     * The badge of the app icon.
     * @param ctx
     * The application context.
     */
    protected void saveBadge (int badge, Context ctx) {
        SharedPreferences.Editor editor = getSharedPreferences(ctx).edit();

        editor.putInt(KEY, badge);
        editor.apply();
    }

    /**
     * Informs if the app has the permission to show badges.
     *
     * @param callback
     * The function to be exec as the callback
     */
    protected void hasPermission (final CallbackContext callback) {
        PluginResult result = new PluginResult(PluginResult.Status.OK, true);

        callback.sendPluginResult(result);
    }

    /**
     * The Local storage for the application.
     */
    private SharedPreferences getSharedPreferences (Context context) {
        return context.getSharedPreferences(KEY, Context.MODE_PRIVATE);
    }

}
