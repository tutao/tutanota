package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.glance.GlanceModifier
import androidx.glance.action.Action
import androidx.glance.layout.Column
import de.tutao.calendar.widget.data.UIEvent
import java.util.Date

@Composable
fun OtherDayCard(
	userId: String?,
	normalEvents: List<UIEvent>,
	allDayEvents: List<UIEvent>,
	clickAction: Action,
	currentDay: Date
) {

	SimpleCard(userId, currentDay, clickAction) {
		if (allDayEvents.isNotEmpty()) {
			AllDaySection(allDayEvents)
		}
		if (normalEvents.isEmpty()) {
			Column {
				NoEventsRow(
					modifier = GlanceModifier.defaultWeight(),
					currentDay,
					userId
				)
			}
		} else {
			EventList(userId, normalEvents, currentDay)
		}
	}
}