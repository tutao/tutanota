package de.tutao.tutanota.credentials

import android.os.Build
import de.tutao.tutanota.MainActivity
import de.tutao.tutanota.ipc.NativeCredentialsFacade

/**
 * We use a factory for this to be able to cleanly separate code for different Android API versions.
 */
object CredentialsEncryptionFactory {
	fun create(activity: MainActivity): NativeCredentialsFacade {
		val authenticationPrompt = AuthenticationPrompt()
		val keyStoreFacade = de.tutao.tutanota.createAndroidKeyStoreFacade(activity)
		return if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
			CredentialsEncryptionBeforeAPI30(keyStoreFacade, activity, authenticationPrompt)
		} else {
			CredentialsEncryptionFromAPI30(keyStoreFacade, activity, authenticationPrompt)
		}
	}
}