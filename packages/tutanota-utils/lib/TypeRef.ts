/**
 * T should be restricted to Entity.
 */
export class TypeRef<T> {
	readonly app: string
	readonly typeId: number

	/**
	 * Field that is never set. Used to make two TypeRefs incompatible (they are structurally compared otherwise).
	 * Cannot be private.
	 */
	readonly phantom: T | null = null

	constructor(app: string, typeId: number) {
		this.app = app
		this.typeId = typeId
		Object.freeze(this)
	}

	/**
	 * breaks when the object passes worker barrier
	 */
	toString(): string {
		return `[TypeRef ${this.app} ${this.typeId}]`
	}
}

//FIXME rename this
export function getTypeId(typeRef: TypeRef<unknown>) {
	return typeRef.app + "/" + typeRef.typeId
}

export function isSameTypeRefByAttr(typeRef: TypeRef<unknown>, app: string, typeId: number): boolean {
	return typeRef.app === app && typeRef.typeId === typeId
}

export function isSameTypeRef(typeRef1: TypeRef<unknown>, typeRef2: TypeRef<unknown>): boolean {
	return isSameTypeRefByAttr(typeRef1, typeRef2.app, typeRef2.typeId)
}

export function isSameTypeRefNullable(typeRef1: TypeRef<unknown> | null, typeRef2: TypeRef<unknown> | null): boolean {
	return (typeRef1 == null && typeRef2 == null) || (typeRef1 != null && typeRef2 !== null && isSameTypeRef(typeRef1, typeRef2))
}
