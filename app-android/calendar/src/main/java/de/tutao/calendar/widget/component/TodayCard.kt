package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.glance.action.Action
import de.tutao.calendar.widget.data.UIEvent
import java.util.Date

@Composable
fun TodayCard(
	userId: String?,
	normalEvents: List<UIEvent>,
	allDayEvents: List<UIEvent>,
	headerCallback: Action,
	newEventCallback: Action,
	currentDay: Date,
) {

	// TODO define children for today card
	// show header (button, current day and all day events.
	// content contains event list
//		content()
	SimpleCard(userId, currentDay, headerCallback) {
		Header(allDayEvents, newEventCallback)
		if (normalEvents.isEmpty()) {
			NoEventsTodayRow()
		} else {
			EventList(userId, normalEvents, currentDay)
		}
	}
}