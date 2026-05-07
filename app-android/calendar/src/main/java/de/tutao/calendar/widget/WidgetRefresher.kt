package de.tutao.calendar.widget

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import de.tutao.calendar.widget.data.LastSyncDao
import de.tutao.tutashared.widget.WidgetRefreshable
import kotlinx.serialization.json.Json
import java.util.Date

class WidgetRefresher : WidgetRefreshable {
	@Throws
	override suspend fun refresh(context: Context) {
		val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(Agenda::class.java)
		val widgetIds =
			glanceIds.map { glanceId -> GlanceAppWidgetManager(context).getAppWidgetId(glanceId) }.toIntArray()
		val lastSyncTimestamp = Date().time

		context.widgetDataStore.edit { preferences ->
			widgetIds.forEach {
				val lastSyncIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$it"
				val preferencesKey = stringPreferencesKey(lastSyncIdentifier)

				preferences[preferencesKey] =
					Json.encodeToString(LastSyncDao(lastSyncTimestamp, WidgetUpdateTrigger.APP, false))
			}
		}

		Agenda().updateAll(context = context)
	}
}