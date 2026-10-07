package de.tutao.calendar.widget.data

import de.tutao.tutasdk.GeneratedId
import de.tutao.tutashared.IdTuple
import java.time.format.DateTimeFormatter


/**
 * UI representation of a calendar event
 * Contains all the necessary information for the widget to know how to display an event entry on a single day in the Widget UI.
 *
 * If the CalendarEventDao this is associated with spans multiple days, it will be split into multiple UIEvents: one for each day.
 *
 * @param calendarId the id of the calendar this event belongs to
 * @param eventId the event's id
 * @param calendarColor the color saved for a calendar
 * @param summary the event summary, identical to what is stored in database
 * @param formattedStartTime the start time of the event. Should be formatted the dateFormatter provided in the companion object. This is important because we have sorting logic based on this.
 * @param formattedEndTime the end time of the event.  Should be formatted the dateFormatter provided in the companion object. This is important because we have sorting logic based on this.
 * @param isDisplayedAsAllDay boolean flag to tell whether the event should show in the all-day section or as a normal event
 * @param displayedTimes the exact string that is displayed for describing when the event starts and ends
 * @param isBirthday boolean flag designating this as a birthday event
 * @param startsBeforeTodayAndEndsToday true if the event started on a previous day but ends today. We have special display logic for these cases
 */
data class UIEvent(
	val calendarId: GeneratedId,
	val eventId: IdTuple?,
	val calendarColor: String,
	val summary: String,
	val formattedStartTime: String,
	val formattedEndTime: String,
	val isDisplayedAsAllDay: Boolean,
	val displayedTimes: String,
	val isBirthday: Boolean = false,
	// This is used for special sorting behavior for widget events that say "Ends at"
	val startsBeforeTodayAndEndsToday: Boolean = false
) {
	companion object {
		val dateFormatter =
			DateTimeFormatter.ofPattern("HH:mm") // use this to format start times into "formattedStartTime"
	}
}