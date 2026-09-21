package de.tutao.calendar.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import de.tutao.calendar.widget.data.WidgetDataRepository
import de.tutao.calendar.widget.model.WidgetUIViewModel
import de.tutao.calendar.widget.workers.WidgetPeriodicRefresherWorker
import java.time.Duration
import java.util.concurrent.TimeUnit

const val WIDGET_SETTINGS_PREFIX = "calendar_widget_settings"
const val WIDGET_LAST_SYNC_PREFIX = "calendar_widget_last_sync"
const val WIDGET_CACHE_DATE_PREFIX = "calendar_widget_cache_date"
const val WIDGET_SETTINGS_DATASTORE_FILE = "tuta_calendar_widget_settings"
const val WIDGET_EVENTS_CACHE = "calendar_widget_cache"
const val WIDGET_CACHE_DATASTORE_FILE = "tuta_calendar_widget_cache"

val Context.widgetDataStore: DataStore<Preferences> by preferencesDataStore(WIDGET_SETTINGS_DATASTORE_FILE)
val Context.widgetCacheDataStore: DataStore<Preferences> by preferencesDataStore(WIDGET_CACHE_DATASTORE_FILE)
val Context.widgetDataRepository: WidgetDataRepository
	get() = WidgetDataRepository.getInstance()

private val widgetUiViewModel = mutableMapOf<Int, WidgetUIViewModel>()
val Context.widgetIdToViewModel: MutableMap<Int, WidgetUIViewModel>
	get() = widgetUiViewModel

enum class WidgetUpdateTrigger {
	WORKER,
	APP,
	SETTINGS
}

class WidgetReceiver : GlanceAppWidgetReceiver() {
	companion object {
		private const val TAG = "WidgetReceiver"
	}

	override val glanceAppWidget: GlanceAppWidget = Agenda()

	override fun onEnabled(context: Context) {
		super.onEnabled(context)

		Log.d(TAG, "onEnabled called")

		WorkManager.getInstance(context).enqueueUniquePeriodicWork(
			WidgetPeriodicRefresherWorker.TAG,
			ExistingPeriodicWorkPolicy.UPDATE,
			PeriodicWorkRequestBuilder<WidgetPeriodicRefresherWorker>(30, TimeUnit.MINUTES)
				.addTag(WidgetPeriodicRefresherWorker.TAG).setInitialDelay(Duration.ofMinutes(1))
				.build()
		)
	}

	override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {

		super.onUpdate(context, appWidgetManager, appWidgetIds)

		Log.d(
			TAG, "[App widget ids full array] ${appWidgetIds.contentToString()}"
		)

		appWidgetIds.forEach { appWidgetId ->
			context.widgetIdToViewModel.getOrPut(appWidgetId) { WidgetUIViewModel.init(context, appWidgetId) }
		}
	}

	override fun onDisabled(context: Context) {
		super.onDisabled(context)
		WorkManager.getInstance(context).cancelAllWorkByTag(WidgetPeriodicRefresherWorker.TAG)
		context.preferencesDataStoreFile(WIDGET_SETTINGS_DATASTORE_FILE).delete()
		context.preferencesDataStoreFile(WIDGET_CACHE_DATASTORE_FILE).delete()
	}

	override fun onDeleted(context: Context, appWidgetIds: IntArray) {
		super.onDeleted(context, appWidgetIds)
		appWidgetIds.forEach { appWidgetId ->
			WorkManager.getInstance(context).cancelUniqueWork("${LOAD_EVENTS_AFTER_CONFIG_WORK}_$appWidgetId")
		}
	}
}