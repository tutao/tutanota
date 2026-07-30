import o from "@tutao/otest"
import { InstanceTypeId, makeKeyDerivationContext } from "../../../src/platform-kit/instance-pipeline/InstanceTypeContext"

o.spec("InstanceTypeContextTest", () => {
	o.spec("KeyDerivationContext", () => {
		const mail: InstanceTypeId = {
			app: "tutanota",
			name: "Mail",
			id: 97,
		}

		const mailDetailsDraft: InstanceTypeId = {
			app: "tutanota",
			name: "MailDetailsDraft",
			id: 1290,
		}

		const mailDetailsBlob: InstanceTypeId = {
			app: "tutanota",
			name: "MailDetailsBlob",
			id: 1298,
		}

		o.test("replaces MailDetailsDraft type ID with MailDetailsBlob type ID", () => {
			const keyDerivationContext = makeKeyDerivationContext(mailDetailsDraft)
			o.check(keyDerivationContext as string).equals(`${mailDetailsBlob.app}/${mailDetailsBlob.id}`)
		})

		o.test("does not replace other type IDs", () => {
			const keyDerivationContext = makeKeyDerivationContext(mail)
			o.check(keyDerivationContext as string).equals(`${mail.app}/${mail.id}`)
		})
	})
})
