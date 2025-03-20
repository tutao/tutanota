package de.tutao.calendar.widget

import android.content.Context
import android.util.Log
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import de.tutao.calendar.widget.data.WidgetWorkerRepository
import java.util.Date

class WidgetWorkManager(
	private val appContext: Context,
	workParams: WorkerParameters
) : CoroutineWorker(appContext, workParams) {
	companion object {
		const val TAG = "WidgetWorkManager"
	}

	override suspend fun doWork(): Result {
		Log.d(TAG, "Running widget refresh job")
		val repository = WidgetWorkerRepository()
		val glanceIds = GlanceAppWidgetManager(appContext).getGlanceIds(Agenda::class.java)

		val widgetIds =
			glanceIds.map { glanceId -> GlanceAppWidgetManager(appContext).getAppWidgetId(glanceId) }.toIntArray()

		repository.storeLastSyncInBatch(appContext, widgetIds, Date())

		Agenda().updateAll(context = appContext)
		return Result.success()
	}
}