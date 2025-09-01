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
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.layout.wrapContentHeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.style.Dimensions
import kotlin.random.Random

@Composable
fun EmptyBody(
	data: WidgetUIData,
	firstDay: Long,
	headerCallback: Action,
	newEventCallback: Action
) {
	Column(
		verticalAlignment = Alignment.Vertical.CenterVertically,
		horizontalAlignment = Alignment.CenterHorizontally,
		modifier = GlanceModifier
			.fillMaxSize()
	) {
		Column(
			modifier = GlanceModifier.fillMaxWidth().defaultWeight().fillMaxHeight(),
			verticalAlignment = Alignment.CenterVertically,
			horizontalAlignment = Alignment.CenterHorizontally
		) {
			Text(
				LocalContext.current.getString(R.string.widgetNoEvents_msg),
				style = TextStyle(
					fontSize = 16.sp,
					color = GlanceTheme.colors.onBackground,
					textAlign = TextAlign.Center
				),
				maxLines = 2,
				modifier = GlanceModifier.padding(bottom = Dimensions.Spacing.MD.dp, top = 4.dp)
			)
			Image(
				provider = ImageProvider(getEmptyResource()),
				contentDescription = null,
				contentScale = ContentScale.Fit,
				modifier = GlanceModifier.fillMaxWidth().defaultWeight().wrapContentHeight()
			)
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