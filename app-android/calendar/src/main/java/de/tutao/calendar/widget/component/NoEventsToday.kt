package de.tutao.calendar.widget.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.wrapContentHeight
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.style.Dimensions

@Composable
fun NoEventsToday() {
	Column(
		modifier = GlanceModifier
			.fillMaxWidth()
			.padding(Dimensions.Spacing.MD.dp),
		horizontalAlignment = Alignment.CenterHorizontally,
		verticalAlignment = Alignment.CenterVertically
	) {
		Text(
			LocalContext.current.getString(R.string.widgetNoEvents_msg),
			style = TextStyle(
				color = GlanceTheme.colors.onBackground,
				fontSize = 16.sp
			),
			modifier = GlanceModifier.padding(start = Dimensions.Spacing.SM.dp, bottom = 0.dp)
		)
		Spacer(modifier = GlanceModifier.height(Dimensions.Spacing.LG.dp))
		Image(
			provider = ImageProvider(R.drawable.dog),
			contentDescription = null,
			contentScale = ContentScale.Fit,
			modifier = GlanceModifier.defaultWeight().wrapContentHeight()
		)
	}
}


@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 250, heightDp = 250)
@Preview(widthDp = 600, heightDp = 350)
@Composable
fun NoEventsTodayPreview() {
	NoEventsToday()
}