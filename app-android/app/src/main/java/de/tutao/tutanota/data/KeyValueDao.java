package de.tutao.tutanota.data;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.Dao;
import androidx.room.Query;

@Dao
public interface KeyValueDao {
	@Query("SELECT value FROM KeyValue WHERE key = :key LIMIT 1")
	@Nullable
	String getString(String key);

	@Query("INSERT OR REPLACE INTO KeyValue (key, value) VALUES (:key, :value)")
	void putString(@NonNull String key, @Nullable String value);

	@Query("SELECT CAST(value as INT) FROM KeyValue WHERE key = :key LIMIT 1")
	long getLong(String key);

	@Query("INSERT OR REPLACE INTO KeyValue (key, value) VALUES (:key, :value)")
	void putLong(@NonNull String key, long value);
}
