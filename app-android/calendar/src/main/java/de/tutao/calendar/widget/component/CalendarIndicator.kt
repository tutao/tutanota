package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.width


@Composable
fun CalendarIndicator(width: Int = 3, color: Color = Color.Blue) {
	Row(
		modifier = GlanceModifier
			.width(width.dp)
			.fillMaxHeight()
			.background(color)
			.cornerRadius(3.dp)
	) { }
}