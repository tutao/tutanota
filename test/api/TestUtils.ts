import o from "ospec"
import type {BrowserData} from "../../src/misc/ClientConstants"
import type {Db} from "../../src/api/worker/search/SearchTypes"
import {IndexerCore} from "../../src/api/worker/search/IndexerCore"
import {EventQueue} from "../../src/api/worker/search/EventQueue"
import {DbFacade, DbTransaction} from "../../src/api/worker/search/DbFacade"
import {assertNotNull, neverNull} from "@tutao/tutanota-utils"
import type {DesktopDeviceKeyProvider} from "../../src/desktop/DeviceKeyProviderImpl"
import {mock} from "@tutao/tutanota-test-utils"
import {aes256RandomKey, fixedIv, uint8ArrayToKey} from "@tutao/tutanota-crypto"

export const browserDataStub: BrowserData = {
	needsMicrotaskHack: false,
	needsExplicitIDBIds: false,
	indexedDbSupported: true
}

export function makeCore(args?: {
	db?: Db,
	queue?: EventQueue,
	browserData?: BrowserData,
	transaction?: DbTransaction
}, mocker?: (_: any) => void): IndexerCore {
	const safeArgs = args ?? {}
	const {transaction} = safeArgs
	const defaultDb = {
		key: aes256RandomKey(),
		iv: fixedIv,
		dbFacade: ({createTransaction: () => Promise.resolve(transaction)} as Partial<DbFacade>),
		initialized: Promise.resolve()
	} as Partial<Db> as Db
	const defaultQueue = {} as Partial<EventQueue> as EventQueue
	const {db, queue, browserData} = {
		...{db: defaultDb, browserData: browserDataStub, queue: defaultQueue},
		...safeArgs,
	}
	const core = new IndexerCore(db, queue, browserData)
	mocker && mock(core, mocker)
	return core
}

export function preTest() {
	browser(() => {
		const p = document.createElement("p")
		p.id = "report"
		p.style.fontWeight = "bold"
		p.style.fontSize = "30px"
		p.style.fontFamily = "sans-serif"
		p.textContent = "Running tests..."
		neverNull(document.body).appendChild(p)
	})()
}

export function reportTest(results: any, stats: any) {
	// @ts-ignore
	const errCount = o.report(results, stats)
	if (typeof process != "undefined" && errCount !== 0) process.exit(1) // eslint-disable-line no-process-exit
	browser(() => {
		const p = assertNotNull(document.getElementById("report"))
		// errCount includes bailCount
		p.textContent = errCount === 0 ? "No errors" : `${errCount} error(s) (see console)`
		// @ts-ignore
		p.style.Color = errCount === 0 ? "green" : "red"
	})()
}

export function makeDeviceKeyProvider(uint8ArrayKey: Uint8Array): DesktopDeviceKeyProvider {
	return {
		getDeviceKey() {
			return Promise.resolve(uint8ArrayToKey(uint8ArrayKey))
		}
	}
}