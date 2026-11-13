package de.tutao.tutashared.push

import android.util.Log
import androidx.lifecycle.lifecycleScope
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.DateProviderImpl
import de.tutao.tutashared.LifecycleJobService
import de.tutao.tutashared.NetworkUtils
import de.tutao.tutashared.SuspensionHandler
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.alarms.AlarmIntentFactory
import de.tutao.tutashared.alarms.AlarmNotificationsManager
import de.tutao.tutashared.alarms.SystemAlarmFacade
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.file.TempFs
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.security.SecureRandom
import java.util.TimeZone

class CommonPushNotificationModule {

	// PushNotificationServiceStateIndicator is necessary because the push notification service state needs to be modified within this function,
	// but just passing a variable with the PushNOtificationServicesStates enum value does not work because
	// function input params are immutable in Kotlin.
	fun onCreate(context: LifecycleJobService, looperThread: LooperThread, localNotificationsFacade: LocalErrorNotificationsFacade, alarmIntentFactory: AlarmIntentFactory, jobState: IPushNotificationJobState, serviceState: PushNotificationServiceStateIndicator) {
		Log.d(TAG, "onCreate")
		serviceState.state = PushNotificationServiceStates.CREATED

		looperThread.start()

		val appDatabase: AppDatabase = AppDatabase.getDatabase(context, allowMainThreadAccess = true)
		val crypto = AndroidNativeCryptoFacade(context, TempFs(context, SecureRandom(), TempDir(context)))
		val keyStoreFacade = createAndroidKeyStoreFacade()
		val nativeCredentialsFacade = CredentialsEncryptionFactory.create(context, crypto, appDatabase)
		val sseStorage = SseStorage(appDatabase, keyStoreFacade)
		val dateProvider = DateProviderImpl()
		val alarmNotificationsManager = AlarmNotificationsManager(
			sseStorage,
			crypto,
			SystemAlarmFacade(context, alarmIntentFactory),
			localNotificationsFacade,
			dateProvider,
			TimeZone.getDefault()
		)
		alarmNotificationsManager.reScheduleAlarms()
		val suspensionHandler = SuspensionHandler(dateProvider)
		sseClient = SseClient(
			crypto,
			sseStorage,
			NetworkObserver(context, context, jobState),
			NotificationSseListener(sseState),
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

	companion object {
		const val TAG = "CommonPushNotificationModule"
	}

}