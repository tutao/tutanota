package de.tutao.calendar.widget.component.otherDayCard

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import de.tutao.calendar.widget.component.allDayRow.AllDayRow
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.style.Dimensions
import de.tutao.tutashared.IdTupleCustom

@Composable
fun AllDaySection(allDayEvents: List<UIEvent>) {
	Row(
		verticalAlignment = Alignment.CenterVertically,
		modifier = GlanceModifier.padding(horizontal = Dimensions.Spacing.space_12.dp, vertical = Dimensions.Spacing.space_4.dp)
			.fillMaxWidth()
			.background(GlanceTheme.colors.surfaceVariant),
	) {
		AllDayRow(allDayEvents)

	}
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 80)
@Composable
fun AllDaySectionPreview() {
	AllDaySection(
		allDayEvents = listOf(
			UIEvent(
				"calendarId", IdTupleCustom("list", "elemnt"), "dd55ff", "My all day", "", "", true, 0L
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
				"calendarId", IdTupleCustom("list", "elemnt"), "aa55ff", "Jane Birthday", "", "", true, 0L, true
			)
		)
	)
}
