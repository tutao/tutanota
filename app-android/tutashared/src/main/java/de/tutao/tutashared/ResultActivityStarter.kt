package de.tutao.tutashared

import android.content.Intent
import androidx.annotation.RequiresPermission

interface AsyncActivityUtils {
	suspend fun startActivityForResult(@RequiresPermission intent: Intent?): ActivityResult
	suspend fun getPermission(permission: String)
}