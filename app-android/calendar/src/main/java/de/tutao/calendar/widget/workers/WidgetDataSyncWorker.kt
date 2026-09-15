package de.tutao.calendar.widget.workers

import android.content.Context
import android.util.Log
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import de.tutao.calendar.widget.Agenda
import de.tutao.calendar.widget.WidgetViewModelProvider
import de.tutao.calendar.widget.widgetCacheDataStore
import de.tutao.calendar.widget.widgetDataStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDateTime

const val APP_WIDGET_ID_KEY = "appWidgetId"

class WidgetDataSyncWorker(
	private val appContext: Context,
	workParams: WorkerParameters
) : CoroutineWorker(appContext, workParams) {
	companion object {
		private const val TAG = "WidgetDataSyncWorker"
	}

	override suspend fun doWork(): Result {
		val widgetId: Int = inputData.keyValueMap[APP_WIDGET_ID_KEY]!! as Int

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