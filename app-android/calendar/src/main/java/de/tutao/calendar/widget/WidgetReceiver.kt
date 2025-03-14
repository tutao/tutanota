package de.tutao.calendar.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import kotlinx.coroutines.MainScope

const val WIDGET_SETTINGS_PREFIX = "calendar_widget_settings"
const val WIDGET_LAST_SYNC_PREFIX = "calendar_widget_last_sync"
const val WIDGET_SETTINGS_DATASTORE_FILE = "tuta_calendar_widget_settings"
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(WIDGET_SETTINGS_DATASTORE_FILE)

class WidgetReceiver : GlanceAppWidgetReceiver() {
	override val glanceAppWidget: GlanceAppWidget = VerticalWidget()
	private val coroutineScope = MainScope()

	override fun onEnabled(context: Context?) {
		super.onEnabled(context)
	}

	override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
		Log.d("WidgetReceiver", "Called update for appWidgetIds ${appWidgetIds.joinToString { " $it " }}")
		super.onUpdate(context, appWidgetManager, appWidgetIds)
//		observeData(context, )
	}

	private fun observeData(context: Context, widgetId: Int) {
//		coroutineScope.launch {
//			WidgetUIViewModel.getInstance(context, AppWidgetManager)
//		}
	}
}