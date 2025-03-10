import o from "@tutao/otest"
import { getAttributeId, resolveTypeReference } from "../../../../src/common/api/common/EntityFunctions"
import { MailTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { spy } from "@tutao/tutanota-test-utils"

o.spec("EntityFunctionsTest", function () {
	o("can get attribute id lazily", async () => {
		o(await getAttributeId(MailTypeRef, "subject")).equals(105)
		o(await getAttributeId(MailTypeRef, "unread")).equals(109)

		// FIXME: mock resolveTypeReference?
		// - we want to verify that when calling getAttributeId for same type multiple times,
		// we should call resolveTypeRefernce only once
		// - and is there a way to mock TypeModel and not use real TypeRef

		//o(spy(resolveTypeReference).callCount).equals(1)
	})
})
