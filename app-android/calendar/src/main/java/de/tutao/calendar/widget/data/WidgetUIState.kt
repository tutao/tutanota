package de.tutao.calendar.widget.data

import de.tutao.calendar.widget.error.WidgetError
import java.time.LocalDate

sealed interface WidgetUIState {
	object NewlyCreated : WidgetUIState

	object NewConfigurationProvided : WidgetUIState

	object Loading : WidgetUIState

	data class Error(val error: WidgetError) : WidgetUIState

	data class Available(
		var daysAndEvents: Map<LocalDate, MutableList<UIEvent>>,
	) : WidgetUIState
}
