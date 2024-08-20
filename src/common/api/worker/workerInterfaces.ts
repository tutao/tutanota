import { EventBusClient } from "./EventBusClient.js"
import { LoginFacade, LoginListener } from "./facades/LoginFacade.js"
import { WebsocketConnectivityListener } from "../../misc/WebsocketConnectivityModel.js"
import { ExposedProgressTracker } from "../main/ProgressTracker.js"
import { ExposedEventController } from "../main/EventController.js"
import { ExposedOperationProgressTracker } from "../main/OperationProgressTracker.js"
import { InfoMessageHandler } from "../../gui/InfoMessageHandler.js"
import { CustomerFacade } from "./facades/lazy/CustomerFacade.js"
import { GiftCardFacade } from "./facades/lazy/GiftCardFacade.js"
import { GroupManagementFacade } from "./facades/lazy/GroupManagementFacade.js"
import { ConfigurationDatabase } from "./facades/lazy/ConfigurationDatabase.js"
import { CalendarFacade } from "./facades/lazy/CalendarFacade.js"
import { MailFacade } from "./facades/lazy/MailFacade.js"
import { ShareFacade } from "./facades/lazy/ShareFacade.js"
import { CacheManagementFacade } from "./facades/lazy/CacheManagementFacade.js"
import { CounterFacade } from "./facades/lazy/CounterFacade.js"
import { BookingFacade } from "./facades/lazy/BookingFacade.js"
import { MailAddressFacade } from "./facades/lazy/MailAddressFacade.js"
import { BlobAccessTokenFacade } from "./facades/BlobAccessTokenFacade.js"
import { BlobFacade } from "./facades/lazy/BlobFacade.js"
import { UserManagementFacade } from "./facades/lazy/UserManagementFacade.js"
import { RecoverCodeFacade } from "./facades/lazy/RecoverCodeFacade.js"
import { EntityRestInterface } from "./rest/EntityRestClient.js"
import { IServiceExecutor } from "../common/ServiceRequest.js"
import { CryptoFacade } from "./crypto/CryptoFacade.js"
import { ExposedCacheStorage } from "./rest/DefaultEntityRestCache.js"
import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { EntropyFacade } from "./facades/EntropyFacade.js"
import { WorkerFacade } from "./facades/WorkerFacade.js"
import { ContactFacade } from "./facades/lazy/ContactFacade.js"

export interface WorkerRandomizer {
	generateRandomNumber(numBytes: number): Promise<number>
}

export interface ExposedEventBus {
	tryReconnect: EventBusClient["tryReconnect"]
	close: EventBusClient["close"]
}

/** Interface for the "main"/webpage context of the app, interface for the worker client. */
export interface MainInterface {
	readonly loginListener: LoginListener
	readonly wsConnectivityListener: WebsocketConnectivityListener
	readonly progressTracker: ExposedProgressTracker
	readonly eventController: ExposedEventController
	readonly operationProgressTracker: ExposedOperationProgressTracker
	readonly infoMessageHandler: InfoMessageHandler
}

/** Interface of the facades exposed by the worker, basically interface for the worker itself */
export interface CommonWorkerInterface {
	readonly loginFacade: LoginFacade
	readonly customerFacade: CustomerFacade
	readonly giftCardFacade: GiftCardFacade
	readonly groupManagementFacade: GroupManagementFacade
	readonly configFacade: ConfigurationDatabase
	readonly calendarFacade: CalendarFacade
	readonly mailFacade: MailFacade
	readonly shareFacade: ShareFacade
	readonly cacheManagementFacade: CacheManagementFacade
	readonly counterFacade: CounterFacade
	readonly bookingFacade: BookingFacade
	readonly mailAddressFacade: MailAddressFacade
	readonly blobAccessTokenFacade: BlobAccessTokenFacade
	readonly blobFacade: BlobFacade
	readonly userManagementFacade: UserManagementFacade
	readonly recoverCodeFacade: RecoverCodeFacade
	readonly restInterface: EntityRestInterface
	readonly serviceExecutor: IServiceExecutor
	readonly cryptoFacade: CryptoFacade
	readonly cacheStorage: ExposedCacheStorage
	readonly sqlCipherFacade: SqlCipherFacade
	readonly random: WorkerRandomizer
	readonly eventBus: ExposedEventBus
	readonly entropyFacade: EntropyFacade
	readonly workerFacade: WorkerFacade
	readonly contactFacade: ContactFacade
}
