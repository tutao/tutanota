package de.tutao.drive

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Rect
import android.net.Uri
import android.os.Bundle
import android.os.PowerManager
import android.print.PrintDocumentAdapter
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
import androidx.activity.enableEdgeToEdge
import androidx.annotation.MainThread
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.ViewCompat.setSystemGestureExclusionRects
import androidx.core.view.WindowInsetsCompat.Type.displayCutout
import androidx.core.view.WindowInsetsCompat.Type.ime
import androidx.core.view.WindowInsetsCompat.Type.systemBars
import androidx.core.view.doOnLayout
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import de.tutao.tutashared.ActivityResult
import de.tutao.tutashared.ActivityUtils
import de.tutao.tutashared.AndroidCalendarFacade
import de.tutao.tutashared.AndroidCommonSystemFacade
import de.tutao.tutashared.AndroidMobileSystemFacade
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.AndroidThemeFacade
import de.tutao.tutashared.AppType
import de.tutao.tutashared.CancelledError
import de.tutao.tutashared.NetworkUtils
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.Theme
import de.tutao.tutashared.WebViewReloader
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.file.AndroidFileFacade
import de.tutao.tutashared.file.TempFs
import de.tutao.tutashared.ipc.AndroidGlobalDispatcher
import de.tutao.tutashared.ipc.CalendarOpenAction
import de.tutao.tutashared.ipc.CommonNativeFacade
import de.tutao.tutashared.ipc.CommonNativeFacadeSendDispatcher
import de.tutao.tutashared.ipc.MobileFacade
import de.tutao.tutashared.ipc.MobileFacadeSendDispatcher
import de.tutao.tutashared.ipc.SqlCipherFacade
import de.tutao.tutashared.offline.AndroidSqlCipherFacade
import de.tutao.tutashared.remote.RemoteBridge
import de.tutao.tutashared.toDp
import de.tutao.tutashared.toPx
import de.tutao.tutashared.webauthn.AndroidWebauthnFacade
import de.tutao.tutashared.webauthn.WebauthnFlowRunner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.io.UnsupportedEncodingException
import java.net.URLEncoder
import java.security.SecureRandom
import java.util.concurrent.ConcurrentHashMap
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

class MainActivity : FragmentActivity(), ActivityUtils, WebViewReloader, WebauthnFlowRunner {
	private lateinit var webView: WebView
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
		if (savedInstanceState != null && (intent.action == OPEN_CALENDAR_ACTION || intent.action == OPEN_LOGS_ACTION)) {
			intent.putExtra(ALREADY_HANDLED_INTENT, true)
		}

		val db = AppDatabase.getDatabase(this, false)

		// On top before CalendarFacade because we need the user agent to sync external calendars
		webView = WebView(this)
		//we need to manually enable edge-to-edge to get `windowInsets` in Android ≤ 14
		enableEdgeToEdge()

		val localNotificationsFacade = LocalNotificationsFacade(this)
		val tempDir = TempDir(this)
		val tempFs = TempFs(this, SecureRandom(), tempDir)

		val fileFacade =
			AndroidFileFacade(
				this,
				this,
				localNotificationsFacade,
				SecureRandom(),
				tempFs,
				NetworkUtils.defaultClient,
				{ fileId, bytes ->
					lifecycleScope.launch {
						commonNativeFacade.downloadProgress(fileId, bytes.toLong())
					}
				},
				{ fileId, bytes ->
					lifecycleScope.launch {
						commonNativeFacade.uploadProgress(fileId, bytes.toLong())
					}
				},
				BuildConfig.FILE_PROVIDER_AUTHORITY
			)
		val calendarFacade = AndroidCalendarFacade(NetworkUtils.defaultClient, webView.settings.userAgentString)
		val cryptoFacade = AndroidNativeCryptoFacade(this, tempFs)

		val ipcJson = Json { ignoreUnknownKeys = true }

		themeFacade = AndroidThemeFacade(this, this)

		sqlCipherFacade = AndroidSqlCipherFacade(this)
		commonSystemFacade =
			AndroidCommonSystemFacade(this, sqlCipherFacade, tempDir, NetworkUtils.defaultClient)

		val webauthnFacade = AndroidWebauthnFacade(this, ipcJson, "tutadrive", BuildConfig.APPLICATION_ID)

		val globalDispatcher = AndroidGlobalDispatcher(
			ipcJson,
			commonSystemFacade,
			calendarFacade,
			fileFacade,
			AndroidMobileContactsFacadeStub,
			AndroidMobileSystemFacade(
				fileFacade,
				this,
				this,
				db,
				BuildConfig.FILE_PROVIDER_AUTHORITY,
				AppType.DRIVE,
				null,
				tempDir
			),
			CredentialsEncryptionFactory.create(this, cryptoFacade, db),
			cryptoFacade,
			AndroidNativePushFacadeStub,
			sqlCipherFacade,
			themeFacade,
			webauthnFacade,
		)
		remoteBridge = RemoteBridge(
			ipcJson,
			this.webView,
			globalDispatcher,
			commonSystemFacade,
		)

		themeFacade.applyCurrentTheme()

		installSplashScreen()

		super.onCreate(savedInstanceState)
		actionBar?.hide()

