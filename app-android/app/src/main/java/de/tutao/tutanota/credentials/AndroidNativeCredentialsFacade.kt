package de.tutao.tutanota.credentials

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.fragment.app.FragmentActivity
import de.tutao.tutanota.AndroidKeyStoreFacade
import de.tutao.tutanota.base64ToBytes
import de.tutao.tutanota.data.AppDatabase
import de.tutao.tutanota.ipc.CredentialEncryptionMode
import de.tutao.tutanota.ipc.DataWrapper
import de.tutao.tutanota.ipc.NativeCredentialsFacade
import de.tutao.tutanota.ipc.PersistedCredentials
import de.tutao.tutanota.ipc.wrap
import de.tutao.tutanota.toBase64
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.firstOrNull
import java.io.IOException

abstract class AndroidNativeCredentialsFacade(
	private val keyStoreFacade: AndroidKeyStoreFacade,
	private val activity: Context,
	private val authenticationPrompt: AuthenticationPrompt
) : NativeCredentialsFacade {
	private val db: AppDatabase = AppDatabase.getDatabase(activity, false)
	private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

	companion object {
		// FIXME Can we move this to somewhere all platforms can read?
		private val ENCRYPTION_MODE_KEY = "credentialEncryptionMode"
		private val CREDENTIALS_ENCRYPTION_KEY_KEY = "credentialsEncryptionKey"
	}

	private object PreferencesKeys {
		val ENCRYPTION_MODE_KEY_PREF = stringPreferencesKey(ENCRYPTION_MODE_KEY)
		val CREDENTIALS_ENCRYPTION_KEY_KEY_PREF = stringPreferencesKey(CREDENTIALS_ENCRYPTION_KEY_KEY)
	}

	override suspend fun loadAll(): List<PersistedCredentials> {
		return db.PersistedCredentialsDao().allPersistedCredentials.map { e -> e.toObject() }
	}

	override suspend fun store(credentials: PersistedCredentials) {
		db.PersistedCredentialsDao().insertPersistedCredentials(credentials.toEntity())
	}

	override suspend fun loadByUserId(id: String): PersistedCredentials? {
		return db.PersistedCredentialsDao().allPersistedCredentials.firstOrNull { e -> e.userId == id }?.toObject()
	}

	override suspend fun deleteByUserId(id: String) {
		db.PersistedCredentialsDao().deletePersistedCredentials(id)
	}

	override suspend fun getCredentialEncryptionMode(): CredentialEncryptionMode? {
		val encryptionModeStr = activity.dataStore.data.catch { exception ->
			if (exception is IOException) {
				emit(emptyPreferences())
			} else {
				throw exception
			}
		}.firstOrNull()?.get(PreferencesKeys.ENCRYPTION_MODE_KEY_PREF)

		return if (encryptionModeStr != null) enumValueOf<CredentialEncryptionMode>(encryptionModeStr) else null
	}

	override suspend fun setCredentialEncryptionMode(encryptionMode: CredentialEncryptionMode?) {
		activity.dataStore.edit { preferences ->
			if (encryptionMode != null) preferences[PreferencesKeys.ENCRYPTION_MODE_KEY_PREF] = encryptionMode.name
		}
	}

	override suspend fun getCredentialsEncryptionKey(): DataWrapper? {
		val credentialsEncryptionKey = activity.dataStore.data.catch { exception ->
			if (exception is IOException) {
				emit(emptyPreferences())
			} else {
				throw exception
			}
		}.firstOrNull()?.get(PreferencesKeys.CREDENTIALS_ENCRYPTION_KEY_KEY_PREF)

		return credentialsEncryptionKey?.base64ToBytes()?.wrap()
	}

	override suspend fun setCredentialsEncryptionKey(credentialsEncryptionKey: DataWrapper?) {
		activity.dataStore.edit { preferences ->
			if (credentialsEncryptionKey != null)
				preferences[PreferencesKeys.CREDENTIALS_ENCRYPTION_KEY_KEY_PREF] =
					credentialsEncryptionKey.data.toBase64()
		}
	}
}