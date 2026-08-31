package de.tutao.calendar.widget

import de.tutao.calendar.widget.model.WidgetUIViewModel

object WidgetViewModelProvider {
	private val TAG = "[WidgetViewModelProvider]"
	val map = mutableMapOf<Int, WidgetUIViewModel>()

	fun addNew(appWidgetId: Int, viewModel: WidgetUIViewModel) {
		if (map.containsKey(appWidgetId)) {
			throw Exception("$TAG Trying to add an UI view model to a known widget. We should instead use the existing instance...")
		}
		map[appWidgetId] = viewModel
	}

	fun getModelFor(appWidgetId: Int): WidgetUIViewModel {
		return map[appWidgetId]!!
	}


	val arr = ArrayList<String>()

	fun sayHi(who: String) {
		arr.add(who)
	}

	fun log() {
		val sb = StringBuilder()
		for (item in arr) {
			sb.append(item)
			sb.append(", ")
		}
		println(sb)
	}
}