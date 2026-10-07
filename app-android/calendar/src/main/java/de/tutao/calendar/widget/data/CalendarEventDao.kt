package de.tutao.calendar.widget.data

import de.tutao.tutashared.IdTuple
import kotlinx.serialization.Serializable

/**
 * Represents an event as stored in the database, but only including fields that are relevant to the widget.
 * @param id the entity id as represented in our database
 * @param startTime event start time represented as milliseconds since 1970-01-01 00:00:00 UTC
 * @param endTime event end time represented as milliseconds since 1970-01-01 00:00:00 UTC
 * @param summary the event summary stored on the event in our database
 *
 */
@Serializable
data class CalendarEventDao(
	val id: IdTuple?,
	val startTime: ULong, // milliseconds
	val endTime: ULong, // milliseconds
	val summary: String
)