package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import de.tutao.calendar.widget.WIDGET_LAST_SYNC_PREFIX
import de.tutao.calendar.widget.WidgetUpdateTrigger.WORKER
import de.tutao.calendar.widget.widgetDataStore
import kotlinx.serialization.encodeToString
import java.time.Instant
import java.time.LocalDateTime
import java.util.Calendar
import java.util.Date

class WidgetWorkerRepository : WidgetRepository() {
	override suspend fun storeLastSyncInBatch(context: Context, widgetIds: IntArray, now: Date) {
		val nowTimestamp = now.time
		val nowAsLocalDateTime = LocalDateTime.ofInstant(
			Instant.ofEpochMilli(nowTimestamp),
			Calendar.getInstance().timeZone.toZoneId()
		)

		var widgetMapToUpdate: Map<Preferences.Key<String>, LastSyncDao> = mapOf()

		// We can't access the DataStore while writing to it, so we collect the changes before and then apply
		for (id in widgetIds) {
			val storedLastSync = this.loadLastSync(context, id)

			val storedLastSyncAsLocalDateTime = LocalDateTime.ofInstant(
				Instant.ofEpochMilli(storedLastSync?.lastSync ?: 0),
				Calendar.getInstance().timeZone.toZoneId()
			)

			val force = storedLastSyncAsLocalDateTime.dayOfYear != nowAsLocalDateTime.dayOfYear
			val lastSyncIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$id"
			val preferencesKey = stringPreferencesKey(lastSyncIdentifier)

			widgetMapToUpdate = widgetMapToUpdate.plus(preferencesKey to LastSyncDao(nowTimestamp, WORKER, force))
		}

		context.widgetDataStore.edit { preferences ->
			widgetMapToUpdate.entries.forEach { (key, lastSync) ->
				preferences[key] = json.encodeToString(lastSync)
			}
		}
	}
}