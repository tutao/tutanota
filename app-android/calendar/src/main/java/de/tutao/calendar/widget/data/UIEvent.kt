package de.tutao.calendar.widget.data

import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.IdTupleCustom

data class UIEvent(
	val calendarId: GeneratedId,
	val eventId: IdTupleCustom?,
	val calendarColor: String,
	val summary: String,
	val startTime: String,
	val endTime: String,
	val isAllDay: Boolean,
	val startTimestamp: ULong
)