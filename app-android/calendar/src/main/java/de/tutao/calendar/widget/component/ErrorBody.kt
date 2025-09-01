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
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import de.tutao.calendar.R
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorHandler
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.calendar.widget.style.Dimensions


@Composable
fun ErrorBody(error: WidgetError?, logsAction: Action, loginAction: Action) {
	Column(
		modifier = GlanceModifier.padding(Dimensions.Spacing.MD.dp)
			.background(GlanceTheme.colors.background)
			.fillMaxSize()
			.appWidgetBackground()
			.cornerRadius(Dimensions.Spacing.SM.dp),
		verticalAlignment = Alignment.CenterVertically,
		horizontalAlignment = Alignment.CenterHorizontally
	) {
		if (error == null) {
			return@Column LoadingSpinner()
		}

		Column(
			verticalAlignment = Alignment.CenterVertically,
			horizontalAlignment = Alignment.CenterHorizontally
		) {
			Image(
				provider = ImageProvider(R.drawable.error),
				contentDescription = null,
				contentScale = ContentScale.Fit,
				modifier = GlanceModifier.fillMaxWidth().defaultWeight()
			)
			Text(
				WidgetErrorHandler.getErrorMessage(LocalContext.current, error),
				style = TextStyle(
					fontSize = 14.sp,
					color = GlanceTheme.colors.onBackground,
					textAlign = TextAlign.Center,
					fontWeight = FontWeight.Normal
				),
				maxLines = 2,
				modifier = GlanceModifier.padding(vertical = 16.dp)
			)
			ErrorButton(error, if (error.type == WidgetErrorType.CREDENTIALS) loginAction else logsAction)
		}
	}
}