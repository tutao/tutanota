package de.tutao.tutashared

import android.content.Intent
import android.print.PrintDocumentAdapter
import androidx.annotation.RequiresPermission

interface AsyncActivityUtils {
	suspend fun startActivityForResult(@RequiresPermission intent: Intent?): ActivityResult
	suspend fun getPermission(permission: String)
	fun hasPermission(permission: String): Boolean
	fun createPrintDocumentAdapter(jobName: String): PrintDocumentAdapter
	suspend fun requestBatteryOptimizationPermission()
	fun hasBatteryOptimizationPermission(): Boolean
}