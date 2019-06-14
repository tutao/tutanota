package de.tutao.tutanota.push;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.support.annotation.Nullable;

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


    public void storePushIdentifier(String identifier, String userId, String sseOrigin, String pushIdentifierElementId, String encSessionKey) {
        final SseInfo sseInfo = getSseInfo();
        SseInfo newInfo;
        if (sseInfo == null) {
            newInfo = new SseInfo(identifier, Collections.singletonList(userId), sseOrigin, new HashMap<>());
            newInfo.getPushIdentifierToSessionKey().put(pushIdentifierElementId, encSessionKey);
        } else {
            List<String> userList = new ArrayList<>(sseInfo.getUserIds());
            if (!userList.contains(userId)) {
                userList.add(userId);
            }
            sseInfo.getPushIdentifierToSessionKey().put(pushIdentifierElementId, encSessionKey);
            newInfo = new SseInfo(identifier, userList, sseOrigin, sseInfo.getPushIdentifierToSessionKey());
        }
        getPrefs().edit().putString(SSE_INFO_PREF, newInfo.toJSON()).apply();
    }

    public void clear() {
        this.getPrefs().edit().remove(SSE_INFO_PREF).apply();
    }

    private SharedPreferences getPrefs() {
        return PreferenceManager.getDefaultSharedPreferences(context);
    }
}

