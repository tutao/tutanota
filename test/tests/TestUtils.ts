import type { BrowserData } from "../../src/common/misc/ClientConstants.js"
import { DbEncryptionData } from "../../src/common/api/worker/search/SearchTypes.js"
import { IndexerCore } from "../../src/mail-app/workerUtils/index/IndexerCore.js"
import { DbFacade, DbTransaction } from "../../src/common/api/worker/search/DbFacade.js"
import { assertNotNull, clone, deepEqual, defer, isNotNull, Thunk, typedEntries, TypeRef } from "@tutao/tutanota-utils"
import type { DesktopKeyStoreFacade } from "../../src/common/desktop/DesktopKeyStoreFacade.js"
import { mock } from "@tutao/tutanota-test-utils"
import { aes256RandomKey, fixedIv, uint8ArrayToKey } from "@tutao/tutanota-crypto"
import { ScheduledPeriodicId, ScheduledTimeoutId, Scheduler } from "../../src/common/api/common/utils/Scheduler.js"
import { matchers, object, when } from "testdouble"
import { Entity, ModelValue, ParsedInstance, TypeModel } from "../../src/common/api/common/EntityTypes.js"
import { create, generatedIdToTimestamp, timestampToGeneratedId } from "../../src/common/api/common/utils/EntityUtils.js"
import { ClientModelInfo, ServerModelInfo, ServerModels, TypeModelResolver } from "../../src/common/api/common/EntityFunctions.js"
import { type fetch as undiciFetch, type Response } from "undici"
import { Cardinality, ValueType } from "../../src/common/api/common/EntityConstants.js"
import { InstancePipeline } from "../../src/common/api/worker/crypto/InstancePipeline"
import { ModelMapper } from "../../src/common/api/worker/crypto/ModelMapper"
import { dummyResolver } from "./api/worker/crypto/InstancePipelineTestUtils"
import { EncryptedDbWrapper } from "../../src/common/api/worker/search/EncryptedDbWrapper"
import { ClientPlatform } from "../../src/common/misc/ClientDetector"

export const browserDataStub: BrowserData = {
	needsMicrotaskHack: false,
	needsExplicitIDBIds: false,
	indexedDbSupported: true,
	clientPlatform: ClientPlatform.UNKNOWN,
}

export function makeCore(
	args?: {
		encryptionData?: DbEncryptionData
		browserData?: BrowserData
		transaction?: DbTransaction
	},
	mocker?: (_: any) => void,
): IndexerCore {
	const safeArgs = args ?? {}
	const { transaction } = safeArgs
	const dbFacade = { createTransaction: () => Promise.resolve(transaction) } as Partial<DbFacade>
	const defaultDb = new EncryptedDbWrapper(dbFacade as DbFacade)
	defaultDb.init(safeArgs.encryptionData ?? { key: aes256RandomKey(), iv: fixedIv })
	const { db, browserData } = {
		...{ db: defaultDb, browserData: browserDataStub },
		...safeArgs,
	}
	const core = new IndexerCore(db, browserData)
	if (mocker) mock(core, mocker)
	return core
}

export function makeKeyStoreFacade(uint8ArrayKey: Uint8Array): DesktopKeyStoreFacade {
	const o: DesktopKeyStoreFacade = object()
	when(o.getDeviceKey()).thenResolve(uint8ArrayToKey(uint8ArrayKey))
	when(o.getKeyChainKey()).thenResolve(uint8ArrayToKey(uint8ArrayKey))
	return o
}

type IdThunk = {
	id: ScheduledTimeoutId
	thunk: Thunk
}

export class SchedulerMock implements Scheduler {
	alarmId: number = 0

	/** key is the time */
	scheduledAt: Map<number, IdThunk> = new Map()
	scheduledAfter: Map<number, IdThunk> = new Map()
	cancelledAt: Set<ScheduledTimeoutId> = new Set()
	scheduledPeriodic: Map<number, IdThunk> = new Map()
	cancelledPeriodic: Set<ScheduledTimeoutId> = new Set()

	scheduleAt(callback, date): ScheduledTimeoutId {
		const id = this._incAlarmId()

		this.scheduledAt.set(date.getTime(), {
			id,
			thunk: callback,
		})
		return id
	}

	getThunkAt(time: number): Thunk {
		return assertNotNull(this.scheduledAt.get(time), "No thunk scheduled at " + time).thunk
	}

	getThunkAfter(time: number): Thunk {
		return assertNotNull(this.scheduledAfter.get(time), "No thunk scheduled after " + time).thunk
	}

	scheduleAfter(thunk: Thunk, after: number): ScheduledTimeoutId {
		const id = this._incAlarmId()

		this.scheduledAfter.set(after, {
			id,
			thunk: thunk,
		})
		return id
	}

