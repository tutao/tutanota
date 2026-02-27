package de.tutao.calendar.widget.data

import de.tutao.tutashared.IdTupleCustom
import kotlinx.serialization.Serializable

@Serializable
data class CalendarEventDao(
	val id: IdTupleCustom?,
	val startTime: ULong,
	val endTime: ULong,
	val summary: String
)