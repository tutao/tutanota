package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import de.tutao.calendar.widget.WIDGET_LAST_SYNC_PREFIX
import de.tutao.calendar.widget.WidgetUpdateTrigger.WORKER
import de.tutao.calendar.widget.widgetDataStore
import kotlinx.serialization.encodeToString
import java.util.Date

class WidgetWorkerRepository : WidgetRepository() {
	override suspend fun storeLastSyncInBatch(context: Context, widgetIds: IntArray, now: Date) {
		val nowTimestamp = now.time

		var widgetMapToUpdate: Map<Preferences.Key<String>, LastSyncDao> = mapOf()

		// We can't access the DataStore while writing to it, so we collect the changes before and then apply
		for (id in widgetIds) {
			val cacheCreation = this.loadCacheCreationDate(context, id)
			val forceRefresh = (nowTimestamp - (cacheCreation?.createdAt ?: 0)) > 3600 // 1hr

			val lastSyncIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$id"
			val preferencesKey = stringPreferencesKey(lastSyncIdentifier)

			widgetMapToUpdate =
				widgetMapToUpdate.plus(preferencesKey to LastSyncDao(nowTimestamp, WORKER, forceRefresh))
		}

		context.widgetDataStore.edit { preferences ->
			widgetMapToUpdate.entries.forEach { (key, lastSync) ->
				preferences[key] = json.encodeToString(lastSync)
			}
		}
	}
}