package de.tutao.tutanota.push;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public final class SseInfo {
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
