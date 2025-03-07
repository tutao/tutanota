package de.tutao.calendar.widget

import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color
import androidx.glance.material3.ColorProviders

object AppTheme {
	val LightColors = lightColorScheme(
		primary = Color(0xFF013E85),
		onPrimary = Color(0xFFFFFFFF),
		secondary = Color(0xFF303030),
		onSecondary = Color(0xFF013E85),
		background = Color(0xFFF6F6F6),
		onBackground = Color(0xFF707070),
		surface = Color(0xFFFFFFFF),
		onSurface = Color(0xFF303030),
		primaryContainer = Color(0xFFF6F6F6),
		tertiary = Color(0xFF8B8B8B) // Used for ripple effects
	)

	val DarkColors = darkColorScheme(
		primary = Color(0xFFACC7FF),
		onPrimary = Color(0xFF232323),
		secondary = Color(0xFFDDDDDD),
		onSecondary = Color(0xFFACC7FF),
		background = Color(0xFF232323),
		onBackground = Color(0xFFDDDDDD),
		surface = Color(0xFF111111),
		onSurface = Color(0xFFDDDDDD),
		primaryContainer = Color(0xFF111111),
		tertiary = Color(0xFF8B8B8B) // Used for ripple effects
	)

	val colors = ColorProviders(
		light = LightColors,
		dark = DarkColors
	)
}