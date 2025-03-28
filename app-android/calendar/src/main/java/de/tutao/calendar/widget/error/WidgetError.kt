package de.tutao.calendar.widget.error

data class WidgetError(
	val message: String,
	val stackTrace: String,
	val type: WidgetErrorType
)