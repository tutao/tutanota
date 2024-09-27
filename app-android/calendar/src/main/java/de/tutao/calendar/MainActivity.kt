package de.tutao.calendar

import android.annotation.SuppressLint
import android.app.job.JobInfo
import android.app.job.JobScheduler
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Rect
import android.net.MailTo
import android.net.Uri
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import android.view.ContextMenu
import android.view.ContextMenu.ContextMenuInfo
import android.view.View
import android.webkit.CookieManager
import android.webkit.MimeTypeMap
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebView.HitTestResult
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.addCallback
import androidx.annotation.MainThread
import androidx.annotation.RequiresPermission
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat.setSystemGestureExclusionRects
import androidx.core.view.doOnLayout
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.flowWithLifecycle
import androidx.lifecycle.lifecycleScope
import de.tutao.calendar.alarms.AlarmNotificationsManager
import de.tutao.calendar.alarms.SystemAlarmFacade
import de.tutao.calendar.push.AndroidNativePushFacade
import de.tutao.calendar.push.LocalNotificationsFacade
import de.tutao.calendar.push.PushNotificationService
import de.tutao.calendar.webauthn.AndroidWebauthnFacade
import de.tutao.tutashared.AndroidCalendarFacade
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CancelledError
import de.tutao.tutashared.NetworkUtils
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.ipc.AndroidGlobalDispatcher
import de.tutao.tutashared.ipc.CommonNativeFacade
import de.tutao.tutashared.ipc.CommonNativeFacadeSendDispatcher
import de.tutao.tutashared.ipc.MobileFacade
import de.tutao.tutashared.ipc.MobileFacadeSendDispatcher
import de.tutao.tutashared.ipc.SqlCipherFacade
import de.tutao.tutashared.offline.AndroidSqlCipherFacade
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.toPx
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.io.UnsupportedEncodingException
import java.net.URLEncoder
import java.security.SecureRandom
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

const val SYSTEM_GESTURES_EXCLUSION_WIDTH_DP = 40
const val SYSTEM_GESTURES_EXCLUSION_HEIGHT_DP = 200 // max exclusion height allowed by the system is 200 dp

interface WebauthnHandler {
	fun onResult(result: String)
	fun onNoResult()
}


class MainActivity : FragmentActivity() {
	lateinit var webView: WebView
		private set
	private lateinit var sseStorage: SseStorage
	private lateinit var themeFacade: AndroidThemeFacade
	private lateinit var remoteBridge: RemoteBridge
	private lateinit var mobileFacade: MobileFacade
	private lateinit var commonNativeFacade: CommonNativeFacade
	private lateinit var commonSystemFacade: AndroidCommonSystemFacade
	private lateinit var sqlCipherFacade: SqlCipherFacade

	private val permissionsRequests: MutableMap<Int, Continuation<Unit>> = ConcurrentHashMap()
	private val activityRequests: MutableMap<Int, Continuation<ActivityResult>> = ConcurrentHashMap()

	private var firstLoaded = false
	private var webauthnResultHandler: WebauthnHandler? = null

