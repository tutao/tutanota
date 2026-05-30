/**
 * PlatformKit integration example: creates a BaseLocator, logs in, fetches the most recent INBOX mail.
 * Launched by runExamples.ts which sets up the environment first.
 */
import type { BaseLocator } from "../../src/platform-kit/base/BaseLocator.js"
import type { LoginListener } from "../../src/platform-kit/base/facades/LoginFacade.js"
import type { MainInterface } from "../../src/applications/common/api/worker/workerInterfaces.js"
import type { IdentityKeyTrustDatabase } from "../../src/platform-kit/base/crypto/persistence/IdentityKeyTrustDatabase.js"
import type { NativeInterface } from "../../src/app-kit/native-bridge/common/NativeInterface.js"
import type { BrowserData } from "../../src/platform-kit/app-env/boot/ClientConstants.js"
import type { NamedClientModel } from "../../src/platform-kit/instance-pipeline"

import { createBaseLocator } from "../../src/platform-kit/base/BaseLocator.js"
import { ClientPlatform } from "../../src/platform-kit/app-env/boot/ClientDetector.js"
import { SessionType } from "../../src/platform-kit/app-env"
import { MailBoxTypeRef, MailTypeRef, MailboxGroupRootTypeRef } from "../../src/entities/tutanota/TypeRefs.js"
import { tutanotaModelInfo, tutanotaTypeModels } from "../../src/entities/tutanota"
import { baseModelInfo, baseTypeModels } from "../../src/entities/base"
import { sysModelInfo, sysTypeModels } from "../../src/entities/sys"
import { driveModelInfo, driveTypeModels } from "../../src/entities/drive"
import { storageModelInfo, storageTypeModels } from "../../src/entities/storage"
import { monitorModelInfo, monitorTypeModels } from "../../src/entities/monitor"
import { usageModelInfo, usageTypeModels } from "../../src/entities/usage"
import { accountingModelInfo, accountingTypeModels } from "../../src/entities/accounting"
import { AppNameEnum } from "../../src/platform-kit/meta/TypeRef.js"
import { lazyMemoized } from "../../src/platform-kit/utils"
import { GENERATED_MAX_ID } from "../../src/platform-kit/meta/EntityUtils.js"
import { GroupType } from "../../src/entities/sys/Utils.js"
import { LateInitializedCacheStorageImpl } from "../../src/app-kit/local-store/CacheStorageProxy.js"
import { EphemeralCacheStorage } from "../../src/app-kit/local-store/EphemeralCacheStorage.js"
import { CustomCacheHandlerMap } from "../../src/app-kit/local-store/CustomCacheHandler.js"
import { NoOpLastProcessedEventBatchStorageFacade } from "../../src/applications/common/api/worker/LastProcessedEventBatchStorageFacade.js"
import { loadWasmFromFileOrNetwork } from "../../src/platform-kit/utils/WebAssembly.js"
import { generateKeyFromPassphraseArgon2id, type Argon2IDExports } from "../../src/platform-kit/crypto"
import { RsaWeb } from "../../src/app-kit/native-bridge/worker/RsaImplementation.js"
import { TutanotaEntityMigrator } from "../../src/applications/common/misc/TutanotaEntityMigrator.js"
import { DefaultEntityRestCache } from "../../src/applications/common/api/worker/rest/DefaultEntityRestCache.js"
import { DomainConfigProvider } from "../../src/applications/common/api/common/DomainConfigProvider.js"

