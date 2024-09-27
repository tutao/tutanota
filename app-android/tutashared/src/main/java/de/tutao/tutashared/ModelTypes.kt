package de.tutao.tutashared

import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.listSerialDescriptor
import kotlinx.serialization.encoding.CompositeDecoder
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.encoding.decodeStructure

@Serializable
enum class OperationType {
	@SerialName("0")
	CREATE,

	@SerialName("1")
	UPDATE,

	@SerialName("2")
	DELETE;
}

@Serializable(with = IdTuple.IdTupleSerializer::class)
class IdTuple(
	val listId: String,
	val elementId: String
) {

	@OptIn(ExperimentalSerializationApi::class)
	companion object IdTupleSerializer : KSerializer<IdTuple> {
		override val descriptor: SerialDescriptor = listSerialDescriptor<String>()

		override fun serialize(encoder: Encoder, value: IdTuple) {
			val listEncoder = encoder.beginCollection(
				ListSerializer(String.serializer()).descriptor,
				2
			)
			listEncoder.encodeStringElement(descriptor, 0, value.listId)
			listEncoder.encodeStringElement(descriptor, 1, value.elementId)
			listEncoder.endStructure(descriptor)
		}

		override fun deserialize(decoder: Decoder): IdTuple {
			return decoder.decodeStructure(
				ListSerializer(String.serializer()).descriptor
			) {
				var listId = ""
				var elementId = ""
				while (true) {
					when (val index = decodeElementIndex(descriptor)) {
						0 -> listId = decodeStringElement(descriptor, 0)
						1 -> elementId = decodeStringElement(descriptor, 1)
						CompositeDecoder.DECODE_DONE -> break
						else -> error("Unknown index $index")
					}
				}
				IdTuple(listId, elementId)
			}

		}
	}
}


