package de.tutao.tutanota.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity
class PushIdentifierKey(
		@field:PrimaryKey val pushIdentifierId: String,
		val deviceEncPushIdentifierKey: ByteArray?,
)