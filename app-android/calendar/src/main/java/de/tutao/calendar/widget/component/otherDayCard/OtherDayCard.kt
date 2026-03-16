package de.tutao.calendar.widget.component.otherDayCard

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.action.Action
import androidx.glance.layout.Alignment
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.padding
import androidx.glance.layout.width
import de.tutao.calendar.widget.component.Card
import de.tutao.calendar.widget.component.EventList
import de.tutao.calendar.widget.component.allDayRow.AllDayRow
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions
import java.time.LocalDateTime

@Composable
fun OtherDayCard(
	userId: String?,
	normalEvents: List<UIEvent>,
	allDayEvents: List<UIEvent>,
	clickAction: Action,
	currentDate: LocalDateTime
) {

	Card(clickAction) {
		if (normalEvents.isEmpty() && allDayEvents.isNotEmpty()) {
			// Special case: There is an all day event happening on another day.
			// We show the all day event in the same row together with DayAndWeekday
			Row(
				verticalAlignment = Alignment.CenterVertically,
				modifier = GlanceModifier.padding(vertical = Dimensions.Spacing.space_4.dp),
			) {
				Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.space_12.dp))
				DayWithWeekday(currentDate)
				Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.space_8.dp))
				AllDayRow(allDayEvents)
			}
		} else {
			// Show all day events on top of regular event list.
			if (allDayEvents.isNotEmpty()) {
				AllDaySection(allDayEvents)
			}
			Row {
				Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.space_12.dp))
				DayWithWeekday(currentDate)
				Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.space_8.dp))
				EventList(
					userId,
					normalEvents,
					currentDate
				)
			}
		}
	}

}