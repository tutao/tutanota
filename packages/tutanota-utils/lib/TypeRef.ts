// T should be restricted to Entity
export class TypeRef<T> {
	readonly app: string
	readonly type: string

	/**
	 * Field that is never set. Used to make two TypeRefs incompatible (they are structurally compared otherwise).
	 * Cannot be private.
	 */
	readonly phantom: T | null = null

	constructor(app: string, type: string) {
		this.app = app
		this.type = type
		Object.freeze(this)
	}

	toString(): string {
		return `[TypeRef ${this.app} ${this.type}]`
	}

	getId(): string {
		return this.app + "/" + this.type
	}
}

export function isSameTypeRefByAttr(typeRef: TypeRef<any>, app: string, type: string): boolean {
	return typeRef.app === app && typeRef.type === type
}

export function isSameTypeRef(typeRef1: TypeRef<any>, typeRef2: TypeRef<any>): boolean {
	return isSameTypeRefByAttr(typeRef1, typeRef2.app, typeRef2.type)
}