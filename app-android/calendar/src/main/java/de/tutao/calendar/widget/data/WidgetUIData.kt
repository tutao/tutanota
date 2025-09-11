package de.tutao.calendar.widget.data

data class WidgetUIData(
	val normalEvents: HashMap<Long, List<UIEvent>>,
	val allDayEvents: HashMap<Long, List<UIEvent>>,
)