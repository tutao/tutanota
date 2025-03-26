package de.tutao.calendar.widget.data

data class WidgetUIData(
	val normalEvents: List<UIEvent>,
	val allDayEvents: List<UIEvent>,
	val allDayEventsCount: Int = allDayEvents.size
)