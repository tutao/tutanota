package de.tutao.tutanota.data;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Transaction;

import java.util.List;

import static androidx.room.OnConflictStrategy.REPLACE;

@Dao
public abstract class UserInfoDao {
	@Query("SELECT * FROM User")
	public abstract LiveData<List<User>> observeUsers();

	@Query("SELECT * FROM PushIdentifierKey WHERE pushIdentifierId = :pushIdentifier")
	public abstract PushIdentifierKey getPushIdentifierKey(String pushIdentifier);

	@Insert(onConflict = REPLACE)
	public abstract void insertPushIdentifierKey(PushIdentifierKey userInfo);

	@Insert(onConflict = REPLACE)
	public abstract void insertUser(User user);

	@Transaction
	public void clear() {
		clearKeys();
		clearUsers();
	}

	@Query("Delete FROM PushIdentifierKey")
	abstract void clearKeys();

	@Query("Delete FROM User")
	abstract void clearUsers();

}
