package de.tutao.tutashared.offline

import android.content.Context
import android.database.Cursor
import android.util.Log
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.SqlCipherFacade
import de.tutao.tutashared.ipc.wrap
import kotlinx.coroutines.CompletableDeferred
import net.sqlcipher.database.SQLiteDatabase
import java.io.File
import java.util.concurrent.ConcurrentHashMap

class AndroidSqlCipherFacade(private val context: Context) : SqlCipherFacade {
	init {
		SQLiteDatabase.loadLibs(context)
	}

	// Set db to volatile because we only wrap modifications to db in synchronized yet we still want all access
	// operations to see the latest value
	@Volatile
	private var db: SQLiteDatabase? = null
	private val openedDb: SQLiteDatabase
		get() = db ?: throw OfflineDbClosedError()

	private val listIdLocks: MutableMap<String, CompletableDeferred<Unit>> = ConcurrentHashMap()

	override suspend fun openDb(userId: String, dbKey: DataWrapper) {
		// db is volatile so we see the latest value but it doesn't mean that we won't try to open/delete it in parallel
		// so we need synchronized.
		// Wrap the whole method into synchronized to ensure that no other check or modification can happen in between
		synchronized(this) {
			if (db != null) {
				Log.w(TAG, "opening new database while old one is open")
				closeDbSync()
			}
			db = SQLiteDatabase.openOrCreateDatabase(getDbFile(userId).path, dbKey.data, null)
		}

		// We are using the auto_vacuum=incremental mode to allow for a faster vacuum execution
		// After changing the auto_vacuum mode we need to run "vacuum" once
		// auto_vacuum mode: 0 (NONE) | 1 (FULL) | 2 (INCREMENTAL)
		openedDb.query("PRAGMA auto_vacuum").use { cursor ->
			if (cursor.moveToFirst()) {
				if (cursor.getInt(0) != 2) {
					db?.query("PRAGMA auto_vacuum = incremental")
					db?.query("PRAGMA vacuum")
				}
			}
		}
	}

	private fun getDbFile(userId: String): File {
		val dbFile = context.getDatabasePath("offline_$userId.sqlite")
		dbFile.parentFile!!.mkdirs()
		if (!dbFile.parentFile!!.exists()) {
			Log.e(TAG, "could not create db path at ${dbFile.path}")
		}
		return dbFile
	}

	private fun closeDbSync() {
		// We are performing defragmentation (incremental_vacuum) the database before closing
		db?.query("PRAGMA incremental_vacuum")
		db?.close()
		db = null
	}

	override suspend fun closeDb() {
		synchronized(this) {
			this.closeDbSync()
		}
	}

	override suspend fun deleteDb(userId: String) {
		synchronized(this) {
			try {
				closeDbSync()
			} finally {
				getDbFile(userId).delete()
			}
		}
	}

	override suspend fun run(query: String, params: List<TaggedSqlValue>) {
		openedDb.execSQL(query, params.prepare())
	}

	override suspend fun get(query: String, params: List<TaggedSqlValue>): Map<String, TaggedSqlValue>? {
		return openedDb.query(query, params.prepare()).use { cursor ->
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
		return openedDb.query(query, params.prepare()).use { cursor ->
			buildList {
				while (cursor.moveToNext()) {
					add(cursor.readRow())
				}
			}
		}
	}

	/**
	 * We want to lock the access to the "ranges" db when updating / reading the
	 * offline available mail list ranges for each mail list (referenced using the listId).
	 * @param listId the mail list that we want to lock
	 */
	override suspend fun lockRangesDbAccess(listId: String): Unit {
		if (listIdLocks.containsKey(listId)) {
			listIdLocks[listId]?.await()
			listIdLocks[listId] = CompletableDeferred()
		} else {
			listIdLocks[listId] = CompletableDeferred()
		}
	}

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)".
	 * @param listId the mail list that we want to unlock
	 */
	override suspend fun unlockRangesDbAccess(listId: String) {
		val completableDeferred = listIdLocks.remove(listId)
		if (completableDeferred == null) {
			Log.w(TAG, "No deferred for the listIdLock with listId $listId")
			return
		}
		completableDeferred.complete(Unit)
	}

	private fun List<TaggedSqlValue>.prepare() = map { it.unwrap() }.toTypedArray()
}

private const val TAG = "AndroidSqlCipherFacade"

class OfflineDbClosedError : Exception()