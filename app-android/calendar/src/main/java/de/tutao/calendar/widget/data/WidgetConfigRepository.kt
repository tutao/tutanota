package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import de.tutao.calendar.widget.WIDGET_LAST_SYNC_PREFIX
import de.tutao.calendar.widget.WidgetUpdateTrigger.APP
import de.tutao.calendar.widget.widgetDataStore
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.PersistedCredentials
import kotlinx.serialization.encodeToString
import java.util.Date

class WidgetConfigRepository : WidgetRepository() {
	override suspend fun storeLastSyncInBatch(context: Context, widgetIds: IntArray, now: Date) {
		val lastSyncTimestamp = now.time

		context.widgetDataStore.edit { preferences ->
			widgetIds.forEach {
				val lastSyncIdentifier = "${WIDGET_LAST_SYNC_PREFIX}_$it"
				val preferencesKey = stringPreferencesKey(lastSyncIdentifier)

				preferences[preferencesKey] =
					json.encodeToString(LastSyncDao(lastSyncTimestamp, APP, false))
			}
		}
	}

	override suspend fun loadCredentials(credentialsFacade: NativeCredentialsFacade): List<PersistedCredentials> {
		return credentialsFacade.loadAll()
	}
}