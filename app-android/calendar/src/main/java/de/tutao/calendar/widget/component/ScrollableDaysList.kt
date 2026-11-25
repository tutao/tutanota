package de.tutao.calendar.widget.component

import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.layout.Row
import androidx.glance.layout.padding
import de.tutao.calendar.widget.TAG
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
	var adjustedDaysToEvents = data.daysAndEvents
	val startOfToday = LocalDate.now()
	val dayDifference = ChronoUnit.DAYS.between(data.loadUiStateDate, startOfToday).toInt()
	if (dayDifference > 0) {
		Log.i(TAG, "Adjusting daysToEvents: dayDifference = $dayDifference")
		adjustedDaysToEvents = data.daysAndEvents.slice(dayDifference ..< data.daysAndEvents.size).plus(List(dayDifference) { emptyList() }).toTypedArray()
		// TODO: Kick-off new loadUiState, to populate new day arrays with events that were outside the previous range
	} else if (dayDifference < 0){
		Log.w(TAG, "Day difference was negative. This should never happen. resetting to 0.")
	}

	LazyColumn {
		items(adjustedDaysToEvents.size) { dayIndex ->

			val currentDay = LocalDateTime.of(startOfToday.plus(dayIndex.toLong(), ChronoUnit.DAYS), LocalTime.MIDNIGHT)

			val isFirstDay = dayIndex == 0
			val topPadding = if (!isFirstDay) {
				Dimensions.Spacing.space_8.dp
			} else 0.dp

			val bottomPadding = if (dayIndex == adjustedDaysToEvents.size - 1) {
				Dimensions.Spacing.space_16.dp
			} else {
				0.dp
			}

			val currentDayAction = openCalendarAgenda(LocalContext.current, userId, currentDay)
			if (isFirstDay) {
				Row(modifier = GlanceModifier.padding(top = topPadding, bottom = bottomPadding)) {
					TodayCard(
						userId,
						adjustedDaysToEvents[dayIndex],
						currentDayAction,
						currentDay,
						onNewEvent
					)
				}
			} else if (adjustedDaysToEvents[dayIndex].isNotEmpty()) {
				Row(modifier = GlanceModifier.padding(top = topPadding, bottom = bottomPadding)) {
					OtherDayCard(
						userId,
						adjustedDaysToEvents[dayIndex],
						currentDayAction,
						currentDay
					)
				}
			}
		}
	}
}
