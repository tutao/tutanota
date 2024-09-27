package de.tutao.tutashared.credentials

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface CredentialsDao {
	@Insert(onConflict = OnConflictStrategy.REPLACE)
	fun insertPersistedCredentials(persistedCredentials: PersistedCredentialsEntity)

	@Query("SELECT * FROM PersistedCredentials")
	fun allPersistedCredentials(): List<PersistedCredentialsEntity>

	@Query("DELETE FROM PersistedCredentials WHERE userId = :userId")
	fun deletePersistedCredentials(userId: String)

	@Query("DELETE FROM PersistedCredentials")
	fun clear()
}