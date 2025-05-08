package de.tutao.calendar.widget.data

import kotlinx.serialization.Serializable

@Serializable
data class BirthdayEventDao(val eventDao: CalendarEventDao, val contact: ContactDao)