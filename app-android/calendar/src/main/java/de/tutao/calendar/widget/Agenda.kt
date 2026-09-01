package de.tutao.calendar.widget

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
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
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.state.GlanceStateDefinition
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.calendar.widget.component.EmptyStateUI
import de.tutao.calendar.widget.component.ErrorStateUI
import de.tutao.calendar.widget.component.LoadingSpinner
import de.tutao.calendar.widget.component.ScrollableDaysList
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetStateDefinition
import de.tutao.calendar.widget.data.WidgetUIState
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorHandler
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.calendar.widget.model.BirthdayStrings
import de.tutao.calendar.widget.model.WidgetUIViewModel
import de.tutao.calendar.widget.model.openCalendarAgenda
import de.tutao.calendar.widget.style.AppTheme
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.SdkFileClient
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.file.TempFs
import de.tutao.tutashared.ipc.CalendarOpenAction
import de.tutao.tutashared.remote.RemoteStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.SecureRandom
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Calendar


const val TAG = "AgendaWidget"

class Agenda : GlanceAppWidget() {
	override val stateDefinition: GlanceStateDefinition<*> = WidgetStateDefinition()

	override suspend fun onDelete(context: Context, glanceId: GlanceId) {
		super.onDelete(context, glanceId)

		// We can't access the model from here, only the repository directly
		val repository = context.widgetDataRepository

		repository.eraseLastSyncForWidget(context, glanceId)
		repository.eraseSettingsForWidget(context, glanceId)

		val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(glanceId)
		WidgetViewModelProvider.deleteModelFor(appWidgetId)
	}

	override suspend fun provideGlance(context: Context, id: GlanceId) {

		val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
		Log.d(TAG, "[$appWidgetId] provideGlance called")

		val (widgetUIViewModel, userId) = setupWidget(context, appWidgetId)

		if (widgetUIViewModel.uiState.value is WidgetUIState.NewlyCreated) {
			Log.i(TAG, "[$appWidgetId] Widget UI state is empty, starting coroutine to populate UI state.")
			withContext(Dispatchers.IO) {
				widgetUIViewModel.loadUIState(
					context.widgetDataStore,
					context.widgetCacheDataStore,
					LocalDateTime.now()
				)
			}
		}

		provideContent {
			Log.d(TAG, "[$appWidgetId] provideContent called")
			val data by widgetUIViewModel.uiState.collectAsState()

			GlanceTheme(colors = AppTheme.colors) {
				WidgetBody(data, userId)
			}
		}
	}

	suspend fun setupWidget(
		context: Context, appWidgetId: Int
	): Pair<WidgetUIViewModel, String?> {
		if (WidgetViewModelProvider.getModelFor(appWidgetId) == null) {
			val db = AppDatabase.getDatabase(context, true)
			val remoteStorage = RemoteStorage(db)
			val tempDir = TempDir(context)
			val tempFs = TempFs(context, SecureRandom(), tempDir)
			val crypto = AndroidNativeCryptoFacade(context, tempFs)
			val nativeCredentialsFacade = CredentialsEncryptionFactory.create(context, crypto, db)
			val birthdayStrings = BirthdayStrings(
				context.getString(R.string.birthdayEvent_title), context.getString(R.string.birthdayEventAge_title)
			)

			val sdk = try {
				Sdk(remoteStorage.getRemoteUrl()!!, SdkRestClient(), SdkFileClient(context.filesDir))
			} catch (e: Exception) {
				Log.e(TAG, "[$appWidgetId] Failed to initialize SDK, falling back to cached events if available. $e")
				null
			}
			val widgetUIViewModel = WidgetUIViewModel.initWithData(
				context.widgetDataRepository,
				appWidgetId,
				nativeCredentialsFacade,
				crypto,
				sdk,
				Calendar.getInstance(),
				birthdayStrings,
				context.widgetDataStore,
				context.widgetCacheDataStore
			)
			WidgetViewModelProvider.addNew(appWidgetId, widgetUIViewModel)
		}

		val widgetUIViewModel: WidgetUIViewModel = WidgetViewModelProvider.getModelFor(appWidgetId)!!

		val userId = widgetUIViewModel.getLoggedInUser(context)

		val pair = Pair(widgetUIViewModel, userId)
		Log.d(TAG, "[$appWidgetId] Widget setup data: $pair")

		return pair
	}

