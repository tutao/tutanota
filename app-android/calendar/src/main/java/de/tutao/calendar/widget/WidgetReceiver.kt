package de.tutao.calendar.widget

import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

class WidgetReceiver : GlanceAppWidgetReceiver() {
	// Let MyAppWidgetReceiver know which GlanceAppWidget to use
	override val glanceAppWidget: GlanceAppWidget = VerticalWidget()
}