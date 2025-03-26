package de.tutao.calendar.widget.data

import de.tutao.tutasdk.GeneratedId

data class UIEvent(
	val calendarId: GeneratedId,
	val calendarColor: String,
	val summary: String,
	val startTime: String,
	val endTime: String,
	val isAllDay: Boolean,
	val startTimestamp: ULong,
	val endTimestamp: ULong,
)