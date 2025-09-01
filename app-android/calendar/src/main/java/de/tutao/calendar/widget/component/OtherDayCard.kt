package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.action.Action
import androidx.glance.layout.Column
import androidx.glance.layout.padding
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions
import java.util.Date

@Composable
fun OtherDayCard(
	userId: String?,
	normalEvents: List<UIEvent>,
	allDayEvents: List<UIEvent>,
	clickAction: Action,
	currentDay: Date
) {
	Card(clickAction) {
		if (allDayEvents.isNotEmpty()) {
			AllDaySection(allDayEvents)
		}
		if (normalEvents.isEmpty()) {
			Column(
				modifier = GlanceModifier.padding(
					vertical = Dimensions.Spacing.SM.dp,
					horizontal = Dimensions.Spacing.LG.dp
				)
			) {
				NoEventsRow(
					modifier = GlanceModifier.defaultWeight(),
					currentDay,
				)
			}
		} else {
			EventList(userId, normalEvents, currentDay)
		}
	}
}