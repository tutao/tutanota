package de.tutao.calendar.widget.component.otherDayCard

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.widget.style.Dimensions
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
fun DayWithWeekday(currentDate: LocalDateTime) {
	val day = currentDate.format(DateTimeFormatter.ofPattern("dd"))
	val weekday = currentDate.format(DateTimeFormatter.ofPattern("EE"))
	Column(
		horizontalAlignment = Alignment.CenterHorizontally,
		verticalAlignment = Alignment.Vertical.CenterVertically,
		modifier = GlanceModifier.width(Dimensions.Size.core_32.dp)
	) {
		Text(
			style = TextStyle(
				fontWeight = FontWeight.Bold,
				fontSize = Dimensions.FontSize.font_20.sp,
				color = GlanceTheme.colors.secondary

			),
			text = day,
			maxLines = 1,
			modifier = GlanceModifier.padding(bottom = (-4).dp)
		)
		Text(
			style = TextStyle(
				fontSize = Dimensions.FontSize.font_12.sp,
				color = GlanceTheme.colors.secondary
			),
			text = weekday,
			maxLines = 1,
		)
	}
}