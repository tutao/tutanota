package de.tutao.tutanota.ipc

import de.tutao.tutanota.base64ToBytes
import de.tutao.tutanota.toBase64
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.element
import kotlinx.serialization.encoding.*

/**
 * this class is needed to send byte arrays over our ipc bridge and corresponds
 * to the struct of the same name in the ios app.
 */
@Serializable(with = DataWrapperSerializer::class)
class DataWrapper(
		val data: ByteArray
)

object DataWrapperSerializer : KSerializer<DataWrapper> {
	override val descriptor: SerialDescriptor = buildClassSerialDescriptor("DataWrapper") {
		element<String>("data")
		element<String>("marker")
	}

	override fun serialize(encoder: Encoder, value: DataWrapper) {
		encoder.encodeStructure(descriptor) {
			encodeStringElement(descriptor, 0, value.data.toBase64())
			encodeStringElement(descriptor, 1, "__bytes")
		}
	}

	override fun deserialize(decoder: Decoder): DataWrapper {
		return decoder.decodeStructure(descriptor) {
			var data: ByteArray? = null
			while (true) {
				when (val index = decodeElementIndex(descriptor)) {
					0 -> data = decodeStringElement(descriptor, 0).base64ToBytes()
					1 -> decodeStringElement(descriptor, 1)
					CompositeDecoder.DECODE_DONE -> break
					else -> error("Unknown index $index")
				}
			}
			DataWrapper(data!!)
		}
	}
}


fun ByteArray.wrap() = DataWrapper(this)