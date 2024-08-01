package de.tutao.tutashared

import android.os.Build
import de.tutao.tutashared.credentials.DataKeyGeneratorBeforeAPI30
import de.tutao.tutashared.credentials.DataKeyGeneratorFromAPI30

fun createAndroidKeyStoreFacade() =
	AndroidKeyStoreFacade(
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
			DataKeyGeneratorBeforeAPI30()
		} else {
			DataKeyGeneratorFromAPI30()
		}
	)