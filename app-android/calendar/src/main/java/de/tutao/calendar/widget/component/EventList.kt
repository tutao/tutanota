package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.height
import androidx.glance.layout.padding
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.model.openCalendarAgenda
import de.tutao.calendar.widget.style.Dimensions
import java.time.LocalDateTime


@Composable
fun EventList(userId: String?, normalEvents: List<UIEvent>, currentDay: LocalDateTime) {

	// we need to chunk events because columns inside scrollable elements doesn't support more than five children
	// lazy lists also doesn't support more than 10 elements
	val chunked = normalEvents.chunked(5)
	val eventGroups = chunked.subList(0, if (chunked.size > 10) 10 else chunked.size)

	val firstEventOfTheDay = normalEvents.first()

	eventGroups.forEachIndexed { index, events ->
		Column(
			modifier = GlanceModifier.padding(
				start = Dimensions.Spacing.LG.dp,
				top = if (index == 0) Dimensions.Spacing.SM.dp else 0.dp,
				end = Dimensions.Spacing.LG.dp,
				bottom = if (index == eventGroups.size - 1) Dimensions.Spacing.SM.dp else 0.dp,
			)
		) {
			events.forEachIndexed { eventIndex, event ->
				EventRow(
					modifier = GlanceModifier.defaultWeight(),
					firstEventOfTheDay.eventId == event.eventId,
					currentDay,
					event,
					openCalendarAgenda(LocalContext.current, userId, currentDay, event.eventId)
				)
				// add space between elements (no spacing after the last element)
				if (eventIndex < normalEvents.size - 1) {
					Spacer(
						modifier = GlanceModifier.height(Dimensions.Spacing.SM.dp)
					)
				}
			}
		}
	}
}