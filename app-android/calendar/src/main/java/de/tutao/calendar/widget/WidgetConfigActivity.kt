package de.tutao.calendar.widget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
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
import androidx.compose.ui.layout.onPlaced
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.toSize
import androidx.core.graphics.toColorInt
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.lifecycle.viewmodel.MutableCreationExtras
import androidx.lifecycle.viewmodel.compose.viewModel
import de.tutao.calendar.widget.data.WidgetConfigRepository
import de.tutao.calendar.widget.data.WidgetConfigViewModel
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.push.SseStorage
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class WidgetConfigActivity : AppCompatActivity() {
	private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

	@OptIn(ExperimentalMaterial3Api::class)
	val rippleConfiguration =
		RippleConfiguration(color = Color(0xFF8B8B8B), rippleAlpha = RippleAlpha(0.38f, 0.38f, .38f, .38f))

	private fun modelFactoryExtras(context: Context): MutableCreationExtras {
		return MutableCreationExtras().apply {
			val db = AppDatabase.getDatabase(baseContext, true)
			val keyStoreFacade = createAndroidKeyStoreFacade()
			val sseStorage = SseStorage(db, keyStoreFacade)

			val crypto = AndroidNativeCryptoFacade(baseContext)
			val sdk =
				Sdk(sseStorage.getSseOrigin()!!, SdkRestClient()) // FIXME Handle null sseOrigin / no saved accounts
			val credentialsFacade = CredentialsEncryptionFactory.create(baseContext, crypto, db)

			set(WidgetConfigViewModel.APPLICATION_EXTRA_KEY, application)
			set(WidgetConfigViewModel.CREDENTIALS_FACADE_EXTRA_KEY, credentialsFacade)
			set(WidgetConfigViewModel.SDK_EXTRA_KEY, sdk)
			set(WidgetConfigViewModel.REPOSITORY_EXTRA_KEY, WidgetConfigRepository())
		}
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
		val viewModel: WidgetConfigViewModel by viewModels(extrasProducer = { modelFactoryExtras(context) }) { WidgetConfigViewModel.Factory }
		viewModel.loadCredentials()
		viewModel.loadWidgetSettings(context, appWidgetId)

		// Use Jetpack Compose to build the configuration UI.
		setContent {

			val isDarkMode = isSystemInDarkTheme()

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
					WidgetConfig(
						finishAction = {
							finish()
						},
						okAction = {
							try {
								val activityContext = this
								val storeJob = viewModel.storeSettings(this, appWidgetId)
								storeJob.invokeOnCompletion {
									GlobalScope.launch { //FIXME handle coroutine properly
										Log.d("WidgetConfigActivity", "GlobalScope coroutine start")

										val manager = GlanceAppWidgetManager(activityContext)
										val widget = Agenda()
										val glanceIds = manager.getGlanceIds(widget.javaClass)
										glanceIds.forEach { glanceId ->
											widget.update(context, glanceId)
										}

										// FIXME Remove LOG
										Log.d("WidgetConfigActivity", "GlobalScope coroutine end")
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
		finishAction: () -> Unit,
		okAction: () -> Unit
	) {
		val model: WidgetConfigViewModel =
			viewModel(
				extras = this.modelFactoryExtras(context = LocalContext.current),
				factory = WidgetConfigViewModel.Factory
			)
		val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior(rememberTopAppBarState())
		val isLoading by model.isLoading.collectAsState()

		Scaffold(
			topBar = {
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
				SettingsBody(innerPadding)
			}
		}
	}

	@Composable
	private fun SettingsBody(innerPadding: PaddingValues) {
		val model: WidgetConfigViewModel =
			viewModel(extras = this.modelFactoryExtras(LocalContext.current), factory = WidgetConfigViewModel.Factory)
		val credentials by model.credentials.collectAsState()
		var showDropdown by remember { mutableStateOf(false) }
		val selectedLogin =
			model.selectedCredential.collectAsState().value?.credentialInfo?.login ?: "Select a credential"
		val calendars by model.calendars.collectAsState()

		var rowSize by remember { mutableStateOf(Size.Zero) }

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
			Column(
				modifier = Modifier
					.padding(8.dp)
					.wrapContentWidth()
			) {
				Text(
					"Account".uppercase(),
					color = MaterialTheme.colorScheme.onBackground,
					fontWeight = FontWeight.Bold,
					fontSize = 12.sp,
					lineHeight = 12.sp
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
					"Calendars".uppercase(),
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
								calendar.name.ifEmpty {
									"Private"
								},
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

	@Preview(widthDp = 500, heightDp = 500)
	@Composable
	fun WidgetConfigPreview() {
		MaterialTheme(
			colorScheme = if (isSystemInDarkTheme()) {
				AppTheme.DarkColors
			} else {
				AppTheme.LightColors
			}
		) {
//		WidgetConfig(WidgetConfigViewModel(get), {})
		}
	}
}