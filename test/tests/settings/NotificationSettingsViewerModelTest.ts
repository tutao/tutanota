import o from "@tutao/otest"
import { NotificationSettingsViewerModel } from "../../../src/mail-app/settings/NotificationSettingsViewerModel"
import { NativePushServiceApp } from "../../../src/common/native/main/NativePushServiceApp"
import { sysTypeRefs } from "@tutao/typeRefs"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { object, when } from "testdouble"
import { createTestEntity } from "../TestUtils"
import { AppType } from "../../../src/common/misc/ClientConstants"

o.spec("NotificationSettingsViewerModel", () => {
	let model: NotificationSettingsViewerModel
	let pushService: NativePushServiceApp
	let user: sysTypeRefs.User
	let entityClient: EntityClient

	o.beforeEach(() => {
		pushService = object()
		user = createTestEntity(sysTypeRefs.UserTypeRef, user)
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

			user.pushIdentifierList = sysTypeRefs.createPushIdentifierList({
				list: "hi i'm a list",
			})

			const someList = [
				createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "a", app: AppType.Mail }),
				createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "b", app: AppType.Mail }),
				createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "c", app: AppType.Mail }),
				createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "d", app: AppType.Mail }),
				createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "e", app: AppType.Mail }),
			]

			when(entityClient.loadAll(sysTypeRefs.PushIdentifierTypeRef, user.pushIdentifierList.list)).thenResolve(someList)

			await model.reload()

			o.check(model.getCurrentIdentifier()).equals(null)
			o.check(model.getLoadedPushIdentifiers()).deepEquals(someList)
		})

		o.test("loaded with a few identifiers and a current identifier", async () => {
			when(pushService.getLoadedPushIdentifier()).thenReturn({
				identifier: "c",
				disabled: false,
			})

			user.pushIdentifierList = sysTypeRefs.createPushIdentifierList({
				list: "hi i'm a list",
			})

			const someList = [
				createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "a", app: AppType.Mail }),
				createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "b", app: AppType.Mail }),
				createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "c", app: AppType.Mail }),
				createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "d", app: AppType.Mail }),
				createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "e", app: AppType.Mail }),
			]

			when(entityClient.loadAll(sysTypeRefs.PushIdentifierTypeRef, user.pushIdentifierList.list)).thenResolve(someList)

			await model.reload()

			o.check(model.getCurrentIdentifier()).equals("c")
			o.check(model.getLoadedPushIdentifiers()).deepEquals([someList[2], someList[0], someList[1], someList[3], someList[4]])
		})

		o.test("loaded with many identifiers and no current identifier", async () => {
			when(pushService.getLoadedPushIdentifier()).thenReturn(null)

			user.pushIdentifierList = sysTypeRefs.createPushIdentifierList({
				list: "hi i'm a list",
			})

			const someList: sysTypeRefs.PushIdentifier[] = []

			for (let i = 1; i <= 1000; i++) {
				someList.push(createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: `${i}`, app: AppType.Mail }))
			}
			someList.splice(500, 0, createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "this is my current identifier", app: AppType.Mail }))
			when(entityClient.loadAll(sysTypeRefs.PushIdentifierTypeRef, user.pushIdentifierList.list)).thenResolve(someList)

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

			user.pushIdentifierList = sysTypeRefs.createPushIdentifierList({
				list: "hi i'm a list",
			})

			const someList: sysTypeRefs.PushIdentifier[] = []

			for (let i = 1; i <= 1000; i++) {
				someList.push(createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: `${i}`, app: AppType.Mail }))
			}
			someList.splice(500, 0, createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: "this is my current identifier", app: AppType.Mail }))
			when(entityClient.loadAll(sysTypeRefs.PushIdentifierTypeRef, user.pushIdentifierList.list)).thenResolve(someList)

			await model.reload()
			o.check(model.getCurrentIdentifier()).equals("this is my current identifier")
			const identifiers = model.getLoadedPushIdentifiers()
			o.check(identifiers.length).equals(51)
			o.check(identifiers[0].identifier).equals("this is my current identifier")
			o.check(identifiers[50].identifier).equals("1000")
		})

		o.test("calendar notifiers are ignored", async () => {
			when(pushService.getLoadedPushIdentifier()).thenReturn(null)

			user.pushIdentifierList = sysTypeRefs.createPushIdentifierList({
				list: "hi i'm a list",
			})

			const someList: sysTypeRefs.PushIdentifier[] = []
			someList.push(createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: `a mail identifier`, app: AppType.Mail }))
			someList.push(createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: `a calendar identifier`, app: AppType.Calendar }))
			someList.push(createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { identifier: `an integrated identifier`, app: AppType.Integrated }))

			when(entityClient.loadAll(sysTypeRefs.PushIdentifierTypeRef, user.pushIdentifierList.list)).thenResolve(someList)

			await model.reload()
			o.check(model.getCurrentIdentifier()).equals(null)
			const identifiers = model.getLoadedPushIdentifiers()
			o.check(identifiers.length).equals(2)
			o.check(identifiers.every((identifier) => identifier.app !== AppType.Calendar)).equals(true)
		})
	})
})
