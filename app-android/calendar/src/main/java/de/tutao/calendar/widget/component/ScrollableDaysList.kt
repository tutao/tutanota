package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.layout.Row
import androidx.glance.layout.padding
import de.tutao.calendar.widget.DAYS_IN_WIDGET
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
	val currentDay = LocalDate.now()

	LazyColumn {
		items(DAYS_IN_WIDGET) { dayIndex ->

			val itemDay = currentDay.plus(dayIndex.toLong(), ChronoUnit.DAYS)
			val events = data.daysAndEvents[itemDay]
			val isFirstDay = dayIndex == 0
			val topPadding = if (!isFirstDay) {
				Dimensions.Spacing.space_8.dp
			} else 0.dp

			val bottomPadding = if (dayIndex == DAYS_IN_WIDGET-1) {
				Dimensions.Spacing.space_16.dp
			} else {
				0.dp
			}

			val currentDayAction = openCalendarAgenda(LocalContext.current, userId, LocalDateTime.of(itemDay, LocalTime.MIDNIGHT))
			if (isFirstDay) {
				Row(modifier = GlanceModifier.padding(top = topPadding, bottom = bottomPadding)) {
					TodayCard(
						userId,
						events,
						currentDayAction,
						itemDay,
						onNewEvent
					)
				}
			} else if (events != null) {
				Row(modifier = GlanceModifier.padding(top = topPadding, bottom = bottomPadding)) {
					OtherDayCard(
						userId,
						events,
						currentDayAction,
						itemDay
					)
				}
			}
		}
	}
}
