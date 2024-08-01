package de.tutao.tutashared.data

import androidx.room.Dao
import androidx.room.Query

@Dao
interface KeyBinaryDao {
	@Query("SELECT value FROM KeyBinary WHERE key = :key LIMIT 1")
	fun get(key: String): ByteArray?

	@Query("INSERT OR REPLACE INTO KeyBinary (key, value) VALUES (:key, :value)")
	fun put(key: String, value: ByteArray?)
}