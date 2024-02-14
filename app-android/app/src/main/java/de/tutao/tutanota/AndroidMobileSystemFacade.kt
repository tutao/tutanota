package de.tutao.tutanota

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.util.Log
import androidx.core.content.ContextCompat.startActivity
import androidx.core.content.FileProvider
import de.tutao.tutanota.ipc.MobileSystemFacade
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException

class AndroidMobileSystemFacade(
  private val fileFacade: AndroidFileFacade,
  private val activity: Activity,
) : MobileSystemFacade {


  override suspend fun openLink(uri: String): Boolean {
	val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
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
		Uri.parse("package:${activity.packageName}")
	  )
	  startActivity(activity, intent, null)
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
		val logoUri = FileProvider.getUriForFile(activity, BuildConfig.FILE_PROVIDER_AUTHORITY, logoFile)
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

  companion object {
	private const val TAG = "SystemFacade"
  }
}