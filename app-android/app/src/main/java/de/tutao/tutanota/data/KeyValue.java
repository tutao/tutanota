package de.tutao.tutanota.data;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity
public class KeyValue {
	@PrimaryKey
	@NonNull
	private final String key;
	private final String value;


	public KeyValue(@NonNull String key, String value) {
		this.key = key;
		this.value = value;
	}

	@NonNull
	public String getKey() {
		return key;
	}

	public String getValue() {
		return value;
	}
}
