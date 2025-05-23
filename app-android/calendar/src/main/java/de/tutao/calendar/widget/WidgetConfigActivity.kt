package de.tutao.calendar.widget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.ripple.RippleAlpha
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonColors
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalRippleConfiguration
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RippleConfiguration
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberTopAppBarState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onPlaced
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.toSize
import androidx.core.graphics.toColorInt
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.viewmodel.MutableCreationExtras
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.WidgetConfigRepository
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorHandler
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.calendar.widget.model.WidgetConfigModel
import de.tutao.calendar.widget.model.WidgetConfigViewModel
import de.tutao.calendar.widget.test.WidgetConfigTestViewModel
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CredentialType
import de.tutao.tutashared.SdkFileClient
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.ipc.CalendarOpenAction
import de.tutao.tutashared.ipc.CredentialsInfo
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.PersistedCredentials
import de.tutao.tutashared.remote.RemoteStorage
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

val CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID = "clientOnly_birthdays"

class WidgetConfigActivity : AppCompatActivity() {
	private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

	@OptIn(ExperimentalMaterial3Api::class)
	val rippleConfiguration =
		RippleConfiguration(color = Color(0xFF8B8B8B), rippleAlpha = RippleAlpha(0.38f, 0.38f, .38f, .38f))

	private fun modelFactoryExtras(): MutableCreationExtras {
		return MutableCreationExtras().apply {
			val db = AppDatabase.getDatabase(baseContext, true)
			val remoteStorage = RemoteStorage(db)

			val serverURL = remoteStorage.getRemoteUrl()

			val crypto = AndroidNativeCryptoFacade(baseContext)
			val sdk =
				if (serverURL == null) {
					null
				} else {
					Sdk(serverURL, SdkRestClient(), SdkFileClient(baseContext.filesDir))
				}

			val credentialsFacade = CredentialsEncryptionFactory.create(baseContext, crypto, db)

			set(WidgetConfigViewModel.APPLICATION_EXTRA_KEY, application)
			set(WidgetConfigViewModel.CREDENTIALS_FACADE_EXTRA_KEY, credentialsFacade)
			set(WidgetConfigViewModel.SDK_EXTRA_KEY, sdk)
			set(WidgetConfigViewModel.REPOSITORY_EXTRA_KEY, WidgetConfigRepository())
		}
	}

	private fun buildOpenAgendaIntent(context: Context): Intent {
		val openCalendarAgenda = Intent(context, MainActivity::class.java)
		openCalendarAgenda.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
		openCalendarAgenda.action = MainActivity.OPEN_CALENDAR_ACTION
		openCalendarAgenda.putExtra(
			MainActivity.OPEN_CALENDAR_IN_APP_ACTION_KEY,
			CalendarOpenAction.AGENDA.value
		)
		openCalendarAgenda.putExtra(
			MainActivity.OPEN_CALENDAR_DATE_KEY,
			LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
		)

		return openCalendarAgenda
	}

	@OptIn(ExperimentalMaterial3Api::class, DelicateCoroutinesApi::class)
	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		val context = this

		// Retrieve the App Widget ID from the launching intent.
		appWidgetId = intent?.extras?.getInt(
			AppWidgetManager.EXTRA_APPWIDGET_ID,
			AppWidgetManager.INVALID_APPWIDGET_ID
		) ?: AppWidgetManager.INVALID_APPWIDGET_ID

