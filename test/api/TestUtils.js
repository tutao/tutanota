// @flow
import o from "ospec"
import type {BrowserData} from "../../src/misc/ClientConstants"
import type {Db} from "../../src/api/worker/search/SearchTypes"
import {aes256RandomKey} from "../../src/api/worker/crypto/Aes"
import {IndexerCore} from "../../src/api/worker/search/IndexerCore"
import {EventQueue} from "../../src/api/worker/search/EventQueue"
import {DbTransaction} from "../../src/api/worker/search/DbFacade"
import {fixedIv, uint8ArrayToKey} from "../../src/api/worker/crypto/CryptoUtils"
import {assertNotNull, neverNull} from "@tutao/tutanota-utils"
import type {DesktopDeviceKeyProvider} from "../../src/desktop/DeviceKeyProviderImpl"
import {mock} from "@tutao/tutanota-test-utils"

export const browserDataStub: BrowserData = {needsMicrotaskHack: false, needsExplicitIDBIds: false, indexedDbSupported: true}

export function makeCore(args?: {
	db?: Db,
	queue?: EventQueue,
	browserData?: BrowserData,
	transaction?: DbTransaction
}, mocker?: (any) => void): IndexerCore {
	const safeArgs = args || {}
	const {transaction = (null: any)} = safeArgs
	const defaultDb = {
		key: aes256RandomKey(),
		iv: fixedIv,
		dbFacade: ({createTransaction: () => Promise.resolve(transaction)}: any),
		initialized: Promise.resolve()
	}
	const {db = defaultDb, queue = (null: any), browserData = browserDataStub} = safeArgs
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

export function reportTest(results: mixed, stats: mixed) {
	const errCount = o.report(results, stats)
	if (typeof process != "undefined" && errCount !== 0) process.exit(1) // eslint-disable-line no-process-exit
	browser(() => {
		const p = assertNotNull(document.getElementById("report"))
		// errCount includes bailCount
		p.textContent = errCount === 0 ? "No errors" : `${errCount} error(s) (see console)`
		p.style.color = errCount === 0 ? "green" : "red"
	})()
}

export function makeDeviceKeyProvider(uint8ArrayKey: Uint8Array): DesktopDeviceKeyProvider {
	return {
		getDeviceKey() {
			return Promise.resolve(uint8ArrayToKey(uint8ArrayKey))
		}
	}
}