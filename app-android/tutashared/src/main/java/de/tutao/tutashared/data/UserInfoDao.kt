package de.tutao.tutashared.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
abstract class UserInfoDao {
	@Query("SELECT * FROM User")
	abstract fun users(): List<User>

	@Query("SELECT * FROM User")
	abstract fun observeUsers(): Flow<List<User>>

	@Query("SELECT * FROM PushIdentifierKey WHERE pushIdentifierId = :pushIdentifier")
	abstract fun getPushIdentifierKey(pushIdentifier: String): PushIdentifierKey?

	@Insert(onConflict = OnConflictStrategy.REPLACE)
	abstract fun insertPushIdentifierKey(userInfo: PushIdentifierKey)

	@Insert(onConflict = OnConflictStrategy.REPLACE)
	abstract fun insertUser(user: User)

	@Transaction
	open fun clear() {
		clearKeys()
		clearUsers()
	}

	@Query("Delete FROM PushIdentifierKey")
	abstract fun clearKeys()

	@Query("Delete FROM User")
	abstract fun clearUsers()

	@Query("DELETE FROM User WHERE userId = :userId")
	abstract fun deleteUser(userId: String)
}