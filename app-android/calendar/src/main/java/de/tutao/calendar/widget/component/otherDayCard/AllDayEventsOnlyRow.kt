package de.tutao.calendar.widget.component.otherDayCard

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.core.graphics.ColorUtils
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.layout.Alignment
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import de.tutao.calendar.widget.component.allDayRow.AllDayRow
import de.tutao.calendar.widget.component.eventCard.DayWithWeekday
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.tutashared.parseColor
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Composable
fun AllDayEventsOnlyRow(
	modifier: GlanceModifier, currentDate: LocalDateTime, allDayEvents: List<UIEvent>
) {
	val currentDay = currentDate.format(DateTimeFormatter.ofPattern("dd"))
	val currentWeekDay = currentDate.format(DateTimeFormatter.ofPattern("EE"))
	val calendarColor = Color(parseColor("#${allDayEvents.first().calendarColor}"))

	val spacerColor = GlanceTheme.colors.surfaceVariant.getColor(LocalContext.current)
	val isLightBg = ColorUtils.calculateLuminance(calendarColor.toArgb()) > 0.5

	Row(
		modifier = modifier.fillMaxWidth().padding(
			start = Dimensions.Spacing.LG.dp,
			top = Dimensions.Spacing.SM.dp,
			end = Dimensions.Spacing.LG.dp,
			bottom = Dimensions.Spacing.SM.dp,
		),
		verticalAlignment = Alignment.CenterVertically,


		) {
		DayWithWeekday(GlanceModifier, currentDay, currentWeekDay)
		Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.MD.dp))
		AllDayRow(allDayEvents)

	}
}


@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 80)
@Composable
fun NoEventsRowPreview() {
	AllDayEventsOnlyRow(
		modifier = GlanceModifier,
		LocalDateTime.now(),
		allDayEvents = listOf()
	)
}
