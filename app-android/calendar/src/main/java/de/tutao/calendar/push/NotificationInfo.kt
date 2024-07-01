package de.tutao.calendar.push

import kotlinx.serialization.Serializable

@Serializable
data class NotificationInfo(
	val mailAddress: String,
	val userId: String,
	val mailId: IdTupleWrapper?,
)

@Serializable
data class IdTupleWrapper(
	val listId: String,
	val listElementId: String,
)
