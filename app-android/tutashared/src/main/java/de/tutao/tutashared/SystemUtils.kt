package de.tutao.tutashared

import android.content.pm.PackageManager
import java.io.File

sealed class SystemUtils {
	companion object {
		/**
		 * Returns the installation time of a package in UNIX Epoch time.
		 * Adapted from https://stackoverflow.com/a/2832419
		 */
		@JvmStatic
		fun getInstallationDate(pm: PackageManager, packageName: String): String {
			val appInfo = pm.getApplicationInfo(packageName, 0)
			val appFile = appInfo.sourceDir
			val installedTime = File(appFile).lastModified() //Epoch Time
			return installedTime.toString()
		}
	}
}