	private fun openCalendarEditor(context: Context, userId: String? = ""): Action {
		val openCalendarEventEditor = Intent(context, MainActivity::class.java)
		openCalendarEventEditor.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
		openCalendarEventEditor.action = MainActivity.OPEN_CALENDAR_ACTION
		openCalendarEventEditor.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
		openCalendarEventEditor.putExtra(
			MainActivity.OPEN_CALENDAR_IN_APP_ACTION_KEY,
			CalendarOpenAction.EVENT_EDITOR.value
		)
		openCalendarEventEditor.putExtra(
			MainActivity.OPEN_CALENDAR_DATE_KEY,
			LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
		)

		return actionStartActivity(openCalendarEventEditor)
	}

	@Composable
	fun WidgetBody(data: WidgetUIState, userId: String?) {
		Column(
			modifier = GlanceModifier.padding(
				top = Dimensions.Spacing.space_16.dp,
				start = Dimensions.Spacing.space_16.dp,
				end = Dimensions.Spacing.space_16.dp,
				bottom = 0.dp
			).background(GlanceTheme.colors.background).fillMaxSize().appWidgetBackground()
				.cornerRadius(20.dp),
		) {
			when (data) {
				is WidgetUIState.Error -> {
					ErrorStateUI(
						data.error,
						logsAction = actionStartActivity(
							WidgetErrorHandler.buildLogsIntent(
								LocalContext.current,
								data.error
							)
						),
						loginAction = openCalendarAgenda(LocalContext.current, userId)
					)
				}

				is WidgetUIState.Loading -> {
					LoadingSpinner()
				}

				is WidgetUIState.Available -> {
					val hasAllDayEvents = data.allDayEvents.values.any { it.isNotEmpty() }
					val hasNormalEvents = data.normalEvents.values.any { it.isNotEmpty() }

					val onNewEvent = openCalendarEditor(LocalContext.current, userId)

					if (hasAllDayEvents || hasNormalEvents) {
						ScrollableDaysList(
							data,
							onNewEvent = onNewEvent,
							userId
						)
					} else {
						EmptyStateUI(onNewEvent, userId)
					}
				}

				is WidgetUIState.NewlyCreated -> {
					// Ideally this state is never rendered because provideGlance loads it before provideContent().
				}
			}
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 250, heightDp = 250)
	@Preview(widthDp = 250, heightDp = 400)
	@Preview(widthDp = 250, heightDp = 600)
	@Composable
	fun AgendaPreviewWithOnlyAllDays() {
		val normalEventData = HashMap<LocalDate, List<UIEvent>>()
		val allDayEvents = HashMap<LocalDate, List<UIEvent>>()

		val startOfToday = LocalDate.now()
		normalEventData[startOfToday] = listOf()
		allDayEvents[startOfToday] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"All day today",
				"08:00",
				"17:00",
				isDisplayedAsAllDay = true
			)
		)

