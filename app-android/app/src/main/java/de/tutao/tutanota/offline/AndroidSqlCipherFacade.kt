package de.tutao.tutanota.offline

import android.content.Context
import android.database.Cursor
import android.util.Log
import de.tutao.tutanota.ipc.DataWrapper
import de.tutao.tutanota.ipc.SqlCipherFacade
import de.tutao.tutanota.ipc.wrap
import net.sqlcipher.database.SQLiteDatabase
import java.io.File

class AndroidSqlCipherFacade(private val context: Context) : SqlCipherFacade {
	init {
		SQLiteDatabase.loadLibs(context)
	}

	private var database: SQLiteDatabase? = null

	override suspend fun openDb(userId: String, dbKey: DataWrapper) {
		if (database != null) {
			Log.w(TAG, "opening new database while old one is open")
			closeDb()
		}
		database = SQLiteDatabase.openOrCreateDatabase(getDbFile(userId).path, dbKey.data, null)
	}

	private fun getDbFile(userId: String): File {
		val dbFile = context.getDatabasePath("offline_$userId.sqlite")
		dbFile.parentFile!!.mkdirs()
		if (!dbFile.parentFile!!.exists()) {
			Log.e(TAG, "could not create db path at ${dbFile.path}")
		}
		return dbFile
	}

	override suspend fun closeDb() {
		database?.close()
		database = null
	}

	override suspend fun deleteDb(userId: String) {
		try {
			closeDb()
		} finally {
			getDbFile(userId).delete()
		}
	}

	override suspend fun run(query: String, params: List<TaggedSqlValue>) {
		database!!.execSQL(query, params.prepare())
	}

	override suspend fun get(query: String, params: List<TaggedSqlValue>): Map<String, TaggedSqlValue>? {
		return database!!.query(query, params.prepare()).use { cursor ->
			if (cursor.moveToNext()) {
				cursor.readRow()
			} else {
				null
			}
		}
	}

	private fun Cursor.readRow(): MutableMap<String, TaggedSqlValue> {
		val columnNames = columnNames
		val result = mutableMapOf<String, TaggedSqlValue>()
		for (name in columnNames) {
			val index = getColumnIndex(name)
			result[name] = when (val type = getType(index)) {
				Cursor.FIELD_TYPE_NULL -> TaggedSqlValue.Null
				Cursor.FIELD_TYPE_BLOB -> TaggedSqlValue.Bytes(getBlob(index).wrap())
				Cursor.FIELD_TYPE_INTEGER -> TaggedSqlValue.Num(getInt(index))
				Cursor.FIELD_TYPE_STRING -> TaggedSqlValue.Str(getString(index))
				else -> error("SQL type is not supported: $type")
			}
		}
		return result
	}

	override suspend fun all(query: String, params: List<TaggedSqlValue>): List<Map<String, TaggedSqlValue>> {
		return database!!.query(query, params.prepare()).use { cursor ->
			buildList {
				while (cursor.moveToNext()) {
					add(cursor.readRow())
				}
			}
		}
	}

	private fun List<TaggedSqlValue>.prepare() = map { it.unwrap() }.toTypedArray()
}

const val TAG = "AndroidSqlCipherFacade"