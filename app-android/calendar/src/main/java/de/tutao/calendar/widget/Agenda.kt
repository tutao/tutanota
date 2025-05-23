package de.tutao.calendar.widget

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.graphics.ColorUtils
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
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
import androidx.glance.layout.absolutePadding
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.layout.wrapContentHeight
import androidx.glance.layout.wrapContentSize
import androidx.glance.layout.wrapContentWidth
import androidx.glance.material3.ColorProviders
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetStateDefinition
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorHandler
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.calendar.widget.model.WidgetUIViewModel
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.SdkFileClient
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.base64ToBase64Url
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.ipc.CalendarOpenAction
import de.tutao.tutashared.parseColor
import de.tutao.tutashared.remote.RemoteStorage
import de.tutao.tutashared.toBase64
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.random.Random

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
						loginAction = openCalendarAgenda(context, userId, null)
					)
				}

				WidgetBody(
					data,
					userId,
					headerCallback = openCalendarAgenda(context, userId, null),
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

	private fun openCalendarAgenda(context: Context, userId: String? = "", eventId: IdTuple? = null): Action {
		val openCalendarAgenda = Intent(context, MainActivity::class.java)
		openCalendarAgenda.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
		openCalendarAgenda.action = MainActivity.OPEN_CALENDAR_ACTION
		openCalendarAgenda.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
		openCalendarAgenda.putExtra(
			MainActivity.OPEN_CALENDAR_IN_APP_ACTION_KEY,
			CalendarOpenAction.AGENDA.value
		)
		openCalendarAgenda.putExtra(
			MainActivity.OPEN_CALENDAR_DATE_KEY,
			LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
		)

		if (eventId != null) {
			openCalendarAgenda.putExtra(
				MainActivity.OPEN_CALENDAR_EVENT_KEY,
				"${eventId.listId}/${eventId.elementId}".toByteArray().toBase64().base64ToBase64Url()
			)
		}

		return actionStartActivity(openCalendarAgenda)
	}

	@Composable
	fun ErrorBody(error: WidgetError?, logsAction: Action, loginAction: Action) {
		Column(
			modifier = GlanceModifier.padding(12.dp).background(GlanceTheme.colors.background).fillMaxSize()
				.appWidgetBackground().cornerRadius(8.dp),
			verticalAlignment = Alignment.CenterVertically,
			horizontalAlignment = Alignment.CenterHorizontally
		) {
			if (error == null) {
				return@Column LoadingSpinner()
			}

			Column(
				modifier = GlanceModifier.wrapContentSize().fillMaxWidth().wrapContentSize(),
				verticalAlignment = Alignment.CenterVertically,
				horizontalAlignment = Alignment.CenterHorizontally
			) {
				Image(
					provider = ImageProvider(R.drawable.error),
					contentDescription = null,
					contentScale = ContentScale.Fit,
					modifier = GlanceModifier.fillMaxWidth().defaultWeight()
				)
				Text(
					WidgetErrorHandler.getErrorMessage(LocalContext.current, error),
					style = TextStyle(
						fontSize = 14.sp,
						color = GlanceTheme.colors.onBackground,
						textAlign = TextAlign.Center,
						fontWeight = FontWeight.Normal
					),
					maxLines = 2,
					modifier = GlanceModifier.padding(vertical = 16.dp)
				)
				ErrorButton(error, if (error.type == WidgetErrorType.CREDENTIALS) loginAction else logsAction)
			}
		}
	}

	@Composable
	fun ErrorButton(error: WidgetError, action: Action) {
		val buttonLabel = if (error.type == WidgetErrorType.UNEXPECTED) {
			LocalContext.current.getString(R.string.sendLogs_action)
		} else {
			LocalContext.current.getString(R.string.widgetOpenApp_action)
		}

		return Box(
			contentAlignment = Alignment.Center,
			modifier = GlanceModifier
				.padding(horizontal = 16.dp)
				.height(44.dp)
				.background(GlanceTheme.colors.primary)
				.cornerRadius(8.dp)
				.clickable(
					rippleOverride = R.drawable.transparent_ripple,
					onClick = action
				)
		) {
			Text(buttonLabel, style = TextStyle(color = GlanceTheme.colors.onPrimary, fontWeight = FontWeight.Medium))
		}
	}

	@Composable
	fun WidgetBody(data: WidgetUIData?, userId: String?, headerCallback: Action, newEventCallback: Action) {
		val isEmpty = data?.allDayEvents?.isEmpty() ?: true && data?.normalEvents?.isEmpty() ?: true

		Column(
			modifier = GlanceModifier.padding(
				top = 12.dp,
				start = 12.dp,
				end = 12.dp,
				bottom = 0.dp
			)
				.background(GlanceTheme.colors.background)
				.fillMaxSize()
				.appWidgetBackground()
				.cornerRadius(20.dp),
		) {

			if (data == null) {
				return@Column LoadingSpinner()
			}

			Header(
				allDayEvents = data.allDayEvents,
				onTap = headerCallback,
				onNewEvent = newEventCallback,
				hasAllDayEvents = data.allDayEvents.isNotEmpty()
			)

			if (isEmpty) {
				return@Column Column(
					verticalAlignment = Alignment.Vertical.CenterVertically,
					horizontalAlignment = Alignment.CenterHorizontally,
					modifier = GlanceModifier
						.fillMaxSize()
				) {
					Column(
						modifier = GlanceModifier.fillMaxWidth().defaultWeight().fillMaxHeight(),
						verticalAlignment = Alignment.CenterVertically,
						horizontalAlignment = Alignment.CenterHorizontally
					) {
						Text(
							LocalContext.current.getString(R.string.widgetNoEvents_msg),
							style = TextStyle(
								fontSize = 16.sp,
								color = GlanceTheme.colors.onBackground,
								textAlign = TextAlign.Center
							),
							maxLines = 2,
							modifier = GlanceModifier.padding(bottom = 12.dp, top = 4.dp)
						)
						Image(
							provider = ImageProvider(getEmptyResource()),
							contentDescription = null,
							contentScale = ContentScale.Fit,
							modifier = GlanceModifier.fillMaxWidth().defaultWeight().wrapContentHeight()
						)
					}
				}
			}

			val events = data.normalEvents.ifEmpty { data.allDayEvents }
			LazyColumn {
				itemsIndexed(
					events,
					itemId = { index, _ -> index.toLong() }) { index, event ->
					Column {
						EventCard(event, this@Agenda.openCalendarAgenda(LocalContext.current, userId, event.eventId))
						Spacer(
							modifier = GlanceModifier.height(
								if (index != events.size - 1) {
									4.dp
								} else {
									12.dp
								}
							)
						)
					}
				}
			}
		}
	}

	private fun getEmptyResource(): Int {
		return if (Random.nextBoolean()) {
			R.drawable.dog
		} else {
			R.drawable.music
		}
	}

	@Composable
	private fun LoadingSpinner() {
		Column(
			verticalAlignment = Alignment.CenterVertically,
			horizontalAlignment = Alignment.CenterHorizontally,
			modifier = GlanceModifier.fillMaxSize().background(GlanceTheme.colors.background)
		) {
			CircularProgressIndicator(
				modifier = GlanceModifier.width(48.dp),
				color = GlanceTheme.colors.primary,
			)
		}
	}

	@Composable
	private fun Header(
		allDayEvents: List<UIEvent>,
		onTap: Action,
		onNewEvent: Action,
		hasAllDayEvents: Boolean
	) {
		val hasAllDayEvent = allDayEvents.isNotEmpty()
		val titleBottomPadding = if (hasAllDayEvent) 0.dp else (-8).dp
		val dateNow = LocalDateTime.now()

		Row(
			verticalAlignment = Alignment.Top,
			modifier = GlanceModifier.fillMaxWidth().padding(bottom = 8.dp)
		) {
			Column(
				modifier = GlanceModifier
					.clickable(rippleOverride = R.drawable.transparent_ripple, onClick = onTap).defaultWeight()
			) {
				Text(
					style = TextStyle(
						fontWeight = FontWeight.Bold,
						fontSize = if (hasAllDayEvents) 20.sp else 32.sp,
						color = GlanceTheme.colors.secondary
					),
					text = dateNow.format(DateTimeFormatter.ofPattern(if (hasAllDayEvent) "EEEE dd" else "dd")),
					maxLines = 1,
					modifier = GlanceModifier.defaultWeight().wrapContentHeight()
						.absolutePadding(0.dp, (-7).dp, 0.dp, titleBottomPadding)
				)

				val subTitle = if (hasAllDayEvent) {
					allDayEvents.first().summary.ifEmpty { "<No title>" }
				} else {
					dateNow.format(DateTimeFormatter.ofPattern("EEEE"))
				}

				Row(
					modifier = GlanceModifier.defaultWeight(),
					verticalAlignment = Alignment.CenterVertically
				) {
					if (hasAllDayEvent) {
						val calendarColor = Color(parseColor("#${allDayEvents.first().calendarColor}"))
						val isLightBg = ColorUtils.calculateLuminance(calendarColor.toArgb()) > 0.5
						val allDayIconColor =
							generateColorProviderForColor(if (isLightBg) AppTheme.LightColors.onSurface else AppTheme.DarkColors.onSurface)

						val image: Int
						val padding: Int

						if (allDayEvents.first().isBirthday) {
							image = R.drawable.ic_gift
							padding = 3
						} else {
							image = R.drawable.ic_all_day
							padding = 2
						}

						Box(
							modifier = GlanceModifier.background(calendarColor).cornerRadius(8.dp).size(16.dp)
								.padding(padding.dp)
						) {
							Image(
								provider = ImageProvider(image),
								contentDescription = "All day event",
								colorFilter = androidx.glance.ColorFilter.tint(allDayIconColor),
							)
						}
					}

					Row {
						Text(
							style = TextStyle(
								color = GlanceTheme.colors.secondary,
								fontSize = 12.sp
							),
							maxLines = 1,
							text = subTitle,
							modifier = GlanceModifier.padding(start = if (hasAllDayEvent) 4.dp else 0.dp)
								.defaultWeight()
						)

						if (allDayEvents.size > 1) {
							Text(
								"+${allDayEvents.size - 1}", style = TextStyle(
									color = GlanceTheme.colors.secondary,
									fontSize = 12.sp,
									fontWeight = FontWeight.Bold
								),
								maxLines = 1,
								modifier = GlanceModifier.padding(start = 8.dp).defaultWeight().wrapContentWidth()
							)
						}
					}
				}
			}
			Row(
				modifier = GlanceModifier.defaultWeight().padding(start = 32.dp).wrapContentWidth(),
				horizontalAlignment = Alignment.End
			) {
				Box(
					contentAlignment = Alignment.Center,
					modifier = GlanceModifier
						.size(48.dp)
						.background(GlanceTheme.colors.primary)
						.cornerRadius(8.dp)
						.clickable(rippleOverride = R.drawable.transparent_ripple, onClick = onNewEvent)
				) {
					Image(
						provider = ImageProvider(R.drawable.ic_add),
						contentDescription = "Add event button",
						colorFilter = ColorFilter.tint(GlanceTheme.colors.onPrimary),
						modifier = GlanceModifier.size(24.dp)
					)
				}
			}
		}
	}

	private fun generateColorProviderForColor(color: Color): ColorProvider {
		return ColorProviders(
			light = lightColorScheme(primary = color),
			dark = darkColorScheme(primary = color)
		).primary
	}

	@Composable
	fun EventCard(event: UIEvent, action: Action) {
		Row(
			modifier = GlanceModifier.padding(horizontal = 8.dp, vertical = 4.dp)
				.background(GlanceTheme.colors.surface)
				.cornerRadius(8.dp)
				.fillMaxWidth()
				.clickable(action),
			verticalAlignment = Alignment.CenterVertically
		) {
			CalendarIndicator(color = Color(parseColor("#${event.calendarColor}")))

			// event title and time
			Column(
				modifier = GlanceModifier.padding(start = 8.dp)
			) {
				Text(
					event.summary.ifEmpty { "<No title>" },
					style = TextStyle(
						color = GlanceTheme.colors.onSurface,
						fontWeight = FontWeight.Bold,
						fontSize = 14.sp
					),
					maxLines = 1,
				)

				Text(
					if (event.isAllDay) "All day" else event.startTime + " - " + event.endTime,
					modifier = GlanceModifier,
					style = TextStyle(
						color = GlanceTheme.colors.onSurface,
						fontSize = 10.sp
					),
				)
			}
		}

	}

	@Composable
	fun CalendarIndicator(radius: Int = 16, color: Color = Color.Blue) {
		Column(
			modifier = GlanceModifier
				.width(radius.dp)
				.height(radius.dp)
				.background(color)
				.cornerRadius((radius / 2).dp),
		) { }
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 250, heightDp = 250)
	@Preview(widthDp = 250, heightDp = 400)
	@Composable
	fun AgendaPreviewWithAllDay() {
		val eventData = ArrayList<UIEvent>()
		val allDayEvents = ArrayList<UIEvent>()
		for (i in 1..7) {
			eventData.add(
				UIEvent(
					"previewCalendar",
					IdTuple("", ""),
					"2196f3",
					"Hello Widget $i",
					"08:00",
					"17:00",
					isAllDay = false,
					startTimestamp = 0UL
				)
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 250, heightDp = 250)
	@Preview(widthDp = 250, heightDp = 400)
	@Composable
	fun AgendaPreviewWithBirthday() {
		val eventData = ArrayList<UIEvent>()
		val allDayEvents = ArrayList<UIEvent>()
		for (i in 1..7) {
			eventData.add(
				UIEvent(
					"previewCalendar",
					IdTuple("", ""),
					"2196f3",
					"Hello Widget $i",
					"08:00",
					"17:00",
					isAllDay = false,
					startTimestamp = 0UL
				)
			)
		}

		allDayEvents.add(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Summery",
				"Start Time",
				"End Time",
				isAllDay = true,
				startTimestamp = 0UL,
				isBirthday = true
			)
		)

		allDayEvents.add(
			UIEvent(
				"previewCalendar",
				IdTuple("", ""),
				"2196f3",
				"Summery",
				"Start Time",
				"End Time",
				isAllDay = true,
				startTimestamp = 0UL,
				isBirthday = true
			)
		)

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIData(
					allDayEvents = allDayEvents,
					normalEvents = eventData,
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
	fun AgendaPreview() {
		val eventData = ArrayList<UIEvent>()
		val allDayEvents = ArrayList<UIEvent>()
		for (i in 1..7) {
			eventData.add(
				UIEvent(
					"previewCalendar",
					IdTuple("", ""),
					"2196f3",
					"Hello Widget $i",
					"08:00",
					"17:00",
					isAllDay = false,
					startTimestamp = 0UL
				)
			)
		}

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIData(
					allDayEvents = allDayEvents,
					normalEvents = eventData,
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
	fun AgendaPreviewNoEvents() {
		val eventData = ArrayList<UIEvent>()
		val allDayEvents = ArrayList<UIEvent>()

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIData(
					allDayEvents = allDayEvents,
					normalEvents = eventData,
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

