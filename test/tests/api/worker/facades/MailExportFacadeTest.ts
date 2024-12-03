import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { MAIL_EXPORT_TOKEN_HEADER, MailExportFacade } from "../../../../../src/common/api/worker/facades/lazy/MailExportFacade"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { createMailExportTokenServicePostOut, Mail, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { CacheMode, EntityRestClientLoadOptions } from "../../../../../src/common/api/worker/rest/EntityRestClient"
import { MailExportTokenService } from "../../../../../src/common/api/entities/tutanota/Services"
import { AccessExpiredError, TooManyRequestsError } from "../../../../../src/common/api/common/error/RestError"
import { createTestEntity } from "../../../TestUtils"

o.spec("MailExportFacade", () => {
	let serviceExecutor!: IServiceExecutor
	let entityClient!: EntityClient
	let facade!: MailExportFacade

	o.beforeEach(() => {
		serviceExecutor = object()
		entityClient = object()
		facade = new MailExportFacade(serviceExecutor, entityClient)
	})

	o.spec("loading", () => {
		const mailId = ["some mail list", "some mail id"] as IdTuple
		const validToken = "my token"
		const expiredToken = "my expired token"
		const testMail = createTestEntity<Mail>(MailTypeRef, {
			subject: "hellooooooo",
		})

		const hasValidToken = (a: EntityRestClientLoadOptions) => {
			return a.cacheMode === CacheMode.ReadOnly && a.extraHeaders![MAIL_EXPORT_TOKEN_HEADER] === validToken
		}
		const hasExpiredToken = (a: EntityRestClientLoadOptions) => {
			return a.cacheMode === CacheMode.ReadOnly && a.extraHeaders![MAIL_EXPORT_TOKEN_HEADER] === expiredToken
		}

		o.beforeEach(() => {
			when(serviceExecutor.post(MailExportTokenService, null)).thenResolve(createMailExportTokenServicePostOut({ mailExportToken: validToken }))

			when(entityClient.load(matchers.anything(), matchers.anything(), matchers.argThat(hasValidToken))).thenResolve(testMail)
			when(
				entityClient.loadMultiple(matchers.anything(), matchers.anything(), matchers.anything(), undefined, matchers.argThat(hasValidToken)),
			).thenResolve([testMail])
			when(
				entityClient.loadRange(
					matchers.anything(),
					matchers.anything(),
					matchers.anything(),
					matchers.anything(),
					matchers.anything(),
					matchers.argThat(hasValidToken),
				),
			).thenResolve([testMail])

			when(entityClient.load(matchers.anything(), matchers.anything(), matchers.argThat(hasExpiredToken))).thenReject(
				new AccessExpiredError("oh no load :("),
			)
			when(
				entityClient.loadMultiple(matchers.anything(), matchers.anything(), matchers.anything(), undefined, matchers.argThat(hasExpiredToken)),
			).thenReject(new AccessExpiredError("oh no loadMultiple :("))
			when(
				entityClient.loadRange(
					matchers.anything(),
					matchers.anything(),
					matchers.anything(),
					matchers.anything(),
					matchers.anything(),
					matchers.argThat(hasExpiredToken),
				),
			).thenReject(new AccessExpiredError("oh no loadRange :("))
		})

		o.spec("new export", () => {
			o.test("load", async () => {
				const mail = await facade.load(MailTypeRef, mailId)
				verify(entityClient.load(MailTypeRef, mailId, matchers.argThat(hasValidToken)))
				o(mail).deepEquals(testMail)
			})
			o.test("loadMultiple", async () => {
				const mails = await facade.loadMultiple(MailTypeRef, "some mail list", ["some mail id"])
				verify(entityClient.loadMultiple(MailTypeRef, "some mail list", ["some mail id"], undefined, matchers.argThat(hasValidToken)))
				o(mails).deepEquals([testMail])
			})
			o.test("loadRange", async () => {
				const mails = await facade.loadRange(MailTypeRef, "some mail list", "some mail id", 10, true)
				verify(entityClient.loadRange(MailTypeRef, "some mail list", "some mail id", 10, true, matchers.argThat(hasValidToken)))
				o(mails).deepEquals([testMail])
			})
		})

		o.spec("reuse token", () => {
			o.beforeEach(() => {
				facade._setCurrentExportToken(validToken)
			})
			o.test("load", async () => {
				const mail = await facade.load(MailTypeRef, mailId)
				verify(entityClient.load(MailTypeRef, mailId, matchers.argThat(hasValidToken)))
				o(mail).deepEquals(testMail)
			})
			o.test("loadMultiple", async () => {
				const mails = await facade.loadMultiple(MailTypeRef, "some mail list", ["some mail id"])
				verify(entityClient.loadMultiple(MailTypeRef, "some mail list", ["some mail id"], undefined, matchers.argThat(hasValidToken)))
				o(mails).deepEquals([testMail])
			})
			o.test("loadRange", async () => {
				const mails = await facade.loadRange(MailTypeRef, "some mail list", "some mail id", 10, true)
				verify(entityClient.loadRange(MailTypeRef, "some mail list", "some mail id", 10, true, matchers.argThat(hasValidToken)))
				o(mails).deepEquals([testMail])
			})
		})

		o.spec("re-request token on expiry", () => {
			o.beforeEach(() => {
				facade._setCurrentExportToken(expiredToken)
			})
			o.test("load", async () => {
				const mail = await facade.load(MailTypeRef, mailId)
				verify(entityClient.load(MailTypeRef, mailId, matchers.argThat(hasExpiredToken)))
				verify(entityClient.load(MailTypeRef, mailId, matchers.argThat(hasValidToken)))
				o(facade._getCurrentExportToken()).equals(validToken)
				o(mail).deepEquals(testMail)
			})
			o.test("loadMultiple", async () => {
				const mails = await facade.loadMultiple(MailTypeRef, "some mail list", ["some mail id"])
				verify(entityClient.loadMultiple(MailTypeRef, "some mail list", ["some mail id"], undefined, matchers.argThat(hasExpiredToken)))
				verify(entityClient.loadMultiple(MailTypeRef, "some mail list", ["some mail id"], undefined, matchers.argThat(hasValidToken)))
				o(facade._getCurrentExportToken()).equals(validToken)
				o(mails).deepEquals([testMail])
			})
			o.test("loadRange", async () => {
				const mails = await facade.loadRange(MailTypeRef, "some mail list", "some mail id", 10, true)
				verify(entityClient.loadRange(MailTypeRef, "some mail list", "some mail id", 10, true, matchers.argThat(hasExpiredToken)))
				verify(entityClient.loadRange(MailTypeRef, "some mail list", "some mail id", 10, true, matchers.argThat(hasValidToken)))
				o(facade._getCurrentExportToken()).equals(validToken)
				o(mails).deepEquals([testMail])
			})
		})

		o.spec("left uninitialized if unable to request tokens", () => {
			o.beforeEach(() => {
				when(serviceExecutor.post(MailExportTokenService, null)).thenReject(new TooManyRequestsError("no more tokens :("))
			})
			o.test("load", async () => {
				await o(() => facade.load(MailTypeRef, mailId)).asyncThrows(TooManyRequestsError)
				verify(entityClient.load(MailTypeRef, mailId, matchers.argThat(hasValidToken)), { times: 0 })
				o(facade._getCurrentExportToken()).equals(null)
			})
			o.test("loadMultiple", async () => {
				await o(() => facade.loadMultiple(MailTypeRef, "some mail list", ["some mail id"])).asyncThrows(TooManyRequestsError)
				verify(entityClient.loadMultiple(MailTypeRef, "some mail list", ["some mail id"], undefined, matchers.argThat(hasValidToken)), { times: 0 })
				o(facade._getCurrentExportToken()).equals(null)
			})
			o.test("loadRange", async () => {
				await o(() => facade.loadRange(MailTypeRef, "some mail list", "some mail id", 10, true)).asyncThrows(TooManyRequestsError)
				verify(entityClient.loadRange(MailTypeRef, "some mail list", "some mail id", 10, true, matchers.argThat(hasValidToken)), { times: 0 })
				o(facade._getCurrentExportToken()).equals(null)
			})
		})
	})
})
