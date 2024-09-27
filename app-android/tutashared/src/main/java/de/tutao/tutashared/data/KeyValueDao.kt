package de.tutao.tutashared.data

import androidx.room.Dao
import androidx.room.Query

@Dao
interface KeyValueDao {
	@Query("SELECT value FROM KeyValue WHERE key = :key LIMIT 1")
	fun getString(key: String): String?

	@Query("INSERT OR REPLACE INTO KeyValue (key, value) VALUES (:key, :value)")
	fun putString(key: String, value: String?)

	@Query("SELECT CAST(value as INT) FROM KeyValue WHERE key = :key LIMIT 1")
	fun getLong(key: String): Long

	@Query("INSERT OR REPLACE INTO KeyValue (key, value) VALUES (:key, :value)")
	fun putLong(key: String, value: Long)
}