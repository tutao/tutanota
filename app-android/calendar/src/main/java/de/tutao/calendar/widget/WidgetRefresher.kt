package de.tutao.calendar.widget

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import de.tutao.calendar.widget.data.LastSyncDao
import de.tutao.calendar.widget.workers.APP_WIDGET_ID_KEY
import de.tutao.calendar.widget.workers.WidgetDataSyncWorker
import de.tutao.tutashared.widget.WidgetRefreshable
import kotlinx.serialization.json.Json
import java.util.Date

const val LOAD_EVENTS_AFTER_REFRESH_WORK = "LoadWidgetEventsAfterRefresh"

class WidgetRefresher : WidgetRefreshable {
	companion object {
		private const val TAG = "WidgetRefresher"
	}

	@Throws
	override suspend fun refresh(context: Context) {
		val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(Agenda::class.java)
		val widgetIds =
			glanceIds.map { glanceId -> GlanceAppWidgetManager(context).getAppWidgetId(glanceId) }.toIntArray()
		val syncTimestamp = Date().time

		context.widgetDataStore.edit { preferences ->
			Log.d(
				TAG, "Active WorkInfos: ${WorkManager.getInstance(context).getWorkInfosByTag(TAG)}"
			)
			widgetIds.forEach { widgetId ->
				val uniqueWorkName = "${LOAD_EVENTS_AFTER_REFRESH_WORK}_$widgetId"
				val workRequest = OneTimeWorkRequestBuilder<WidgetDataSyncWorker>().addTag(TAG)
					.setInputData(Data.Builder().putAll(mapOf(APP_WIDGET_ID_KEY to widgetId)).build())
					.build()
				WorkManager.getInstance(context).beginUniqueWork(
					uniqueWorkName,
					ExistingWorkPolicy.APPEND_OR_REPLACE,
					workRequest
				).enqueue()

				val lastSyncIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$widgetId"
				val preferencesKey = stringPreferencesKey(lastSyncIdentifier)
				val lastSyncDao = LastSyncDao(syncTimestamp, WidgetUpdateTrigger.APP, false)
				Log.d(TAG, "WidgetRefresher.refresh() with LastSyncDao: ${Json.encodeToString(lastSyncDao)}")
				preferences[preferencesKey] =
					Json.encodeToString(lastSyncDao)
			}
		}

		Agenda().updateAll(context = context)
	}
}