export async function runPlatformKitExample() {
	// ── argon2 facade (wasm from test/build/) ─────────────────────────────────────

	const argon2Wasm = await loadWasmFromFileOrNetwork<Argon2IDExports>("argon2.wasm", new URL("../build/", import.meta.url).href)
	const argon2idFacade = {
		async generateKeyFromPassphrase(passphrase: string, salt: Uint8Array) {
			return generateKeyFromPassphraseArgon2id(argon2Wasm, passphrase, salt)
		},
	}

	// ── apps ──────────────────────────────────────────────────────────────────────

	const apps: Array<NamedClientModel> = [
		{ app: AppNameEnum.Base, clientModel: baseTypeModels, modelInfo: baseModelInfo },
		{ app: "sys", clientModel: sysTypeModels, modelInfo: sysModelInfo },
		{ app: "tutanota", clientModel: tutanotaTypeModels, modelInfo: tutanotaModelInfo },
		{ app: "drive", clientModel: driveTypeModels, modelInfo: driveModelInfo },
		{ app: "storage", clientModel: storageTypeModels, modelInfo: storageModelInfo },
		{ app: "monitor", clientModel: monitorTypeModels, modelInfo: monitorModelInfo },
		{ app: "usage", clientModel: usageTypeModels, modelInfo: usageModelInfo },
		{ app: "accounting", clientModel: accountingTypeModels, modelInfo: accountingModelInfo },
	]

	// ── stubs ─────────────────────────────────────────────────────────────────────

	const noOpLoginListener: LoginListener = {
		async onPartialLoginSuccess() {},
		async onFullLoginSuccess() {},
		async onLoginFailure() {},
		async onSecondFactorChallenge() {},
		onResetSession() {},
	}

	const mainInterface: MainInterface = {
		loginListener: noOpLoginListener,
		wsConnectivityListener: { updateWebSocketState() {} } as any,
		progressTracker: { write() {} } as any,
		eventController: { onEntityEventsReceived() {}, onError() {} } as any,
		operationProgressTracker: { onProgress() {} } as any,
		infoMessageHandler: { onInfoMessage() {} } as any,
		syncTracker: { onSyncStarted() {}, onSyncCompleted() {} } as any,
		uploadProgressListener: { onProgress() {} } as any,
	}

	const worker: NativeInterface & { sendError(e: Error): Promise<void>; getMainInterface(): MainInterface } = {
		invokeNative(requestType: string, args: ReadonlyArray<unknown>): Promise<any> {
			throw new Error("invokeNative not supported: " + requestType)
		},
		sendError(e: Error): Promise<void> {
			console.error("Worker error:", e)
			return Promise.resolve()
		},
		getMainInterface(): MainInterface {
			return mainInterface
		},
	}

	const identityKeyTrustDatabase: IdentityKeyTrustDatabase = {
		async isIdentityKeyTrustDatabaseSupported() {
			return false
		},
		async getManuallyVerifiedEntries() {
			return new Map()
		},
		async trust(mailAddress, key, source) {
			return { publicIdentityKey: key, sourceOfTrust: source }
		},
		async untrust() {},
		async getTrustedEntry() {
			return null
		},
	}

	// ── setup & run ───────────────────────────────────────────────────────────────

	let base: BaseLocator

	const ephemeralStorageProvider = async () =>
		new EphemeralCacheStorage((base as any).instancePipeline.modelMapper, (base as any).typeModelResolver, new CustomCacheHandlerMap())

	const maybeUninitializedStorage = new LateInitializedCacheStorageImpl(
		async (error: Error) => console.error("Storage error:", error),
		ephemeralStorageProvider,
		async () => null,
	)

	const cacheManagement = lazyMemoized(async () => {
		const { CacheManagementFacade } = await import("../../src/applications/common/api/worker/facades/lazy/CacheManagementFacade.js")
		return new CacheManagementFacade(base.user, base.cachingEntityClient, base.cache as any)
	})

	const lastProcessedEventBatchStorageFacade = lazyMemoized(async () => new NoOpLastProcessedEventBatchStorageFacade())

	const browserData: BrowserData = {
		needsMicrotaskHack: false,
		needsExplicitIDBIds: false,
		indexedDbSupported: true,
		clientPlatform: ClientPlatform.UNKNOWN,
	}

	console.log("Creating BaseLocator...")
	base = await createBaseLocator({
		worker,
		apps,
		browserData,
		loginListenerProvider: () => noOpLoginListener,
		maybeUninitializedStorage,
		lastProcessedEventBatchStorageFacade,
		cacheManagement,
		identityKeyTrustDatabase,
		domainConfig: new DomainConfigProvider().getCurrentDomainConfig(),
		argon2idFacade,
		rsa: new RsaWeb(),
		fileFacade: { writeToAppDir: async () => {}, readFromAppDir: async () => new Uint8Array(), deleteFromAppDir: async () => {} },
		entityMigratorFactory: ({
			cryptoWrapper,
			user,
			keyLoader,
			cachingEntityClient,
			serviceExecutor,
			typeModelResolver,
			instancePipeline,
			restClient,
			crypto,
		}) =>
			new TutanotaEntityMigrator(
				cryptoWrapper,
				user,
				keyLoader,
				cachingEntityClient,
				serviceExecutor,
				typeModelResolver,
				instancePipeline,
				restClient,
				crypto,
			),
		entityRestCache: (entityRestClient, patchMerger, typeModelResolver, lastProcessed) =>
			new DefaultEntityRestCache(entityRestClient, maybeUninitializedStorage, typeModelResolver, patchMerger, lastProcessed),
	})

	console.log("Logging in as map-free@tutanota.de...")
	await base.login.createSession("map-free@tutanota.de", "map", "Linux node", SessionType.Temporary, null)

	console.log("Fetching INBOX...")
	const mailGroupId = base.user.getGroupId(GroupType.Mail)
	const mailboxGroupRoot = await base.cachingEntityClient.load(MailboxGroupRootTypeRef, mailGroupId)
	const mailbox = await base.cachingEntityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)

	if (mailbox.currentMailBag == null) {
		console.log("No current mail bag")
		process.exit(0)
	}

	const mails = await base.cachingEntityClient.loadRange(MailTypeRef, mailbox.currentMailBag.mails, GENERATED_MAX_ID, 1, true)
	if (mails.length === 0) {
		console.log("INBOX is empty")
		process.exit(0)
	}

	const mail = mails[0]

	console.log("\nMost recent mail:")
	console.log("  Subject:  ", mail.subject)
	console.log("  From:     ", `${mail.sender.name} <${mail.sender.address}>`)
	console.log("  Received: ", mail.receivedDate.toISOString())
	console.log("  Unread:   ", mail.unread)
}
