import { EventBusClient } from "../../../../platform-kits/network/EventBusClient.js"
import { LoginFacade, LoginListener } from "../../../../platform-kits/base/facades/LoginFacade.js"
import { ExposedProgressTracker } from "../main/ProgressTracker.js"
import { ExposedEventController } from "../main/EventController.js"
import { ExposedOperationProgressTracker } from "../main/OperationProgressTracker.js"
import { InfoMessageHandler } from "../../gui/InfoMessageHandler.js"
import { CustomerFacade } from "./facades/lazy/CustomerFacade.js"
import { GiftCardFacade } from "./facades/lazy/GiftCardFacade.js"
import { GroupManagementFacade } from "../../../../platform-kits/base/facades/lazy/GroupManagementFacade.js"
import { ConfigurationDatabase } from "./facades/lazy/ConfigurationDatabase.js"
import { CalendarFacade } from "./facades/lazy/CalendarFacade.js"
import { MailFacade } from "./facades/lazy/MailFacade.js"
import { ShareFacade } from "../../../../platform-kits/base/facades/lazy/ShareFacade.js"
import { CacheManagementFacade } from "./facades/lazy/CacheManagementFacade.js"
import { CounterFacade } from "../../../../platform-kits/network/CounterFacade.js"
import { BookingFacade } from "./facades/lazy/BookingFacade.js"
import { MailAddressFacade } from "./facades/lazy/MailAddressFacade.js"
import { BlobAccessTokenFacade } from "../../../../platform-kits/network/BlobAccessTokenFacade.js"
import { BlobFacade } from "./facades/lazy/BlobFacade.js"
import { UserManagementFacade } from "./facades/lazy/UserManagementFacade.js"
import { RecoverCodeFacade } from "../../../../platform-kits/base/facades/lazy/RecoverCodeFacade.js"
import { IServiceExecutor } from "../../../../platform-kits/network/ServiceRequest.js"
import { CryptoFacade } from "../../../../platform-kits/base/crypto/CryptoFacade.js"
import { SqlCipherFacade } from "../../../../app-kits/native-bridge/common/generatedipc/types"
import { EntropyFacade } from "../../../../platform-kits/base/facades/EntropyFacade.js"
import { WorkerFacade } from "./facades/WorkerFacade.js"
import { ContactFacade } from "./facades/lazy/ContactFacade.js"
import { SyncTracker } from "../main/SyncTracker.js"
import { KeyVerificationFacade } from "../../../../platform-kits/base/facades/lazy/KeyVerificationFacade"
import { ApplicationTypesFacade } from "@tutao/instance-pipeline"
import PublicEncryptionKeyProvider from "../../../../platform-kits/base/crypto/PublicEncryptionKeyProvider"
import { IdentityKeyCreator } from "../../../../platform-kits/base/crypto/IdentityKeyCreator"
import { PublicIdentityKeyProvider } from "../../../../platform-kits/base/crypto/PublicIdentityKeyProvider"
import { DriveFacade } from "./facades/lazy/DriveFacade"
import { TransferProgressDispatcher } from "../main/TransferProgressDispatcher"
import { ExposedCacheStorage } from "../../../../app-kits/local-store/CacheStorage"
import { assertMainOrNode } from "@tutao/app-env"
import { WebsocketConnectivityListener } from "../../../../platform-kits/network/WebsocketConnectivityListener"
import { EntityRestInterface } from "../../../../platform-kits/network/EntityRestCacheInterface"
import { AlarmFacade } from "./facades/lazy/AlarmFacade"

assertMainOrNode()

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
	readonly syncTracker: SyncTracker
	readonly uploadProgressListener: TransferProgressDispatcher
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
	readonly keyVerificationFacade: KeyVerificationFacade
	readonly publicEncryptionKeyProvider: PublicEncryptionKeyProvider
	readonly publicIdentityKeyProvider: PublicIdentityKeyProvider
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
	readonly applicationTypesFacade: ApplicationTypesFacade
	readonly identityKeyCreator: IdentityKeyCreator
	readonly driveFacade: DriveFacade
	readonly alarmFacade: AlarmFacade
}
