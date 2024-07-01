package de.tutao.calendar

import android.os.Build
import de.tutao.calendar.credentials.DataKeyGeneratorBeforeAPI30
import de.tutao.calendar.credentials.DataKeyGeneratorFromAPI30

fun createAndroidKeyStoreFacade() =
		AndroidKeyStoreFacade(
				if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
					DataKeyGeneratorBeforeAPI30()
				} else {
					DataKeyGeneratorFromAPI30()
				}
		)