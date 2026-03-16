package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.size
import de.tutao.calendar.R
import de.tutao.calendar.widget.style.Dimensions


@Composable
fun NewEventButton(clickAction: Action) {

	Box(
		contentAlignment = Alignment.Center,
		modifier = GlanceModifier
			.size(
				Dimensions.Size.core_48.dp
			)
			.clickable(rippleOverride = R.drawable.transparent_ripple, onClick = clickAction)
			.background(ImageProvider(R.drawable.btn_background))

	) {
		Image(
			provider = ImageProvider(R.drawable.ic_add),
			contentDescription = "Add event button",
			colorFilter = ColorFilter.tint(GlanceTheme.colors.onPrimary),
			modifier = GlanceModifier.size(Dimensions.Size.core_32.dp)
		)
	}

}