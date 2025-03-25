package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import de.tutao.calendar.widget.WIDGET_LAST_SYNC_PREFIX
import de.tutao.calendar.widget.WidgetUpdateTrigger.WORKER
import de.tutao.calendar.widget.widgetDataStore
import kotlinx.serialization.encodeToString
import java.util.Date

class WidgetWorkerRepository : WidgetRepository() {
	override suspend fun storeLastSyncInBatch(context: Context, widgetIds: IntArray, lastSync: Date) {
		val lastSyncTimestamp = lastSync.time

		context.widgetDataStore.edit { preferences ->
			widgetIds.forEach {
				val lastSyncIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$it"
				val preferencesKey = stringPreferencesKey(lastSyncIdentifier)

				preferences[preferencesKey] =
					json.encodeToString(LastSyncDao(lastSyncTimestamp, WORKER))
			}
		}
	}
}