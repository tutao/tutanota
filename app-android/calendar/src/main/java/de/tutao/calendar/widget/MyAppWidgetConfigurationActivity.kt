package de.tutao.calendar.widget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

class MyAppWidgetConfigurationActivity : AppCompatActivity() {
	private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID


	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)

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
		var resultValue = Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
		setResult(Activity.RESULT_CANCELED, resultValue)

		// Use Jetpack Compose to build the configuration UI.
		setContent {
			WidgetConfig(
				onRegularSelected = {
					resultValue = Intent().apply {
						putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
					}
					setResult(Activity.RESULT_OK, resultValue)
					finish()
				},
				onTonalSelected = {
					resultValue = Intent().apply {
						putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
					}
					setResult(Activity.RESULT_OK, resultValue)
					finish()
				}
			)
		}
	}
}

/**
 * @param onRegularSelected function that gets executed when regular button is pressed
 * @param onTonalSelected function that gets executed when tonal button is pressed
 */
@Composable
fun WidgetConfig(
	onRegularSelected: () -> Unit,
	onTonalSelected: () -> Unit
) {
	Row(
		modifier = Modifier
			.padding(horizontal = 10.dp)
			.fillMaxSize(),
		verticalAlignment = Alignment.CenterVertically,
	) {
		Button(onClick = onRegularSelected) {
			Text("Regular Colors")
		}
		Spacer(modifier = Modifier.padding(5.dp))
		Button(onClick = onTonalSelected) {
			Text("Tonal Colors")
		}
	}
}

@Preview(widthDp = 500, heightDp = 500)
@Composable
fun WidgetConfigPreview() {
	WidgetConfig({}, {})
}