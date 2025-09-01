package de.tutao.calendar.widget

import android.content.Context
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.unit.dp
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.action.Action
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.state.GlanceStateDefinition
import de.tutao.calendar.widget.component.ErrorBody
import de.tutao.calendar.widget.component.LoadingSpinner
import de.tutao.calendar.widget.component.ScrollableDaysList
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetStateDefinition
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorHandler
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.calendar.widget.model.WidgetUIViewModel
import de.tutao.calendar.widget.model.openCalendarAgenda
import de.tutao.calendar.widget.style.AppTheme
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.SdkFileClient
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.midnightInDate
import de.tutao.tutashared.remote.RemoteStorage
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.temporal.ChronoUnit

const val TAG = "AgendaWidget"

class Agenda : GlanceAppWidget() {
	override val stateDefinition: GlanceStateDefinition<*> = WidgetStateDefinition()

	override suspend fun onDelete(context: Context, glanceId: GlanceId) {
		super.onDelete(context, glanceId)

		// We can't access the model from here, only the repository directly
		val repository = context.widgetDataRepository

		repository.eraseLastSyncForWidget(context, glanceId)
		repository.eraseSettingsForWidget(context, glanceId)
	}

	override suspend fun provideGlance(context: Context, id: GlanceId) {
		val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)

		val (widgetUIViewModel, userId) = setupWidget(context, appWidgetId)

		val settingsPreferencesKey = stringPreferencesKey("${WIDGET_SETTINGS_PREFIX}_$appWidgetId")
		val lastSyncPreferencesKey = stringPreferencesKey("${WIDGET_LAST_SYNC_PREFIX}_$appWidgetId")

