package de.tutao.tutanota

import android.content.Context
import android.os.Build
import de.tutao.tutanota.credentials.DataKeyGeneratorBeforeAPI30
import de.tutao.tutanota.credentials.DataKeyGeneratorFromAPI30

/**
 * We use a factory for this to be able to cleanly separate code for different Android API versions.
 */
object AndroidKeyStoreFacadeFactory {
	fun create(context: Context) =
			AndroidKeyStoreFacade(context, if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
				DataKeyGeneratorBeforeAPI30()
			} else {
				DataKeyGeneratorFromAPI30()
			})
}