package de.tutao.calendar.widget.data

import de.tutao.tutasdk.CalendarRenderData
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.element
import kotlinx.serialization.encoding.CompositeDecoder
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.encoding.decodeStructure
import kotlinx.serialization.encoding.encodeStructure

object CalendarRenderDataSerializer : KSerializer<CalendarRenderData> {
	override val descriptor = buildClassSerialDescriptor("CalendarRenderData") {
		element<String>("name")
		element<String>("color")
	}

	override fun serialize(encoder: Encoder, value: CalendarRenderData) {
		encoder.encodeStructure(descriptor) {
			encodeStringElement(descriptor, 0, value.name)
			encodeStringElement(descriptor, 1, value.color)
		}
	}

	override fun deserialize(decoder: Decoder): CalendarRenderData {
		return decoder.decodeStructure(descriptor) {
			var name = ""
			var color = ""
			while (true) {
				when (val index = decodeElementIndex(descriptor)) {
					0 -> name = decodeStringElement(descriptor, 0)
					1 -> color = decodeStringElement(descriptor, 1)
					CompositeDecoder.DECODE_DONE -> break
					else -> error("Unknown index $index")
				}
			}
			CalendarRenderData(name, color)
		}
	}
}