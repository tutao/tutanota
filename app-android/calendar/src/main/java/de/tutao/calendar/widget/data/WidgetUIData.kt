package de.tutao.calendar.widget.data

import java.time.LocalDate

data class WidgetUIData(
	val normalEvents: HashMap<LocalDate, List<UIEvent>>,
	val allDayEvents: HashMap<LocalDate, List<UIEvent>>,
)