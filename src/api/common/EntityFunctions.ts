import {Type, ValueType} from "./EntityConstants"
import {TypeRef} from "@tutao/tutanota-utils"
import sysModelMap from "../entities/sys/sysModelMap"
import tutanotaModelMap from "../entities/tutanota/tutanotaModelMap"
import monitorModelMap from "../entities/monitor/monitorModelMap"
import {customIdToString, firstBiggerThanSecond} from "./utils/EntityUtils"
import accountingModelMap from "../entities/accounting/accountingModelMap"
import baseModelMap from "../entities/base/baseModelMap"
import gossipModelMap from "../entities/gossip/gossipModelMap"
import storageModelMap from "../entities/storage/storageModelMap"
import type {TypeModel} from "./EntityTypes"
import sysModelInfo from "../entities/sys/sysModelInfo"
import baseModelInfo from "../entities/base/baseModelInfo"
import tutanotaModelInfo from "../entities/tutanota/tutanotaModelInfo"
import monitorModelInfo from "../entities/monitor/monitorModelInfo"
import accountingModelInfo from "../entities/accounting/accountingModelInfo"
import gossipModelInfo from "../entities/gossip/gossipModelInfo"
import storageModelInfo from "../entities/storage/storageModelInfo"

export const enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
}

export const enum MediaType {
	Json = "application/json",
	Binary = "application/octet-stream",
	Text = "text/plain",
}

/**
 * Model maps are needed for static analysis and dead-code elimination.
 * We access most types through the TypeRef but also sometimes we include them completely dynamically (e.g. encryption of aggregates).
 * This means that we need to tell our bundler which ones do exist so that they are included.
 */
const modelMaps = {
	base: baseModelMap,
	sys: sysModelMap,
	tutanota: tutanotaModelMap,
	monitor: monitorModelMap,
	accounting: accountingModelMap,
	gossip: gossipModelMap,
	storage: storageModelMap,
} as const

export const modelInfos = {
	base: baseModelInfo,
	sys: sysModelInfo,
	tutanota: tutanotaModelInfo,
	monitor: monitorModelInfo,
	accounting: accountingModelInfo,
	gossip: gossipModelInfo,
	storage: storageModelInfo,
} as const

export function resolveTypeReference(typeRef: TypeRef<any>): Promise<TypeModel> {
	// @ts-ignore
	const modelMap = modelMaps[typeRef.app]

	if (modelMap[typeRef.type] == null) {
		return Promise.reject(new Error("Cannot find TypeRef: " + JSON.stringify(typeRef)))
	} else {
		return modelMap[typeRef.type]().then((module: any) => {
			return module._TypeModel
		})
	}
}

/**
 * Return appropriate id sorting function for typeModel.
 *
 * For generated IDs we use base64ext which is sortable. For custom IDs we use base64url which is not sortable.
 *
 * Important: works only with custom IDs which are derived from strings.
 *
 * @param typeModel
 * @return {(function(string, string): boolean)}
 */
export function getFirstIdIsBiggerFnForType(typeModel: TypeModel): (arg0: Id, arg1: Id) => boolean {
	if (typeModel.values["_id"].type === ValueType.CustomId) {
		return (left, right) => firstBiggerThanSecond(customIdToString(left), customIdToString(right))
	} else {
		return firstBiggerThanSecond
	}
}

export function _verifyType(typeModel: TypeModel) {
	if (typeModel.type !== Type.Element && typeModel.type !== Type.ListElement) {
		throw new Error("only Element and ListElement types are permitted, was: " + typeModel.type)
	}
}