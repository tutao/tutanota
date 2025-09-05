package de.tutao.calendar.widget

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.Visibility
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.appwidget.CircularProgressIndicator
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.itemsIndexed
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.layout.wrapContentHeight
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.visibility
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.calendar.widget.component.ErrorBody
import de.tutao.calendar.widget.component.ErrorButton
import de.tutao.calendar.widget.component.EventRow
import de.tutao.calendar.widget.component.LoadingSpinner
import de.tutao.calendar.widget.component.OtherDayCard
import de.tutao.calendar.widget.component.TodayCard
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
import de.tutao.tutashared.base64ToBase64Url
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.ipc.CalendarOpenAction
import de.tutao.tutashared.midnightInDate
import de.tutao.tutashared.parseColor
import de.tutao.tutashared.remote.RemoteStorage
import de.tutao.tutashared.toBase64
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Date

const val TAG = "AgendaWidget"

enum class HeaderVariant {
	OUTSIDE,
	INSIDE
}

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
					headerCallback = openCalendarAgenda(context, userId),
					newEventCallback = openCalendarEditor(context, userId)
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
	fun WidgetBody(data: WidgetUIData?, userId: String?, headerCallback: Action, newEventCallback: Action) {
		val firstDay = if (data?.normalEvents?.isNotEmpty() == true) data.normalEvents.keys.minOf { it } else 0L
		val isEmpty =
			!(data?.allDayEvents?.any { it.key != firstDay && it.value.isNotEmpty() }
				?: false) && data?.normalEvents?.all { it.value.isEmpty() } ?: true

		Column(
			modifier = GlanceModifier.padding(
				top = Dimensions.Spacing.MD.dp,
				start = Dimensions.Spacing.MD.dp,
				end = Dimensions.Spacing.MD.dp,
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
			ScrollableDaysList(data, headerCallback, newEventCallback, userId)
		}
	}


	@Composable
	private fun ScrollableDaysList(
		data: WidgetUIData,
		headerCallback: Action,
		newEventCallback: Action,
		userId: String?

	) {
		LazyColumn {
			itemsIndexed(data.normalEvents.keys.sorted()) { dayIndex, startOfDay ->
				val normalEvents = data.normalEvents[startOfDay] ?: listOf()
				val allDayEvents = data.allDayEvents[startOfDay] ?: listOf()
				val currentDay = Date.from(Instant.ofEpochMilli(startOfDay))
				val isFirstDay = dayIndex == 0

				Row(modifier = GlanceModifier.padding(top = Dimensions.Spacing.SM.dp)) {
					if (isFirstDay) {
						TodayCard(
							userId,
							normalEvents,
							allDayEvents,
							headerCallback,
							newEventCallback,
							currentDay,
						)
					} else {
						val currentDayAction = this@Agenda.openCalendarAgenda(LocalContext.current, userId, currentDay)
						OtherDayCard(
							userId,
							normalEvents,
							allDayEvents,
							currentDayAction,
							currentDay
						)
					}
				}


//				Column {
//					DayCard(
//						userId,
//						normalEvents,
//						allDayEvents,
//						headerCallback,
//						newEventCallback,
//						isFirstDay,
//						currentDay
//					) {
//						if (hasOnlyAllDay) {
//							Column {
//								Event(
//									modifier = GlanceModifier.defaultWeight(),
//									true,
//									currentDay,
//									null,
//									null
//								)
//							}
//						} else {
//							val eventGroups = normalEvents.chunked(5)
//							val firstEventOfTheDay = normalEvents.first()
//
//							eventGroups.forEach { events ->
//								Column {
//									events.forEachIndexed { eventIndex, event ->
//										Event(
//											modifier = GlanceModifier.defaultWeight(),
//											firstEventOfTheDay.eventId == event.eventId,
//											currentDay,
//											event,
//											userId
//										)
//										if (eventIndex < normalEvents.size - 1) {
//											Spacer(
//												modifier = GlanceModifier.height(Dimensions.Spacing.md.dp)
//											)
//										}
//									}
//								}
//							}
//						}
//					}
//					Spacer(
//						modifier = GlanceModifier.height(
//							if (data.normalEvents[startOfDay]?.isEmpty() != false ||
//								dayIndex == data.normalEvents.size - 1
//							) Dimensions.Spacing.md.dp else 6.dp
//						)
//					)
//				}
			}
		}
	}




	@Composable
	private fun NoEventsTodayRow() {
		Row(
			modifier = GlanceModifier
				.fillMaxWidth()
				.padding(Dimensions.Spacing.MD.dp),
			horizontalAlignment = Alignment.CenterHorizontally,
			verticalAlignment = Alignment.CenterVertically
		) {
			Row(verticalAlignment = Alignment.CenterVertically) {
				Image(
					provider = ImageProvider(R.drawable.dog),
					contentDescription = null,
					contentScale = ContentScale.Fit,
					modifier = GlanceModifier.defaultWeight().wrapContentHeight()
				)
				Text(
					LocalContext.current.getString(R.string.widgetNoEvents_msg),
					style = TextStyle(
						color = GlanceTheme.colors.onBackground,
						fontSize = 12.sp
					),
					modifier = GlanceModifier.padding(start = Dimensions.Spacing.SM.dp, bottom = 0.dp)
				)
			}
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
				headerCallback = actionRunCallback<ActionCallback>(),
				newEventCallback = actionRunCallback<ActionCallback>(),
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
				headerCallback = actionRunCallback<ActionCallback>(),
				newEventCallback = actionRunCallback<ActionCallback>(),
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
				headerCallback = actionRunCallback<ActionCallback>(),
				newEventCallback = actionRunCallback<ActionCallback>(),
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
				headerCallback = actionRunCallback<ActionCallback>(),
				newEventCallback = actionRunCallback<ActionCallback>(),
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
				headerCallback = actionRunCallback<ActionCallback>(),
				newEventCallback = actionRunCallback<ActionCallback>(),
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

