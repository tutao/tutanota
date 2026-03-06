package de.tutao.calendar.widget.component.otherDayCard

import androidx.compose.runtime.Composable
import androidx.glance.GlanceModifier
import androidx.glance.action.Action
import androidx.glance.layout.Column
import de.tutao.calendar.widget.component.Card
import de.tutao.calendar.widget.component.EventList
import de.tutao.calendar.widget.data.UIEvent
import java.time.LocalDateTime

@Composable
fun OtherDayCard(
	userId: String?,
	normalEvents: List<UIEvent>,
	allDayEvents: List<UIEvent>,
	clickAction: Action,
	currentDay: LocalDateTime
) {
	Card(clickAction) {
		Column {
			if (normalEvents.isEmpty() && allDayEvents.isNotEmpty()) {
				AllDayEventsOnlyRow(
					modifier = GlanceModifier.defaultWeight(),
					currentDay,
					allDayEvents
				)

			} else if (normalEvents.isNotEmpty() && allDayEvents.isEmpty()) {

				EventList(
					userId,
					normalEvents,
					currentDay
				)
			} else {
				AllDaySection(allDayEvents)
				EventList(userId, normalEvents, currentDay)
			}
		}
	}
}