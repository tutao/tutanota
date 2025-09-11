package de.tutao.calendar.widget.data

import de.tutao.tutasdk.GeneratedId
import de.tutao.tutashared.IdTuple

data class UIEvent(
	val calendarId: GeneratedId,
	val eventId: IdTuple?,
	val calendarColor: String,
	val summary: String,
	val startTime: String,
	val endTime: String,
	val isAllDay: Boolean,
	val startTimestamp: Long,
	val isBirthday: Boolean = false
)