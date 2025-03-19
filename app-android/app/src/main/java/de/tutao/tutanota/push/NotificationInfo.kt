package de.tutao.tutanota.push

import de.tutao.tutashared.IdTupleWrapper
import de.tutao.tutashared.IdTupleWrapperZeroOrOneAssociationSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class NotificationInfo(
	@SerialName("1366")
	val mailAddress: String,
	@SerialName("1368")
	val userId: String,
	@SerialName("2319")
	@Serializable(with = IdTupleWrapperZeroOrOneAssociationSerializer::class)
	val mailId: IdTupleWrapper?,
)

