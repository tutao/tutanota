package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.height
import androidx.glance.layout.padding
import de.tutao.calendar.widget.DAYS_IN_WIDGET
import de.tutao.calendar.widget.component.otherDayCard.OtherDayCard
import de.tutao.calendar.widget.component.todayCard.TodayCard
import de.tutao.calendar.widget.data.WidgetUIState
import de.tutao.calendar.widget.model.openCalendarAgenda
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.temporal.ChronoUnit

@Composable
fun ScrollableDaysList(
	data: WidgetUIState.Available,
	onNewEvent: Action,
	userId: String?,
	containerPadding: Dp
) {
	val currentDay = LocalDate.now()
	LazyColumn() {
		val itemGap = 8.dp

		items(DAYS_IN_WIDGET) { dayIndex ->

			val itemDay = currentDay.plus(dayIndex.toLong(), ChronoUnit.DAYS)
			val events = data.daysAndEvents[itemDay]
			val isFirstDay = dayIndex == 0
			val topPadding = if (isFirstDay) containerPadding else itemGap

			val currentDayAction = openCalendarAgenda(LocalContext.current, userId, LocalDateTime.of(itemDay, LocalTime.MIDNIGHT))
			if (isFirstDay) {
				Row(modifier = GlanceModifier.padding(top = topPadding)) {
					TodayCard(
						userId,
						events,
						currentDayAction,
						itemDay,
						onNewEvent
					)
				}
			} else if (events != null) {
				Row(modifier = GlanceModifier.padding(top = topPadding)) {
					OtherDayCard(
						userId,
						events,
						currentDayAction,
						itemDay
					)
				}
			}
		}
		item { Spacer(modifier = GlanceModifier.height(containerPadding) )}
	}
}
