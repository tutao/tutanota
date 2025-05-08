package de.tutao.calendar.widget.data

import kotlinx.serialization.Serializable

@Serializable
data class CalendarEventListDao(
	val shortEvents: List<CalendarEventDao>,
	val longEvents: List<CalendarEventDao>,
	val birthdayEvents: List<BirthdayEventDao> = listOf()
)
