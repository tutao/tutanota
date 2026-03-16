package de.tutao.calendar.widget.component.allDayRow;

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.layout.Alignment
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.width
import androidx.glance.layout.wrapContentWidth
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions


@Composable
fun AllDayRow(allDayEvents: List<UIEvent>) {
	Row(
		verticalAlignment = Alignment.CenterVertically,
		horizontalAlignment = Alignment.Start,
	) {
		AllDayIcon(allDayEvents)
		Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.space_4.dp))
		Text(
			style = TextStyle(
				color = GlanceTheme.colors.secondary,
				fontSize = Dimensions.FontSize.font_12.sp
			),
			maxLines = 1,
			text = allDayEvents.first().summary.ifEmpty { LocalContext.current.getString(R.string.noTitle_label) },
			modifier = GlanceModifier.defaultWeight()
		)
		if (allDayEvents.size > 1) {
			Spacer(modifier = GlanceModifier.width(Dimensions.Spacing.space_4.dp))
			Text(
				"+${allDayEvents.size - 1}", style = TextStyle(
					color = GlanceTheme.colors.secondary,
					fontSize = Dimensions.FontSize.font_12.sp,
					fontWeight = FontWeight.Bold
				),
				maxLines = 1,
				modifier = GlanceModifier.wrapContentWidth()
			)
		}
	}

}
