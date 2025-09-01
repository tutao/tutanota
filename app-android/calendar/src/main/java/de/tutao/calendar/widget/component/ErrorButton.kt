package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.calendar.widget.style.Dimensions

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