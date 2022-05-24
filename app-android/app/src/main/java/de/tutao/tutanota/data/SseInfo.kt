package de.tutao.tutanota.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import de.tutao.tutanota.data.SseInfo.UserIdsConverter

@Entity
@TypeConverters(UserIdsConverter::class)
data class SseInfo(
		@field:PrimaryKey val pushIdentifier: String,
		val userIds: Collection<String>,
		val sseOrigin: String
) {
	internal class UserIdsConverter {
		@TypeConverter
		fun userIdsToString(ids: List<String>) = ids.joinToString(",")

		@TypeConverter
		fun stringToIds(string: String) = string.split(",")
	}
}