package de.tutao.calendar.widget

import android.content.Context
import android.util.Log
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDateTime

const val WIDGET_ID_WORKER_KEY = "appWidgetId"

class WidgetDataWorker(
	private val appContext: Context,
	workParams: WorkerParameters
) : CoroutineWorker(appContext, workParams) {
	companion object {
		private const val TAG = "WidgetDataWorker"
	}

	override suspend fun doWork(): Result {
		val widgetId: Int = inputData.keyValueMap[WIDGET_ID_WORKER_KEY]!! as Int

		Log.i(TAG, "[$widgetId] Getting existing ViewModel")

		val model = WidgetViewModelProvider.getModelFor(widgetId)
			?: throw Exception("Worker could not find a ViewModel for widget $widgetId")

		Log.i(TAG, "[$widgetId] Dispatching UI state load to IO thread")
		withContext(Dispatchers.IO) {
			model.loadUIState(appContext.widgetDataStore, appContext.widgetCacheDataStore, LocalDateTime.now())
		}

		Agenda().updateAll(appContext)
		return Result.success()
	}
}