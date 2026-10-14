import o from "@tutao/otest"
import { snapshotEntity } from "../../../src/platform-kit/instance-pipeline/EntitySnapshot"
import { TypeRef } from "../../../src/platform-kit/meta"

o.spec("EntitySnapshot", function () {
	o.test("equals structuredClone for entity-like data", function () {
		const entity = {
			_id: ["list", "id"],
			subject: "hello",
			n: "1",
			flag: null,
			date: new Date(1234),
			bytes: new Uint8Array([1, 2, 3]),
			ids: ["a", "b"],
			agg: [{ _id: "x", name: "y", _original: { name: "y" } }],
		}
		const snapshot = snapshotEntity(entity)
		const expected = structuredClone(entity)
		;(expected.agg[0] as any)._original = null
		o(snapshot).deepEquals(expected)
	})

	o.test("mutating the entity does not affect the snapshot", function () {
		const entity = { subject: "a", ids: ["a"], agg: { name: "n" }, date: new Date(1), bytes: new Uint8Array([1]) }
		const snapshot = snapshotEntity(entity)
		entity.subject = "b"
		entity.ids.push("b")
		entity.agg.name = "m"
		entity.date.setTime(2)
		entity.bytes[0] = 9
		o(snapshot.subject).equals("a")
		o(snapshot.ids).deepEquals(["a"])
		o(snapshot.agg.name).equals("n")
		o(snapshot.date.getTime()).equals(1)
		o(Array.from(snapshot.bytes)).deepEquals([1])
	})

	o.test("shares TypeRef", function () {
		const typeRef = new TypeRef<any>("sys", 1)
		o(snapshotEntity({ _type: typeRef })._type === typeRef).equals(true)
	})
})
