package de.tutao.calendar.widget

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import de.tutao.calendar.widget.data.WidgetDataRepository
import java.time.Duration
import java.util.concurrent.TimeUnit

const val WIDGET_SETTINGS_PREFIX = "calendar_widget_settings"
const val WIDGET_LAST_SYNC_PREFIX = "calendar_widget_last_sync"
const val WIDGET_SETTINGS_DATASTORE_FILE = "tuta_calendar_widget_settings"

val Context.widgetDataStore: DataStore<Preferences> by preferencesDataStore(WIDGET_SETTINGS_DATASTORE_FILE)
val Context.widgetDataRepository: WidgetDataRepository
	get() = WidgetDataRepository.getInstance()

enum class WidgetUpdateTrigger {
	WORKER,
	APP
}

class WidgetReceiver : GlanceAppWidgetReceiver() {
	companion object {
		const val WIDGET_WORKER_TAG = "agenda_widget_worker"
		const val TAG = "WidgetReceiver"
	}

	override val glanceAppWidget: GlanceAppWidget = Agenda()

	override fun onEnabled(context: Context) {
		super.onEnabled(context)

		WorkManager.getInstance(context).enqueueUniquePeriodicWork(
			WIDGET_WORKER_TAG,
			ExistingPeriodicWorkPolicy.UPDATE,
			PeriodicWorkRequestBuilder<WidgetWorkManager>(30, TimeUnit.MINUTES)
				.addTag(WIDGET_WORKER_TAG).setInitialDelay(Duration.ofMinutes(1)).build()
		)
	}

	override fun onDisabled(context: Context) {
		super.onDisabled(context)

		WorkManager.getInstance(context).cancelAllWorkByTag(WIDGET_WORKER_TAG)
	}
}