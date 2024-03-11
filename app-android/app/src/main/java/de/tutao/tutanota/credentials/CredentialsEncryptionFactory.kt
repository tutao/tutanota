package de.tutao.tutanota.credentials

import android.content.Context
import android.os.Build
import de.tutao.tutanota.AndroidNativeCryptoFacade
import de.tutao.tutanota.data.AppDatabase
import de.tutao.tutanota.ipc.NativeCredentialsFacade

/**
 * We use a factory for this to be able to cleanly separate code for different Android API versions.
 */
object CredentialsEncryptionFactory {
	fun create(activity: Context, crypto: AndroidNativeCryptoFacade, db: AppDatabase): NativeCredentialsFacade {
		val authenticationPrompt = AuthenticationPrompt()
		val keyStoreFacade = de.tutao.tutanota.createAndroidKeyStoreFacade()
		val keychainEncryption = if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
			CredentialsEncryptionBeforeAPI30(keyStoreFacade, activity, crypto, authenticationPrompt)
		} else {
			CredentialsEncryptionFromAPI30(keyStoreFacade, activity, crypto, authenticationPrompt)
		}
		return AndroidNativeCredentialsFacade(crypto, keychainEncryption, db)
	}
}