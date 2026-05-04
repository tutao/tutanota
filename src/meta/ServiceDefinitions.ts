import { TypeRef } from "./TypeRef.js"
import { Entity } from "./EntityTypes.js"

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

export function getServiceRestPath(service: ServiceDefinition) {
	return `/rest/${service.app.toLowerCase()}/${service.name.toLowerCase()}`
}
