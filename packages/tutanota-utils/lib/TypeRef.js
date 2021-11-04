//@flow

/**
 * Attention: TypeRef must be defined as class and not as Flow type because object types use structural typing and TypeRef does not
 * reference T. See https://github.com/facebook/flow/issues/3348
 * T should be bound to entities but we have no type to define them yet.
 */
export class TypeRef<+T> {
	+app: string;
	+type: string;

	constructor(app: string, type: string) {
		this.app = app
		this.type = type
		Object.freeze(this)
	}
}

export function isSameTypeRefByAttr(typeRef: TypeRef<any>, app: string, type: string): boolean {
	return typeRef.app === app && typeRef.type === type
}

export function isSameTypeRef(typeRef1: TypeRef<any>, typeRef2: TypeRef<any>): boolean {
	return isSameTypeRefByAttr(typeRef1, typeRef2.app, typeRef2.type)
}