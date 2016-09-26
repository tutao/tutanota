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
package org.apache.cordova;

import android.app.Activity;
import android.content.Intent;

import org.apache.cordova.CordovaPlugin;

import java.util.concurrent.ExecutorService;

/**
 * The Activity interface that is implemented by CordovaActivity.
 * It is used to isolate plugin development, and remove dependency on entire Cordova library.
 */
public interface CordovaInterface {

    /**
     * Launch an activity for which you would like a result when it finished. When this activity exits,
     * your onActivityResult() method will be called.
     *
     * @param command     The command object
     * @param intent      The intent to start
     * @param requestCode   The request code that is passed to callback to identify the activity
     */
    abstract public void startActivityForResult(CordovaPlugin command, Intent intent, int requestCode);

    /**
     * Set the plugin to be called when a sub-activity exits.
     *
     * @param plugin      The plugin on which onActivityResult is to be called
     */
    abstract public void setActivityResultCallback(CordovaPlugin plugin);

    /**
     * Get the Android activity.
     *
     * @return the Activity
     */
    public abstract Activity getActivity();
    

    /**
     * Called when a message is sent to plugin.
     *
     * @param id            The message id
     * @param data          The message data
     * @return              Object or null
     */
    public Object onMessage(String id, Object data);
    
    /**
     * Returns a shared thread pool that can be used for background tasks.
     */
    public ExecutorService getThreadPool();

    /**
     * Sends a permission request to the activity for one permission.
     */
    public void requestPermission(CordovaPlugin plugin, int requestCode, String permission);

    /**
     * Sends a permission request to the activity for a group of permissions
     */
    public void requestPermissions(CordovaPlugin plugin, int requestCode, String [] permissions);

    /**
     * Check for a permission.  Returns true if the permission is granted, false otherwise.
     */
    public boolean hasPermission(String permission);

}
