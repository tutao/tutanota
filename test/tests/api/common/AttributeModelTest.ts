import o from "@tutao/otest"
import {  AttributeModel } from "../../../../src/common/api/common/AttributeModel"
import { MailTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { spy } from "@tutao/tutanota-test-utils"
import {resolveTypeReference} from "../../../../src/common/api/common/EntityFunctions";

o.spec("EntityFunctionsTest", function () {
	o("can get attribute id lazily", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef);
		o(AttributeModel.getAttributeId(mailModel, "subject")).equals(105)
		o(AttributeModel.getAttributeId(mailModel, "unread")).equals(109)

		// FIXME: mock resolveTypeReference?
		// - we want to verify that when calling getAttributeId for same type multiple times,
		// we should call resolveTypeRefernce only once
		// - and is there a way to mock TypeModel and not use real TypeRef

		//o(spy(resolveTypeReference).callCount).equals(1)
	})
})
