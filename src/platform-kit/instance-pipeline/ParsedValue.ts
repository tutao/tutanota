import { arrayEqualsWithPredicate, assert, assertNotNull, base64ToUint8Array, DeepEquals, isNotNull, Nullable, uint8ArrayToBase64 } from "@tutao/utils"
import { ProgrammingError } from "@tutao/app-env"
import { elementIdPart, listIdPart } from "@tutao/meta"

export const enum InstanceDirection {
	OutgoingToServer,
	IncomingFromServer,
}

export class ParsedValue<NestedObject extends DeepEquals> implements DeepEquals {
	private constructor(
		private readonly stringValue: Nullable<string>,
		private readonly arrayValue: Nullable<Array<ParsedValue<NestedObject>>>,
		private readonly nestedObj: Nullable<NestedObject>,
	) {
		let nonNullCount = (isNotNull(stringValue) ? 1 : 0) + (isNotNull(arrayValue) ? 1 : 0) + (isNotNull(nestedObj) ? 1 : 0)
		assert(nonNullCount <= 1, "At most one non-null value")
		if (isNotNull(this.arrayValue)) {
			assert(
				this.arrayValue.every((v) => !v.isNull()),
				"Array of nulled item? Mehh",
			)
		}
	}

	public isString(): boolean {
		return isNotNull(this.stringValue)
	}

	public isArray(): boolean {
		return isNotNull(this.arrayValue)
	}

	public isNestedObj(): boolean {
		return isNotNull(this.nestedObj)
	}

	public isNull() {
		return this.stringValue == null && this.arrayValue == null && this.nestedObj == null
	}

	public asString(): string {
		assert(this.nestedObj == null && this.arrayValue == null, "Expected a string")
		return assertNotNull(this.stringValue, "Expected string")
	}

	public asId(): Id {
		return this.asString()
	}

	public asIdOrIdTuple(): Id | IdTuple {
		const id = this.stringValue
		if (isNotNull(id)) {
			return id
		}
		const idTuple = this.arrayValue
		if (isNotNull(idTuple)) {
			const [listId, elementId] = idTuple
			if (isNotNull(listId) && isNotNull(elementId) && isNotNull(listId.stringValue) && isNotNull(elementId.stringValue)) {
				return [listId.stringValue, elementId.stringValue] satisfies IdTuple
			}
		}

		throw new ProgrammingError("Expected either id or idTuple. found None")
	}

	public asArray(): Array<ParsedValue<NestedObject>> {
		assert(this.nestedObj == null && this.stringValue == null, "Expected a array")
		return assertNotNull(this.arrayValue, "Expected array")
	}

	public asNestedObj(): NestedObject {
		assert(this.arrayValue == null && this.stringValue == null, "Expected Object")
		return assertNotNull(this.nestedObj, "Expected  Object")
	}

	public static fromNull<NestedObject extends DeepEquals>(): ParsedValue<NestedObject> {
		return new ParsedValue<NestedObject>(null, null, null)
	}

	static fromString<NestedObject extends DeepEquals>(value: string): ParsedValue<NestedObject> {
		//FIXME
		// Expand this to multiple methods that take correct value type
		return new ParsedValue<NestedObject>(value, null, null)
	}

	static fromNestedItem<NestedObject extends DeepEquals>(value: NestedObject): ParsedValue<NestedObject> {
		return new ParsedValue<NestedObject>(null, null, value)
	}

	static fromNestedItems<NestedObject extends DeepEquals>(value: Array<NestedObject>): ParsedValue<NestedObject> {
		const items = value.map((a) => ParsedValue.fromNestedItem(a))
		return new ParsedValue(null, items, null)
	}

	static fromIdList<NestedObject extends DeepEquals>(value: Array<Id>): ParsedValue<NestedObject> {
		const items = value.map((a) => ParsedValue.fromString<NestedObject>(a))
		return new ParsedValue<NestedObject>(null, items, null)
	}

	static fromIdTuple<NestedObject extends DeepEquals>(idTuple: IdTuple): ParsedValue<NestedObject> {
		const listId = ParsedValue.fromString<NestedObject>(listIdPart(idTuple))
		const elId = ParsedValue.fromString<NestedObject>(elementIdPart(idTuple))
		return new ParsedValue(null, [listId, elId], null)
	}

	static fromIdTupleList<NestedObject extends DeepEquals>(value: Array<IdTuple>): ParsedValue<NestedObject> {
		const items = value.map((idTuple) => ParsedValue.fromIdTuple<NestedObject>(idTuple))
		return new ParsedValue(null, items, null)
	}

	asIdTupleList(): Array<IdTuple> {
		return this.asArray().map((item) => item.asIdTuple())
	}

	asIdList(): Array<Id> {
		return this.asArray().map((item) => item.asId())
	}

	asNestedObjList(): Array<NestedObject> {
		return this.asArray().map((item) => item.asNestedObj())
	}

	static fromBoolean<NestedObject extends DeepEquals>(value: boolean): ParsedValue<NestedObject> {
		const stringValue = value ? "1" : "0"
		return new ParsedValue<NestedObject>(stringValue, null, null)
	}

	asBoolean(): boolean {
		return this.asString() !== "0"
	}

	asByteArray(): Uint8Array {
		return base64ToUint8Array(this.asString())
	}

	static fromByteArray<NestedObject extends DeepEquals>(byteArray: Uint8Array): ParsedValue<NestedObject> {
		const bytesAsString = uint8ArrayToBase64(byteArray)
		return ParsedValue.fromString<NestedObject>(bytesAsString)
	}

	asIdTuple(): IdTuple {
		return assertNotNull(this.getIdTupleOrNull(), "Expected to be an idTuple")
	}

	public getIdTupleOrNull(): Nullable<IdTuple> {
		const [lid, eid, ...rest] = this.asArray()
		const isIdTuple = rest.length === 0 && isNotNull(lid) && isNotNull(eid) && lid.isString() && eid.isString()
		if (isIdTuple) {
			return [lid.asString(), eid.asString()]
		}
		return null
	}

	static fromId<NestedObject extends DeepEquals>(id: Id): ParsedValue<NestedObject> {
		return ParsedValue.fromString<NestedObject>(id)
	}

	getNullWhenNull(): Nullable<this> {
		if (this.isNull()) {
			return null
		} else {
			return this
		}
	}

	asDate(): Date {
		return new Date(parseInt(this.asString()))
	}

	deepEquals(other: this): boolean {
		if (this.isString() === other.isString() && this.isArray() === other.isArray() && this.isNestedObj() === other.isNestedObj()) {
			if (this.isString()) {
				return this.asString() === other.asString()
			} else if (this.isArray()) {
				return arrayEqualsWithPredicate(this.asArray(), other.asArray(), (a, b) => a.deepEquals(b))
			} else if (this.isNestedObj()) {
				return this.asNestedObj().deepEquals(other.asNestedObj())
			}
		}

		return this.isNull() === other.isNull()
	}
}
