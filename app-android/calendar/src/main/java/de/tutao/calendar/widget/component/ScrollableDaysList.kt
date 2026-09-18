package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.layout.Row
import androidx.glance.layout.padding
import de.tutao.calendar.widget.component.otherDayCard.OtherDayCard
import de.tutao.calendar.widget.component.todayCard.TodayCard
import de.tutao.calendar.widget.data.WidgetUIState
import de.tutao.calendar.widget.model.openCalendarAgenda
import de.tutao.calendar.widget.style.Dimensions
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.temporal.ChronoUnit

@Composable
fun ScrollableDaysList(
	data: WidgetUIState.Available,
	onNewEvent: Action,
	userId: String?
) {

	val startOfToday = LocalDate.now()

	LazyColumn {
		items(data.daysAndEvents.size) { dayIndex ->

			val currentDay = LocalDateTime.of(startOfToday.plus(dayIndex.toLong(), ChronoUnit.DAYS), LocalTime.MIDNIGHT)

			val isFirstDay = dayIndex == 0
			val topPadding = if (!isFirstDay) {
				Dimensions.Spacing.space_8.dp
			} else 0.dp

			val bottomPadding = if (dayIndex == data.daysAndEvents.size - 1) {
				Dimensions.Spacing.space_16.dp
			} else {
				0.dp
			}

			val currentDayAction = openCalendarAgenda(LocalContext.current, userId, currentDay)
			Row(modifier = GlanceModifier.padding(top = topPadding, bottom = bottomPadding)) {
				if (isFirstDay) {
					TodayCard(
						userId,
						data.daysAndEvents[dayIndex],
						currentDayAction,
						currentDay,
						onNewEvent
					)
				} else {
					if (data.daysAndEvents[dayIndex].isNotEmpty())
						OtherDayCard(
							userId,
							data.daysAndEvents[dayIndex],
							currentDayAction,
							currentDay
						)
				}
			}
		}
	}
}