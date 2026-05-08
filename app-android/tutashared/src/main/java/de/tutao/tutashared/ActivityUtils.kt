package de.tutao.tutashared

import android.content.Intent
import android.print.PrintDocumentAdapter

interface ActivityUtils {
	suspend fun startActivityForResult(intent: Intent): ActivityResult
	suspend fun getPermission(permission: String)
	fun hasPermission(permission: String): Boolean
	fun createPrintDocumentAdapter(jobName: String): PrintDocumentAdapter
	suspend fun requestBatteryOptimizationPermission()
	fun hasBatteryOptimizationPermission(): Boolean
}