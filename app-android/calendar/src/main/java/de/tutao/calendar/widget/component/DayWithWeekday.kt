package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle

@Composable
fun DayWithWeekday(dateModifier: GlanceModifier, day: String, weekday: String) {
	Row(
		horizontalAlignment = Alignment.CenterHorizontally,
		verticalAlignment = Alignment.Vertical.CenterVertically,
		modifier = dateModifier.width(32.dp)
	) {
		Column(
			horizontalAlignment = Alignment.CenterHorizontally
		) {
			Text(
				style = TextStyle(
					fontWeight = FontWeight.Bold,
					fontSize = 22.sp,
					color = GlanceTheme.colors.secondary

				),
				text = day,
				maxLines = 1,
				modifier = GlanceModifier.padding(bottom = (-4).dp)
			)
			Text(
				style = TextStyle(
					fontSize = 12.sp,
					color = GlanceTheme.colors.secondary
				),
				text = weekday,
				maxLines = 1,
				modifier = GlanceModifier.padding(top = (-4).dp)
			)
		}
	}
}