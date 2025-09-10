package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.Visibility
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
import androidx.glance.visibility
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.midnightInDate
import de.tutao.tutashared.parseColor
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@Composable
fun EventRow(
	modifier: GlanceModifier,
	showDayAndWeekday: Boolean,
	currentDate: LocalDateTime,
	event: UIEvent,
	openEventAction: Action
) {
	val zoneId = ZoneId.systemDefault()
	val currentDay = currentDate.format(DateTimeFormatter.ofPattern("dd"))
	val currentWeekDay = currentDate.format(DateTimeFormatter.ofPattern("EE"))
	val happensToday = midnightInDate(zoneId, LocalDateTime.now()) == midnightInDate(zoneId, currentDate)
	val eventTitle = event.summary.ifEmpty { LocalContext.current.getString(R.string.eventNoTitle_title) }
	val dateModifier = if (happensToday) {
		GlanceModifier.visibility(Visibility.Gone)
	} else if (showDayAndWeekday) {
		GlanceModifier.visibility(Visibility.Visible)
	} else {
		GlanceModifier.visibility(Visibility.Invisible)
	}

	modifier.clickable(
		openEventAction
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


@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 50)
@Composable
fun EventRowTodayPreview() {
	val startOfToday = midnightInDate(ZoneId.systemDefault(), LocalDateTime.now())
	EventRow(
		modifier = GlanceModifier,
		true,
		LocalDateTime.now(),
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
		true,
		LocalDateTime.ofInstant(startOfTomorrow, ZoneId.systemDefault()),
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