	@SuppressLint("SetJavaScriptEnabled", "StaticFieldLeak")
	override fun onCreate(savedInstanceState: Bundle?) {
		Log.d(TAG, "App started")

		// App is handling a redelivered intent, ignoring as we probably already handled it
		if (savedInstanceState != null && intent.action == OPEN_CALENDAR_ACTION) {
			intent.putExtra(ALREADY_HANDLED_INTENT, true)
		}

		val db = AppDatabase.getDatabase(this, false)
		sseStorage = SseStorage(
				db,
				createAndroidKeyStoreFacade()
		)
		val localNotificationsFacade = LocalNotificationsFacade(this, sseStorage)
		val fileFacade =
			AndroidFileFacade(this, localNotificationsFacade, SecureRandom(), NetworkUtils.defaultClient)
		val calendarFacade = AndroidCalendarFacade(NetworkUtils.defaultClient)
		val cryptoFacade = AndroidNativeCryptoFacade(this, fileFacade.tempDir)


		val alarmNotificationsManager = AlarmNotificationsManager(
				sseStorage,
				cryptoFacade,
				SystemAlarmFacade(this),
				localNotificationsFacade
		)
		val nativePushFacade = AndroidNativePushFacade(
				this,
				sseStorage,
				alarmNotificationsManager,
				localNotificationsFacade,
		)

		val ipcJson = Json { ignoreUnknownKeys = true }

		themeFacade = AndroidThemeFacade(this, this)

		sqlCipherFacade = AndroidSqlCipherFacade(this)
		commonSystemFacade = AndroidCommonSystemFacade(this, sqlCipherFacade, fileFacade.tempDir)

		val webauthnFacade = AndroidWebauthnFacade(this, ipcJson)

		val globalDispatcher = AndroidGlobalDispatcher(
			ipcJson,
			commonSystemFacade,
			calendarFacade,
			fileFacade,
			AndroidMobileContactsFacade(this),
			AndroidMobileSystemFacade(fileFacade, this, db),
			CredentialsEncryptionFactory.create(this, cryptoFacade, db),
			cryptoFacade,
			nativePushFacade,
			sqlCipherFacade,
			themeFacade,
			webauthnFacade,
		)
		remoteBridge = RemoteBridge(
				ipcJson,
				this,
				globalDispatcher,
				commonSystemFacade,
		)

		themeFacade.applyCurrentTheme()

		installSplashScreen()

		super.onCreate(savedInstanceState)
		actionBar?.hide()

		mobileFacade = MobileFacadeSendDispatcher(ipcJson, remoteBridge)
		commonNativeFacade = CommonNativeFacadeSendDispatcher(ipcJson, remoteBridge)

		setupPushNotifications()

		webView = WebView(this)
		webView.setBackgroundColor(Color.TRANSPARENT)

		if (BuildConfig.DEBUG) {
			WebView.setWebContentsDebuggingEnabled(true)
		}

		webView.settings.apply {
			javaScriptEnabled = true
			domStorageEnabled = true
			javaScriptCanOpenWindowsAutomatically = false	
			allowFileAccess = false
			allowContentAccess = false
			cacheMode = WebSettings.LOAD_NO_CACHE
			// needed for external content in mail
			mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
				// Safe browsing is not needed because we are loading our own resources only.
				// Also we don't want to report every URL that we load to Google.
				// Also it causes random lag in loading resources, see https://github.com/tutao/tutanota/issues/5830
				safeBrowsingEnabled = false
			}

		webView.clearCache(true)

		// Reject cookies by external content
		CookieManager.getInstance().setAcceptCookie(false)
		CookieManager.getInstance().removeAllCookies(null)

		webView.webViewClient = object : WebViewClient() {
			@Deprecated("shouldOverrideUrlLoading is deprecated")
			override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
				Log.d(TAG, "see if should override $url")
				if (url.startsWith(BASE_WEB_VIEW_URL)) {
					return false
				}
				val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
				try {
					startActivity(intent)
				} catch (e: ActivityNotFoundException) {
					Toast.makeText(this@MainActivity, "Could not open link: $url", Toast.LENGTH_SHORT)
							.show()
				}
				return true
			}

			override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
				val url = request.url
				return if (request.method == "OPTIONS") {
					Log.v(TAG, "replacing OPTIONS response to $url")
					WebResourceResponse(
							"text/html",
							"UTF-8",
							200,
							"OK",
							mutableMapOf(
									"Access-Control-Allow-Origin" to "*",
									"Access-Control-Allow-Methods" to "POST, GET, PUT, DELETE",
									"Access-Control-Allow-Headers" to "*"
							),
							null
					)
				} else if (request.method == "GET" && url.toString().startsWith(BASE_WEB_VIEW_URL)) {
					Log.v(TAG, "replacing asset GET response to ${url.path}")
					try {
						val assetPath = File(BuildConfig.RES_ADDRESS + url.path!!).canonicalPath.run {
							slice(1..lastIndex)
						}
						if (!assetPath.startsWith(BuildConfig.RES_ADDRESS)) throw IOException("can't find this")
						val mimeType = getMimeTypeForUrl(url.toString())
						WebResourceResponse(
								mimeType,
								null,
								200,
								"OK",
								null,
								assets.open(assetPath)
						)
					} catch (e: IOException) {
						Log.w(TAG, "Resource not found ${url.path}")
						WebResourceResponse(
								null,
								null,
								404,
								"Not Found",
								null,
								null
						)
					}
				} else {
					Log.v(TAG, "forwarding ${request.method} request to $url")
					null
				}
			}

