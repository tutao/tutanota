package de.tutao.tutanota.push

import android.app.job.JobParameters
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.lifecycle.lifecycleScope
import de.tutao.tutanota.alarms.AlarmNotificationsManager
import de.tutao.tutanota.alarms.SystemAlarmFacade
import de.tutao.tutanota.push.SseClient.SseListener
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.LifecycleJobService
import de.tutao.tutashared.NetworkUtils
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.offline.AndroidSqlCipherFacade
import de.tutao.tutashared.push.SseStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import java.io.File
import java.util.concurrent.TimeUnit

private enum class State {
	/** onCreate was called but onStartCommand hasn't been yet. */
	CREATED,

	/** onStartCommand has been called. We start holding wakeLock via job. */
	STARTED,

	/** onStartingConnection has been called. */
	CONNECTING,

	/** we received an initial message from the server, we release wakeLock by finished the job. */
	CONNECTED,

	/** The system forcibly stopped us. */
	STOPPED
}

/**
 * Main entry point for the background service that listens for notifications via SSE.
 *
 * The service is started in multiple ways
 *
 * 1. The main way the service is started is JobManager. It solves two things for us: periodic run and wakeLock. We try
 * to not hold wakeLock more than necessary so as soon as we receive a response from the server we schedule to release
 * it (after delay). This does not mean that the system will immediately kill the service (and in practice it does not).
 * 2. We also start the service from MainActivity, mostly to make sure that we still receive notifications.
 * 3. We start it on boot (see [BootBroadcastReceiver]
 * 4. We start it when a notification is dismissed (with [NOTIFICATION_DISMISSED_ADDR_EXTRA].
 *
 * SSE has its own event loop, we are just listening for events here and mediating between it and SSE storage.
 */
class PushNotificationService : LifecycleJobService() {
	@Volatile
	private var jobParameters: JobParameters? = null
	private lateinit var localNotificationsFacade: LocalNotificationsFacade
	private lateinit var sseClient: SseClient
	private var state = State.STOPPED
		set(value) {
			Log.d(TAG, "State $field -> $value")
			field = value
		}
	private val finishJobThread = LooperThread {}

	override fun onCreate() {
		super.onCreate()
		Log.d(TAG, "onCreate")
		state = State.CREATED

		finishJobThread.start()

		val appDatabase: AppDatabase = AppDatabase.getDatabase(this, allowMainThreadAccess = true)
		val crypto = AndroidNativeCryptoFacade(this)
		val keyStoreFacade = createAndroidKeyStoreFacade()
		val nativeCredentialsFacade = CredentialsEncryptionFactory.create(this, crypto, appDatabase)
		val sseStorage = SseStorage(appDatabase, keyStoreFacade)
		localNotificationsFacade = LocalNotificationsFacade(this, sseStorage)
		val alarmNotificationsManager = AlarmNotificationsManager(
			sseStorage,
			crypto,
			SystemAlarmFacade(this),
			localNotificationsFacade
		)
		alarmNotificationsManager.reScheduleAlarms()
		sseClient = SseClient(
			crypto,
			sseStorage,
			NetworkObserver(this, this),
			NotificationSseListener(
				localNotificationsFacade,
				sseStorage,
				nativeCredentialsFacade,
				alarmNotificationsManager,
				NetworkUtils.defaultClient,
				this.filesDir
			),
			NetworkUtils.defaultClient
		)
		lifecycleScope.launch {
			sseStorage.observeUsers().collect { userInfos ->
				Log.d(TAG, "sse storage updated " + userInfos.size)
				// Closing the connection sends RST packets over network and it triggers StrictMode
				// violations so we dispatch it to another thread.
				withContext(Dispatchers.IO) {
					val userIds = userInfos.mapTo(HashSet()) { it.userId }

					if (userIds.isEmpty()) {
						sseClient.stopConnection()
						finishJobIfNeeded()
					} else {
						sseClient.restartConnectionIfNeeded(
							SseInfo(
								sseStorage.getPushIdentifier()!!,
								userIds,
								sseStorage.getSseOrigin()!!
							)
						)
					}
				}
			}
		}

		localNotificationsFacade.createNotificationChannels()
	}

