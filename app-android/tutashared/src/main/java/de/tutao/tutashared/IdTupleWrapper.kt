package de.tutao.tutashared

import de.tutao.tutasdk.IdTupleGenerated
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.serializer

@Serializable
data class IdTupleWrapper(
	@SerialName("2317")
	val listId: String,
	@SerialName("2318")
	val listElementId: String,
)

// The name is to avoid confusion between `tutasdk.IdTuple` and `tutanota.IdTuple`
fun IdTupleWrapper.toSdkIdTupleGenerated(): IdTupleGenerated {
	return IdTupleGenerated(
		this.listId,
		this.listElementId
	)
}

object IdTupleWrapperZeroOrOneAssociationSerializer : ZeroOrOneAssociationSerializer<IdTupleWrapper>(serializer())

object IdTupleOneAssociationSerializer : OneAssociationSerializer<IdTuple>(serializer())