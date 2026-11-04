import o from "@tutao/otest"
import { computeLabelIndexKey, ImapLabelIndex } from "../../../../../src/applications/common/desktop/migration/imapsync/ImapLabelIndex"

o.spec("ImapLabelIndex", () => {
	o.test("labelsFor returns all labels containing the key", () => {
		const index = new ImapLabelIndex()
		index.reserve("Labels/A", 2)
		for (let i = 0n; i < 100n; i++) {
			index.add("Labels/A", i * 7n)
		}
		index.add("Folders/B", 14n)
		index.add("Folders/B", 3n)
		index.finish()

		o.check(index.labelsFor(14n)).deepEquals(new Set(["Labels/A", "Folders/B"]))
		o.check(index.labelsFor(21n)).deepEquals(new Set(["Labels/A"]))
		o.check(index.labelsFor(3n)).deepEquals(new Set(["Folders/B"]))
		o.check(index.labelsFor(4n)).deepEquals(new Set())
		o.check(index.labelsFor(2n ** 64n - 1n)).deepEquals(new Set())
	})

	o.test("empty index", () => {
		const index = new ImapLabelIndex()
		index.finish()
		o.check(index.labelsFor(1n)).deepEquals(new Set())
	})

	o.spec("computeLabelIndexKey", () => {
		const base = { envelope: { messageId: "<a@b>", subject: "s" }, internalDate: new Date(1000), size: 42 }

		o.test("same for equal mails, also if internalDate is a string", () => {
			o.check(computeLabelIndexKey(base)).equals(computeLabelIndexKey({ ...base, internalDate: new Date(1000).toISOString() }))
		})

		o.test("differs if message id, date or size differ", () => {
			const key = computeLabelIndexKey(base)
			o.check(computeLabelIndexKey({ ...base, envelope: { messageId: "<c@d>" } })).notEquals(key)
			o.check(computeLabelIndexKey({ ...base, internalDate: new Date(2000) })).notEquals(key)
			o.check(computeLabelIndexKey({ ...base, size: 43 })).notEquals(key)
		})

		o.test("uses subject if there is no message id", () => {
			const noId = { internalDate: new Date(1000), size: 42 }
			o.check(computeLabelIndexKey({ ...noId, envelope: { subject: "a" } })).notEquals(computeLabelIndexKey({ ...noId, envelope: { subject: "b" } }))
		})
	})
})
