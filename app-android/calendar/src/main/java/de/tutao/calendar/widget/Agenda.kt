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
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.layout.wrapContentHeight
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
import androidx.glance.visibility
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetStateDefinition
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorHandler
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.calendar.widget.model.WidgetUIViewModel
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

	private fun openCalendarAgenda(
		context: Context,
		userId: String? = "",
		date: Date = Date(),
		eventId: IdTuple? = null
	): Action {
		val openCalendarAgenda = Intent(context, MainActivity::class.java)
		openCalendarAgenda.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
		openCalendarAgenda.action = MainActivity.OPEN_CALENDAR_ACTION
		openCalendarAgenda.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
		openCalendarAgenda.putExtra(
			MainActivity.OPEN_CALENDAR_IN_APP_ACTION_KEY,
			CalendarOpenAction.AGENDA.value
		)

		val localDate = date.toInstant()
			.atZone(ZoneId.systemDefault()) // convert to local timezone
			.toLocalDate()
		openCalendarAgenda.putExtra(
			MainActivity.OPEN_CALENDAR_DATE_KEY,
			localDate.format(DateTimeFormatter.ISO_DATE)
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
			modifier = GlanceModifier.padding(Dimensions.Spacing.MD.dp)
				.background(GlanceTheme.colors.background)
				.fillMaxSize()
				.appWidgetBackground()
				.cornerRadius(Dimensions.Spacing.SM.dp),
			verticalAlignment = Alignment.CenterVertically,
			horizontalAlignment = Alignment.CenterHorizontally
		) {
			if (error == null) {
				return@Column LoadingSpinner()
			}

			Column(
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
				.cornerRadius(Dimensions.Spacing.SM.dp)
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

			if (data == null) {
				return@Column LoadingSpinner()
			}
			if (isEmpty) {
				return@Column EmptyBody(data, firstDay, headerCallback, newEventCallback)
			}

			ScrollableDaysList(data, headerCallback, newEventCallback, userId)
		}
	}

	@Composable
	private fun EmptyBody(
		data: WidgetUIData,
		firstDay: Long,
		headerCallback: Action,
		newEventCallback: Action
	) {
		Header(
			allDayEvents = data.allDayEvents[firstDay] ?: listOf(),
			onTap = headerCallback,
			onNewEvent = newEventCallback,
			variant = HeaderVariant.OUTSIDE
		)

		Column(
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
					modifier = GlanceModifier.padding(bottom = Dimensions.Spacing.MD.dp, top = 4.dp)
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
						OtherDayCard(
							userId,
							normalEvents,
							allDayEvents,
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
	private fun EventList(userId: String?, normalEvents: List<UIEvent>, currentDay: Date) {

		// we need to chunk events because columns inside scrollable elements doesn't support more than five children
		val eventGroups = normalEvents.chunked(5)
		val firstEventOfTheDay = normalEvents.first()

		eventGroups.forEachIndexed { index, events ->
			Column(
				modifier = GlanceModifier.padding(
					start = Dimensions.Spacing.SM.dp,
					top = if (index == 0) Dimensions.Spacing.SM.dp else 0.dp,
					end = Dimensions.Spacing.SM.dp,
					bottom = if (index == eventGroups.size - 1) Dimensions.Spacing.SM.dp else 0.dp,
				)
			) {
				events.forEachIndexed { eventIndex, event ->
					EventRow(
						modifier = GlanceModifier.defaultWeight(),
						firstEventOfTheDay.eventId == event.eventId,
						currentDay,
						event,
						userId
					)
					// add space between elements (no spacing after the last element)
					if (eventIndex < normalEvents.size - 1) {
						Spacer(
							modifier = GlanceModifier.height(Dimensions.Spacing.SM.dp)
						)
					}
				}
			}
		}
	}

	@Composable
	private fun TodayCard(
		userId: String?,
		normalEvents: List<UIEvent>,
		allDayEvents: List<UIEvent>,
		headerCallback: Action,
		newEventCallback: Action,
		currentDay: Date,
	) {

		// TODO define children for today card
		// show header (button, current day and all day events.
		// content contains event list
//		content()
		SimpleCard(userId, currentDay) {
			Header(allDayEvents, headerCallback, newEventCallback, HeaderVariant.INSIDE)
			if (normalEvents.isEmpty()) {
				NoEventsTodayRow()
			} else {
				EventList(userId, normalEvents, currentDay)
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


	@Composable
	private fun OtherDayCard(
		userId: String?,
		normalEvents: List<UIEvent>,
		allDayEvents: List<UIEvent>,
		currentDay: Date
	) {
		SimpleCard(userId, currentDay) {
			if (allDayEvents.isNotEmpty()) {
				AllDayHeader(allDayEvents)
			}
			if (normalEvents.isEmpty()) {
				Column {
					NoEventsRow(
						modifier = GlanceModifier.defaultWeight(),
						currentDay,
						userId
					)
				}
			} else {
				EventList(userId, normalEvents, currentDay)
			}
		}
	}

	@Composable
	private fun SimpleCard(
		userId: String?,
		currentDay: Date,
		content: @Composable () -> Unit
	) {
		Column(
			modifier = GlanceModifier
				.background(GlanceTheme.colors.surface)
				.cornerRadius(Dimensions.Spacing.SM.dp)
				.fillMaxWidth()
				.clickable(this@Agenda.openCalendarAgenda(LocalContext.current, userId, currentDay)),
		) {
			content()
		}
	}


	@Composable
	private fun DayCard(
		userId: String?,
		normalEvents: List<UIEvent>,
		allDayEvents: List<UIEvent>,
		headerCallback: Action,
		newEventCallback: Action,
		firstDay: Boolean,
		currentDay: Date,
		content: @Composable () -> Unit
	) {
		val showAllDayInfo = !firstDay && allDayEvents.isNotEmpty()
		val defaultVerticalPadding = 8
		val defaultHorizontalPadding = 12

		val hasOnlyAllDays = normalEvents.isEmpty() && allDayEvents.isNotEmpty()
		val paddingVertical = if (hasOnlyAllDays || showAllDayInfo) 0 else defaultVerticalPadding
		val paddingHorizontal = if (showAllDayInfo) 0 else defaultHorizontalPadding


		Column(
			modifier = GlanceModifier.padding(
				(paddingHorizontal).dp,
				if (firstDay) 0.dp else (paddingVertical).dp,
				if (firstDay) 0.dp else (paddingHorizontal).dp,
				(paddingVertical).dp
			)
				.background(GlanceTheme.colors.surface)
				.cornerRadius(Dimensions.Spacing.SM.dp)
				.fillMaxWidth()
				.clickable(this@Agenda.openCalendarAgenda(LocalContext.current, userId, currentDay)),
		) {
			if (showAllDayInfo) {
				AllDayHeader(allDayEvents)
			}

			val innerPadding =
				if (showAllDayInfo) Pair(defaultHorizontalPadding, defaultVerticalPadding) else Pair(0, 0)
			Column(
				modifier = GlanceModifier.padding((innerPadding.first).dp, (innerPadding.second).dp)
					.fillMaxHeight()
			) {
				if (firstDay) {
					Header(
						allDayEvents = allDayEvents,
						onTap = headerCallback,
						onNewEvent = newEventCallback,
						variant = HeaderVariant.INSIDE
					)
				}

				content()
			}
		}
	}

	@Composable
	private fun AllDayHeader(allDayEvents: List<UIEvent>) {
		Row(
			modifier = GlanceModifier
				.padding(Dimensions.Spacing.MD.dp, Dimensions.Spacing.SM.dp)
				.fillMaxWidth()
				.background(GlanceTheme.colors.surfaceVariant),
			verticalAlignment = Alignment.CenterVertically
		) {
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
				modifier = GlanceModifier
					.background(calendarColor)
					.cornerRadius((Dimensions.Size.SM / 2).dp)
					.size(Dimensions.Size.SM.dp)
					.padding(padding.dp)
			) {
				Image(
					provider = ImageProvider(image),
					contentDescription = "All day event",
					colorFilter = ColorFilter.tint(allDayIconColor),
				)
			}

			Row {
				Text(
					style = TextStyle(
						color = GlanceTheme.colors.secondary,
						fontSize = 12.sp
					),
					maxLines = 1,
					text = allDayEvents.first().summary.ifEmpty { LocalContext.current.getString(R.string.widgetNoEvents_msg) },
					modifier = GlanceModifier.padding(start = 4.dp)
						.defaultWeight()
				)

				if (allDayEvents.size > 1) {
					Text(
						"+${allDayEvents.size - 1}", style = TextStyle(
							color = GlanceTheme.colors.onSurfaceVariant,
							fontSize = 12.sp,
							fontWeight = FontWeight.Bold
						),
						maxLines = 1,
						modifier = GlanceModifier.padding(start = Dimensions.Spacing.SM.dp).defaultWeight()
							.wrapContentWidth()
					)
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
	) {
		val hasAllDayEvents = allDayEvents.isNotEmpty()
		val titleBottomPadding = if (hasAllDayEvents) 0.dp else (-Dimensions.Spacing.SM).dp
		val dateNow = LocalDateTime.now()

		Row(
			verticalAlignment = Alignment.Top,
			modifier = GlanceModifier.fillMaxWidth().padding(bottom = Dimensions.Spacing.SM.dp)
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
					text = dateNow.format(DateTimeFormatter.ofPattern(if (hasAllDayEvents) "EEEE dd" else "dd")),
					maxLines = 1,
					modifier = GlanceModifier.defaultWeight().wrapContentHeight()
						.padding(bottom = titleBottomPadding)
				)

				val subTitle = if (hasAllDayEvents) {
					allDayEvents.first().summary.ifEmpty { LocalContext.current.getString(R.string.widgetNoEvents_msg) }
				} else {
					dateNow.format(DateTimeFormatter.ofPattern("EEEE"))
				}

				Row(
					modifier = GlanceModifier.defaultWeight(),
					verticalAlignment = Alignment.CenterVertically
				) {
					if (hasAllDayEvents) {
						AllDayIcon(allDayEvents)
					}

					Row {
						Text(
							style = TextStyle(
								color = GlanceTheme.colors.secondary,
								fontSize = 12.sp
							),
							maxLines = 1,
							text = subTitle,
							modifier = GlanceModifier.padding(start = if (hasAllDayEvents) 4.dp else 0.dp)
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
								modifier = GlanceModifier.padding(start = Dimensions.Spacing.SM.dp).defaultWeight()
									.wrapContentWidth()
							)
						}
					}
				}
			}
			Row(
				modifier = GlanceModifier.defaultWeight().wrapContentWidth(),
				horizontalAlignment = Alignment.End
			) {
				Box(
					contentAlignment = Alignment.Center,
					modifier = GlanceModifier
						.size(Dimensions.Size.XXL.dp)
						.background(GlanceTheme.colors.primary)
						.clickable(rippleOverride = R.drawable.transparent_ripple, onClick = onNewEvent)
				) {
					Image(
						provider = ImageProvider(R.drawable.ic_add),
						contentDescription = "Add event button",
						colorFilter = ColorFilter.tint(GlanceTheme.colors.onPrimary),
						modifier = GlanceModifier.size(Dimensions.Size.MD.dp)
					)
				}
			}
		}
	}

	@Composable
	private fun AllDayIcon(allDayEvents: List<UIEvent>) {
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
			modifier = GlanceModifier.background(calendarColor).cornerRadius(Dimensions.Spacing.SM.dp)
				.size(16.dp)
				.padding(padding.dp)
		) {
			Image(
				provider = ImageProvider(image),
				contentDescription = "All day event",
				colorFilter = ColorFilter.tint(allDayIconColor),
			)
		}
	}

	private fun generateColorProviderForColor(color: Color): ColorProvider {
		return ColorProviders(
			light = lightColorScheme(primary = color),
			dark = darkColorScheme(primary = color)
		).primary
	}

	@Composable
	fun NoEventsRow(
		modifier: GlanceModifier,
		currentDate: Date,
		userId: String?
	) {
		val zoneId = ZoneId.systemDefault()
		val currentDateAsLocal = LocalDateTime.ofInstant(currentDate.toInstant(), zoneId)
		val currentDay = currentDateAsLocal.format(DateTimeFormatter.ofPattern("dd"))
		val currentWeekDay = currentDateAsLocal.format(DateTimeFormatter.ofPattern("EE"))
		val spacerColor = GlanceTheme.colors.surfaceVariant.getColor(LocalContext.current)

		modifier.clickable(
			this@Agenda.openCalendarAgenda(
				LocalContext.current,
				userId,
				currentDate,
				null
			)
		)
		Row(
			modifier = modifier
				.fillMaxWidth()
				.padding(Dimensions.Spacing.SM.dp),
			verticalAlignment = Alignment.CenterVertically

		) {
			DayWithWeekday(GlanceModifier, currentDay, currentWeekDay)
			Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.MD.dp))
			CalendarIndicator(color = spacerColor)
			Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.MD.dp))
			val eventTitle = LocalContext.current.getString(R.string.widgetNoEvents_msg)
			Text(
				eventTitle,
				style = TextStyle(
					color = GlanceTheme.colors.onSurface,
					fontWeight = FontWeight.Bold,
					fontSize = 14.sp
				),
				maxLines = 1,
			)
		}
	}


	@Composable
	fun EventRow(
		modifier: GlanceModifier,
		showDayAndWeekday: Boolean,
		currentDate: Date,
		event: UIEvent,
		userId: String?
	) {
		val zoneId = ZoneId.systemDefault()
		val currentDateAsLocal = LocalDateTime.ofInstant(currentDate.toInstant(), zoneId)
		val currentDay = currentDateAsLocal.format(DateTimeFormatter.ofPattern("dd"))
		val currentWeekDay = currentDateAsLocal.format(DateTimeFormatter.ofPattern("EE"))
		val happensToday = midnightInDate(zoneId, LocalDateTime.now()) == midnightInDate(zoneId, currentDateAsLocal)
		val eventTitle = event.summary.ifEmpty { LocalContext.current.getString(R.string.eventNoTitle_title) }
		val dateModifier = if (happensToday) {
			GlanceModifier.visibility(Visibility.Gone)
		} else if (showDayAndWeekday) {
			GlanceModifier.visibility(Visibility.Visible)
		} else {
			GlanceModifier.visibility(Visibility.Invisible)
		}

		modifier.clickable(
			this@Agenda.openCalendarAgenda(
				LocalContext.current,
				userId,
				currentDate,
				event.eventId
			)
		)

		Row(
			modifier = modifier.fillMaxWidth(),
			verticalAlignment = Alignment.CenterVertically
		) {
			DayWithWeekday(dateModifier, currentDay, currentWeekDay)

			if (!happensToday) {
				Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.MD.dp))
			}

			CalendarIndicator(color = Color(parseColor("#${event.calendarColor}")))
			Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.MD.dp))

			// event title and time
			Column {
				Text(
					eventTitle,
					style = TextStyle(
						color = GlanceTheme.colors.onSurface,
						fontWeight = FontWeight.Bold,
						fontSize = 14.sp
					),
					maxLines = 1,
				)

				Text(
					event.startTime + " - " + event.endTime,
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
	private fun DayWithWeekday(dateModifier: GlanceModifier, day: String, weekday: String) {
		Row(
			horizontalAlignment = Alignment.CenterHorizontally,
			verticalAlignment = Alignment.Vertical.CenterVertically,
			modifier = dateModifier.width(32.dp)
		) {
			Column(
				horizontalAlignment = Alignment.CenterHorizontally
			) {
				Text(
					style = TextStyle(
						fontWeight = FontWeight.Bold,
						fontSize = 22.sp,
						color = GlanceTheme.colors.secondary

					),
					text = day,
					maxLines = 1,
					modifier = GlanceModifier.padding(bottom = (-4).dp)
				)
				Text(
					style = TextStyle(
						fontSize = 14.sp,
						color = GlanceTheme.colors.secondary
					),
					text = weekday,
					maxLines = 1,
					modifier = GlanceModifier.padding(top = (-4).dp)
				)
			}
		}
	}

	@Composable
	fun CalendarIndicator(width: Int = 3, color: Color = Color.Blue) {
		Row(
			modifier = GlanceModifier
				.width(width.dp)
				.fillMaxHeight()
				.background(color)
				.cornerRadius(3.dp)
		) { }
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

