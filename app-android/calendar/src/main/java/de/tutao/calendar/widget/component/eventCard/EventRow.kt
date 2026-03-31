package de.tutao.calendar.widget.component.eventCard

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
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
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.midnightInDate
import de.tutao.tutashared.parseColor
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.temporal.ChronoUnit

@Composable
fun EventRow(
	modifier: GlanceModifier,
	event: UIEvent,
	openEventAction: Action
) {
	val eventTitle = event.summary.ifEmpty { LocalContext.current.getString(R.string.noTitle_label) }

	Row(
		modifier = modifier.clickable(openEventAction).fillMaxWidth(),
		verticalAlignment = Alignment.CenterVertically
	) {
		CalendarIndicator(color = Color(parseColor("#${event.calendarColor}")))
		Spacer(GlanceModifier.width(Dimensions.Spacing.space_12.dp))
		Column {
			Text(
				eventTitle,
				style = TextStyle(
					color = GlanceTheme.colors.onSurface,
					fontWeight = FontWeight.Bold,
					fontSize = Dimensions.FontSize.font_14.sp
				),
				maxLines = 1,
			)
			Text(
				event.startTime + " - " + event.endTime,

				style = TextStyle(
					color = GlanceTheme.colors.onSurface,
					fontSize = Dimensions.FontSize.font_12.sp
				),
			)
		}
	}
}


@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 50)
@Composable
fun EventRowTodayPreview() {
	val startOfToday = midnightInDate(ZoneId.systemDefault(), LocalDateTime.now())
	EventRow(
		modifier = GlanceModifier,
		UIEvent(
			"previewCalendar",
			IdTuple("", ""),
			"2196f3",
			"Hello Widget",
			"08:00",
			"17:00",
			isAllDay = false,
			startTimestamp = startOfToday
		),
		actionRunCallback<ActionCallback>(),
	)
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 50)
@Composable
fun EventRowTomorrowPreview() {
	val startOfToday = midnightInDate(ZoneId.systemDefault(), LocalDateTime.now())
	val startOfTomorrow = Instant.ofEpochMilli(startOfToday).plus(1, ChronoUnit.DAYS)
	EventRow(
		modifier = GlanceModifier,
		UIEvent(
			"previewCalendar",
			IdTuple("", ""),
			"2196f3",
			"Hello Widget",
			"08:00",
			"17:00",
			isAllDay = false,
			startTimestamp = startOfTomorrow.toEpochMilli()
		),
		actionRunCallback<ActionCallback>(),
	)
}
