package de.tutao.calendar.widget.component.todayCard

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.component.Card
import de.tutao.calendar.widget.component.EventList
import de.tutao.calendar.widget.component.Header
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
		Header(allDayEvents, onNewEvent)
		if (normalEvents.isEmpty() && allDayEvents.isEmpty()) {
			Text(
				LocalContext.current.getString(R.string.widgetNoEventsToday_msg),
				style = TextStyle(
					color = GlanceTheme.colors.onBackground,
					fontSize = 16.sp,
					textAlign = TextAlign.Center
				),
				modifier = GlanceModifier.padding(Dimensions.Spacing.SM.dp).fillMaxWidth()
			)
		} else if (normalEvents.isNotEmpty()) {
			EventList(userId, normalEvents, currentDay)
		} else {
			Spacer(modifier = GlanceModifier.height(Dimensions.Spacing.SM.dp))
		}
	}
}