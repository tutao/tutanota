package de.tutao.calendar.widget.data

import de.tutao.tutasdk.GeneratedId
import de.tutao.tutashared.IdTuple


/**
 * UI representation of an calendar event
 *
 * Contains all the necessary information to render an event in the Widget UI
 */
data class UIEvent(
	val calendarId: GeneratedId,
	val eventId: IdTuple?,
	val calendarColor: String,
	val summary: String,
	val formattedStartTime: String,
	val formattedEndTime: String,
	val isDisplayedAsAllDay: Boolean,
	val isBirthday: Boolean = false
)