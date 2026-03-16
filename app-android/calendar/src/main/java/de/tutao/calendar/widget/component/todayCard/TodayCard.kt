package de.tutao.calendar.widget.component.todayCard

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.component.Card
import de.tutao.calendar.widget.component.EventList
import de.tutao.calendar.widget.component.NewEventButton
import de.tutao.calendar.widget.component.TodayWithWeekday
import de.tutao.calendar.widget.component.allDayRow.AllDayRow
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions
import java.time.LocalDateTime

@Composable
fun TodayCard(
	userId: String?,
	normalEvents: List<UIEvent>,
	allDayEvents: List<UIEvent>,
	cardAction: Action,
	currentDay: LocalDateTime,
	onNewEvent: Action
) {

	Card(cardAction) {
		Box(modifier = GlanceModifier.fillMaxWidth(), contentAlignment = Alignment.TopEnd) {
			NewEventButton(onNewEvent)
			Column(
				modifier = GlanceModifier.padding(
					vertical = Dimensions.Spacing.space_8.dp,
					horizontal = Dimensions.Spacing.space_12.dp
				).fillMaxWidth()
			) {
				TodayWithWeekday()
				if (normalEvents.isEmpty() && allDayEvents.isEmpty()) {
					Text(
						LocalContext.current.getString(R.string.widgetNoEventsToday_msg),
						style = TextStyle(
							color = GlanceTheme.colors.onBackground,
							fontSize = Dimensions.FontSize.font_12.sp,
							textAlign = TextAlign.Center
						),
						modifier = GlanceModifier.fillMaxWidth()
					)
				} else {
					if (allDayEvents.isNotEmpty()) {
						Row(modifier = GlanceModifier.padding(end = (Dimensions.Size.core_48 + Dimensions.Spacing.space_4).dp)) {
							AllDayRow(allDayEvents)
						}
					}
					EventList(
						userId,
						normalEvents,
						currentDay,
						paddingEndForFirstElement = if (allDayEvents.isEmpty()) Dimensions.Size.core_48 else 0
					)
				}
			}
		}
	}
}