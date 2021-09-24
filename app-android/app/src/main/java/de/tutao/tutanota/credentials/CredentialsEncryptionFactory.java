package de.tutao.tutanota.credentials;

import android.os.Build;

import de.tutao.tutanota.AndroidKeyStoreFacade;
import de.tutao.tutanota.AndroidKeyStoreFacadeFactory;
import de.tutao.tutanota.MainActivity;

/**
 * We use a factory for this to be able to cleanly separate code for different Android API versions.
 */
public final class CredentialsEncryptionFactory {
	public static ICredentialsEncryption create(MainActivity activity) {
		AuthenticationPrompt authenticationPrompt = new AuthenticationPrompt();
		AndroidKeyStoreFacade keyStoreFacade = AndroidKeyStoreFacadeFactory.create(activity);
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
			return new CredentialsEncryptionBeforeAPI30(keyStoreFacade, activity, authenticationPrompt);
		} else {
			return new CredentialsEncryptionFromAPI30(keyStoreFacade, activity, authenticationPrompt);
		}
	}
}
