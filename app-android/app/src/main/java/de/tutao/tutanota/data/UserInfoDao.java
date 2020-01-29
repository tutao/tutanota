package de.tutao.tutanota.data;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

@Dao
public interface UserInfoDao {
	@Query("SELECT * FROM UserInfo")
	LiveData<List<UserInfo>> observeUserInfos();

	@Query("SELECT * FROM UserInfo WHERE pushIdentifierId = :pushIdentifier")
	UserInfo getUserInfoByPushIdentifier(String pushIdentifier);

	@Insert(onConflict = OnConflictStrategy.REPLACE)
	void insertUserInfo(UserInfo userInfo);

	@Query("Delete FROM UserInfo")
	void clear();
}
