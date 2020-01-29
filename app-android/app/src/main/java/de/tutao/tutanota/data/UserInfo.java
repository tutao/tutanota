package de.tutao.tutanota.data;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

import java.util.Arrays;

@Entity
public class UserInfo {
	@NonNull
	private final String userId;
	@PrimaryKey
	@NonNull
	// It is a primary key becase PushIdentifier can be deleted by the user and new one will be generated with new pushIdentifierId and new sessionKey.
	private final String pushIdentifierId;
	private final byte[] deviceEncPushIdentifierKey;

	public UserInfo(String userId, String pushIdentifierId, byte[] deviceEncPushIdentifierKey) {
		this.userId = userId;
		this.pushIdentifierId = pushIdentifierId;
		this.deviceEncPushIdentifierKey = deviceEncPushIdentifierKey;
	}

	@NonNull
	public String getUserId() {
		return userId;
	}

	@NonNull
	public String getPushIdentifierId() {
		return pushIdentifierId;
	}

	public byte[] getDeviceEncPushIdentifierKey() {
		return deviceEncPushIdentifierKey;
	}

	@Override
	public String toString() {
		return "UserInfo{" +
				"userId='" + userId + '\'' +
				", pushIdentifierId='" + pushIdentifierId + '\'' +
				", deviceEncPushIdentifierKey=" + Arrays.toString(deviceEncPushIdentifierKey) +
				'}';
	}
}