		if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
			finish()
			return
		}

		// Set default result in case the user cancels.
		val resultValue = Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
		setResult(Activity.RESULT_CANCELED, resultValue)

		// The view model depends on the injection of the SDK and CredentialsFacade
		// So we must pass them to the factory through Extras.

		// Gets the existing ViewModel or creates a new one using the factory if it doesn't exist yet.
		val viewModel: WidgetConfigViewModel by viewModels(extrasProducer = { modelFactoryExtras() }) { WidgetConfigViewModel.Factory }
		viewModel.loadCredentials()
		viewModel.loadWidgetSettings(context, appWidgetId)

		// Use Jetpack Compose to build the configuration UI.
		setContent {
			val isDarkMode = isSystemInDarkTheme()
			val error by viewModel.error.collectAsState()

			DisposableEffect(isDarkMode) {
				context.enableEdgeToEdge(
					statusBarStyle = if (!isDarkMode) {
						SystemBarStyle.light(
							AppTheme.LightColors.background.toArgb(),
							AppTheme.DarkColors.background.toArgb()
						)
					} else {
						SystemBarStyle.dark(AppTheme.DarkColors.background.toArgb())
					},
					navigationBarStyle = if (!isDarkMode) {
						SystemBarStyle.light(
							AppTheme.LightColors.background.toArgb(),
							AppTheme.DarkColors.background.toArgb()
						)
					} else {
						SystemBarStyle.dark(AppTheme.DarkColors.background.toArgb())
					}
				)

				onDispose { }
			}

			MaterialTheme(
				colorScheme = if (isSystemInDarkTheme()) {
					AppTheme.DarkColors
				} else {
					AppTheme.LightColors
				}
			) {
				CompositionLocalProvider(LocalRippleConfiguration provides rippleConfiguration) {
					if (error != null) {
						return@CompositionLocalProvider ErrorMessage(error as WidgetError, {
							if (error!!.type == WidgetErrorType.CREDENTIALS) {
								startActivity(buildOpenAgendaIntent(context))
							} else {
								startActivity(WidgetErrorHandler.buildLogsIntent(context, error))
							}
						})
					}

					WidgetConfig(
						viewModel,
						finishAction = {
							finish()
						},
						okAction = {
							try {
								val activityContext = this
								val storeJob = viewModel.storeSettings(this, appWidgetId)
								storeJob.invokeOnCompletion {
									lifecycleScope.launch {
										val manager = GlanceAppWidgetManager(activityContext)
										val widget = Agenda()
										val glanceIds = manager.getGlanceIds(widget.javaClass)
										glanceIds.forEach { glanceId ->
											widget.update(context, glanceId)
										}
									}
								}
								setResult(Activity.RESULT_OK, resultValue)
							} catch (ex: Exception) {
								Toast.makeText(
									applicationContext,
									"Could not save widget config - ${ex.message}",
									Toast.LENGTH_SHORT
								).show()
							}

							finish()
						}
					)
				}
			}
		}
	}


	@OptIn(ExperimentalMaterial3Api::class)
	@Composable
	fun WidgetConfig(
		model: WidgetConfigModel,
		finishAction: () -> Unit,
		okAction: () -> Unit
	) {
		val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior(rememberTopAppBarState())
		val credentials by model.credentials.collectAsState()
		val isLoading by model.isLoading.collectAsState()

		Scaffold(
			topBar = {
				TopBar(
					finishAction, if (credentials.isEmpty() || isLoading) {
						null
					} else {
						okAction
					}
				)
			},
			modifier = Modifier
				.nestedScroll(scrollBehavior.nestedScrollConnection)
				.fillMaxSize()
				.background(MaterialTheme.colorScheme.background)
				.safeDrawingPadding()
		) { innerPadding ->
			if (isLoading) {
				Column(
					modifier = Modifier
						.fillMaxSize()
						.background(MaterialTheme.colorScheme.background)
						.padding(
							vertical = innerPadding.calculateTopPadding().value.coerceAtLeast(8F).dp,
							horizontal = 8.dp
						),
					verticalArrangement = Arrangement.Center,
					horizontalAlignment = Alignment.CenterHorizontally,
				) {
					CircularProgressIndicator(
						modifier = Modifier.width(48.dp),
						color = MaterialTheme.colorScheme.primary,
						trackColor = MaterialTheme.colorScheme.surface,
					)
				}
			} else {
				SettingsBody(innerPadding, model)
			}
		}
	}

	@Composable
	private fun TopBar(finishAction: () -> Unit, okAction: (() -> Unit)?) {
		Row(
			modifier = Modifier.padding(start = 0.dp, end = 8.dp),
			verticalAlignment = Alignment.CenterVertically
		) {
			TextButton(
				shape = RoundedCornerShape(8.dp),
				onClick = finishAction, modifier = Modifier
					.width(44.dp)
					.height(44.dp),
				contentPadding = PaddingValues(0.dp)
			) {
				Icon(
					Icons.Default.ChevronLeft,
					"Back",
					tint = MaterialTheme.colorScheme.onBackground,
					modifier = Modifier
						.size(28.dp)
				)
			}
			Text("Widget Settings", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold)
			if (okAction != null) {
				Row(
					verticalAlignment = Alignment.CenterVertically,
					modifier = Modifier.fillMaxWidth(),
					horizontalArrangement = Arrangement.End
				) {
					TextButton(
						okAction,
						shape = RoundedCornerShape(8.dp),
					) {
						Text(
							"Confirm",
							fontWeight = FontWeight.Bold,
							textAlign = TextAlign.End,
						)
					}
				}
			}
		}
	}

	@Composable
	private fun SettingsBody(innerPadding: PaddingValues, model: WidgetConfigModel) {
		val credentials by model.credentials.collectAsState()
		var showDropdown by remember { mutableStateOf(false) }
		val selectedLogin =
			model.selectedCredential.collectAsState().value?.credentialInfo?.login ?: "Select a credential"
		val calendars by model.calendars.collectAsState()

		var rowSize by remember { mutableStateOf(Size.Zero) }
		val context = LocalContext.current

		Column(
			modifier = Modifier
				.fillMaxSize()
				.background(MaterialTheme.colorScheme.background)
				.padding(
					top = innerPadding.calculateTopPadding().value.coerceAtLeast(8F).dp,
					bottom = innerPadding.calculateBottomPadding().value.coerceAtLeast(8F).dp,
					start = 8.dp,
					end = 8.dp
				),
		) {
			if (credentials.isEmpty()) {
				return@Column Column(
					modifier = Modifier
						.padding(8.dp)
						.fillMaxSize(),
					verticalArrangement = Arrangement.Center,
					horizontalAlignment = Alignment.CenterHorizontally
				) {
					Column(
						verticalArrangement = Arrangement.Center,
						horizontalAlignment = Alignment.CenterHorizontally,
						modifier = Modifier.padding(16.dp)
					) {
						Text(
							context.getString(R.string.widgetNoCredentialsInfo_msg),
							fontWeight = FontWeight.Bold,
							fontSize = 24.sp,
							modifier = Modifier.padding(bottom = 16.dp)
						)
						Button(
							{ startActivity(buildOpenAgendaIntent(context)) },
							modifier = Modifier
								.padding(horizontal = 16.dp)
								.height(44.dp),
							shape = RoundedCornerShape(8.dp)
						) {
							Text(
								context.getString(R.string.widgetOpenApp_action),
								style = TextStyle(
									fontWeight = FontWeight.Medium,
									color = MaterialTheme.colorScheme.onPrimary
								)
							)
						}
					}
				}
			}

			Column(
				modifier = Modifier
					.padding(8.dp)
					.wrapContentWidth()
			) {
				Text(
					context.getString(R.string.account_label).uppercase(),
					color = MaterialTheme.colorScheme.onBackground,
					fontWeight = FontWeight.Bold,
					fontSize = 12.sp,
					lineHeight = 12.sp,
					modifier = Modifier.padding(bottom = 4.dp)
				)
				TextButton(
					contentPadding = PaddingValues(8.dp),
					onClick = { showDropdown = true },
					shape = RoundedCornerShape(8.dp),
					colors = ButtonColors(
						contentColor = MaterialTheme.colorScheme.secondary,
						containerColor = MaterialTheme.colorScheme.surface,
						disabledContentColor = MaterialTheme.colorScheme.primary,
						disabledContainerColor = MaterialTheme.colorScheme.onPrimary
					),
					modifier = Modifier
						.fillMaxWidth()
						.onPlaced { layoutCoordinates -> rowSize = layoutCoordinates.size.toSize() }
				) {
					Text(selectedLogin, modifier = Modifier.weight(weight = 1f), overflow = TextOverflow.Ellipsis)
					Icon(
						Icons.Default.ArrowDropDown,
						"",
						tint = MaterialTheme.colorScheme.onBackground,
						modifier = Modifier
							.size(32.dp)
							.padding(4.dp)
					)
				}
				DropdownMenu(
					expanded = showDropdown,
					onDismissRequest = { showDropdown = false },
					modifier = Modifier
						.background(MaterialTheme.colorScheme.surface)
						.width(with(LocalDensity.current) { rowSize.width.toDp() })
				) {
					credentials.forEach {
						DropdownMenuItem(
							text = { Text(it.credentialInfo.login) },
							onClick = {
								showDropdown = false
								model.setSelectedCredential(it)
							},
							modifier = Modifier
								.background(color = MaterialTheme.colorScheme.surface)
						)
					}
				}
			}

			Column(
				modifier = Modifier
					.padding(8.dp)
			) {
				Text(
					context.getString(R.string.calendars_label).uppercase(),
					color = MaterialTheme.colorScheme.onBackground,
					fontWeight = FontWeight.Bold,
					fontSize = 12.sp,
					lineHeight = 12.sp,
					modifier = Modifier.padding(bottom = 4.dp)
				)
				Card(
					colors = CardDefaults.cardColors(
						containerColor = MaterialTheme.colorScheme.surface,
					),
					modifier = Modifier
						.fillMaxWidth(),
				) {
					LazyColumn(modifier = Modifier.padding(4.dp)) {
						itemsIndexed(calendars.toList()) { _, it ->
							val calendar = it.second
							val key = it.first
							CalendarRow(
								calendar.color,
								getCalendarName(key, calendar),
								onCalendarSelect = { isSelected ->
									model.toggleCalendarSelection(key, isSelected)
								},
								model.isCalendarSelected(key)
							)
						}

						if (calendars.isEmpty()) {
							item {
								Text(
									"No Items",
									color = MaterialTheme.colorScheme.onBackground,
									textAlign = TextAlign.Center,
									modifier = Modifier
										.fillMaxWidth()
										.padding(vertical = 32.dp)
								)
							}
						}
					}
				}
			}
		}
	}

	@Composable
	private fun getCalendarName(id: GeneratedId, calendar: CalendarRenderData): String {
		if (id.contains(CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID)) {
			return getString(R.string.birthdayCalendar_label)
		}

		return calendar.name.ifEmpty {
			"Private"
		}
	}

	@Composable
	private fun CalendarRow(
		color: String,
		calendarName: String,
		onCalendarSelect: (selected: Boolean) -> Unit,
		isChecked: Boolean = false
	) {
		var checked by rememberSaveable { mutableStateOf(isChecked) }
		val markCalendarAsChecked = {
			onCalendarSelect(!checked)
			checked = !checked
		}
		Row(
			horizontalArrangement = Arrangement.spacedBy(8.dp),
			verticalAlignment = Alignment.CenterVertically,
			modifier = Modifier
				.padding(4.dp)
				.height(IntrinsicSize.Min)
				.fillMaxWidth()
				.clickable(
					interactionSource = remember { MutableInteractionSource() },
					indication = null,
					onClick = markCalendarAsChecked
				),
		) {
			Checkbox(
				checked,
				onCheckedChange = { markCalendarAsChecked() },
				colors = CheckboxDefaults.colors(
					checkedColor = Color("#$color".toColorInt()),
					uncheckedColor = Color("#$color".toColorInt()),
					checkmarkColor = Color("#$color".toColorInt()),
				),
				modifier = Modifier
					.padding(0.dp)
					.size(24.dp)
			)
			Text(calendarName, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
		}
	}

	@OptIn(ExperimentalMaterial3Api::class)
	@Composable
	private fun ErrorMessage(error: WidgetError, action: () -> Unit) {
		val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior(rememberTopAppBarState())
		val buttonLabel = if (error.type == WidgetErrorType.UNEXPECTED) {
			LocalContext.current.getString(R.string.sendLogs_action)
		} else {
			LocalContext.current.getString(R.string.widgetOpenApp_action)
		}

		Scaffold(
			topBar = {
				TopBar({ finish() }, null)
			},
			modifier = Modifier
				.nestedScroll(scrollBehavior.nestedScrollConnection)
				.fillMaxSize()
				.background(MaterialTheme.colorScheme.background)
				.safeDrawingPadding()
		) { innerPadding ->
			Column(
				modifier = Modifier
					.padding(
						top = innerPadding.calculateTopPadding().value.coerceAtLeast(8F).dp,
						bottom = innerPadding.calculateBottomPadding().value.coerceAtLeast(8F).dp,
						start = 16.dp,
						end = 16.dp
					)
					.fillMaxSize(),
				verticalArrangement = Arrangement.Center,
				horizontalAlignment = Alignment.CenterHorizontally
			) {
				Image(
					painter = painterResource(id = R.drawable.error),
					contentDescription = null,
					contentScale = ContentScale.Fit,
					modifier = Modifier
						.fillMaxWidth(0.6f)
						.aspectRatio(1.375f)
				)
				Text(
					WidgetErrorHandler.getErrorMessage(LocalContext.current, error),
					modifier = Modifier.padding(vertical = 16.dp),
					style = TextStyle(color = MaterialTheme.colorScheme.onBackground, fontSize = 16.sp)
				)
				Button(
					action,
					modifier = Modifier
						.padding(horizontal = 16.dp)
						.height(44.dp),
					shape = RoundedCornerShape(8.dp)
				) {
					Text(
						buttonLabel,
						style = TextStyle(
							fontWeight = FontWeight.Medium,
							color = MaterialTheme.colorScheme.onPrimary
						)
					)
				}
			}
		}
	}

	@Preview(widthDp = 424, heightDp = 943)
	@Composable
	fun ConfigPreviewNoCredentials() {
		MaterialTheme(
			colorScheme = if (isSystemInDarkTheme()) {
				AppTheme.DarkColors
			} else {
				AppTheme.LightColors
			}
		) {
			WidgetConfig(
				WidgetConfigTestViewModel(listOf()),
				finishAction = {},
				okAction = {}
			)
		}
	}

	@Preview(widthDp = 424, heightDp = 943)
	@Composable
	fun ConfigPreviewWithCredentials() {
		val credential = PersistedCredentials(
			CredentialsInfo(
				"foo@bar.com",
				"",
				CredentialType.INTERNAL
			),
			DataWrapper(ByteArray(0)),
			null,
			"",
			null
		)

		MaterialTheme(
			colorScheme = if (isSystemInDarkTheme()) {
				AppTheme.DarkColors
			} else {
				AppTheme.LightColors
			}
		) {
			WidgetConfig(
				WidgetConfigTestViewModel(listOf(credential)),
				finishAction = {},
				okAction = {}
			)
		}
	}

	@Preview(widthDp = 424, heightDp = 943)
	@Composable
	fun ConfigPreviewWithCalendars() {
		val credential = PersistedCredentials(
			CredentialsInfo(
				"foo@bar.com",
				"",
				CredentialType.INTERNAL
			),
			DataWrapper(ByteArray(0)),
			null,
			"",
			null
		)

		MaterialTheme(
			colorScheme = if (isSystemInDarkTheme()) {
				AppTheme.DarkColors
			} else {
				AppTheme.LightColors
			}
		) {
			WidgetConfig(
				WidgetConfigTestViewModel(
					listOf(credential),
					credential,
					mapOf(
						"0" to CalendarRenderData(name = "Foo", color = "013E85"),
						"1" to CalendarRenderData(name = "Bar", color = "A1C1FF")
					),
					listOf("1")
				),
				finishAction = {},
				okAction = {}
			)
		}
	}

	@Preview(widthDp = 424, heightDp = 943)
	@Composable
	fun ConfigPreviewWithError() {
		MaterialTheme(
			colorScheme = if (isSystemInDarkTheme()) {
				AppTheme.DarkColors
			} else {
				AppTheme.LightColors
			}
		) {
			ErrorMessage(WidgetError("Failed", "", WidgetErrorType.UNEXPECTED)) { }
		}
	}

	@Preview(widthDp = 424, heightDp = 943)
	@Composable
	fun ConfigPreviewWithLoginError() {
		MaterialTheme(
			colorScheme = if (isSystemInDarkTheme()) {
				AppTheme.DarkColors
			} else {
				AppTheme.LightColors
			}
		) {
			ErrorMessage(WidgetError("Failed", "", WidgetErrorType.CREDENTIALS)) { }
		}
	}
}