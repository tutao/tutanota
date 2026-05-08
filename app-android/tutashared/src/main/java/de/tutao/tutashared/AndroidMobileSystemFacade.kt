package de.tutao.tutashared

import android.Manifest
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.print.PrintAttributes
import android.print.PrintManager
import android.provider.Settings
import android.util.Base64
import android.util.Log
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import androidx.fragment.app.FragmentActivity
import de.tutao.tutashared.credentials.AuthenticationPrompt
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.file.AndroidFileFacade
import de.tutao.tutashared.ipc.AppLockMethod
import de.tutao.tutashared.ipc.MobileSystemFacade
import de.tutao.tutashared.ipc.PermissionType
import de.tutao.tutashared.remote.RemoteStorage
import de.tutao.tutashared.widget.WidgetRefreshable
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import java.nio.charset.Charset

enum class AppType {
	MAIL,
	CALENDAR,
	DRIVE
}

data class AppDetails(val packageName: String, val scheme: String)

class AndroidMobileSystemFacade(
	private val fileFacade: AndroidFileFacade,
	private val activity: Activity,
	private val activityUtils: ActivityUtils,
	private val db: AppDatabase,
	private val providerAuthority: String,
	private val appType: AppType,
	private val widgetRefresher: WidgetRefreshable?,
) : MobileSystemFacade {
	private val authenticationPrompt = AuthenticationPrompt()

	companion object {
		private const val TAG = "SystemFacade"
		const val APP_LOCK_METHOD = "AppLockMethod"
		const val TUTA_INTENT_ACTION = "TUTA_INTEROP"
	}

	override suspend fun openLink(uri: String): Boolean {
		val intent = Intent(Intent.ACTION_VIEW, uri.toUri())
		return withContext(Dispatchers.Main) {
			try {
				activity.startActivity(intent)
				true
			} catch (e: ActivityNotFoundException) {
				Log.i(TAG, "Activity for intent $uri not found.", e)
				false
			}
		}
	}


	override suspend fun goToSettings() {
		withContext(Dispatchers.Main) {
			val intent = Intent(
				Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
				"package:${activity.packageName}".toUri()
			)
			activity.startActivity(intent)
		}
	}


	override suspend fun shareText(text: String, title: String): Boolean {
		val sendIntent = Intent(Intent.ACTION_SEND)
		sendIntent.type = "text/plain"
		sendIntent.putExtra(Intent.EXTRA_TEXT, text)

		// Shows a text title in the app chooser
		sendIntent.putExtra(Intent.EXTRA_TITLE, title)

		withContext(Dispatchers.IO) {
			// In order to show a logo thumbnail with the app chooser we need to pass a URI of a file in the filesystem
			// we just save one of our resources to the temp directory and then pass that as ClipData
			// because you can't share non 'content' URIs with other apps
			val imageName = "logo-solo-red.png"
			try {
				val logoInputStream = activity.assets.open("tutanota/images/$imageName")
				val logoFile = File(fileFacade.tempDir.decrypt, imageName)
				fileFacade.writeFileStream(logoFile, logoInputStream)
				val logoUri = FileProvider.getUriForFile(activity, providerAuthority, logoFile)
				val thumbnail = ClipData.newUri(
					activity.contentResolver,
					"tutanota_logo",
					logoUri
				)
				sendIntent.clipData = thumbnail
			} catch (e: IOException) {
				Log.e(TAG, "Error attaching thumbnail to share intent:\n${e.message}")
			}
		}

		sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
		val intent = Intent.createChooser(sendIntent, null)
		withContext(Dispatchers.Main) {
			activity.startActivity(intent)
		}
		return true
	}

	override suspend fun hasPermission(permission: PermissionType): Boolean {
		return when (permission) {
			PermissionType.CONTACTS -> activityUtils.hasPermission(Manifest.permission.READ_CONTACTS) && activityUtils.hasPermission(
				Manifest.permission.WRITE_CONTACTS
			)

			PermissionType.IGNORE_BATTERY_OPTIMIZATION -> activityUtils.hasBatteryOptimizationPermission()
			PermissionType.NOTIFICATION -> if (atLeastTiramisu()) activityUtils.hasPermission(Manifest.permission.POST_NOTIFICATIONS) else true
			PermissionType.CAMERA -> activityUtils.hasPermission(Manifest.permission.CAMERA)
		}
	}

	override suspend fun requestPermission(permission: PermissionType) {
		when (permission) {
			PermissionType.CONTACTS -> {
				activityUtils.getPermission(Manifest.permission.READ_CONTACTS)
				activityUtils.getPermission(Manifest.permission.WRITE_CONTACTS)
			}

			PermissionType.IGNORE_BATTERY_OPTIMIZATION -> activityUtils.requestBatteryOptimizationPermission()
			PermissionType.NOTIFICATION -> if (atLeastTiramisu()) activityUtils.getPermission(Manifest.permission.POST_NOTIFICATIONS)
			PermissionType.CAMERA -> activityUtils.getPermission(Manifest.permission.CAMERA)
		}
	}

	override suspend fun getAppLockMethod(): AppLockMethod {
		return db.keyValueDao().getString(APP_LOCK_METHOD)?.let { AppLockMethod.fromValue(it) }
			?: AppLockMethod.NONE
	}

	override suspend fun setAppLockMethod(method: AppLockMethod) {
		db.keyValueDao().putString(APP_LOCK_METHOD, method.value)
	}

	@Throws(CredentialAuthenticationException::class)
	override suspend fun enforceAppLock(method: AppLockMethod) {
		val allowedAuthenticators = when (method) {
			AppLockMethod.NONE -> return
			AppLockMethod.SYSTEM_PASS_OR_BIOMETRICS -> BiometricManager.Authenticators.DEVICE_CREDENTIAL or BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK
			AppLockMethod.BIOMETRICS -> BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK
		}
		val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
			.setTitle(activity.getString(R.string.unlockCredentials_action))
			.setAllowedAuthenticators(allowedAuthenticators)
		if (method == AppLockMethod.BIOMETRICS) {
			promptInfoBuilder.setNegativeButtonText(activity.getString(android.R.string.cancel))
		}
		val promptInfo = promptInfoBuilder.build()
		authenticationPrompt.authenticate(activity as FragmentActivity, promptInfo)
	}

	override suspend fun getSupportedAppLockMethods(): List<AppLockMethod> {
		return buildList {
			add(AppLockMethod.NONE)
			val biometricManager = BiometricManager.from(activity)
			if (biometricManager.canAuthenticate(
					BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK
				) == BiometricManager.BIOMETRIC_SUCCESS
			) {
				add(AppLockMethod.BIOMETRICS)
			}
			if (biometricManager.canAuthenticate(
					BiometricManager.Authenticators.DEVICE_CREDENTIAL or BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK
				) == BiometricManager.BIOMETRIC_SUCCESS
			) {
				add(AppLockMethod.SYSTEM_PASS_OR_BIOMETRICS)
			}
		}
	}

	fun getAppDetails(appType: AppType): AppDetails {
		return when (appType) {
			AppType.MAIL -> AppDetails("tutanota", "tutamail")
			AppType.CALENDAR -> AppDetails("calendar", "tutacalendar")
			AppType.DRIVE -> AppDetails("drive", "tutadrive")
		}
	}

	fun openTutaApp(query: String, appType: AppType) {
		val appDetails = getAppDetails(appType)

		val decodedQuery = Base64.decode(query.toByteArray(), Base64.DEFAULT).toString(Charset.defaultCharset())
		// replace de.tutao.tutashared with de.tutao.tutanota and similarly for different build configurations
		val targetPackageId = BuildConfig.PACKAGE_NAME.replace("tutashared", appDetails.packageName)

		val intent = Intent().apply {
			setPackage(targetPackageId)
			action = Intent.ACTION_EDIT
			putExtra(TUTA_INTENT_ACTION, "interop")
			data = "${appDetails.scheme}://interop?$decodedQuery".toUri()
		}

		try {
			// We check the calling package on the receiving end and for that we have to use startActivityForResult
			// event though we don't care about the result.
			activity.startActivityForResult(intent, 0)
		} catch (e: Exception) {
			Log.d(TAG, e.toString())
			tryToLaunchStore(targetPackageId)
		}
	}

	override suspend fun openMailApp(query: String) {
		if (appType === AppType.MAIL) {
			Log.e(TAG, "Trying to open Tuta Mail from Tuta Mail")
		} else {
			openTutaApp(query, AppType.MAIL)
		}
	}

	override suspend fun openCalendarApp(query: String) {
		if (appType === AppType.CALENDAR) {
			Log.e(TAG, "Trying to open Tuta Calendar from Tuta Calendar")
		} else {
			openTutaApp(query, AppType.CALENDAR)
		}
	}

	private fun tryToLaunchStore(packageId: String) {
		try {
			activity.startActivity(
				Intent(Intent.ACTION_VIEW, "market://details?id=$packageId".toUri())
			)
		} catch (e: Exception) {
			Log.d(TAG, "Failed to launch store $e")
		}
	}

	override suspend fun getInstallationDate(): String {
		return SystemUtils.getInstallationDate(activity.packageManager, activity.packageName)
	}

	override suspend fun getAppleAdsAttributionToken(): String? {
		return null
	}

	override suspend fun requestInAppRating() {
		throw NotImplementedError("requestInAppRating")
	}

	override suspend fun requestWidgetRefresh() {
		if (widgetRefresher == null) {
			Log.e(TAG, "widgetRefresher is null, should not happen")
			return
		}

		try {
			widgetRefresher.refresh(activity)
		} catch (e: Exception) {
			Log.e(TAG, "Failed to refresh widgets state ${e.message}")
		}
	}

	override suspend fun storeServerRemoteOrigin(origin: String) {
		val remoteStorage = RemoteStorage(db)
		remoteStorage.storeRemoteUrl(origin)
	}

	override suspend fun print() {
		if (appType != AppType.MAIL) {
			throw NotImplementedError("print() is only implemented for mail")
		}

		withContext(Dispatchers.Main) {
			val printManager = activity.getSystemService(PrintManager::class.java)
			val jobName = "${activity.getString(R.string.app_name)} Document"

			// Get a print adapter instance
			val printAdapter = activityUtils.createPrintDocumentAdapter(jobName)

			// Create a print job with name and adapter instance
			printManager.print(
				jobName,
				printAdapter,
				PrintAttributes.Builder().build()
			)
		}
	}
}