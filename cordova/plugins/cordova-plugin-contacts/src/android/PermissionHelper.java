/*
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
package org.apache.cordova.contacts;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Arrays;

import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.LOG;

import android.content.pm.PackageManager;

/**
 * This class provides reflective methods for permission requesting and checking so that plugins
 * written for cordova-android 5.0.0+ can still compile with earlier cordova-android versions.
 */
public class PermissionHelper {
    private static final String LOG_TAG = "CordovaPermissionHelper";

    /**
     * Requests a "dangerous" permission for the application at runtime. This is a helper method
     * alternative to cordovaInterface.requestPermission() that does not require the project to be
     * built with cordova-android 5.0.0+
     *
     * @param plugin        The plugin the permission is being requested for
     * @param requestCode   A requestCode to be passed to the plugin's onRequestPermissionResult()
     *                      along with the result of the permission request
     * @param permission    The permission to be requested
     */
    public static void requestPermission(CordovaPlugin plugin, int requestCode, String permission) {
        PermissionHelper.requestPermissions(plugin, requestCode, new String[] {permission});
    }

    /**
     * Requests "dangerous" permissions for the application at runtime. This is a helper method
     * alternative to cordovaInterface.requestPermissions() that does not require the project to be
     * built with cordova-android 5.0.0+
     *
     * @param plugin        The plugin the permissions are being requested for
     * @param requestCode   A requestCode to be passed to the plugin's onRequestPermissionResult()
     *                      along with the result of the permissions request
     * @param permissions   The permissions to be requested
     */
    public static void requestPermissions(CordovaPlugin plugin, int requestCode, String[] permissions) {
        try {
            Method requestPermission = CordovaInterface.class.getDeclaredMethod(
                    "requestPermissions", CordovaPlugin.class, int.class, String[].class);

            // If there is no exception, then this is cordova-android 5.0.0+
            requestPermission.invoke(plugin.cordova, plugin, requestCode, permissions);
        } catch (NoSuchMethodException noSuchMethodException) {
            // cordova-android version is less than 5.0.0, so permission is implicitly granted
            LOG.d(LOG_TAG, "No need to request permissions " + Arrays.toString(permissions));

            // Notify the plugin that all were granted by using more reflection
            deliverPermissionResult(plugin, requestCode, permissions);
        } catch (IllegalAccessException illegalAccessException) {
            // Should never be caught; this is a public method
            LOG.e(LOG_TAG, "IllegalAccessException when requesting permissions " + Arrays.toString(permissions), illegalAccessException);
        } catch(InvocationTargetException invocationTargetException) {
            // This method does not throw any exceptions, so this should never be caught
            LOG.e(LOG_TAG, "invocationTargetException when requesting permissions " + Arrays.toString(permissions), invocationTargetException);
        }
    }

    /**
     * Checks at runtime to see if the application has been granted a permission. This is a helper
     * method alternative to cordovaInterface.hasPermission() that does not require the project to
     * be built with cordova-android 5.0.0+
     *
     * @param plugin        The plugin the permission is being checked against
     * @param permission    The permission to be checked
     *
     * @return              True if the permission has already been granted and false otherwise
     */
    public static boolean hasPermission(CordovaPlugin plugin, String permission) {
        try {
            Method hasPermission = CordovaInterface.class.getDeclaredMethod("hasPermission", String.class);

            // If there is no exception, then this is cordova-android 5.0.0+
            return (Boolean) hasPermission.invoke(plugin.cordova, permission);
        } catch (NoSuchMethodException noSuchMethodException) {
            // cordova-android version is less than 5.0.0, so permission is implicitly granted
            LOG.d(LOG_TAG, "No need to check for permission " + permission);
            return true;
        } catch (IllegalAccessException illegalAccessException) {
            // Should never be caught; this is a public method
            LOG.e(LOG_TAG, "IllegalAccessException when checking permission " + permission, illegalAccessException);
        } catch(InvocationTargetException invocationTargetException) {
            // This method does not throw any exceptions, so this should never be caught
            LOG.e(LOG_TAG, "invocationTargetException when checking permission " + permission, invocationTargetException);
        }
        return false;
    }

    private static void deliverPermissionResult(CordovaPlugin plugin, int requestCode, String[] permissions) {
        // Generate the request results
        int[] requestResults = new int[permissions.length];
        Arrays.fill(requestResults, PackageManager.PERMISSION_GRANTED);

        try {
            Method onRequestPermissionResult = CordovaPlugin.class.getDeclaredMethod(
                    "onRequestPermissionResult", int.class, String[].class, int[].class);

            onRequestPermissionResult.invoke(plugin, requestCode, permissions, requestResults);
        } catch (NoSuchMethodException noSuchMethodException) {
            // Should never be caught since the plugin must be written for cordova-android 5.0.0+ if it
            // made it to this point
            LOG.e(LOG_TAG, "NoSuchMethodException when delivering permissions results", noSuchMethodException);
        } catch (IllegalAccessException illegalAccessException) {
            // Should never be caught; this is a public method
            LOG.e(LOG_TAG, "IllegalAccessException when delivering permissions results", illegalAccessException);
        } catch(InvocationTargetException invocationTargetException) {
            // This method may throw a JSONException. We are just duplicating cordova-android's
            // exception handling behavior here; all it does is log the exception in CordovaActivity,
            // print the stacktrace, and ignore it
            LOG.e(LOG_TAG, "InvocationTargetException when delivering permissions results", invocationTargetException);
        }
    }
}
