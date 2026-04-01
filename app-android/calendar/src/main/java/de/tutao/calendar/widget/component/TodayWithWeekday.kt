package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceTheme
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.widget.style.Dimensions
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun TodayWithWeekday() {
	Text(
		style = TextStyle(
			fontWeight = FontWeight.Bold,
			fontSize = Dimensions.FontSize.font_20.sp,
			color = GlanceTheme.colors.secondary
		),
		text = LocalDate.now().format(DateTimeFormatter.ofPattern("dd EEEE")),
		maxLines = 1,
	)
}