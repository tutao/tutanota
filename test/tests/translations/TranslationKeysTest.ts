import o from "@tutao/otest"
import { difference } from "@tutao/tutanota-utils"
// @ts-ignore[untyped-import]
import en from "../../../src/mail-app/translations/en.js"
// @ts-ignore[untyped-import]
import de from "../../../src/mail-app/translations/de.js"
// @ts-ignore[untyped-import]
import de_sie from "../../../src/mail-app/translations/de_sie.js"

o.spec("synchronisation of translation keys", function () {
	o("en, de and de_sie have exactly the same keys", async function () {
		const enKeys = Object.keys(en.keys)
		const deKeys = Object.keys(de.keys)
		const deSieKeys = Object.keys(de_sie.keys)
		const extraKeysInEn = difference(enKeys, deKeys)
		const extraKeysInDe = difference(deKeys, enKeys)
		const extraKeysInDeSie = difference(deSieKeys, deKeys)
		const keysNotInDeSie = difference(deKeys, deSieKeys)
		o(extraKeysInEn).deepEquals([])("extra keys in en")
		o(extraKeysInDe).deepEquals([])("extra keys in de")
		o(extraKeysInDeSie).deepEquals([])("extra keys in de_sie")
		o(keysNotInDeSie).deepEquals([])("keys not in de_sie")
	})
})