	override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
		super.onStartCommand(intent, flags, startId)
		val maybeSender = intent?.getStringExtra("sender")
		Log.d(TAG, "onStartCommand, sender: $maybeSender")

		this.state = when (this.state) {
			State.STOPPED, State.CREATED, State.STARTED -> State.STARTED
			State.CONNECTING, State.CONNECTED -> this.state
		}

		return START_STICKY
	}

	override fun onStartJob(params: JobParameters): Boolean {
		Log.d(TAG, "onStartJob")
		jobParameters = params
		return true
	}

	override fun onStopJob(params: JobParameters): Boolean {
		Log.d(TAG, "The job is finished")
		return true
	}

	private fun scheduleJobFinish() {
		Log.d(TAG, "scheduleJobFinish, will actually schedule: ${jobParameters != null}")
		if (jobParameters != null) {
			finishJobThread.handler.postDelayed({
				Log.d(TAG, "Executing scheduled jobFinished")
				finishJobIfNeeded()
			}, TimeUnit.SECONDS.toMillis(20))
		}
	}

	private fun finishJobIfNeeded() {
		if (jobParameters != null) {
			// We pass `true` for `wantsReschedule` here because we want to be rescheduled again if system doesn't
			// mind so we can run a bit more.
			jobFinished(jobParameters, true)
			jobParameters = null
		}
	}

	override fun onDestroy() {
		Log.d(TAG, "onDestroy")
		this.state = State.STOPPED
		super.onDestroy()
	}

	companion object {
		private const val TAG = "PushNotificationService"
		private const val SENDER_EXTRA = "sender"

		fun startIntent(context: Context?, sender: String?): Intent {
			val intent = Intent(context, PushNotificationService::class.java)
			intent.putExtra(SENDER_EXTRA, sender)
			return intent
		}
	}

	private inner class NotificationSseListener(
		notificationsFacade: LocalNotificationsFacade,
		sseStorage: SseStorage,
		nativeCredentialsFacade: NativeCredentialsFacade,
		alarmNotificationsManager: AlarmNotificationsManager,
		defaultClient: OkHttpClient,
		appDir: File
	) : SseListener {

		private val tutanotaNotificationsHandler =
			TutanotaNotificationsHandler(
				notificationsFacade,
				sseStorage,
				nativeCredentialsFacade,
				alarmNotificationsManager,
				defaultClient,
				lifecycleScope,
				{ AndroidSqlCipherFacade(this@PushNotificationService) },
				appDir
			)

		override fun onStartingConnection(): Boolean {
			Log.d(TAG, "onStartingConnection")
			state = State.CONNECTING
			return tutanotaNotificationsHandler.onConnect()
		}

		override fun onMessage(data: String, sseInfo: SseInfo?) {
			if ("notification" == data) {
				tutanotaNotificationsHandler.onNewNotificationAvailable(sseInfo)
			}
		}

		override fun onConnectionEstablished() {
			Log.d(TAG, "onConnectionEstablished")
			state = State.CONNECTED

			// After establishing connection we finish in some time.
			scheduleJobFinish()
		}

		override fun onConnectionBroken() {
			Log.d(TAG, "onConnectionBroken")
			state = State.CONNECTING
		}

		override fun onNotAuthorized(userId: String) {
			tutanotaNotificationsHandler.onNotAuthorized(userId)
		}

		override fun onStoppingReconnectionAttempts() {
			Log.d(TAG, "onStoppingReconnectionAttempts")
			state = when (state) {
				State.CONNECTING -> State.STARTED
				else -> state
			}
			finishJobIfNeeded()
		}
	}
}