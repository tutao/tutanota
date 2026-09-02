package de.tutao.calendar.widget.workers

import android.content.Context
import android.util.Log
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import de.tutao.calendar.widget.Agenda
import de.tutao.calendar.widget.WidgetUpdateTrigger
import de.tutao.calendar.widget.data.WidgetWorkerRepository
import java.util.Date

class WidgetPeriodicRefresherWorker(
	private val appContext: Context,
	workParams: WorkerParameters
) : CoroutineWorker(appContext, workParams) {
	companion object {
		public const val TAG = "WidgetPeriodicRefresherWorker"
	}

	override suspend fun doWork(): Result {
		Log.d(TAG, "Running widget refresh job")
		val repository = WidgetWorkerRepository()
		val glanceIds = GlanceAppWidgetManager(appContext).getGlanceIds(Agenda::class.java)

		val widgetIds =
			glanceIds.map { glanceId -> GlanceAppWidgetManager(appContext).getAppWidgetId(glanceId) }.toIntArray()

		repository.storeLastSyncInBatch(appContext, widgetIds, Date(), WidgetUpdateTrigger.WORKER)

		Agenda().updateAll(context = appContext)
		return Result.success()
	}
}