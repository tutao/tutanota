// @flow
import {SysService} from "../entities/sys/Services"
import {worker} from "./WorkerClient"
import {
	_setupEntity,
	_updateEntity,
	_eraseEntity,
	_loadEntity,
	_loadMultipleEntities,
	_loadEntityRange,
	_verifyType,
	GENERATED_MIN_ID,
	resolveTypeReference,
	TypeRef,
	getLetId,
	getEtId,
	HttpMethod,
	CUSTOM_MIN_ID
} from "../common/EntityFunctions"
import {createVersionData} from "../entities/sys/VersionData"
import {RootInstanceTypeRef} from "../entities/sys/RootInstance"
import {VersionReturnTypeRef} from "../entities/sys/VersionReturn"
import {assertMainOrNode} from "../Env"
import EC from "../common/EntityConstants" // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug)
const Type = EC.Type
const ValueType = EC.ValueType

assertMainOrNode()

// TODO write testcases

export function setup<T>(listId: ?Id, instance: T): Promise<Id> {
	return _setupEntity(listId, instance, worker)
}

export function update<T>(instance: T): Promise<void> {
	return _updateEntity(instance, worker)
}

export function erase<T>(instance: T): Promise<void> {
	return _eraseEntity(instance, worker)
}

export function load<T>(typeRef: TypeRef<T>, id: Id|IdTuple, queryParams: ?Params): Promise<T> {
	return _loadEntity(typeRef, id, queryParams, worker)
}

export function loadMultiple<T>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[]): Promise<T[]> {
	return _loadMultipleEntities(typeRef, listId, elementIds, worker)
}

export function loadRange<T>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
	return _loadEntityRange(typeRef, listId, start, count, reverse, worker)
}


export function loadAll<T>(typeRef: TypeRef<T>, listId: Id): Promise<T[]> {
	return resolveTypeReference(typeRef).then(typeModel => {
		let minId = (typeModel.values["_id"].type == ValueType.GeneratedId) ? GENERATED_MIN_ID : CUSTOM_MIN_ID
		return _loadAll(typeRef, listId, minId)
	})
}

const RANGE_ITEM_LIMIT = 1000
function _loadAll<T>(typeRef: TypeRef<T>, listId: Id, start: Id): Promise<T[]> {
	return loadRange(typeRef, listId, start, RANGE_ITEM_LIMIT, false).then(elements => {
		if (elements.length === RANGE_ITEM_LIMIT) {
			let lastElementId = getLetId(elements[elements.length - 1])[1]
			return _loadAll(typeRef, listId, lastElementId).then(nextElements => {
				return elements.concat(nextElements)
			})
		} else {
			return Promise.resolve(elements)
		}
	})
}

export function loadVersion<T>(instance: T, version: Id): Promise<T> {
	return resolveTypeReference((instance:any)._type).then(typeModel => {
		if (!typeModel.versioned) throw new Error("unversioned instance: can't load version")
		return load((instance:any)._type, (instance:any)._id, {version})
	})
}

export function loadVersionInfo<T>(instance: T): Promise<VersionReturn> {
	return resolveTypeReference((instance:any)._type).then(typeModel => {
		if (!typeModel.versioned) throw new Error("unversioned instance: can't load version info")
		_verifyType(typeModel)
		let versionData = createVersionData()
		versionData.application = typeModel.app
		versionData.typeId = typeModel.id + ""
		if (typeModel.type === Type.ListElement) {
			versionData.id = getLetId(instance)[1]
			versionData.listId = getLetId(instance)[0]
		} else {
			versionData.id = getEtId(instance)
		}
		return serviceRequest(SysService.VersionService, HttpMethod.GET, versionData, VersionReturnTypeRef)
	})
}

export function loadRoot<T>(typeRef: TypeRef<T>, groupId: Id): Promise<T> {
	return resolveTypeReference(typeRef).then(typeModel => {
		let rootId = [groupId, typeModel.rootId];
		return load(RootInstanceTypeRef, rootId).then((root: RootInstance) => {
			return load(typeRef, root.reference)
		})
	})
}

export function serviceRequest<T>(service: SysServiceEnum|TutanotaServiceEnum|MonitorServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: ?TypeRef<T>, queryParams: ?Params, sk: ?Aes128Key): Promise<T> {
	return worker.serviceRequest(service, method, requestEntity, responseTypeRef, queryParams, sk)
}

export function serviceRequestVoid<T>(service: SysServiceEnum|TutanotaServiceEnum|MonitorServiceEnum, method: HttpMethodEnum, requestEntity: ?any, queryParams: ?Params, sk: ?Aes128Key): Promise<void> {
	return worker.serviceRequest(service, method, requestEntity, null, queryParams, sk)
}
