package de.tutao.calendar.widget.data

import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import kotlinx.serialization.Serializable

@Serializable
data class SettingsDao(
	val userId: GeneratedId,
	val calendars: Map<GeneratedId, @Serializable(with = CalendarRenderDataSerializer::class) CalendarRenderData>
)