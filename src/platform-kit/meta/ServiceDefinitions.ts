import { AppName, isSameTypeRef, TypeRef } from "./TypeRef.js"
import { DataTransferEntity, NullEntityTypeRef } from "./EntityTypes.js"
import { Nullable } from "@tutao/utils"

export abstract class ServiceDefinition<In extends DataTransferEntity, Out extends DataTransferEntity> {
	public readonly requestTypeRef: Nullable<TypeRef<In>>
	public readonly returnTypeRef: Nullable<TypeRef<Out>>
	public readonly fullServiceName: string
	public readonly serviceRestPath: string

	protected constructor(
		protected readonly app: AppName,
		protected readonly name: string,
		public readonly httpMethod: string,
		inTypeRef: TypeRef<In>,
		outTypeRef: TypeRef<Out>,
	) {
		this.requestTypeRef = isSameTypeRef(NullEntityTypeRef, inTypeRef) ? null : inTypeRef
		this.returnTypeRef = isSameTypeRef(NullEntityTypeRef, outTypeRef) ? null : outTypeRef
		this.fullServiceName = `${this.app.toLowerCase()}/${this.name.toLowerCase()}`
		this.serviceRestPath = `/rest/${this.fullServiceName}`
	}
}

export class GetService<In extends DataTransferEntity, Out extends DataTransferEntity> extends ServiceDefinition<In, Out> {
	constructor(app: AppName, name: string, inTypeRef: TypeRef<In>, outTypeRef: TypeRef<Out>) {
		super(app, name, "GET", inTypeRef, outTypeRef)
	}
}

export class PostService<In extends DataTransferEntity, Out extends DataTransferEntity> extends ServiceDefinition<In, Out> {
	constructor(app: AppName, name: string, inTypeRef: TypeRef<In>, outTypeRef: TypeRef<Out>) {
		super(app, name, "POST", inTypeRef, outTypeRef)
	}
}

export class PutService<In extends DataTransferEntity, Out extends DataTransferEntity> extends ServiceDefinition<In, Out> {
	constructor(app: AppName, name: string, inTypeRef: TypeRef<In>, outTypeRef: TypeRef<Out>) {
		super(app, name, "PUT", inTypeRef, outTypeRef)
	}
}

export class DeleteService<In extends DataTransferEntity, Out extends DataTransferEntity> extends ServiceDefinition<In, Out> {
	constructor(app: AppName, name: string, inTypeRef: TypeRef<In>, outTypeRef: TypeRef<Out>) {
		super(app, name, "DELETE", inTypeRef, outTypeRef)
	}
}
