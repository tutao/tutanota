package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.itemsIndexed
import androidx.glance.layout.Row
import androidx.glance.layout.padding
import de.tutao.calendar.widget.component.otherDayCard.OtherDayCard
import de.tutao.calendar.widget.component.todayCard.TodayCard
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.model.openCalendarAgenda
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.tutashared.midnightInDate
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

@Composable
fun ScrollableDaysList(
	data: WidgetUIData,
	onNewEvent: Action,
	userId: String?
) {

	// only need to get keys of normalEvents list all days with events are included in both lists on WidgetUIData
	val sortedDaysList = data.normalEvents.keys.sorted()
	val startOfToday = midnightInDate(ZoneId.systemDefault(), LocalDateTime.now())

	// we only have to check the normal events list because both normalEvents and allDayEvents lists are created whenever there are any events on a day.
	val hasToday = sortedDaysList.contains(startOfToday)

	var renderedDaysList = data.normalEvents.keys.sorted().toMutableList()
	if (!hasToday) {
		// create card for today even if there are no events today.
		renderedDaysList.add(0, startOfToday)
	}

	LazyColumn {
		itemsIndexed(renderedDaysList) { dayIndex, startOfDay ->
			val normalEvents = data.normalEvents[startOfDay] ?: listOf()
			val allDayEvents = data.allDayEvents[startOfDay] ?: listOf()
			val currentDay = LocalDateTime.ofInstant(Instant.ofEpochMilli(startOfDay), ZoneId.systemDefault())
			val isFirstDay = dayIndex == 0
			val topPadding = if (!isFirstDay) {
				Dimensions.Spacing.SM.dp
			} else 0.dp
			val bottomPadding = if (dayIndex == data.normalEvents.size - 1) {
				Dimensions.Spacing.LG.dp
			} else {
				0.dp
			}

			val currentDayAction = openCalendarAgenda(LocalContext.current, userId, currentDay)

			Row(modifier = GlanceModifier.padding(top = topPadding, bottom = bottomPadding)) {
				if (isFirstDay) {
					TodayCard(
						userId,
						normalEvents,
						allDayEvents,
						currentDayAction,
						currentDay,
						onNewEvent
					)
				} else {
					OtherDayCard(
						userId,
						normalEvents,
						allDayEvents,
						currentDayAction,
						currentDay
					)
				}
			}
		}
	}
}