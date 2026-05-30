import { DefaultLoginListener } from "../../../common/workerUtils/DefaultLoginListener"
import { isAdminClient, isTest, SessionType } from "@tutao/app-env"
import { CacheInfo, LoginListener } from "../../../../platform-kit/base/facades/LoginFacade"
import { Credentials } from "@tutao/network/types"
import { locator } from "./WorkerLocator"
import type { WorkerImpl } from "./WorkerImpl"
import { assertNotNull, delay, lazy } from "@tutao/utils"
import { ConnectionError, ServiceUnavailableError } from "@tutao/rest-client/error"
import { EventBusClient } from "../../../../app-kit/local-store/event/EventBusClient"
import { UserFacade } from "../../../../platform-kit/base/facades/UserFacade"

export class MailLoginListener extends DefaultLoginListener {
	constructor(
		eventBusClient: lazy<EventBusClient>,
		mainLoginListener: LoginListener,
		userFacade: UserFacade,
		private readonly worker: WorkerImpl,
	) {
		super(eventBusClient, mainLoginListener, userFacade)
	}

	async onPartialLoginSuccess(sessionType: SessionType, _cacheInfo: CacheInfo, _credentials: Credentials): Promise<void> {
		if (!isTest() && sessionType !== SessionType.Temporary && !isAdminClient()) {
			const indexer = await locator.indexer()
			await indexer.partialLoginInit()
		}
		await super.onPartialLoginSuccess(sessionType, _cacheInfo, _credentials)
	}

	async onFullLoginSuccess(sessionType: SessionType, cacheInfo: CacheInfo, credentials: Credentials): Promise<void> {
		if (!isTest() && sessionType !== SessionType.Temporary && !isAdminClient()) {
			// index new items in background
			console.log("initIndexer and SpamClassifier after log in")
			await fullLoginIndexerInit(this.worker)
		}

		await super.onFullLoginSuccess(sessionType, cacheInfo, credentials)
	}
}

const RETRY_TIMEOUT_AFTER_INIT_INDEXER_ERROR_MS = 30000

async function fullLoginIndexerInit(worker: WorkerImpl): Promise<void> {
	const indexer = await locator.indexer()
	try {
		await indexer.fullLoginInit({
			user: assertNotNull(locator.base.user.getUser()),
		})
	} catch (e) {
		if (e instanceof ServiceUnavailableError) {
			console.log("Retry init indexer in 30 seconds after ServiceUnavailableError")
			await delay(RETRY_TIMEOUT_AFTER_INIT_INDEXER_ERROR_MS)
			console.log("_initIndexer after ServiceUnavailableError")
			return fullLoginIndexerInit(worker)
		} else if (e instanceof ConnectionError) {
			console.log("Retry init indexer in 30 seconds after ConnectionError")
			await delay(RETRY_TIMEOUT_AFTER_INIT_INDEXER_ERROR_MS)
			console.log("_initIndexer after ConnectionError")
			return fullLoginIndexerInit(worker)
		} else {
			console.log("send indexer error to main thread", e)
			// not awaiting
			// noinspection ES6MissingAwait
			worker.sendError(e)
			return
		}
	}
}
