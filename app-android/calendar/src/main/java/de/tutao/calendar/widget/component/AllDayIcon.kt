package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.core.graphics.ColorUtils
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Box
import androidx.glance.layout.padding
import androidx.glance.layout.size
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.AppTheme
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.calendar.widget.style.generateColorProviderForColor
import de.tutao.tutashared.parseColor

@Composable
fun AllDayIcon(allDayEvents: List<UIEvent>) {
	val calendarColor = Color(parseColor("#${allDayEvents.first().calendarColor}"))
	val isLightBg = ColorUtils.calculateLuminance(calendarColor.toArgb()) > 0.5
	val allDayIconColor =
		generateColorProviderForColor(if (isLightBg) AppTheme.LightColors.onSurface else AppTheme.DarkColors.onSurface)

	val image: Int
	val padding: Int

	if (allDayEvents.first().isBirthday) {
		image = R.drawable.ic_gift
		padding = 3
	} else {
		image = R.drawable.ic_all_day
		padding = 2
	}

	Box(
		modifier = GlanceModifier.background(calendarColor).cornerRadius(Dimensions.Size.XS.dp)
			.size(Dimensions.Size.SM.dp)
			.padding(padding.dp)
	) {
		Image(
			provider = ImageProvider(image),
			contentDescription = "All day event",
			colorFilter = ColorFilter.tint(allDayIconColor),
		)
	}
}