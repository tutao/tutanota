package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import de.tutao.calendar.widget.WIDGET_SETTINGS_PREFIX
import de.tutao.calendar.widget.widgetDataStore
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.PersistedCredentials
import de.tutao.tutashared.push.toSdkCredentials
import kotlinx.serialization.encodeToString

class WidgetConfigRepository : WidgetRepository() {
	override suspend fun storeSettings(context: Context, widgetId: Int, settings: SettingsDao) {
		val databaseWidgetIdentifier = "${WIDGET_SETTINGS_PREFIX}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)
		val serializedSettings = json.encodeToString(settings)

		context.widgetDataStore.edit { preferences ->
			preferences[preferencesKey] = serializedSettings
		}
	}

	override suspend fun loadCredentials(credentialsFacade: NativeCredentialsFacade): List<PersistedCredentials> {
		return credentialsFacade.loadAll()
	}

	override suspend fun loadCalendars(
		userId: GeneratedId,
		credentialsFacade: NativeCredentialsFacade,
		sdk: Sdk
	): Map<GeneratedId, CalendarRenderData> {
		val credential = credentialsFacade.loadByUserId(userId)?.toSdkCredentials()
			?: throw Exception("Missing credentials for user $userId during calendars loading")

		val loggedInSdk = sdk.login(credential)
		val calendarFacade = loggedInSdk.calendarFacade()
		return calendarFacade.getCalendarsRenderData().toMutableMap().toSortedMap(Comparator<GeneratedId> { a, b ->
			when {
				a > b -> 1
				a < b -> -1
				else -> 0
			}
		})
	}
}