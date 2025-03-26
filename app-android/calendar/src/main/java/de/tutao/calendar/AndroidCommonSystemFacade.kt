package de.tutao.calendar

import de.tutao.tutashared.TempDir
import de.tutao.tutashared.getLogcat
import de.tutao.tutashared.ipc.CommonSystemFacade
import de.tutao.tutashared.ipc.SqlCipherFacade
import kotlinx.coroutines.CompletableDeferred

class AndroidCommonSystemFacade(
	private val activity: MainActivity,
	private val sqlCipherFacade: SqlCipherFacade,
	private val tempDir: TempDir
) : CommonSystemFacade {

	@Volatile
	private var webAppInitialized = CompletableDeferred<Unit>()

	val initialized: Boolean
		get() = webAppInitialized.isCompleted

	override suspend fun initializeRemoteBridge() {
		this.webAppInitialized.complete(Unit)
	}

	override suspend fun reload(query: Map<String, String>) {
		this.sqlCipherFacade.closeDb()
		this.webAppInitialized = CompletableDeferred()
		activity.reload(query)
	}

	override suspend fun getLog(): String {
		return getLogcat(tempDir.root)
	}

	suspend fun awaitForInit() {
		webAppInitialized.await()
	}
}