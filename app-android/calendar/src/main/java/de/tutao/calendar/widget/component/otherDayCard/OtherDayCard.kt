package de.tutao.calendar.widget.component.otherDayCard

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.action.Action
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
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
	userId: String?, events: List<UIEvent>, clickAction: Action, currentDate: LocalDateTime
) {

	val normalEvents: List<UIEvent> = events.filter { uiEvent -> !uiEvent.isDisplayedAsAllDay }
	val allDayEvents: List<UIEvent> = events.filter { uiEvent -> uiEvent.isDisplayedAsAllDay && !uiEvent.isBirthday }
	val birthdayEvents = events.filter { uiEvent -> uiEvent.isBirthday }


	Card(clickAction) {
//		if (normalEvents.isEmpty() && (allDayEvents.isNotEmpty() || birthdayEvents.isNotEmpty())) {
		// Special case: There is an all day event happening on another day.
		// We show the all day event in the same row together with DayAndWeekday
		Row(
			verticalAlignment = if (normalEvents.isEmpty()) Alignment.CenterVertically else Alignment.Top,
			modifier = GlanceModifier.padding(vertical = Dimensions.Spacing.space_4.dp),
		) {

			Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.space_12.dp))
			DayWithWeekday(currentDate)
			Column() {
				if (allDayEvents.isNotEmpty()) {
					Row(
						modifier = GlanceModifier.padding(
							top = 2.dp,
							bottom = 2.dp,
							start = 4.dp,
						).fillMaxWidth()
					) { AllDayRow(allDayEvents) }
				}
				if (birthdayEvents.isNotEmpty()) {
					Row(
						modifier = GlanceModifier.padding(
							top = 2.dp,
							bottom = 2.dp,
							start = 4.dp,
						).fillMaxWidth()
					) { AllDayRow(birthdayEvents) }
				}
				if (normalEvents.isNotEmpty()) {
					Row(
						modifier = GlanceModifier.padding(
							start = 10.dp,
						)
					) {
						EventList(
							userId, normalEvents, currentDate
						)
					}
				}
			}
		}
//		} else {
//			// Show all day events on top of regular event list.
//			if (allDayEvents.isNotEmpty()) {
//				AllDaySection(allDayEvents)
//			}
//			if (birthdayEvents.isNotEmpty()) {
//				AllDaySection(birthdayEvents)
//			}
//			Row {
//				Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.space_12.dp))
//				DayWithWeekday(currentDate)
//				Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.space_8.dp))
//				EventList(
//					userId,
//					normalEvents,
//					currentDate
//				)
//			}
//		}
	}

}