package de.tutao.tutanota.push;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;


public final class SseStorage {

    private static final String SSE_INFO_PREF = "sseInfo";
    private static final String TAG = SseStorage.class.getSimpleName();


    private Context context;

    public SseStorage(Context context) {
        this.context = context;
    }

    @Nullable
    public String getPushIdentifier() {
        SseInfo sseInfo = getSseInfo();
        if (sseInfo != null) {
            return sseInfo.getPushIdentifier();
        }
        return null;
    }

    @Nullable
    public SseInfo getSseInfo() {
        String pushIdentifierPref = getPrefs().getString(SSE_INFO_PREF, null);
        if (pushIdentifierPref == null) {
            return null;
        }
        return SseInfo.fromJson(pushIdentifierPref);
    }

    public void storePushIdentifier(String identifier, String userId, String sseOrigin) {
        final SseInfo sseInfo = getSseInfo();
        SseInfo newInfo;
        if (sseInfo == null) {
            newInfo = new SseInfo(identifier, Collections.singletonList(userId), sseOrigin);
        } else {
            List<String> userList = new ArrayList<>(sseInfo.getUserIds());
            if (!userList.contains(userId)) {
                userList.add(userId);
            }
            newInfo = new SseInfo(identifier, userList, sseOrigin);
        }
        getPrefs().edit().putString(SSE_INFO_PREF, newInfo.toJSON()).apply();
    }

    public void clear() {
        this.getPrefs().edit().clear().apply();
    }

    private SharedPreferences getPrefs() {
        return PreferenceManager.getDefaultSharedPreferences(context);
    }
}

final class SseInfo {
    private static final String PUSH_IDENTIFIER_JSON_KEY = "pushIdentifier";
    private static final String USER_IDS_JSON_KEY = "userIds";
    private static final String SSE_ORIGIN_JSON_KEY = "sseOrigin";

    final private String pushIdentifier;
    final private List<String> userIds;
    final private String sseOrigin;

    @Nullable
    public static SseInfo fromJson(@NonNull String json) {
        try {
            JSONObject jsonObject = new JSONObject(json);
            String identifier = jsonObject.getString(PUSH_IDENTIFIER_JSON_KEY);
            JSONArray userIdsArray = jsonObject.getJSONArray(USER_IDS_JSON_KEY);
            List<String> userIds = new ArrayList<>(userIdsArray.length());
            for (int i = 0; i < userIdsArray.length(); i++) {
                userIds.add(userIdsArray.getString(i));
            }
            String sseOrigin = jsonObject.getString(SSE_ORIGIN_JSON_KEY);
            return new SseInfo(identifier, userIds, sseOrigin);
        } catch (JSONException e) {
            Log.w("SseInfo", "could read sse info", e);
            return null;
        }
    }

    SseInfo(String pushIdentifier, List<String> userIds, String sseOrigin) {
        this.pushIdentifier = pushIdentifier;
        this.userIds = userIds;
        this.sseOrigin = sseOrigin;
    }

    public String getPushIdentifier() {
        return pushIdentifier;
    }

    public List<String> getUserIds() {
        return userIds;
    }

    public String getSseOrigin() {
        return sseOrigin;
    }

    public String toJSON() {
        HashMap<String, Object> sseInfoMap = new HashMap<>();
        sseInfoMap.put(PUSH_IDENTIFIER_JSON_KEY, this.pushIdentifier);
        sseInfoMap.put(USER_IDS_JSON_KEY, this.userIds);
        sseInfoMap.put(SSE_ORIGIN_JSON_KEY, this.sseOrigin);
        JSONObject jsonObject = new JSONObject(sseInfoMap);
        return jsonObject.toString();
    }

    @Override
    public boolean equals(Object other) {
        if (other instanceof SseInfo) {
            return ((SseInfo) other).toJSON().equals(this.toJSON());
        } else {
            return false;
        }
    }

    @Override
    public String toString() {
        return toJSON();
    }
}