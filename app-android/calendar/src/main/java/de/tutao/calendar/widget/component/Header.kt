package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.wrapContentHeight
import androidx.glance.layout.wrapContentWidth
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Composable
fun Header(
	allDayEvents: List<UIEvent>,
	onNewEvent: Action,
) {
	val hasAllDayEvents = allDayEvents.isNotEmpty()
	val titleBottomPadding = if (hasAllDayEvents) 0.dp else (-Dimensions.Spacing.SM).dp
	val dateNow = LocalDateTime.now()

	Row(
		verticalAlignment = Alignment.Top,
		modifier = GlanceModifier
			.fillMaxWidth()
			.padding(bottom = Dimensions.Spacing.SM.dp)
	) {
		Column(
			modifier = GlanceModifier
				.defaultWeight()
				.padding(
					start = (Dimensions.Spacing.SM).dp,
					top = (if (hasAllDayEvents) Dimensions.Spacing.XS else 0).dp
				)
		) {
			Text(
				style = TextStyle(
					fontWeight = FontWeight.Bold,
					fontSize = if (hasAllDayEvents) 20.sp else 32.sp,
					color = GlanceTheme.colors.secondary
				),
				text = dateNow.format(DateTimeFormatter.ofPattern(if (hasAllDayEvents) "EEEE dd" else "dd")),
				maxLines = 1,
				modifier = GlanceModifier.defaultWeight().wrapContentHeight()
					.padding(bottom = titleBottomPadding)
			)

			val subTitle = if (hasAllDayEvents) {
				allDayEvents.first().summary.ifEmpty { LocalContext.current.getString(R.string.widgetNoEvents_msg) }
			} else {
				dateNow.format(DateTimeFormatter.ofPattern("EEEE"))
			}

			Row(
				modifier = GlanceModifier.defaultWeight(),
				verticalAlignment = Alignment.CenterVertically
			) {
				if (hasAllDayEvents) {
					AllDayIcon(allDayEvents)
				}

				Row {
					Text(
						style = TextStyle(
							color = GlanceTheme.colors.secondary,
							fontSize = 12.sp
						),
						maxLines = 1,
						text = subTitle,
						modifier = GlanceModifier.padding(start = if (hasAllDayEvents) 4.dp else 0.dp)
							.defaultWeight()
					)

					if (allDayEvents.size > 1) {
						Text(
							"+${allDayEvents.size - 1}", style = TextStyle(
								color = GlanceTheme.colors.secondary,
								fontSize = 12.sp,
								fontWeight = FontWeight.Bold
							),
							maxLines = 1,
							modifier = GlanceModifier.padding(start = Dimensions.Spacing.SM.dp)
								.defaultWeight()
								.wrapContentWidth()
						)
					}
				}
			}
		}
		Row( // add event button row
			modifier = GlanceModifier.defaultWeight().wrapContentWidth(),
			horizontalAlignment = Alignment.End
		) {
			Box(
				contentAlignment = Alignment.Center,
				modifier = GlanceModifier
					.size(Dimensions.Size.XL.dp)
					.clickable(rippleOverride = R.drawable.transparent_ripple, onClick = onNewEvent)
					.background(ImageProvider(R.drawable.btn_background))

			) {
				Image(
					provider = ImageProvider(R.drawable.ic_add),
					contentDescription = "Add event button",
					colorFilter = ColorFilter.tint(GlanceTheme.colors.onPrimary),
					modifier = GlanceModifier.size(Dimensions.Size.MD.dp)
				)
			}
		}
	}
}