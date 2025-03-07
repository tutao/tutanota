package de.tutao.calendar.widget.data

import android.content.Context
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.PersistedCredentials
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.push.toSdkCredentials
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.element
import kotlinx.serialization.encodeToString
import kotlinx.serialization.encoding.CompositeDecoder
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.encoding.decodeStructure
import kotlinx.serialization.encoding.encodeStructure
import kotlinx.serialization.json.Json

@Serializable
data class SettingsDao(
	val userId: GeneratedId,
	val calendars: Map<GeneratedId, @Serializable(with = CalendarRenderDataSerializer::class) CalendarRenderData>
)

object CalendarRenderDataSerializer : KSerializer<CalendarRenderData> {
	override val descriptor = buildClassSerialDescriptor("CalendarRenderData") {
		element<String>("name")
		element<String>("color")
	}

	override fun serialize(encoder: Encoder, value: CalendarRenderData) {
		encoder.encodeStructure(descriptor) {
			encodeStringElement(descriptor, 0, value.name)
			encodeStringElement(descriptor, 1, value.color)
		}
	}

	override fun deserialize(decoder: Decoder): CalendarRenderData {
		return decoder.decodeStructure(descriptor) {
			var name = ""
			var color = ""
			while (true) {
				when (val index = decodeElementIndex(descriptor)) {
					0 -> name = decodeStringElement(descriptor, 0)
					1 -> color = decodeStringElement(descriptor, 1)
					CompositeDecoder.DECODE_DONE -> break
					else -> error("Unknown index $index")
				}
			}
			CalendarRenderData(name, color)
		}
	}
}

/**
 * @param context Application context used to access the database and the crypto facade.
 *
 * SHOULD NEVER RECEIVE ACTIVITY CONTEXT
 */
class WidgetRepository(context: Context) {
	private val WIDGET_PREFIX = "calendar_widget"
	private val json = Json { ignoreUnknownKeys = true }

	private var sdk: Sdk
	private var credentialsFacade: NativeCredentialsFacade
	private var db: AppDatabase = AppDatabase.getDatabase(context, true)

	init {
		val keyStoreFacade = createAndroidKeyStoreFacade()
		val sseStorage = SseStorage(db, keyStoreFacade)
		val crypto = AndroidNativeCryptoFacade(context)

		sdk = Sdk(sseStorage.getSseOrigin()!!, SdkRestClient())
		credentialsFacade = CredentialsEncryptionFactory.create(context, crypto, db)
	}

	suspend fun loadCredentials(): List<PersistedCredentials> {
		return credentialsFacade.loadAll()
	}

	suspend fun loadCalendars(credential: PersistedCredentials): Map<GeneratedId, CalendarRenderData> {
		val loadedCredentials = credentialsFacade.loadByUserId(credential.credentialInfo.userId)!!.toSdkCredentials()
		val loggedInSdk = sdk.login(loadedCredentials)

		val calendarFacade = loggedInSdk.calendarFacade()

		return calendarFacade.getCalendarsRenderData()
	}

	fun loadSettings(widgetId: Int): SettingsDao? {
		val databaseWidgetIdentifier = "${WIDGET_PREFIX}_settings_$widgetId"
		val encodedSettings = db.keyValueDao().getString(databaseWidgetIdentifier) ?: return null

		return json.decodeFromString<SettingsDao>(encodedSettings)
	}

	fun storeSettings(widgetId: Int, settings: SettingsDao) {
		val databaseWidgetIdentifier = "${WIDGET_PREFIX}_settings_$widgetId"
		val serializedSettings = json.encodeToString(settings)

		db.keyValueDao().putString(databaseWidgetIdentifier, serializedSettings)
	}
}