package de.tutao.calendar.widget

import android.util.Log
import de.tutao.calendar.widget.model.WidgetUIViewModel

object WidgetViewModelProvider {
	private val TAG = "WidgetViewModelProvider"

	// AppWidgetId to WidgetUIViewModel
	private val viewModelsByWidgetId = mutableMapOf<Int, WidgetUIViewModel>()

	fun addNew(widgetId: Int, viewModel: WidgetUIViewModel) {
		Log.d(TAG, "Adding a new WidgetUIViewModel for widget $widgetId")
		if (viewModelsByWidgetId.containsKey(widgetId)) {
			throw Exception("$TAG Trying to add an UI view model to a known widget. We should instead use the existing instance...")
		}
		viewModelsByWidgetId[widgetId] = viewModel
		Log.d(TAG, "WidgetUIViewModel for widget $widgetId added to provider")
	}

	fun deleteModelFor(widgetId: Int): WidgetUIViewModel? {
		return viewModelsByWidgetId.remove(widgetId)
	}


	fun getModelFor(widgetId: Int): WidgetUIViewModel? {
		return viewModelsByWidgetId[widgetId]
	}
}