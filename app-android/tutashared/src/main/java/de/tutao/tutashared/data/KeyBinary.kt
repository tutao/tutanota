package de.tutao.tutashared.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity
class KeyBinary(@field:PrimaryKey val key: String, val value: ByteArray?)