import o from "@tutao/otest"
import { NotificationSettingsViewerModel } from "../../../src/mail-app/settings/NotificationSettingsViewerModel"
import { NativePushServiceApp } from "../../../src/common/native/main/NativePushServiceApp"
import { createPushIdentifierList, PushIdentifier, PushIdentifierTypeRef, User, UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { object, when } from "testdouble"
import { createTestEntity } from "../TestUtils"
import { AppType } from "../../../src/common/misc/ClientConstants"

o.spec("NotificationSettingsViewerModel", () => {
	let model: NotificationSettingsViewerModel
	let pushService: NativePushServiceApp
	let user: User
	let entityClient: EntityClient

	o.beforeEach(() => {
		pushService = object()
		user = createTestEntity(UserTypeRef, user)
		entityClient = object()
		model = new NotificationSettingsViewerModel(pushService, user, entityClient)
	})

	o.spec("reload push notifiers", () => {
		o.test("not yet reloaded", () => {
			o.check(model.getCurrentIdentifier()).equals(null)
			o.check(model.getLoadedPushIdentifiers()).deepEquals([])
		})

		o.test("loaded with a few identifiers and no current identifier", async () => {
			when(pushService.getLoadedPushIdentifier()).thenReturn(null)

			user.pushIdentifierList = createPushIdentifierList({
				list: "hi i'm a list",
			})

			const someList = [
				createTestEntity(PushIdentifierTypeRef, { identifier: "a", app: AppType.Mail }),
				createTestEntity(PushIdentifierTypeRef, { identifier: "b", app: AppType.Mail }),
				createTestEntity(PushIdentifierTypeRef, { identifier: "c", app: AppType.Mail }),
				createTestEntity(PushIdentifierTypeRef, { identifier: "d", app: AppType.Mail }),
				createTestEntity(PushIdentifierTypeRef, { identifier: "e", app: AppType.Mail }),
			]

			when(entityClient.loadAll(PushIdentifierTypeRef, user.pushIdentifierList.list)).thenResolve(someList)

			await model.reload()

			o.check(model.getCurrentIdentifier()).equals(null)
			o.check(model.getLoadedPushIdentifiers()).deepEquals(someList)
		})

		o.test("loaded with a few identifiers and a current identifier", async () => {
			when(pushService.getLoadedPushIdentifier()).thenReturn({
				identifier: "c",
				disabled: false,
			})

			user.pushIdentifierList = createPushIdentifierList({
				list: "hi i'm a list",
			})

			const someList = [
				createTestEntity(PushIdentifierTypeRef, { identifier: "a", app: AppType.Mail }),
				createTestEntity(PushIdentifierTypeRef, { identifier: "b", app: AppType.Mail }),
				createTestEntity(PushIdentifierTypeRef, { identifier: "c", app: AppType.Mail }),
				createTestEntity(PushIdentifierTypeRef, { identifier: "d", app: AppType.Mail }),
				createTestEntity(PushIdentifierTypeRef, { identifier: "e", app: AppType.Mail }),
			]

			when(entityClient.loadAll(PushIdentifierTypeRef, user.pushIdentifierList.list)).thenResolve(someList)

			await model.reload()

			o.check(model.getCurrentIdentifier()).equals("c")
			o.check(model.getLoadedPushIdentifiers()).deepEquals([someList[2], someList[0], someList[1], someList[3], someList[4]])
		})

		o.test("loaded with many identifiers and no current identifier", async () => {
			when(pushService.getLoadedPushIdentifier()).thenReturn(null)

			user.pushIdentifierList = createPushIdentifierList({
				list: "hi i'm a list",
			})

			const someList: PushIdentifier[] = []

			for (let i = 1; i <= 1000; i++) {
				someList.push(createTestEntity(PushIdentifierTypeRef, { identifier: `${i}`, app: AppType.Mail }))
			}
			someList.splice(500, 0, createTestEntity(PushIdentifierTypeRef, { identifier: "this is my current identifier", app: AppType.Mail }))
			when(entityClient.loadAll(PushIdentifierTypeRef, user.pushIdentifierList.list)).thenResolve(someList)

			await model.reload()
			o.check(model.getCurrentIdentifier()).equals(null)
			const identifiers = model.getLoadedPushIdentifiers()
			o.check(identifiers.length).equals(50)
			o.check(identifiers[0].identifier).equals("951")
			o.check(identifiers[49].identifier).equals("1000")
		})

		o.test("loaded with many identifiers and a current identifier", async () => {
			when(pushService.getLoadedPushIdentifier()).thenReturn({
				identifier: "this is my current identifier",
				disabled: false,
			})

			user.pushIdentifierList = createPushIdentifierList({
				list: "hi i'm a list",
			})

			const someList: PushIdentifier[] = []

			for (let i = 1; i <= 1000; i++) {
				someList.push(createTestEntity(PushIdentifierTypeRef, { identifier: `${i}`, app: AppType.Mail }))
			}
			someList.splice(500, 0, createTestEntity(PushIdentifierTypeRef, { identifier: "this is my current identifier", app: AppType.Mail }))
			when(entityClient.loadAll(PushIdentifierTypeRef, user.pushIdentifierList.list)).thenResolve(someList)

			await model.reload()
			o.check(model.getCurrentIdentifier()).equals("this is my current identifier")
			const identifiers = model.getLoadedPushIdentifiers()
			o.check(identifiers.length).equals(51)
			o.check(identifiers[0].identifier).equals("this is my current identifier")
			o.check(identifiers[50].identifier).equals("1000")
		})

		o.test("calendar notifiers are ignored", async () => {
			when(pushService.getLoadedPushIdentifier()).thenReturn(null)

			user.pushIdentifierList = createPushIdentifierList({
				list: "hi i'm a list",
			})

			const someList: PushIdentifier[] = []
			someList.push(createTestEntity(PushIdentifierTypeRef, { identifier: `a mail identifier`, app: AppType.Mail }))
			someList.push(createTestEntity(PushIdentifierTypeRef, { identifier: `a calendar identifier`, app: AppType.Calendar }))
			someList.push(createTestEntity(PushIdentifierTypeRef, { identifier: `an integrated identifier`, app: AppType.Integrated }))

			when(entityClient.loadAll(PushIdentifierTypeRef, user.pushIdentifierList.list)).thenResolve(someList)

			await model.reload()
			o.check(model.getCurrentIdentifier()).equals(null)
			const identifiers = model.getLoadedPushIdentifiers()
			o.check(identifiers.length).equals(2)
			o.check(identifiers.every((identifier) => identifier.app !== AppType.Calendar)).equals(true)
		})
	})
})
