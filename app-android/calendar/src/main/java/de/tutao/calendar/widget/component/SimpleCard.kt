package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxWidth
import de.tutao.calendar.widget.style.Dimensions
import java.util.Date

@Composable
fun SimpleCard(
	userId: String?,
	currentDay: Date,
	clickAction: Action,
	content: @Composable () -> Unit
) {
	Column(
		modifier = GlanceModifier
			.background(GlanceTheme.colors.surface)
			.cornerRadius(Dimensions.Spacing.SM.dp)
			.fillMaxWidth()
			.clickable(clickAction),
	) {
		content()
	}
}