		mobileFacade = MobileFacadeSendDispatcher(ipcJson, remoteBridge)
		commonNativeFacade = CommonNativeFacadeSendDispatcher(ipcJson, remoteBridge)

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

		ViewCompat.setOnApplyWindowInsetsListener(webView) { _, windowInsets ->
			// Retrieve insets as raw pixels
			val safeDrawingInsets = windowInsets.getInsets(
				//we are handling keyboard separately below
				systemBars() or displayCutout()
			)
			val imeHeight = windowInsets.getInsets(ime()).bottom
			lifecycleScope.launch {
				mobileFacade.keyboardSizeChanged(imeHeight.toDp().toLong())
			}

			// Convert raw pixels to density independent pixels
			val top = safeDrawingInsets.top.toDp()
			val right = safeDrawingInsets.right.toDp()
			val bottom = safeDrawingInsets.bottom.toDp()
			val left = safeDrawingInsets.left.toDp()

			val safeAreaJs = """
      		document.documentElement.style.setProperty('--safe-area-inset-left', '${left}px');
        	document.documentElement.style.setProperty('--safe-area-inset-right', '${right}px');
        	document.documentElement.style.setProperty('--safe-area-inset-top', '${top}px');
        	document.documentElement.style.setProperty('--safe-area-inset-bottom', '${bottom}px');
        """.trimIndent()
			webView.evaluateJavascript(safeAreaJs, null)

			windowInsets
		}


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
				val intent = Intent(Intent.ACTION_VIEW, url.toUri())
				try {
					startActivity(intent)
				} catch (e: ActivityNotFoundException) {
					Toast.makeText(this@MainActivity, "Could not open link: $url", Toast.LENGTH_SHORT)
						.show()
				}
				return true
			}

			override fun onPageFinished(view: WebView, url: String) {
				super.onPageFinished(webView, url)
				// dispatch insets because insets aren't applied when the webpage first loads.
				webView.requestApplyInsets()
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
							"Access-Control-Allow-Methods" to "POST, GET, PUT, PATCH, DELETE",
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
						//Devtools sometimes requests non-existent files. That's why we let it run into IO error
						//instead of crashing because of failing to determine the mime type
						val data = assets.open(assetPath)
						val mimeType = getMimeTypeForUrl(url.toString())
						WebResourceResponse(
							mimeType,
							null,
							200,
							"OK",
							null,
							data
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
			if (intent != null && (OPEN_CALENDAR_ACTION == intent.action)) {
				queryParameters["noAutoLogin"] = "true"
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
	override suspend fun startWebauthn(uri: Uri): String {
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
				OPEN_LOGS_ACTION -> sendLogs(intent)
				OPEN_CALENDAR_ACTION -> openCalendar(intent)
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

	override fun hasBatteryOptimizationPermission(): Boolean {
		val pm = ContextCompat.getSystemService(this, PowerManager::class.java)!!
		return pm.isIgnoringBatteryOptimizations(this.packageName)
	}

	override suspend fun requestBatteryOptimizationPermission() {
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


	override fun hasPermission(permission: String): Boolean {
		return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
	}

	override fun createPrintDocumentAdapter(jobName: String): PrintDocumentAdapter {
		throw NotImplementedError("createDocumentPrintAdapter")
	}

	override suspend fun getPermission(permission: String) = suspendCoroutine { continuation ->
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

	override suspend fun startActivityForResult(intent: Intent): ActivityResult =
		suspendCoroutine { continuation ->
			val requestCode = getNextRequestCode()
			activityRequests[requestCode] = continuation
			// we need requestCode to identify the request which is not possible with new API
			super.startActivityForResult(intent, requestCode)
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

	private suspend fun openCalendar(intent: Intent) {
		val userId = intent.getStringExtra(OPEN_USER_MAILBOX_USERID_KEY) ?: return
		val action = CalendarOpenAction.fromValue(intent.getStringExtra(OPEN_CALENDAR_IN_APP_ACTION_KEY) ?: "")
		val date = intent.getStringExtra(OPEN_CALENDAR_DATE_KEY)
		val eventId = intent.getStringExtra(OPEN_CALENDAR_EVENT_KEY)

		commonNativeFacade.openCalendar(userId, action, date, eventId)
	}

	private suspend fun sendLogs(intent: Intent) {
		val log = intent.getStringExtra(OPEN_LOGS_DATA_KEY) ?: return
		commonNativeFacade.sendLogs(log)
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

	override fun reload(query: Map<String, String>) {
		runOnUiThread { startWebApp(query.toMutableMap()) }
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
		const val OPEN_LOGS_ACTION = "de.tutao.calendar.OPEN_CALENDAR_LOGS"
		const val OPEN_LOGS_DATA_KEY = "logs"
		const val OPEN_USER_MAILBOX_USERID_KEY = "userId"
		const val ALREADY_HANDLED_INTENT = "alreadyHandledIntent"
		const val OPEN_CALENDAR_IN_APP_ACTION_KEY = "inAppAction"
		const val OPEN_CALENDAR_DATE_KEY = "targetDate"
		const val OPEN_CALENDAR_EVENT_KEY = "eventId"

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