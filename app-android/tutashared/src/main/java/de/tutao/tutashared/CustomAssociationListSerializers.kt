package de.tutao.tutashared

import kotlinx.serialization.KSerializer
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

open class OneAssociationSerializer<T>(
	oneAssociationType: KSerializer<T>
) : KSerializer<T> {
	private val listSerializer = ListSerializer(oneAssociationType)

	override val descriptor: SerialDescriptor = listSerializer.descriptor
	override fun deserialize(decoder: Decoder): T {
		return listSerializer.deserialize(decoder).first()
	}

	override fun serialize(encoder: Encoder, value: T) {
		listSerializer.serialize(encoder, listOf(value))
	}
}

open class ZeroOrOneAssociationSerializer<T>(
	oneAssociationType: KSerializer<T>
) : KSerializer<T?> {
	private val listSerializer = ListSerializer(oneAssociationType)

	override val descriptor: SerialDescriptor = listSerializer.descriptor
	override fun deserialize(decoder: Decoder): T? {
		val deserializedList = listSerializer.deserialize(decoder)
		return if (deserializedList.isEmpty()) null else deserializedList.first()
	}

	override fun serialize(encoder: Encoder, value: T?) {
		val serializedList: List<T> = if (value == null) listOf() else listOf(value)
		listSerializer.serialize(encoder, serializedList)
	}
}