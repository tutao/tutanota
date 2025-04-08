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
	override suspend fun getDataStore(context: Context, fileKey: String): DataStore<Preferences> =
		context.widgetDataStore

	override fun getLocation(context: Context, fileKey: String): File {
		/**
		 * GlanceWidgetManager calls this function to try deleting the DataStore file associated with a deleted widget.
		 * Since the same file is shared across all widgets, deleting it could lead to issues. To bypass this behavior,
		 * we override the delete function.
		 * For more context, see the discussion at: https://issuetracker.google.com/issues/217385694
		 */

		// Override the delete function to not affect (if existing) other widget instances
		class NoDeleteFile(path: String) : File(path) {
			override fun delete() = false
		}

		val datastoreFile = context.preferencesDataStoreFile(WIDGET_SETTINGS_DATASTORE_FILE)
		return NoDeleteFile(datastoreFile.absolutePath)
	}
}