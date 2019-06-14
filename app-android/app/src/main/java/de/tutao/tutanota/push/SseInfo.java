package de.tutao.tutanota.push;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public final class SseInfo {
    private static final String PUSH_IDENTIFIER_JSON_KEY = "pushIdentifier";
    private static final String USER_IDS_JSON_KEY = "userIds";
    private static final String SSE_ORIGIN_JSON_KEY = "sseOrigin";
    public static final String PUSH_IDENTIFIER_TO_SESSION_KEY = "pushIdentifierToSessionKey";

    final private String pushIdentifier;
    final private List<String> userIds;
    final private String sseOrigin;
    final private Map<String, String> pushIdentifierToSessionKey;

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

            Map<String, String> pushIdentifierToSessionKey = new HashMap<>();
            JSONObject sessionKeysJson = jsonObject.getJSONObject(PUSH_IDENTIFIER_TO_SESSION_KEY);
            Iterator<String> keys = sessionKeysJson.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                pushIdentifierToSessionKey.put(key, sessionKeysJson.getString(key));
            }
            return new SseInfo(identifier, userIds, sseOrigin, pushIdentifierToSessionKey);
        } catch (JSONException e) {
            Log.w("SseInfo", "could read sse info", e);
            return null;
        }
    }

    SseInfo(String pushIdentifier, List<String> userIds, String sseOrigin, Map<String, String> pushIdentifierToSessionKey) {
        this.pushIdentifier = pushIdentifier;
        this.userIds = userIds;
        this.sseOrigin = sseOrigin;
        this.pushIdentifierToSessionKey = pushIdentifierToSessionKey;
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

    public Map<String, String> getPushIdentifierToSessionKey() {
        return pushIdentifierToSessionKey;
    }

    public String toJSON() {
        HashMap<String, Object> sseInfoMap = new HashMap<>();
        sseInfoMap.put(PUSH_IDENTIFIER_JSON_KEY, this.pushIdentifier);
        sseInfoMap.put(USER_IDS_JSON_KEY, this.userIds);
        sseInfoMap.put(SSE_ORIGIN_JSON_KEY, this.sseOrigin);
        sseInfoMap.put(PUSH_IDENTIFIER_TO_SESSION_KEY, this.pushIdentifierToSessionKey);
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
