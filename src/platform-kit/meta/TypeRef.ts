import { Entity } from "./EntityTypes"

export type AppName = string

// Important: Keep ASC order for application names
export const AppNameEnum = Object.freeze({
	Accounting: "accounting",
	Base: "base",
	Drive: "drive",
	Gossip: "gossip",
	Monitor: "monitor",
	Storage: "storage",
	Sys: "sys",
	Tutanota: "tutanota",
	Usage: "usage",
})

/**
 * T should be restricted to Entity.
 */
export class TypeRef<T extends Entity<T>> {
	readonly app: AppName
	readonly typeId: number

	/**
	 * Field that is never set. Used to make two TypeRefs incompatible (they are structurally compared otherwise).
	 * Cannot be private.
	 */
	readonly phantom: T | null = null

	constructor(app: AppName, typeId: number) {
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

export function getTypeString<T extends Entity<T>>(typeRef: TypeRef<T>) {
	return typeRef.app + "/" + typeRef.typeId
}

export function parseTypeString<T extends Entity<T>>(s: string): TypeRef<T> {
	const parts = s.split("/")
	const [app, versionString] = parts
	if (app == null || versionString == null) {
		throw new TypeError(`invalid type string: ${s}`)
	}
	return new TypeRef<T>(app as AppName, parseInt(parts[1], 10))
}

export function isSameTypeRefByAttr<T extends Entity<T>>(typeRef: TypeRef<T>, app: string, typeId: number): boolean {
	return typeRef.app === app && typeRef.typeId === typeId
}

export function isSameTypeRef<T1 extends Entity<T1>, T2 extends Entity<T2>>(typeRef1: TypeRef<T1>, typeRef2: TypeRef<T2>): boolean {
	return isSameTypeRefByAttr(typeRef1, typeRef2.app, typeRef2.typeId)
}
