package de.tutao.tutanota.data;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity
public class User {
	@NonNull
	@PrimaryKey
	private final String userId;

	public User(@NonNull String userId) {
		this.userId = userId;
	}

	@NonNull
	public String getUserId() {
		return userId;
	}
}
