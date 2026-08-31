package de.tutao.calendar.widget

import android.util.Log
import de.tutao.calendar.widget.model.WidgetUIViewModel

object WidgetViewModelProvider {
	private val TAG = "WidgetViewModelProvider"

	// AppWidgetId to WidgetUIViewModel
	val map = mutableMapOf<Int, WidgetUIViewModel>()

	fun addNew(appWidgetId: Int, viewModel: WidgetUIViewModel) {
		Log.d(TAG, "Adding a new WidgetUIViewModel for widget $appWidgetId")
		if (map.containsKey(appWidgetId)) {
			throw Exception("$TAG Trying to add an UI view model to a known widget. We should instead use the existing instance...")
		}
		map[appWidgetId] = viewModel
		Log.d(TAG, "WidgetUIViewModel for widget $appWidgetId added to provider")
	}

	fun getModelFor(appWidgetId: Int): WidgetUIViewModel? {
		return map[appWidgetId]
	}
}