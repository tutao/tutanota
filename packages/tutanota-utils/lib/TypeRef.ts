/**
 * T should be restricted to Entity.
 */
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

	/**
	 * breaks when the object passes worker barrier
	 */
	toString(): string {
		return `[TypeRef ${this.app} ${this.type}]`
	}
}

export function getTypeId(typeRef: TypeRef<unknown>) {
	return typeRef.app + "/" + typeRef.type
}

export function isSameTypeRefByAttr(typeRef: TypeRef<unknown>, app: string, typeName: string): boolean {
	return typeRef.app === app && typeRef.type === typeName
}

export function isSameTypeRef(typeRef1: TypeRef<unknown>, typeRef2: TypeRef<unknown>): boolean {
	return isSameTypeRefByAttr(typeRef1, typeRef2.app, typeRef2.type)
}

export function isSameTypeRefNullable(typeRef1: TypeRef<unknown> | null, typeRef2: TypeRef<unknown> | null): boolean {
	return (typeRef1 == null && typeRef2 == null) || (typeRef1 != null && typeRef2 !== null && isSameTypeRef(typeRef1, typeRef2))
}
