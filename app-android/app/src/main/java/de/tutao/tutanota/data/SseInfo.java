package de.tutao.tutanota.data;

import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.room.TypeConverter;
import androidx.room.TypeConverters;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

@Entity
@TypeConverters(SseInfo.UserIdsConverter.class)
public final class SseInfo {
	private static final String PUSH_IDENTIFIER_JSON_KEY = "pushIdentifier";
	private static final String USER_IDS_JSON_KEY = "userIds";
	private static final String SSE_ORIGIN_JSON_KEY = "sseOrigin";

	@PrimaryKey
	@NonNull
	final private String pushIdentifier;
	final private Collection<String> userIds;
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

	public SseInfo(String pushIdentifier, Collection<String> userIds, String sseOrigin) {
		this.pushIdentifier = pushIdentifier;
		this.userIds = userIds;
		this.sseOrigin = sseOrigin;
	}

	public String getPushIdentifier() {
		return pushIdentifier;
	}

	public Collection<String> getUserIds() {
		return userIds;
	}

	public String getSseOrigin() {
		return sseOrigin;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		SseInfo sseInfo = (SseInfo) o;
		return Objects.equals(pushIdentifier, sseInfo.pushIdentifier) &&
				Objects.equals(userIds, sseInfo.userIds) &&
				Objects.equals(sseOrigin, sseInfo.sseOrigin);
	}

	@Override
	public int hashCode() {
		return Objects.hash(pushIdentifier, userIds, sseOrigin);
	}

	static class UserIdsConverter {
		@TypeConverter
		public String userIdsToString(List<String> ids) {
			return TextUtils.join(",", ids);
		}

		@TypeConverter
		public List<String> stringToIds(String string) {
			return Arrays.asList(string.split(","));
		}
	}

	@Override
	public String toString() {
		return "SseInfo{" +
				"pushIdentifier='" + pushIdentifier + '\'' +
				", userIds=" + userIds +
				", sseOrigin='" + sseOrigin + '\'' +
				'}';
	}
}
