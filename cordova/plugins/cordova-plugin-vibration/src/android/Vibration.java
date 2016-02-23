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
package org.apache.cordova.vibration;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import android.content.Context;
import android.os.Vibrator;
import android.media.AudioManager;

/**
 * This class provides access to vibration on the device.
 */
public class Vibration extends CordovaPlugin {

    /**
     * Constructor.
     */
    public Vibration() {
    }

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action            The action to execute.
     * @param args              JSONArray of arguments for the plugin.
     * @param callbackContext   The callback context used when calling back into JavaScript.
     * @return                  True when the action was valid, false otherwise.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("vibrate")) {
            this.vibrate(args.getLong(0));
        }
        else if (action.equals("vibrateWithPattern")) {
            JSONArray pattern = args.getJSONArray(0);
            int repeat = args.getInt(1);
            //add a 0 at the beginning of pattern to align with w3c
            long[] patternArray = new long[pattern.length()+1];
            patternArray[0] = 0;
            for (int i = 0; i < pattern.length(); i++) {
                patternArray[i+1] = pattern.getLong(i);
            }
            this.vibrateWithPattern(patternArray, repeat);
        }
        else if (action.equals("cancelVibration")) {
            this.cancelVibration();
        }
        else {
            return false;
        }

        // Only alert and confirm are async.
        callbackContext.success();

        return true;
    }

    //--------------------------------------------------------------------------
    // LOCAL METHODS
    //--------------------------------------------------------------------------

    /**
     * Vibrates the device for a given amount of time.
     *
     * @param time      Time to vibrate in ms.
     */
    public void vibrate(long time) {
        // Start the vibration, 0 defaults to half a second.
        if (time == 0) {
            time = 500;
        }
        AudioManager manager = (AudioManager) this.cordova.getActivity().getSystemService(Context.AUDIO_SERVICE);
        if (manager.getRingerMode() != AudioManager.RINGER_MODE_SILENT) {
            Vibrator vibrator = (Vibrator) this.cordova.getActivity().getSystemService(Context.VIBRATOR_SERVICE);
            vibrator.vibrate(time);
        }
    }

    /**
     * Vibrates the device with a given pattern.
     *
     * @param pattern     Pattern with which to vibrate the device.
     *                    Pass in an array of longs that
     *                    are the durations for which to
     *                    turn on or off the vibrator in
     *                    milliseconds. The first value
     *                    indicates the number of milliseconds
     *                    to wait before turning the vibrator
     *                    on. The next value indicates the
     *                    number of milliseconds for which
     *                    to keep the vibrator on before
     *                    turning it off. Subsequent values
     *                    alternate between durations in
     *                    milliseconds to turn the vibrator
     *                    off or to turn the vibrator on.
     *
     * @param repeat      Optional index into the pattern array at which
     *                    to start repeating, or -1 for no repetition (default).
     */
    public void vibrateWithPattern(long[] pattern, int repeat) {
        AudioManager manager = (AudioManager) this.cordova.getActivity().getSystemService(Context.AUDIO_SERVICE);
        if (manager.getRingerMode() != AudioManager.RINGER_MODE_SILENT) {
            Vibrator vibrator = (Vibrator) this.cordova.getActivity().getSystemService(Context.VIBRATOR_SERVICE);
            vibrator.vibrate(pattern, repeat);
        }
    }

    /**
     * Immediately cancels any currently running vibration.
     */
    public void cancelVibration() {
        Vibrator vibrator = (Vibrator) this.cordova.getActivity().getSystemService(Context.VIBRATOR_SERVICE);
        vibrator.cancel();
    }
}
