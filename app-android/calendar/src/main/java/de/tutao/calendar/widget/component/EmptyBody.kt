package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.wrapContentHeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.model.openCalendarAgenda
import de.tutao.calendar.widget.style.Dimensions
import kotlin.random.Random

@Composable
fun EmptyBody(
	openCalendarEditorAction: Action,
	userId: String?
) {
	Box(modifier = GlanceModifier.fillMaxSize(), contentAlignment = Alignment.TopEnd) {
		NewEventButton(clickAction = openCalendarEditorAction)
		Column(
			modifier = GlanceModifier
				.clickable(openCalendarAgenda(LocalContext.current, userId))
				.padding(
					vertical = Dimensions.Spacing.space_8.dp,
					horizontal = Dimensions.Spacing.space_12.dp
				)
		) {
			TodayWithWeekday()
			Column(
				verticalAlignment = Alignment.CenterVertically,
				horizontalAlignment = Alignment.CenterHorizontally,
				modifier = GlanceModifier.fillMaxSize()
			) {
				Text(
					LocalContext.current.getString(R.string.widgetNoEvents_msg),
					style = TextStyle(
						color = GlanceTheme.colors.onBackground,
						fontSize = Dimensions.FontSize.font_16.sp,
					),
					modifier = GlanceModifier.padding(start = Dimensions.Spacing.space_8.dp, bottom = 0.dp)
				)
				Spacer(modifier = GlanceModifier.height(Dimensions.Spacing.space_16.dp))
				Image(
					provider = ImageProvider(getEmptyResource()),
					contentDescription = null,
					contentScale = ContentScale.Fit,
					modifier = GlanceModifier.defaultWeight().wrapContentHeight()
				)
			}
		}
	}
}


private fun getEmptyResource(): Int {
	return if (Random.nextBoolean()) {
		R.drawable.dog
	} else {
		R.drawable.music
	}
}