import { TypeRef } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "./Env.js"
import type { Entity } from "./EntityTypes.js"
import { Aes128Key, AesKey } from "@tutao/tutanota-crypto"
import { SuspensionBehavior } from "../worker/rest/RestClient"

assertMainOrNode()

export type MethodDefinition = {
	data: TypeRef<Entity> | null
	return: TypeRef<Entity> | null
}

export interface ServiceDefinition {
	app: string
	name: string
}

export interface GetService extends ServiceDefinition {
	get: MethodDefinition
}

export interface PostService extends ServiceDefinition {
	post: MethodDefinition
}

export interface PutService extends ServiceDefinition {
	put: MethodDefinition
}

export interface DeleteService extends ServiceDefinition {
	delete: MethodDefinition
}

export type ParamTypeFromRef<TR extends TypeRef<Entity> | null> = TR extends TypeRef<infer T> ? T : null

export type ReturnTypeFromRef<TR extends TypeRef<Entity> | null> = TR extends TypeRef<infer T> ? T : undefined

export interface IServiceExecutor {
	get<S extends GetService>(service: S, data: ParamTypeFromRef<S["get"]["data"]>, params?: ExtraServiceParams): Promise<ReturnTypeFromRef<S["get"]["return"]>>

	post<S extends PostService>(
		service: S,
		data: ParamTypeFromRef<S["post"]["data"]>,
		params?: ExtraServiceParams,
	): Promise<ReturnTypeFromRef<S["post"]["return"]>>

	put<S extends PutService>(service: S, data: ParamTypeFromRef<S["put"]["data"]>, params?: ExtraServiceParams): Promise<ReturnTypeFromRef<S["put"]["return"]>>

	delete<S extends DeleteService>(
		service: S,
		data: ParamTypeFromRef<S["delete"]["data"]>,
		params?: ExtraServiceParams,
	): Promise<ReturnTypeFromRef<S["delete"]["return"]>>
}

export interface ExtraServiceParams {
	queryParams?: Dict
	sessionKey?: AesKey
	extraHeaders?: Dict
	suspensionBehavior?: SuspensionBehavior
	/** override origin for the request */
	baseUrl?: string
}