		provideContent {
			val data by widgetUIViewModel.uiState.collectAsState()
			val error by widgetUIViewModel.error.collectAsState()

			val preferences = currentState<Preferences>()

			LaunchedEffect(preferences[settingsPreferencesKey], preferences[lastSyncPreferencesKey]) {
				widgetUIViewModel.loadUIState(context)
			}

			GlanceTheme(
				colors = AppTheme.colors
			) {
				if (error != null) {
					return@GlanceTheme ErrorBody(
						error,
						logsAction = actionStartActivity(WidgetErrorHandler.buildLogsIntent(context, error)),
						loginAction = openCalendarAgenda(context, userId)
					)
				}

				WidgetBody(
					data,
					userId,
					todayHeaderOnTapAction = openCalendarAgenda(context, userId),
				)
			}
		}
	}

	private suspend fun setupWidget(
		context: Context,
		appWidgetId: Int
	): Pair<WidgetUIViewModel, String?> {
		val db = AppDatabase.getDatabase(context, true)
		val remoteStorage = RemoteStorage(db)
		val crypto = AndroidNativeCryptoFacade(context)
		val nativeCredentialsFacade = CredentialsEncryptionFactory.create(context, crypto, db)

		val sdk = try {
			Sdk(remoteStorage.getRemoteUrl()!!, SdkRestClient(), SdkFileClient(context.filesDir))
		} catch (e: Exception) {
			Log.e(TAG, "Failed to initialize SDK, falling back to cached events if available. $e")
			null
		}

		val widgetUIViewModel =
			WidgetUIViewModel(context.widgetDataRepository, appWidgetId, nativeCredentialsFacade, crypto, sdk)
		val userId = widgetUIViewModel.getLoggedInUser(context)

		return Pair(widgetUIViewModel, userId)
	}

	@Composable
	fun WidgetBody(data: WidgetUIData?, userId: String?, todayHeaderOnTapAction: Action) {
		Column(
			modifier = GlanceModifier.padding(
				top = Dimensions.Spacing.LG.dp,
				start = Dimensions.Spacing.LG.dp,
				end = Dimensions.Spacing.LG.dp,
				bottom = 0.dp
			)
				.background(GlanceTheme.colors.background)
				.fillMaxSize()
				.appWidgetBackground()
				.cornerRadius(20.dp),
		) {
			if (data == null) { //
				return@Column LoadingSpinner()
			}
			ScrollableDaysList(data, todayHeaderOnTapAction, userId)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 250, heightDp = 250)
	@Preview(widthDp = 250, heightDp = 400)
	@Preview(widthDp = 250, heightDp = 600)
	@Composable
	fun AgendaPreviewWithOnlyAllDays() {
		val normalEventData = HashMap<Long, List<UIEvent>>()
		val allDayEvents = HashMap<Long, List<UIEvent>>()

		val startOfToday = midnightInDate(ZoneId.systemDefault(), LocalDateTime.now())
		normalEventData[startOfToday] = listOf()
		allDayEvents[startOfToday] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"All day today",
				"08:00",
				"17:00",
				isAllDay = true,
				startTimestamp = startOfToday
			)
		)

		val afterTomorrow = Instant.ofEpochMilli(startOfToday).plus(2, ChronoUnit.DAYS)
		val startOfAfterTomorrow =
			midnightInDate(ZoneId.systemDefault(), LocalDateTime.ofInstant(afterTomorrow, ZoneId.systemDefault()))
		normalEventData[startOfAfterTomorrow] = listOf()
		allDayEvents[startOfAfterTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello Widget",
				"08:00",
				"17:00",
				isAllDay = true,
				startTimestamp = startOfAfterTomorrow
			)
		)


		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIData(
					allDayEvents = allDayEvents,
					normalEvents = normalEventData,
				),
				"",
				todayHeaderOnTapAction = actionRunCallback<ActionCallback>(),
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 250, heightDp = 250)
	@Preview(widthDp = 250, heightDp = 400)
	@Preview(widthDp = 250, heightDp = 600)
	@Composable
	fun AgendaPreviewWithNormalAndAllDayEvents() {
		val normalEventData = HashMap<Long, List<UIEvent>>()
		val allDayEvents = HashMap<Long, List<UIEvent>>()

		val startOfToday = midnightInDate(ZoneId.systemDefault(), LocalDateTime.now())
		normalEventData[startOfToday] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello Widget",
				"08:00",
				"17:00",
				isAllDay = false,
				startTimestamp = startOfToday
			)
		)
		allDayEvents[startOfToday] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"My all day",
				"00:00",
				"00:00",
				isAllDay = true,
				startTimestamp = startOfToday
			)
		)

		val tomorrow = Instant.ofEpochMilli(startOfToday).plus(1, ChronoUnit.DAYS)
		val startOfTomorrow =
			midnightInDate(ZoneId.systemDefault(), LocalDateTime.ofInstant(tomorrow, ZoneId.systemDefault()))
		normalEventData[startOfTomorrow] = listOf()
		for (i in 1..10) {
			normalEventData[startOfTomorrow] = normalEventData[startOfTomorrow]!!.plus(
				UIEvent(
					"previewCalendar",
					IdTuple("", ""),
					"2196f3",
					"Event #${i}",
					"08:00",
					"17:00",
					isAllDay = false,
					startTimestamp = tomorrow.toEpochMilli()
				)
			)
		}

		allDayEvents[startOfTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Something else",
				"00:00",
				"00:00",
				isAllDay = true,
				startTimestamp = startOfTomorrow
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Vacations",
				"00:00",
				"00:00",
				isAllDay = true,
				startTimestamp = startOfTomorrow
			)
		)

		val afterTomorrow = Instant.ofEpochMilli(startOfToday).plus(2, ChronoUnit.DAYS)
		val startOfAfterTomorrow =
			midnightInDate(ZoneId.systemDefault(), LocalDateTime.ofInstant(afterTomorrow, ZoneId.systemDefault()))
		normalEventData[startOfAfterTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello After Tomorrow Bit title",
				"08:00",
				"17:00",
				isAllDay = false,
				startTimestamp = afterTomorrow.toEpochMilli()
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Meeting After Tomorrow",
				"12:00",
				"13:00",
				isAllDay = false,
				startTimestamp = afterTomorrow.toEpochMilli()
			)
		)

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIData(
					allDayEvents = allDayEvents,
					normalEvents = normalEventData,
				),
				"",
				todayHeaderOnTapAction = actionRunCallback<ActionCallback>(),
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 250, heightDp = 250)
	@Preview(widthDp = 250, heightDp = 400)
	@Composable
	fun AgendaPreviewWithoutAllDays() {
		val normalEventData = HashMap<Long, List<UIEvent>>()
		val allDayEvents = HashMap<Long, List<UIEvent>>()

		val startOfToday = midnightInDate(ZoneId.systemDefault(), LocalDateTime.now())
		normalEventData[startOfToday] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello Widget",
				"08:00",
				"17:00",
				isAllDay = false,
				startTimestamp = startOfToday
			)
		)

		val tomorrow = Instant.ofEpochMilli(startOfToday).plus(1, ChronoUnit.DAYS)
		val startOfTomorrow =
			midnightInDate(ZoneId.systemDefault(), LocalDateTime.ofInstant(tomorrow, ZoneId.systemDefault()))
		normalEventData[startOfTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello Tomorrow",
				"08:00",
				"17:00",
				isAllDay = false,
				startTimestamp = tomorrow.toEpochMilli()
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Meeting Tomorrow",
				"12:00",
				"13:00",
				isAllDay = false,
				startTimestamp = tomorrow.toEpochMilli()
			)
		)

		val afterTomorrow = Instant.ofEpochMilli(startOfToday).plus(2, ChronoUnit.DAYS)
		val startOfAfterTomorrow =
			midnightInDate(ZoneId.systemDefault(), LocalDateTime.ofInstant(afterTomorrow, ZoneId.systemDefault()))
		normalEventData[startOfAfterTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello After Tomorrow Big Title",
				"08:00",
				"17:00",
				isAllDay = false,
				startTimestamp = afterTomorrow.toEpochMilli()
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Meeting After Tomorrow",
				"12:00",
				"13:00",
				isAllDay = false,
				startTimestamp = afterTomorrow.toEpochMilli()
			)
		)

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIData(
					allDayEvents = allDayEvents,
					normalEvents = normalEventData,
				),
				"",
				todayHeaderOnTapAction = actionRunCallback<ActionCallback>(),
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 200, heightDp = 200)
	@Preview(widthDp = 200, heightDp = 400)
	@Preview(widthDp = 800, heightDp = 500)
	@Composable
	fun AgendaPreviewNoEventsToday() {
		val normalEventData = HashMap<Long, List<UIEvent>>()
		val allDayEvents = HashMap<Long, List<UIEvent>>()

		val startOfToday = midnightInDate(ZoneId.systemDefault(), LocalDateTime.now())
		normalEventData[startOfToday] = listOf()

		val tomorrow = Instant.ofEpochMilli(startOfToday).plus(1, ChronoUnit.DAYS)
		val startOfTomorrow =
			midnightInDate(ZoneId.systemDefault(), LocalDateTime.ofInstant(tomorrow, ZoneId.systemDefault()))
		normalEventData[startOfTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello Tomorrow",
				"08:00",
				"17:00",
				isAllDay = false,
				startTimestamp = tomorrow.toEpochMilli()
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Meeting Tomorrow",
				"12:00",
				"13:00",
				isAllDay = false,
				startTimestamp = tomorrow.toEpochMilli()
			)
		)

		val afterTomorrow = Instant.ofEpochMilli(startOfToday).plus(2, ChronoUnit.DAYS)
		val startOfAfterTomorrow =
			midnightInDate(ZoneId.systemDefault(), LocalDateTime.ofInstant(afterTomorrow, ZoneId.systemDefault()))
		normalEventData[startOfAfterTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello After Tomorrow Big Title",
				"08:00",
				"17:00",
				isAllDay = false,
				startTimestamp = afterTomorrow.toEpochMilli()
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Meeting After Tomorrow",
				"12:00",
				"13:00",
				isAllDay = false,
				startTimestamp = afterTomorrow.toEpochMilli()
			)
		)

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIData(
					allDayEvents = allDayEvents,
					normalEvents = normalEventData,
				),
				"",
				todayHeaderOnTapAction = actionRunCallback<ActionCallback>(),
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 200, heightDp = 200)
	@Preview(widthDp = 200, heightDp = 400)
	@Composable
	fun AgendaPreviewNoEvents() {
		val normalEventData = HashMap<Long, List<UIEvent>>()
		val allDayEvents = HashMap<Long, List<UIEvent>>()

		val startOfToday = midnightInDate(ZoneId.systemDefault(), LocalDateTime.now())
		normalEventData[startOfToday] = listOf()

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIData(
					allDayEvents = allDayEvents,
					normalEvents = normalEventData,
				),
				"",
				todayHeaderOnTapAction = actionRunCallback<ActionCallback>(),
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 200, heightDp = 200)
	@Preview(widthDp = 200, heightDp = 400)
	@Preview(widthDp = 800, heightDp = 500)
	@Composable
	fun AgendaPreviewError() {
		GlanceTheme(colors = AppTheme.colors) {
			ErrorBody(
				WidgetError("Failed", "", WidgetErrorType.UNEXPECTED),
				logsAction = actionRunCallback<ActionCallback>(),
				loginAction = actionRunCallback<ActionCallback>()
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 200, heightDp = 200)
	@Composable
	fun AgendaPreviewCredentialError() {
		GlanceTheme(colors = AppTheme.colors) {
			ErrorBody(
				WidgetError("Failed", "", WidgetErrorType.CREDENTIALS),
				logsAction = actionRunCallback<ActionCallback>(),
				loginAction = actionRunCallback<ActionCallback>()
			)
		}
	}
}

