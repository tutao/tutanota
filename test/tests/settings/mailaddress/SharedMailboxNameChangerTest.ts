import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { MailAddressFacade } from "../../../../src/applications/common/api/worker/facades/lazy/MailAddressFacade.js"
import { SharedMailboxNameChanger } from "../../../../src/applications/common/settings/mailaddress/SharedMailboxNameChanger.js"

o.spec("SharedMailboxNameChanger", function () {
	let mailAddressFacade: MailAddressFacade
	let nameChanger: SharedMailboxNameChanger
	const mailGroupId = "mailGroupId"

	o.beforeEach(function () {
		mailAddressFacade = object()
		nameChanger = new SharedMailboxNameChanger(mailAddressFacade, mailGroupId)
	})

	o("getSenderNames delegates to the facade without a viaUser", async function () {
		const names = new Map([["a@tuta.com", "Alice"]])
		when(mailAddressFacade.getSenderNames(mailGroupId)).thenResolve(names)

		const result = await nameChanger.getSenderNames()

		o(result).equals(names)
		verify(mailAddressFacade.getSenderNames(mailGroupId), { times: 1 })
	})

	o("setSenderName delegates to the facade without a viaUser", async function () {
		const names = new Map([["a@tuta.com", "New Name"]])
		when(mailAddressFacade.setSenderName(mailGroupId, "a@tuta.com", "New Name")).thenResolve(names)

		const result = await nameChanger.setSenderName("a@tuta.com", "New Name")

		o(result).equals(names)
		verify(mailAddressFacade.setSenderName(mailGroupId, "a@tuta.com", "New Name"), { times: 1 })
	})

	o("removeSenderName delegates to the facade without a viaUser", async function () {
		const names = new Map()
		when(mailAddressFacade.removeSenderName(mailGroupId, "a@tuta.com")).thenResolve(names)

		const result = await nameChanger.removeSenderName("a@tuta.com")

		o(result).equals(names)
		verify(mailAddressFacade.removeSenderName(mailGroupId, "a@tuta.com"), { times: 1 })
	})
})
