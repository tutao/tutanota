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
import androidx.core.content.ContextCompat.startActivity
import androidx.core.graphics.ColorUtils
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.CircularProgressIndicator
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
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
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetDataRepository
import de.tutao.calendar.widget.data.WidgetStateDefinition
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.data.WidgetUIViewModel
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.ipc.CalendarOpenAction
import de.tutao.tutashared.parseColor
import de.tutao.tutashared.push.SseStorage
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

const val TAG = "AgendaWidget"

class Agenda : GlanceAppWidget() {
	override val stateDefinition: GlanceStateDefinition<*> = WidgetStateDefinition()

	override suspend fun onDelete(context: Context, glanceId: GlanceId) {
		super.onDelete(context, glanceId)

		val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(glanceId)

		// We can't access the model from here, only the repository directly
		val repository = WidgetDataRepository()

		repository.eraseLastSyncForWidget(context, widgetId)
		repository.eraseSettingsForWidget(context, widgetId)
	}

	override suspend fun provideGlance(context: Context, id: GlanceId) {
		val db = AppDatabase.getDatabase(context, true)
		val keyStoreFacade = createAndroidKeyStoreFacade()
		val sseStorage = SseStorage(db, keyStoreFacade)
		val crypto = AndroidNativeCryptoFacade(context)
		val nativeCredentialsFacade = CredentialsEncryptionFactory.create(context, crypto, db)
		val sdk = Sdk(sseStorage.getSseOrigin()!!, SdkRestClient()) // FIXME Change SSE Origin for something else
		val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
		val widgetUIViewModel = WidgetUIViewModel(WidgetDataRepository(), appWidgetId, nativeCredentialsFacade, sdk)
		val userId = widgetUIViewModel.getLoggedInUser(context)

		val settingsPreferencesKey = stringPreferencesKey("${WIDGET_SETTINGS_PREFIX}_$appWidgetId")
		val lastSyncPreferencesKey = longPreferencesKey("${WIDGET_LAST_SYNC_PREFIX}_$appWidgetId")

		widgetUIViewModel.loadUIState(context)

		provideContent {
			val data by widgetUIViewModel.uiState.collectAsState()
			val preferences = currentState<Preferences>()

			LaunchedEffect(preferences[settingsPreferencesKey], preferences[lastSyncPreferencesKey]) {
				Log.d(TAG, "Launching effect ;)")
				widgetUIViewModel.loadUIState(context)
			}

			GlanceTheme(
				colors = AppTheme.colors
			) {
				WidgetBody(
					data,
					headerCallback = { openCalendarAgenda(context, userId) },
					newEventCallback = { openCalendarEditor(context, userId) }
				)
			}
		}
	}

	private fun openCalendarEditor(context: Context, userId: String? = "") {
		val openCalendarEventIntent = Intent(context, MainActivity::class.java)
		openCalendarEventIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
		openCalendarEventIntent.action = MainActivity.OPEN_CALENDAR_ACTION
		openCalendarEventIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
		openCalendarEventIntent.putExtra(
			MainActivity.OPEN_CALENDAR_IN_APP_ACTION_KEY,
			CalendarOpenAction.EVENT_EDITOR.value
		)
		openCalendarEventIntent.putExtra(
			MainActivity.OPEN_CALENDAR_DATE_KEY,
			LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
		)

		startActivity(context, openCalendarEventIntent, null)
	}

	private fun openCalendarAgenda(context: Context, userId: String? = "") {
		val openCalendarEventIntent = Intent(context, MainActivity::class.java)
		openCalendarEventIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
		openCalendarEventIntent.action = MainActivity.OPEN_CALENDAR_ACTION
		openCalendarEventIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
		openCalendarEventIntent.putExtra(
			MainActivity.OPEN_CALENDAR_DATE_KEY,
			LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
		)

		startActivity(context, openCalendarEventIntent, null)
	}

