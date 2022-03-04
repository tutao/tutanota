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
	@PrimaryKey
	@NonNull
	final private String pushIdentifier;
	final private Collection<String> userIds;
	final private String sseOrigin;

	public SseInfo(@NonNull String pushIdentifier, Collection<String> userIds, String sseOrigin) {
		this.pushIdentifier = pushIdentifier;
		this.userIds = userIds;
		this.sseOrigin = sseOrigin;
	}

	@NonNull
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
