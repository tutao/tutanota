package de.tutao.tutanota.push;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.support.annotation.Nullable;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

public final class SseStorage {
    public static final String PUSH_IDENTIFIER_JSON_KEY = "pushIdentifier";
    public static final String USER_IDS_JSON_KEY = "userIds";
    public static final String SSE_ORIGIN_JSON_KEY = "sseOrigin";

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
        try {
            JSONObject jsonObject = new JSONObject(pushIdentifierPref);
            String identifier = jsonObject.getString(PUSH_IDENTIFIER_JSON_KEY);
            JSONArray userIdsArray = jsonObject.getJSONArray(USER_IDS_JSON_KEY);
            List<String> userIds = new ArrayList<>(userIdsArray.length());
            for (int i = 0; i < userIdsArray.length(); i++) {
                userIds.add(userIdsArray.getString(i));
            }
            String sseOrigin = jsonObject.getString(SSE_ORIGIN_JSON_KEY);
            return new SseInfo(identifier, userIds, sseOrigin);
        } catch ( JSONException e) {
            Log.w(TAG, "could read sse info", e);
            return null;
        }
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
    final private String pushIdentifier;
    final private List<String> userIds;
    final private String sseOrigin;

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
        sseInfoMap.put(SseStorage.PUSH_IDENTIFIER_JSON_KEY, this.pushIdentifier);
        sseInfoMap.put(SseStorage.USER_IDS_JSON_KEY, this.userIds);
        sseInfoMap.put(SseStorage.SSE_ORIGIN_JSON_KEY, this.sseOrigin);
        JSONObject jsonObject = new JSONObject(sseInfoMap);
        return jsonObject.toString();
    }
}