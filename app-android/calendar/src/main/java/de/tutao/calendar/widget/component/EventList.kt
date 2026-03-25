package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.layout.Column
import androidx.glance.layout.padding
import de.tutao.calendar.widget.component.eventCard.EventRow
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.model.openCalendarAgenda
import de.tutao.calendar.widget.style.Dimensions
import java.time.LocalDateTime


@Composable
fun EventList(
	userId: String?,
	normalEvents: List<UIEvent>,
	currentDay: LocalDateTime,
	paddingEndForFirstElement: Int = 0
) {
	// we need to chunk events because columns  can only have 10 children
	val chunked = normalEvents.chunked(10)

	Column {
		chunked.forEachIndexed { chunkIndex, events ->
			Column {
				events.forEachIndexed { elementIndexInChunk, event ->
					var paddingEnd = 0
					if (chunkIndex + elementIndexInChunk == 0) {
						paddingEnd = paddingEndForFirstElement
					}

					EventRow(
						modifier = GlanceModifier.defaultWeight()
							.padding(
								top = Dimensions.Spacing.space_4.dp,
								bottom = Dimensions.Spacing.space_4.dp,
								end = paddingEnd.dp
							),
						event,
						openEventAction = openCalendarAgenda(LocalContext.current, userId, currentDay, event.eventId)
					)
				}
			}
		}
	}
}