			override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
				Log.e(TAG, "Error loading WebView ${error?.errorCode} | ${error?.description} @ ${request?.url?.path}")
			}
		}

		// Handle long click on links in the WebView
		registerForContextMenu(webView)

		setContentView(webView)

		// Set callback for back press
		onBackPressedDispatcher.addCallback(this) {
			onBackPressedCallback()
		}

		lifecycleScope.launch {
			val queryParameters = mutableMapOf<String, String>()
			// If opened from notifications, tell Web app to not login automatically, we will pass
			// mailbox later when loaded (in handleIntent())
			if (intent != null && OPEN_CALENDAR_ACTION == intent.action) {
				queryParameters["noAutoLogin"] = "true"
			}


			// Start observing SSE users in the background.
			// If there are no users we need to tell web part to invalidate alarms.
			launch {
				sseStorage.observeUsers()
					.flowWithLifecycle(lifecycle, Lifecycle.State.STARTED)
					.collect { userInfos ->
						if (userInfos.isEmpty()) {
							Log.d(TAG, "invalidateAlarms")
							commonNativeFacade.invalidateAlarms()
						}
					}
				}

			startWebApp(queryParameters)
		}

		// Exclude bottom left screen area from system (back) gestures to open the drawer menu with a swipe from the
		// left on android devices that have system (back) gesture navigation enabled.
		webView.doOnLayout {
			val exclusionWidth = SYSTEM_GESTURES_EXCLUSION_WIDTH_DP.toPx()
			val exclusionHeight = SYSTEM_GESTURES_EXCLUSION_HEIGHT_DP.toPx()
			val exclusions = listOf(Rect(0, (it.height - exclusionHeight), exclusionWidth, it.height))
			setSystemGestureExclusionRects(it, exclusions)
		}

		if (!firstLoaded) {
			handleIntent(intent)
		}
		firstLoaded = true
	}


	/** @return "result" extra value */
	suspend fun startWebauthn(uri: Uri): String {
		val customIntent = CustomTabsIntent.Builder()
			.build()
		val intent = customIntent.intent.apply {
			data = uri
			// close custom tabs activity as soon as user navigates away from it, otherwise it will linger as a separate
			// task
			addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
		}

		return suspendCoroutine { cont ->
			// if there was already a handler, finish it
			webauthnResultHandler?.onNoResult()

			webauthnResultHandler = object : WebauthnHandler {
				override fun onResult(result: String) {
					cont.resume(result)
				}

				override fun onNoResult() {
					cont.resumeWithException(CancelledError())
				}
			}
			startActivity(intent)
		}
	}

	private fun getMimeTypeForUrl(url: String): String {
		// Opening devTools requests some URL that looks like https://assets.tutanota.com/index-app.html/login?theme=blah
		// and MimeTypeMap fails to handle it because of that /login path.
		// There should be no actual resource under index-app.html/, it's only "virtual" paths (handled by JS) for the
		// app so we assume that it is html.
		if (url.startsWith("https://assets.tutanota.com/index-app.html/")) {
			return "text/html"
		}
		val ext = MimeTypeMap.getFileExtensionFromUrl(url)
		// on old android mimetypemap doesn't contain js and returns null
		// we add a few more for safety.
		val mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext)
		return mimeType ?: when (ext) {
			"js", "mjs" -> "text/javascript"
			"json" -> "application/json"
			"html" -> "text/html"
			"ttf" -> "font/ttf"
			"wasm" -> "application/wasm"
			"icc" -> "application/vnd.iccprofile"
			"cmap" -> "text/plain" // used for invoices; no good mime type for cmap, so just use plain text
			else -> error("Unknown extension $ext for url $url")
		}
	}

	override fun onStart() {
		super.onStart()
		Log.d(TAG, "onStart")
		lifecycleScope.launch {
			mobileFacade.visibilityChange(true)
		}
	}

	override fun onResume() {
		super.onResume()
		this.webauthnResultHandler?.onNoResult()
		this.webauthnResultHandler = null
	}

	override fun onStop() {
		Log.d(TAG, "onStop")
		lifecycleScope.launch { mobileFacade.visibilityChange(false) }
		super.onStop()
	}

	override fun onDestroy() {
		Log.d(TAG, "onDestroy")
		runBlocking {
			sqlCipherFacade.closeDb()
		}

		super.onDestroy()
	}

	override fun onConfigurationChanged(newConfig: Configuration) {
		super.onConfigurationChanged(newConfig)
		// Since the activity is not being re-created we need to re-apply our theming manually.
		themeFacade.applyCurrentTheme()
		lifecycleScope.launch {
			commonNativeFacade.updateTheme()
		}
	}

	@MainThread
	private fun startWebApp(parameters: MutableMap<String, String>) {
		webView.loadUrl(getInitialUrl(parameters, themeFacade.currentThemeWithFallback))
		remoteBridge.setup()
	}

	override fun onNewIntent(intent: Intent) {
		super.onNewIntent(intent)
		handleIntent(intent)
	}

	private fun handleIntent(intent: Intent) = lifecycleScope.launch {
		// When we redirect to the app from outside, for example after doing payment verification,
		// we don't want to do any kind of intent handling
		val data = intent.data

		if (data != null && data.scheme == "tutacalendar" && data.host == "webauthn") {
			handleWebauthn(intent, data)
		}

		if (data != null && data.toString().startsWith("tutacalendar://")) {
			return@launch
		}

		if (intent.action != null && !intent.getBooleanExtra(ALREADY_HANDLED_INTENT, false)) {
			when (intent.action) {
				Intent.ACTION_SEND, Intent.ACTION_SEND_MULTIPLE, Intent.ACTION_SENDTO -> share(
					intent
				)

				OPEN_CALENDAR_ACTION -> openCalendar(intent)
				Intent.ACTION_VIEW -> {
					when (intent.scheme) {
						"mailto" -> share(intent)
						"file" -> view(intent)
						"content" -> view(intent)
					}
				}
			}
		}
	}

	private fun handleWebauthn(intent: Intent, data: Uri) {
		if (webauthnResultHandler != null) {
			val result = intent.getStringExtra("result")
			if (result != null) {
				webauthnResultHandler?.onResult(result)
			} else {
				Log.w(TAG, "Webauthn result is not defined! $data")
				webauthnResultHandler?.onNoResult()
			}
			this.webauthnResultHandler = null
		} else {
			Log.w(TAG, "Webauthn handler is not set!")
		}
	}

	fun hasBatteryOptimizationPermission(): Boolean {
		val pm = ContextCompat.getSystemService(this, PowerManager::class.java)!!
		return pm.isIgnoringBatteryOptimizations(this.packageName)
	}

	suspend fun requestBatteryOptimizationPermission() {
		withContext(Dispatchers.Main) {
			@SuppressLint("BatteryLife")
			val intent = Intent(
				Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
				Uri.parse("package:$packageName")
			)
			startActivityForResult(intent)
		}
	}

	private fun getInitialUrl(parameters: MutableMap<String, String>, theme: Theme?): String {
		if (theme != null) {
			parameters["theme"] = JSONObject.wrap(theme)!!.toString()
		}
		parameters["platformId"] = "android"
		val queryBuilder = StringBuilder()
		for ((key, value) in parameters) {
			try {
				val escapedValue = URLEncoder.encode(value, "UTF-8")
				if (queryBuilder.isEmpty()) {
					queryBuilder.append("?")
				} else {
					queryBuilder.append("&")
				}
				queryBuilder.append(key)
				queryBuilder.append('=')
				queryBuilder.append(escapedValue)
			} catch (e: UnsupportedEncodingException) {
				throw RuntimeException(e)
			}
		}
		// additional path information like app.html/login are not handled properly by the WebView
		// when loaded from local file system. so we are just adding parameters to the Url e.g. ../app.html?noAutoLogin=true.
		return BASE_WEB_VIEW_URL + "index-app.html" + queryBuilder.toString()
	}

	private val baseAssetPath: String
		get() = BuildConfig.RES_ADDRESS


	fun hasPermission(permission: String): Boolean {
		return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
	}

	suspend fun getPermission(permission: String) = suspendCoroutine { continuation ->
		if (hasPermission(permission)) {
			continuation.resume(Unit)
		} else {
			val requestCode = getNextRequestCode()
			permissionsRequests[requestCode] = continuation
			requestPermissions(arrayOf(permission), requestCode)
		}
	}

	override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
		super.onRequestPermissionsResult(requestCode, permissions, grantResults)
		val continuation = permissionsRequests.remove(requestCode)
		if (continuation == null) {
			Log.w(TAG, "No deferred for the permission request$requestCode")
			return
		}
		if (grantResults.size == 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
			continuation.resume(Unit)
		} else {
			continuation.resumeWithException(SecurityException("Permission missing: " + permissions.contentToString()))
		}
	}

	suspend fun startActivityForResult(@RequiresPermission intent: Intent?): ActivityResult =
		suspendCoroutine { continuation ->
			val requestCode = getNextRequestCode()
			activityRequests[requestCode] = continuation
			// we need requestCode to identify the request which is not possible with new API
			if (intent != null) {
				super.startActivityForResult(intent, requestCode)
			}
		}

	override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
		super.onActivityResult(requestCode, resultCode, data)
		val continuation = activityRequests.remove(requestCode)
		if (continuation != null) {
			continuation.resume(ActivityResult(resultCode, data))
		} else {
			Log.w(TAG, "No deferred for activity request$requestCode")
		}
	}

	fun setupPushNotifications() {
		try {
			val serviceIntent = PushNotificationService.startIntent(
				this,
				"MainActivity#setupPushNotifications",
				attemptForeground = true,
			)
			startService(serviceIntent)
		} catch (e: Exception) {
			Log.w(TAG, "Could not start push notification service", e)
		}
		val jobScheduler = getSystemService(JOB_SCHEDULER_SERVICE) as JobScheduler
		jobScheduler.schedule(
			JobInfo.Builder(1, ComponentName(this, PushNotificationService::class.java))
				.setPeriodic(TimeUnit.MINUTES.toMillis(15))
				.setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
				.setPersisted(true).build()
		)
	}

	/**
	 * The viewing file activity. Either invoked from MainActivity (if the app was not active when the
	 * view action occurred) or from onCreate.
	 */
	private suspend fun view(intent: Intent) {
		val files: List<String> = getFilesFromIntent(intent)

		try {
			commonNativeFacade.handleFileImport(files)
		} catch (e: Exception) {
			Log.e(TAG, "Falied to read files $files -> $e")
		}
	}

	/**
	 * The sharing activity. Either invoked from MainActivity (if the app was not active when the
	 * share occurred) or from onCreate.
	 */
	private suspend fun share(intent: Intent) {
		val action = intent.action
		val clipData = intent.clipData
		val files: List<String>
		var text: String? = null
		val addresses: List<String> = intent.getStringArrayExtra(Intent.EXTRA_EMAIL)?.toList() ?: listOf()
		val subject = intent.getStringExtra(Intent.EXTRA_SUBJECT)
		if (Intent.ACTION_SEND == action) {
			// Try to read text from the clipboard before fall back on intent.getStringExtra
			if (clipData != null && clipData.itemCount > 0) {
				if (clipData.description.getMimeType(0).startsWith("text")) {
					text = clipData.getItemAt(0).htmlText
				}
				if (text == null && clipData.getItemAt(0).text != null) {
					text = clipData.getItemAt(0).text.toString()
				}
			}
			if (text == null) {
				text = intent.getStringExtra(Intent.EXTRA_TEXT)
			}
			files = getFilesFromIntent(intent)
		} else if (Intent.ACTION_SEND_MULTIPLE == action) {
			files = getFilesFromIntent(intent)
		} else {
			files = listOf()
		}
		val mailToUrlString: String = if (intent.data != null && MailTo.isMailTo(intent.dataString)) {
			intent.dataString ?: ""
		} else {
			""
		}
		try {
			commonNativeFacade.createMailEditor(
				files,
				text ?: "",
				addresses,
				subject ?: "",
				mailToUrlString
			)
		} catch (e: RemoteExecutionException) {
			val name = e.message?.let { message ->
				val element = Json.parseToJsonElement(message)
				element.jsonObject["name"]?.jsonPrimitive?.content
			}
			Log.d(TAG, "failed to create a mail editor because of a ${name ?: "unknown error"}")
		}
	}

	private fun getFilesFromIntent(intent: Intent): List<String> {
		val clipData = intent.clipData
		val filesArray: MutableList<String> = mutableListOf()
		if (clipData != null) {
			for (i in 0 until clipData.itemCount) {
				val item = clipData.getItemAt(i)
				val uri = item.uri
				if (uri != null) {
					filesArray.add(uri.toString())
				}
			}
		} else {
			// Intent documentation claims that data is copied to ClipData if it's not there
			// but we want to be sure
			if (Intent.ACTION_SEND_MULTIPLE == intent.action) {
				// unchecked_cast: we could just check for null instead?
				// deprecation: the alternative requires API 33
				@Suppress("UNCHECKED_CAST", "DEPRECATION")
				val uris = intent.extras!!.getParcelableArrayList<Uri>(Intent.EXTRA_STREAM)
				if (uris != null) {
					for (uri in uris) {
						filesArray.add(uri.toString())
					}
				}
			} else if (intent.hasExtra(Intent.EXTRA_STREAM)) {
				// depreciation: the alternative requires API 33
				@Suppress("DEPRECATION")
				val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
				filesArray.add(uri.toString())
			} else if (intent.data != null) {
				val uri = intent.data
				filesArray.add(uri.toString())
			} else {
				Log.w(TAG, "Did not find files in the intent")
			}
		}
		return filesArray
	}

	private suspend fun openCalendar(intent: Intent) {
		val userId = intent.getStringExtra(OPEN_USER_MAILBOX_USERID_KEY) ?: return
		commonNativeFacade.openCalendar(userId)
	}

	private fun onBackPressedCallback() {
		if (commonSystemFacade.initialized) {
			lifecycleScope.launch {
				val result = mobileFacade.handleBackPress()
				try {
					if (!result) {
						goBack()
					}
				} catch (e: JSONException) {
					Log.e(TAG, "error parsing response", e)
				}
			}
		} else {
			goBack()
		}
	}

	private fun goBack() {
		moveTaskToBack(false)
	}

	fun reload(parameters: Map<String, String>) {
		runOnUiThread { startWebApp(parameters.toMutableMap()) }
	}

	override fun onCreateContextMenu(menu: ContextMenu, v: View, menuInfo: ContextMenuInfo?) {
		super.onCreateContextMenu(menu, v, menuInfo)
		val hitTestResult = webView.hitTestResult
		if (hitTestResult.type == HitTestResult.SRC_ANCHOR_TYPE) {
			val link = hitTestResult.extra ?: return
			if (link.startsWith(baseAssetPath)) {
				return
			}
			menu.setHeaderTitle(link)
			menu.add(0, 0, 0, "Copy link").setOnMenuItemClickListener {
				(getSystemService(CLIPBOARD_SERVICE) as ClipboardManager)
					.setPrimaryClip(ClipData.newPlainText(link, link))
				true
			}
			menu.add(0, 2, 0, "Share").setOnMenuItemClickListener {
				val intent = Intent(Intent.ACTION_SEND)
				intent.putExtra(Intent.EXTRA_TEXT, link)
				intent.setTypeAndNormalize("text/plain")
				this.startActivity(Intent.createChooser(intent, "Share link"))
				true
			}
		}
	}

	companion object {
		// don't remove the trailing slash because otherwise longer domains might match our asset check
		const val BASE_WEB_VIEW_URL = "https://assets.tutanota.com/"
		const val OPEN_CALENDAR_ACTION = "de.tutao.calendar.OPEN_CALENDAR_ACTION"
		const val OPEN_USER_MAILBOX_USERID_KEY = "userId"
		const val ALREADY_HANDLED_INTENT = "alreadyHandledIntent"
		private const val TAG = "MainActivity"
		private var requestId = 0

		@Synchronized
		private fun getNextRequestCode(): Int {
			requestId++
			if (requestId < 0) {
				requestId = 0
			}
			return requestId
		}
	}
}
