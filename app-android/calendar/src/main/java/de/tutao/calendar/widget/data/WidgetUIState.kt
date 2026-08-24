package de.tutao.calendar.widget.data

import java.time.LocalDate

sealed interface WidgetUIState {
	object NewlyCreated : WidgetUIState

	object Loading : WidgetUIState

	data class Available(
		val normalEvents: HashMap<LocalDate, List<UIEvent>>,
		val allDayEvents: HashMap<LocalDate, List<UIEvent>>,
	) : WidgetUIState
}