	unscheduleTimeout(id) {
		this.cancelledAt.add(id)
	}

	schedulePeriodic(thunk, period: number): ScheduledPeriodicId {
		const id = this._incAlarmId()
		this.scheduledPeriodic.set(period, { id, thunk })
		return id
	}

	getThunkPeriodic(period: number): Thunk {
		return assertNotNull(this.scheduledPeriodic.get(period), "No thunk scheduled each " + period).thunk
	}

	getAllPeriodThunks(): Array<Thunk> {
		return Array.from(this.scheduledPeriodic.values()).map((idThunk) => idThunk.thunk)
	}

	unschedulePeriodic(id: ScheduledPeriodicId) {
		this.cancelledPeriodic.add(id)
	}

	_incAlarmId(): ScheduledTimeoutId {
		return this.alarmId++
	}
}

export const domainConfigStub: DomainConfig = {
	firstPartyDomain: true,
	partneredDomainTransitionUrl: "",
	apiUrl: "",
	u2fAppId: "",
	webauthnRpId: "",
	referralBaseUrl: "",
	giftCardBaseUrl: "",
	paymentUrl: "",
	webauthnUrl: "",
	legacyWebauthnUrl: "",
	webauthnMobileUrl: "",
	legacyWebauthnMobileUrl: "",
	websiteBaseUrl: "",
}

// non-async copy of the function
function resolveTypeReference(typeRef: TypeRef<any>): TypeModel {
	const modelMap = ClientModelInfo.getNewInstanceForTestsOnly().typeModels[typeRef.app]
	const typeModel = modelMap[typeRef.typeId]

	if (typeModel == null) {
		throw new Error("Cannot find TypeRef: " + JSON.stringify(typeRef))
	} else {
		return typeModel
	}
}

// copy of the _getDefaultValue but with Date(0) being default date so that the tests are deterministic
function getDefaultTestValue(valueName: string, value: ModelValue): any {
	if (valueName === "_format") {
		return "0"
	} else if (valueName === "_id") {
		return `${value.id}_id`
	} else if (valueName === "_permissions") {
		return `${value.id}_permissions`
	} else if (value.cardinality === Cardinality.ZeroOrOne) {
		return null
	} else {
		switch (value.type) {
			case ValueType.Bytes:
				return new Uint8Array(0)

			case ValueType.Date:
				return new Date(0)

			case ValueType.Number:
				return "0"

			case ValueType.String:
				return ""

			case ValueType.Boolean:
				return false

			case ValueType.CustomId:
			case ValueType.GeneratedId:
				return `${value.id}_${valueName}`
		}
	}
}

export function createTestEntity<T extends Entity>(
	typeRef: TypeRef<T>,
	values?: Partial<T>,
	opts?: {
		populateAggregates: boolean
	},
): T {
	const typeModel = resolveTypeReference(typeRef as TypeRef<any>)
	const entity = create(typeModel, typeRef, getDefaultTestValue)
	if (opts?.populateAggregates) {
		for (const [_, assocDef] of typedEntries(typeModel.associations)) {
			if (assocDef.cardinality === Cardinality.One) {
				const assocName = assocDef.name
				switch (assocDef.type) {
					case "AGGREGATION": {
						const assocTypeRef = new TypeRef<Entity>(assocDef.dependency ?? typeRef.app, assocDef.refTypeId)
						entity[assocName] = createTestEntity(assocTypeRef, undefined, opts)
						break
					}
					case "ELEMENT_ASSOCIATION":
						entity[assocName] = `elementAssoc_${assocName}`
						break
					case "LIST_ASSOCIATION":
						entity[assocName] = `listAssoc_${assocName}`
						break
					case "LIST_ELEMENT_ASSOCIATION_GENERATED":
					case "LIST_ELEMENT_ASSOCIATION_CUSTOM":
						entity[assocName] = [`listElemAssocList_${assocName}`, `listElemAssocElem_${assocName}`]
						break
					case "BLOB_ELEMENT_ASSOCIATION":
						entity[assocName] = [`blobElemAssocList_${assocName}`, `blobElemAssocElem_${assocName}`]
						break
				}
			}
		}
	}
	if (values) {
		return Object.assign(entity, values)
	} else {
		return entity
	}
}

export async function createTestEntityWithDummyResolver<T extends Entity>(typeRef: TypeRef<T>, values?: Partial<T>): Promise<T> {
	const typeModel = await dummyResolver(typeRef)
	const entity = create(typeModel, typeRef, getDefaultTestValue)
	if (values) {
		return Object.assign(entity, values)
	} else {
		return entity
	}
}