		val startOfAfterTomorrow = startOfToday.plus(2, ChronoUnit.DAYS)
		normalEventData[startOfAfterTomorrow] = listOf()
		allDayEvents[startOfAfterTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello Widget",
				"08:00",
				"17:00",
				isDisplayedAsAllDay = true
			)
		)


		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIState.Available(
					allDayEvents = allDayEvents,
					normalEvents = normalEventData,
				),
				""
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 250, heightDp = 250)
	@Preview(widthDp = 250, heightDp = 400)
	@Preview(widthDp = 250, heightDp = 600)
	@Composable
	fun AgendaPreviewWithNormalAndAllDayEvents() {
		val normalEventData = HashMap<LocalDate, List<UIEvent>>()
		val allDayEvents = HashMap<LocalDate, List<UIEvent>>()

		val startOfToday = LocalDate.now()
		normalEventData[startOfToday] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello Widget wiith very long event title",
				"08:00",
				"17:00",
				isDisplayedAsAllDay = false
			)
		)
		allDayEvents[startOfToday] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"My all day which has a very very long title",
				"00:00",
				"00:00",
				isDisplayedAsAllDay = true
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Second all day event",
				"00:00",
				"00:00",
				isDisplayedAsAllDay = true
			)
		)

		val startOfTomorrow = startOfToday.plus(1, ChronoUnit.DAYS)
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
					isDisplayedAsAllDay = false
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
				isDisplayedAsAllDay = true
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Vacations",
				"00:00",
				"00:00",
				isDisplayedAsAllDay = true
			)
		)

		val startOfAfterTomorrow = startOfToday.plus(2, ChronoUnit.DAYS)
		normalEventData[startOfAfterTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello After Tomorrow Bit title",
				"08:00",
				"17:00",
				isDisplayedAsAllDay = false
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Meeting After Tomorrow",
				"12:00",
				"13:00",
				isDisplayedAsAllDay = false
			)
		)

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIState.Available(
					allDayEvents = allDayEvents,
					normalEvents = normalEventData,
				),
				""
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 250, heightDp = 250)
	@Preview(widthDp = 250, heightDp = 400)
	@Composable
	fun AgendaPreviewWithoutAllDays() {
		val normalEventData = HashMap<LocalDate, List<UIEvent>>()
		val allDayEvents = HashMap<LocalDate, List<UIEvent>>()

		val startOfToday = LocalDate.now()
		normalEventData[startOfToday] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello Widget with very long name",
				"08:00",
				"17:00",
				isDisplayedAsAllDay = false
			)
		)

		val startOfTomorrow = startOfToday.plus(1, ChronoUnit.DAYS)
		normalEventData[startOfTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello Tomorrow",
				"08:00",
				"17:00",
				isDisplayedAsAllDay = false
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Meeting Tomorrow",
				"12:00",
				"13:00",
				isDisplayedAsAllDay = false
			)
		)

		val startOfAfterTomorrow = startOfToday.plus(2, ChronoUnit.DAYS)
		normalEventData[startOfAfterTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello After Tomorrow Big Title",
				"08:00",
				"17:00",
				isDisplayedAsAllDay = false
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Meeting After Tomorrow",
				"12:00",
				"13:00",
				isDisplayedAsAllDay = false
			)
		)

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIState.Available(
					allDayEvents = allDayEvents,
					normalEvents = normalEventData,
				),
				""
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 200, heightDp = 200)
	@Preview(widthDp = 200, heightDp = 400)
	@Preview(widthDp = 800, heightDp = 500)
	@Composable
	fun AgendaPreviewNoEventsToday() {
		val normalEventData = HashMap<LocalDate, List<UIEvent>>()
		val allDayEvents = HashMap<LocalDate, List<UIEvent>>()

		val startOfToday = LocalDate.now()
		normalEventData[startOfToday] = listOf()

		val startOfTomorrow = startOfToday.plus(1, ChronoUnit.DAYS)
		normalEventData[startOfTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello Tomorrow",
				"08:00",
				"17:00",
				isDisplayedAsAllDay = false
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Meeting Tomorrow",
				"12:00",
				"13:00",
				isDisplayedAsAllDay = false
			)
		)

		val startOfAfterTomorrow = startOfToday.plus(2, ChronoUnit.DAYS)
		normalEventData[startOfAfterTomorrow] = listOf(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Hello After Tomorrow Big Title",
				"08:00",
				"17:00",
				isDisplayedAsAllDay = false
			),
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Meeting After Tomorrow",
				"12:00",
				"13:00",
				isDisplayedAsAllDay = false
			)
		)

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIState.Available(
					allDayEvents = allDayEvents,
					normalEvents = normalEventData,
				),
				""
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 200, heightDp = 200)
	@Preview(widthDp = 200, heightDp = 400)
	@Composable
	fun AgendaPreviewNoEvents() {
		val normalEventData = HashMap<LocalDate, List<UIEvent>>()
		val allDayEvents = HashMap<LocalDate, List<UIEvent>>()

		val startOfToday = LocalDate.now()
		normalEventData[startOfToday] = listOf()

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIState.Available(
					allDayEvents = allDayEvents,
					normalEvents = normalEventData,
				),
				""
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
			ErrorStateUI(
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
			ErrorStateUI(
				WidgetError("Failed", "", WidgetErrorType.CREDENTIALS),
				logsAction = actionRunCallback<ActionCallback>(),
				loginAction = actionRunCallback<ActionCallback>()
			)
		}
	}
}

