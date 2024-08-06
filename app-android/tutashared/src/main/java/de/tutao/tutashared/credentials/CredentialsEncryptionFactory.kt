package de.tutao.tutashared.credentials

import android.content.Context
import android.os.Build
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.ipc.NativeCredentialsFacade

/**
 * We use a factory for this to be able to cleanly separate code for different Android API versions.
 */
object CredentialsEncryptionFactory {
	fun create(activity: Context, crypto: AndroidNativeCryptoFacade, db: AppDatabase): NativeCredentialsFacade {
		val authenticationPrompt = AuthenticationPrompt()
		val keyStoreFacade = createAndroidKeyStoreFacade()
		val keychainEncryption = if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
			CredentialsEncryptionBeforeAPI30(keyStoreFacade, activity, authenticationPrompt)
		} else {
			CredentialsEncryptionFromAPI30(keyStoreFacade, activity, authenticationPrompt)
		}
		return AndroidNativeCredentialsFacade(crypto, keychainEncryption, db)
	}
}