export function mockFetchRequest(mock: typeof undiciFetch, url: string, headers: Record<string, string>, status: number, jsonObject: unknown): Promise<void> {
	const response = object<Writeable<Response>>()
	response.ok = status >= 200 && status < 300
	response.status = status
	const jsonDefer = defer<void>()
	when(response.json()).thenDo(() => {
		jsonDefer.resolve()
		return Promise.resolve(jsonObject)
	})
	when(
		mock(
			matchers.argThat((urlArg) => urlArg.toString() === url),
			matchers.argThat((options) => {
				return deepEqual(options.headers, headers)
			}),
		),
	).thenResolve(response)
	return jsonDefer.promise
}

export function textIncludes(match: string): (text: string) => { pass: boolean; message: string } {
	return (text) => ({ pass: text.includes(match), message: `should include: "${match}"` })
}

export function equalToArray<A extends any[]>(
	expectedArray: A,
): (value: A) =>
	| { pass: false; message: string }
	| {
			pass: true
	  } {
	return (value) =>
		deepEqual(value, expectedArray)
			? { pass: true }
			: {
					pass: false,
					message: `Arrays are different: Expected ${expectedArray.length} items but got ${value.length}.
The first expected item is ${JSON.stringify(expectedArray[0])} but got ${JSON.stringify(value[0])}.
The last expected item is ${JSON.stringify(expectedArray.at(-1))} but got ${JSON.stringify(value.at(-1))}`,
				}
}

export function removeFinalIvs(instance: Entity | ParsedInstance): Entity | ParsedInstance {
	delete instance["_finalIvs"]
	delete instance["_original"]
	const keys = Object.keys(instance)
	for (const key of keys) {
		const maybeAggregate = instance[key]
		if (maybeAggregate instanceof Object) {
			removeFinalIvs(maybeAggregate)
		}
	}
	return instance
}

export function removeOriginals<T extends Entity>(instance: T | null): T | null {
	if (isNotNull(instance) && typeof instance === "object") {
		delete instance["_original"]
		for (const i of Object.values(instance).filter(isNotNull)) {
			removeOriginals(i)
		}
	}
	return instance
}

export function removeAggregateIds(instance: Entity, aggregate: boolean = false): Entity {
	if (aggregate && instance["_id"]) {
		instance["_id"] = null
	}
	const keys = Object.keys(instance)
	for (const key of keys) {
		const maybeAggregate = instance[key]
		if (maybeAggregate instanceof Object) {
			removeAggregateIds(maybeAggregate, true)
		}
	}
	return instance
}

export function clientModelAsServerModel(clientModel: ClientModelInfo): ServerModelInfo {
	let models = Object.keys(clientModel.typeModels).reduce((obj, app) => {
		Object.assign(obj, {
			[app]: {
				name: app,
				version: clientModel.modelInfos[app].version,
				types: clone(clientModel.typeModels[app]),
			},
		})
		return obj
	}, {}) as ServerModels
	const modelInfo = ServerModelInfo.getUninitializedInstanceForTestsOnly(clientModel, () => {
		throw new Error("should not fetch in test")
	})
	modelInfo.typeModels = models
	return modelInfo
}

export function clientInitializedTypeModelResolver(): TypeModelResolver {
	const clientModelInfo = ClientModelInfo.getNewInstanceForTestsOnly()
	const serverModelInfo = clientModelAsServerModel(clientModelInfo)
	return new TypeModelResolver(clientModelInfo, serverModelInfo)
}

export function instancePipelineFromTypeModelResolver(typeModelResolver: TypeModelResolver): InstancePipeline {
	return new InstancePipeline(
		typeModelResolver.resolveClientTypeReference.bind(typeModelResolver),
		typeModelResolver.resolveServerTypeReference.bind(typeModelResolver),
	)
}

export function modelMapperFromTypeModelResolver(typeModelResolver: TypeModelResolver): ModelMapper {
	return new ModelMapper(
		typeModelResolver.resolveClientTypeReference.bind(typeModelResolver),
		typeModelResolver.resolveServerTypeReference.bind(typeModelResolver),
	)
}

export async function withOverriddenEnv<F extends (...args: any[]) => any>(override: Partial<typeof env>, action: () => ReturnType<F>) {
	const previousEnv: typeof env = clone(env)
	for (const [key, value] of Object.entries(override)) {
		env[key] = value
	}
	try {
		return await action()
	} finally {
		for (const key of Object.keys(override)) {
			env[key] = previousEnv[key]
		}
	}
}

function incrementId(id: Id, ms: number) {
	const timestamp = generatedIdToTimestamp(id)
	return timestampToGeneratedId(timestamp + ms)
}

export class IdGenerator {
	constructor(private currentId: Id) {}

	getNext(incrementByMs: number = 60000): Id {
		this.currentId = incrementId(this.currentId, incrementByMs)
		return this.currentId
	}
}
