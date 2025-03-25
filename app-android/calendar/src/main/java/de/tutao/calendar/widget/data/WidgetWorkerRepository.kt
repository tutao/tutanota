package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import de.tutao.calendar.widget.WIDGET_LAST_SYNC_PREFIX
import de.tutao.calendar.widget.widgetDataStore
import java.util.Date

class WidgetWorkerRepository : WidgetRepository() {
	override suspend fun storeLastSyncInBatch(context: Context, widgetIds: IntArray, lastSync: Date) {
		val lastSyncTimestamp = lastSync.time

		context.widgetDataStore.edit { preferences ->
			widgetIds.forEach {
				val lastSyncIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$it"
				val preferencesKey = longPreferencesKey(lastSyncIdentifier)

				preferences[preferencesKey] = lastSyncTimestamp
			}
		}
	}
}