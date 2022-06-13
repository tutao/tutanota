package de.tutao.tutanota.push

import kotlinx.serialization.Serializable

@Serializable
data class NotificationInfo(
		val mailAddress: String,
		val counter: Int,
		val userId: String,
)
