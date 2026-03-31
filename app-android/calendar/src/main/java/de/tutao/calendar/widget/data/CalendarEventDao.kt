package de.tutao.calendar.widget.data

import de.tutao.tutashared.IdTuple
import kotlinx.serialization.Serializable

@Serializable
data class CalendarEventDao(
	val id: IdTuple?,
	val startTime: ULong,
	val endTime: ULong,
	val summary: String
)