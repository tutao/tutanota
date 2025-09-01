package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.appwidget.CircularProgressIndicator
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.width

@Composable
fun LoadingSpinner() {
	Column(
		verticalAlignment = Alignment.CenterVertically,
		horizontalAlignment = Alignment.CenterHorizontally,
		modifier = GlanceModifier.fillMaxSize().background(GlanceTheme.colors.background)
	) {
		CircularProgressIndicator(
			modifier = GlanceModifier.width(48.dp),
			color = GlanceTheme.colors.primary,
		)
	}
}
