import o from "@tutao/otest"
import type { Entity, PersistentEntity } from "../../../src/platform-kit/meta"
import type { ReadonlyEntity } from "../../../src/platform-kit/meta/ReadonlyEntity"
import type { Mail } from "../../../src/entities/tutanota/TypeRefs"

declare const mail: ReadonlyEntity<Mail>
declare function takesEntity<T extends Entity>(entity: T): void
declare function updatesPersistent<T extends PersistentEntity>(entity: T): void

/**
 * This tests asserts that ReadonlyEntity<T> can be read directly but can't be used where an entity is expected.
 */
function typeChecks() {
	const subject: string = mail.subject
	const senderAddress: string = mail.sender.address

	// @ts-expect-error _original is not part of the type
	mail._original
	// @ts-expect-error not assignable to Entity, so it can't be passed on to update()
	takesEntity(mail)
	// @ts-expect-error not assignable to PersistentEntity
	updatesPersistent(mail)
	// @ts-expect-error not assignable to the full entity
	const full: Mail = mail

	return [subject, senderAddress, full]
}

o.spec("ReadonlyEntity types", () => {
	o.test("compile-time checks are present", () => {
		o.check(typeof typeChecks).equals("function")
	})
})
