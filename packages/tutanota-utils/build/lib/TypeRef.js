/**
 * T should be restricted to Entity.
 */
export class TypeRef {
    app;
    type;
    /**
     * Field that is never set. Used to make two TypeRefs incompatible (they are structurally compared otherwise).
     * Cannot be private.
     */
    phantom = null;
    constructor(app, type) {
        this.app = app;
        this.type = type;
        Object.freeze(this);
    }
    /**
     * breaks when the object passes worker barrier
     */
    toString() {
        return `[TypeRef ${this.app} ${this.type}]`;
    }
}
export function getTypeId(typeRef) {
    return typeRef.app + "/" + typeRef.type;
}
export function isSameTypeRefByAttr(typeRef, app, typeName) {
    return typeRef.app === app && typeRef.type === typeName;
}
export function isSameTypeRef(typeRef1, typeRef2) {
    return isSameTypeRefByAttr(typeRef1, typeRef2.app, typeRef2.type);
}
export function isSameTypeRefNullable(typeRef1, typeRef2) {
    return (typeRef1 == null && typeRef2 == null) || (typeRef1 != null && typeRef2 !== null && isSameTypeRef(typeRef1, typeRef2));
}
