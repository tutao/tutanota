package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
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
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.component.allDayRow.AllDayRow
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.tutashared.IdTupleCustom
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Composable
fun Header(
	allDayEvents: List<UIEvent>,
	onNewEvent: Action,
) {

	Row(
		verticalAlignment = Alignment.Top,
		modifier = GlanceModifier
			.fillMaxWidth()
	) {
		Column(
			modifier = GlanceModifier
				.defaultWeight()
				.padding(
					start = Dimensions.Spacing.MD.dp,
					top = Dimensions.Spacing.XS.dp
				)
		) {
			Text(
				style = TextStyle(
					fontWeight = FontWeight.Bold,
					fontSize = 20.sp,
					color = GlanceTheme.colors.secondary
				),
				text = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd EEEE")),
				maxLines = 1,
				modifier = GlanceModifier.defaultWeight().wrapContentHeight()
			)

			if (allDayEvents.isNotEmpty()) {
				AllDayRow(allDayEvents)
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

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 80)
@Composable
fun HeaderPreview() {
	Header(allDayEvents = listOf(), onNewEvent = actionRunCallback<ActionCallback>())
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 80)
@Composable
fun HeaderWIthAllDayPreview() {
	Header(
		allDayEvents = listOf(
			UIEvent(
				"calendarId",
				IdTupleCustom("list", "elemnt"),
				"dd55ff",
				"My all day",
				"",
				"",
				true,
				0L
			)
		), onNewEvent = actionRunCallback<ActionCallback>()
	)
}


@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 80)
@Composable
fun HeaderWIthAllDayBirthdayPreview() {
	Header(
		allDayEvents = listOf(
			UIEvent(
				"calendarId",
				IdTupleCustom("list", "elemnt"),
				"AA55ff",
				"My all day",
				"",
				"",
				true,
				0L,
				true
			)
		), onNewEvent = actionRunCallback<ActionCallback>()
	)
}


@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 80)
@Composable
fun HeaderWIthAllDayNoTitlePreview() {
	Header(
		allDayEvents = listOf(
			UIEvent(
				"calendarId",
				IdTupleCustom("list", "elemnt"),
				"AAddff",
				"",
				"",
				"",
				true,
				0L,
				true
			)
		), onNewEvent = actionRunCallback<ActionCallback>()
	)
}