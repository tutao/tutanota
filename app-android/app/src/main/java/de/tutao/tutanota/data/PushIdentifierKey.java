package de.tutao.tutanota.data;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

import java.util.Arrays;

@Entity
public class PushIdentifierKey {
	@PrimaryKey
	@NonNull
	private final String pushIdentifierId;
	private final byte[] deviceEncPushIdentifierKey;

	public PushIdentifierKey(@NonNull String pushIdentifierId, byte[] deviceEncPushIdentifierKey) {
		this.pushIdentifierId = pushIdentifierId;
		this.deviceEncPushIdentifierKey = deviceEncPushIdentifierKey;
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
		return "PushIdentifierKey{" +
				"pushIdentifierId='" + pushIdentifierId + '\'' +
				", deviceEncPushIdentifierKey=" + Arrays.toString(deviceEncPushIdentifierKey) +
				'}';
	}
}
