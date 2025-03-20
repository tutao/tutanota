package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.glance.state.GlanceStateDefinition
import de.tutao.calendar.widget.WIDGET_SETTINGS_DATASTORE_FILE
import de.tutao.calendar.widget.widgetDataStore
import java.io.File

class WidgetStateDefinition : GlanceStateDefinition<Preferences> {
	override suspend fun getDataStore(context: Context, fileKey: String): DataStore<Preferences> = context.widgetDataStore
	override fun getLocation(context: Context, fileKey: String): File =
		context.preferencesDataStoreFile(WIDGET_SETTINGS_DATASTORE_FILE)
}