package de.tutao.tutashared.widget

import android.content.Context

interface WidgetRefreshable {
	@Throws
	suspend fun refresh(context: Context)
}