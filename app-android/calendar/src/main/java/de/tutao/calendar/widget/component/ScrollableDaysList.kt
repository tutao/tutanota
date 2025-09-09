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
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.model.openCalendarAgenda
import de.tutao.calendar.widget.style.Dimensions
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.Date

@Composable
fun ScrollableDaysList(
	data: WidgetUIData,
	todayHeaderOnTapAction: Action,
	userId: String?
) {
	LazyColumn {
		itemsIndexed(data.normalEvents.keys.sorted()) { dayIndex, startOfDay ->
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

			Row(modifier = GlanceModifier.padding(top = topPadding, bottom = bottomPadding)) {
				if (isFirstDay) {
					TodayCard(
						userId,
						normalEvents,
						allDayEvents,
						todayHeaderOnTapAction,
						currentDay,
					)
				} else {
					val currentDayAction = openCalendarAgenda(LocalContext.current, userId, currentDay)
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