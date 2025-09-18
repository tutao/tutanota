package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.graphics.ColorUtils
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.wrapContentWidth
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.AppTheme
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.calendar.widget.style.generateColorProviderForColor
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.parseColor

@Composable
fun AllDaySection(allDayEvents: List<UIEvent>) {
	Row(
		modifier = GlanceModifier
			.padding(Dimensions.Spacing.MD.dp, Dimensions.Spacing.SM.dp)
			.fillMaxWidth()
			.background(GlanceTheme.colors.surfaceVariant),
		verticalAlignment = Alignment.CenterVertically
	) {
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
			modifier = GlanceModifier
				.background(calendarColor)
				.cornerRadius((Dimensions.Size.SM / 2).dp)
				.size(Dimensions.Size.SM.dp)
				.padding(padding.dp)
		) {
			Image(
				provider = ImageProvider(image),
				contentDescription = "All day event",
				colorFilter = ColorFilter.tint(allDayIconColor),
			)
		}

		Row {
			Text(
				style = TextStyle(
					color = GlanceTheme.colors.secondary,
					fontSize = 12.sp
				),
				maxLines = 1,
				text = allDayEvents.first().summary.ifEmpty { LocalContext.current.getString(R.string.noTitle_label) },
				modifier = GlanceModifier.padding(start = 4.dp)
					.defaultWeight()
			)

			if (allDayEvents.size > 1) {
				Text(
					"+${allDayEvents.size - 1}", style = TextStyle(
						color = GlanceTheme.colors.onSurfaceVariant,
						fontSize = 12.sp,
						fontWeight = FontWeight.Bold
					),
					maxLines = 1,
					modifier = GlanceModifier.padding(start = Dimensions.Spacing.SM.dp).defaultWeight()
						.wrapContentWidth()
				)
			}
		}
	}
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 80)
@Composable
fun AllDaySectionPreview() {
	AllDaySection(
		allDayEvents = listOf(
			UIEvent(
				"calendarId",
				IdTuple("list", "elemnt"),
				"dd55ff",
				"My all day",
				"",
				"",
				true,
				0L
			)
		)
	)
}


@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 80)
@Composable
fun AllDaySectionBirthdayPreview() {
	AllDaySection(
		allDayEvents = listOf(
			UIEvent(
				"calendarId",
				IdTuple("list", "elemnt"),
				"aa55ff",
				"Jane Birthday",
				"",
				"",
				true,
				0L,
				true
			)
		)
	)
}
