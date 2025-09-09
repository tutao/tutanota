package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.layout.Alignment
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.width
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.style.Dimensions
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Date

@Composable
fun NoEventsRow(
	modifier: GlanceModifier,
	currentDate: LocalDateTime,
) {
	val currentDay = currentDate.format(DateTimeFormatter.ofPattern("dd"))
	val currentWeekDay = currentDate.format(DateTimeFormatter.ofPattern("EE"))
	val spacerColor = GlanceTheme.colors.surfaceVariant.getColor(LocalContext.current)

	Row(
		modifier = modifier.fillMaxWidth(),
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


@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 80)
@Composable
fun NoEventsRowPreview() {
	NoEventsRow(
		modifier = GlanceModifier,
		LocalDateTime.now(),
	)
}
