package de.tutao.tutanota

import android.os.Build
import de.tutao.tutanota.credentials.DataKeyGeneratorBeforeAPI30
import de.tutao.tutanota.credentials.DataKeyGeneratorFromAPI30

fun createAndroidKeyStoreFacade() =
		AndroidKeyStoreFacade(
				if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
					DataKeyGeneratorBeforeAPI30()
				} else {
					DataKeyGeneratorFromAPI30()
				}
		)