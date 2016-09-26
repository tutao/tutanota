/*
 * Copyright (C) 2009 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.cordova.contacts;

import java.util.HashMap;

import android.Manifest;
import android.content.pm.PackageManager;
import android.util.Log;
import org.apache.cordova.CordovaInterface;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * This abstract class defines SDK-independent API for communication with
 * Contacts Provider. The actual implementation used by the application depends
 * on the level of API available on the device. If the API level is Cupcake or
 * Donut, we want to use the {@link ContactAccessorSdk3_4} class. If it is
 * Eclair or higher, we want to use {@link ContactAccessorSdk5}.
 */
public abstract class ContactAccessor {

    protected final String LOG_TAG = "ContactsAccessor";
    protected CordovaInterface mApp;

    /**
     * Check to see if the data associated with the key is required to
     * be populated in the Contact object.
     * @param key
     * @param map created by running buildPopulationSet.
     * @return true if the key data is required
     */
    protected boolean isRequired(String key, HashMap<String,Boolean> map) {
        Boolean retVal = map.get(key);
        return (retVal == null) ? false : retVal.booleanValue();
    }

    /**
     * Create a hash map of what data needs to be populated in the Contact object
     * @param fields the list of fields to populate
     * @return the hash map of required data
     */
    protected HashMap<String, Boolean> buildPopulationSet(JSONObject options) {
        HashMap<String, Boolean> map = new HashMap<String, Boolean>();

        String key;
        try {
            JSONArray desiredFields = null;
            if (options!=null && options.has("desiredFields")) {
                desiredFields = options.getJSONArray("desiredFields");
            }
            if (desiredFields == null || desiredFields.length() == 0) {
                map.put("displayName", true);
                map.put("name", true);
                map.put("nickname", true);
                map.put("phoneNumbers", true);
                map.put("emails", true);
                map.put("addresses", true);
                map.put("ims", true);
                map.put("organizations", true);
                map.put("birthday", true);
                map.put("note", true);
                map.put("urls", true);
                map.put("photos", true);
                map.put("categories", true);
            } else {
                for (int i = 0; i < desiredFields.length(); i++) {
                    key = desiredFields.getString(i);
                    if (key.startsWith("displayName")) {
                        map.put("displayName", true);
                    } else if (key.startsWith("name")) {
                        map.put("displayName", true);
                        map.put("name", true);
                    } else if (key.startsWith("nickname")) {
                        map.put("nickname", true);
                    } else if (key.startsWith("phoneNumbers")) {
                        map.put("phoneNumbers", true);
                    } else if (key.startsWith("emails")) {
                        map.put("emails", true);
                    } else if (key.startsWith("addresses")) {
                        map.put("addresses", true);
                    } else if (key.startsWith("ims")) {
                        map.put("ims", true);
                    } else if (key.startsWith("organizations")) {
                        map.put("organizations", true);
                    } else if (key.startsWith("birthday")) {
                        map.put("birthday", true);
                    } else if (key.startsWith("note")) {
                        map.put("note", true);
                    } else if (key.startsWith("urls")) {
                        map.put("urls", true);
                    } else if (key.startsWith("photos")) {
                        map.put("photos", true);
                    } else if (key.startsWith("categories")) {
                        map.put("categories", true);
                    }
                }
            }
        } catch (JSONException e) {
            Log.e(LOG_TAG, e.getMessage(), e);
        }
        return map;
    }

    /**
     * Convenience method to get a string from a JSON object.  Saves a
     * lot of try/catch writing.
     * If the property is not found in the object null will be returned.
     *
     * @param obj contact object to search
     * @param property to be looked up
     * @return The value of the property
     */
    protected String getJsonString(JSONObject obj, String property) {
        String value = null;
        try {
            if (obj != null) {
                value = obj.getString(property);
                if (value.equals("null")) {
                    Log.d(LOG_TAG, property + " is string called 'null'");
                    value = null;
                }
            }
       }
        catch (JSONException e) {
            Log.d(LOG_TAG, "Could not get = " + e.getMessage());
        }
        return value;
    }

    /**
     * Handles adding a JSON Contact object into the database.
     * @return TODO
     */
    public abstract String save(JSONObject contact);

    /**
     * Handles searching through SDK-specific contacts API.
     */
    public abstract JSONArray search(JSONArray filter, JSONObject options);

    /**
     * Handles searching through SDK-specific contacts API.
     * @throws JSONException
     */
    public abstract JSONObject getContactById(String id) throws JSONException;
    
    /**
     * Handles searching through SDK-specific contacts API.
     * @param desiredFields fields that will filled. All fields will be filled if null 
     * @throws JSONException
     */
    public abstract JSONObject getContactById(String id, JSONArray desiredFields) throws JSONException;

    /**
     * Handles removing a contact from the database.
     */
    public abstract boolean remove(String id);
    
   /**
     * A class that represents the where clause to be used in the database query 
     */
    class WhereOptions {
        private String where;
        private String[] whereArgs;
        public void setWhere(String where) {
            this.where = where;
        }
        public String getWhere() {
            return where;
        }
        public void setWhereArgs(String[] whereArgs) {
            this.whereArgs = whereArgs;
        }
        public String[] getWhereArgs() {
            return whereArgs;
        }
    }
}