	@Composable
	fun WidgetBody(data: WidgetUIData?, headerCallback: () -> Unit, newEventCallback: () -> Unit) {
		println(data)

		val isEmpty = data?.allDayEvents?.isEmpty() ?: true && data?.normalEvents?.isEmpty() ?: true

		Column(
			modifier = GlanceModifier.padding(
				top = 12.dp,
				start = 12.dp,
				end = 12.dp,
				bottom = if (isEmpty) 0.dp else 12.dp
			)
				.background(GlanceTheme.colors.background)
				.fillMaxSize()
				.appWidgetBackground()
				.cornerRadius(8.dp),
		) {

			if (data == null) {
				return@Column Column(
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

			Header(
				allDayEvents = data.allDayEvents,
				onTap = headerCallback,
				onNewEvent = newEventCallback,
				hasAllDayEvents = data.allDayEvents.isNotEmpty()
			)

			if (isEmpty) {
				return@Column Column(
					verticalAlignment = Alignment.Vertical.Bottom,
					horizontalAlignment = Alignment.CenterHorizontally,
					modifier = GlanceModifier
						.fillMaxSize()
				) {
					Column(
						modifier = GlanceModifier.fillMaxWidth().defaultWeight(),
						verticalAlignment = Alignment.Top,
						horizontalAlignment = Alignment.CenterHorizontally
					) {
						Text(
							"No Events",
							style = TextStyle(
								fontSize = 16.sp,
								color = GlanceTheme.colors.onBackground,
								textAlign = TextAlign.Center
							),
							maxLines = 2,
							modifier = GlanceModifier.padding(bottom = 8.dp)
						)
						Image(
							provider = ImageProvider(R.drawable.dog),
							contentDescription = "No events",
							contentScale = ContentScale.Fit,
							modifier = GlanceModifier.fillMaxWidth().defaultWeight().wrapContentHeight()
						)
					}
				}
			}

			LazyColumn {
				itemsIndexed(
					data.normalEvents.ifEmpty { data.allDayEvents },
					itemId = { index, _ -> index.toLong() }) { _, event ->
					Column {
						EventCard(event)
						Spacer(modifier = GlanceModifier.height(4.dp))
					}
				}
			}
		}
	}

	@Composable
	private fun Header(
		allDayEvents: List<UIEvent>,
		onTap: () -> Unit,
		onNewEvent: () -> Unit,
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
					.clickable(rippleOverride = R.drawable.transparent_ripple) { onTap() }.defaultWeight()
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
					modifier = GlanceModifier.defaultWeight()
				) {
					if (hasAllDayEvent) {
						val calendarColor = Color(parseColor("#${allDayEvents.first().calendarColor}"))
						val isLightBg = ColorUtils.calculateLuminance(calendarColor.toArgb()) > 0.5
						val allDayIconColor =
							generateColorProviderForColor(if (isLightBg) AppTheme.LightColors.onSurface else AppTheme.DarkColors.onSurface)

						Image(
							provider = ImageProvider(R.drawable.ic_all_day),
							contentDescription = "Add event button",
							colorFilter = androidx.glance.ColorFilter.tint(allDayIconColor),
							modifier = GlanceModifier.size(16.dp).background(calendarColor).cornerRadius(10.dp)
								.padding(2.dp)
						)
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
						.clickable(rippleOverride = R.drawable.transparent_ripple) {
							onNewEvent()
						}
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
	fun EventCard(event: UIEvent) {
		Row(
			modifier = GlanceModifier.padding(horizontal = 8.dp, vertical = 4.dp)
				.background(GlanceTheme.colors.surface)
				.cornerRadius(8.dp)
				.fillMaxWidth(),
			verticalAlignment = Alignment.CenterVertically
		) {
			CalendarIndicator(color = Color(parseColor("#${event.calendarColor}")))

			// event title and time
			Column(
				modifier = GlanceModifier.padding(start = 8.dp)
					.clickable(rippleOverride = R.drawable.transparent_ripple) { }) {
				Text(
					event.summary.ifEmpty { "<No title>" },
					style = TextStyle(
						color = GlanceTheme.colors.onSurface,
						fontWeight = FontWeight.Bold,
						fontSize = 14.sp
					),
					maxLines = 1
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
	@Preview(widthDp = 200, heightDp = 422)
	@Preview(widthDp = 400, heightDp = 500)
	@Composable
	fun VerticalWidgetPreview() {
		val eventData = ArrayList<UIEvent>()
		val allDayEvents = ArrayList<UIEvent>()
		for (i in 1..7) {
			eventData.add(
				UIEvent(
					"previewCalendar",
					"2196f3",
					"Hello Widget $i",
					"08:00",
					"17:00",
					isAllDay = false,
					startTimestamp = 0UL,
				)
			)
		}

		eventData.add(
			UIEvent(
				"previewCalendar",
				"2196f3",
				"Summery",
				"Start Time",
				"End Time",
				isAllDay = false,
				startTimestamp = 0UL,
			)
		)

		allDayEvents.add(
			UIEvent(
				"previewCalendar",
				"2196f3",
				"Summery",
				"Start Time",
				"End Time",
				isAllDay = false,
				startTimestamp = 0UL,
			)
		)

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIData(
					allDayEvents = allDayEvents,
					normalEvents = eventData,
				),
				headerCallback = {},
				newEventCallback = {},
			)
		}
	}

	@OptIn(ExperimentalGlancePreviewApi::class)
	@Preview(widthDp = 200, heightDp = 200)
	@Preview(widthDp = 400, heightDp = 500)
	@Preview(widthDp = 800, heightDp = 500)
	@Composable
	fun VerticalWidgetPreviewNoEvents() {
		val eventData = ArrayList<UIEvent>()
		val allDayEvents = ArrayList<UIEvent>()

		GlanceTheme(colors = AppTheme.colors) {
			WidgetBody(
				WidgetUIData(
					allDayEvents = allDayEvents,
					normalEvents = eventData,
				),
				headerCallback = {},
				newEventCallback = {},
			)
		}
	}
}


