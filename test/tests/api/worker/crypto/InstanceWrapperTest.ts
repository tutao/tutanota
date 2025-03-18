import o from "@tutao/otest"
import { AttributeModel, resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions"
import { MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { SomeEntity } from "../../../../../src/common/api/common/EntityTypes"

o.spec("InstanceWrapperTest", () => {
	o.test("expect correct value type when intitializing", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const encryptedMail = {}
	})
})
