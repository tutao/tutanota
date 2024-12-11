import o from "@tutao/otest"
import { func, matchers, object, when } from "testdouble"
import { createMailExportTokenServicePostOut } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { MailExportTokenService } from "../../../../../src/common/api/entities/tutanota/Services"
import { AccessExpiredError, TooManyRequestsError } from "../../../../../src/common/api/common/error/RestError"
import { MailExportTokenFacade } from "../../../../../src/common/api/worker/facades/lazy/MailExportTokenFacade.js"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"

o.spec("MailExportTokenFacade", () => {
	let facade!: MailExportTokenFacade
	let serviceExecutor!: ServiceExecutor

	o.beforeEach(() => {
		serviceExecutor = object()
		facade = new MailExportTokenFacade(serviceExecutor)
	})

	o.spec("loading", () => {
		const validToken = "my token"
		const expiredToken = "my expired token"

		o.test("when there's no token, a new one is requested", async () => {
			const expected = "result"
			const cb = func<(token: string) => Promise<string>>()
			when(cb(validToken)).thenResolve(expected)
			when(serviceExecutor.post(MailExportTokenService, null, matchers.anything())).thenResolve(
				createMailExportTokenServicePostOut({ mailExportToken: validToken }),
			)

			const result = await facade.loadWithToken(cb)

			o(result).equals(expected)
		})

		o.test("when there is a valid token it is used", async () => {
			const expected = "result"
			const cb = func<(token: string) => Promise<string>>()
			when(cb(validToken)).thenResolve(expected)
			facade._setCurrentExportToken(validToken)

			const result = await facade.loadWithToken(cb)

			o(result).equals(expected)
		})

		o.test("when token is expired a new one is requested and used", async () => {
			const expected = "result"
			const cb = func<(token: string) => Promise<string>>()
			when(cb(validToken)).thenResolve(expected)
			when(cb(expiredToken)).thenReject(new AccessExpiredError("token expired"))
			facade._setCurrentExportToken(expiredToken)
			when(serviceExecutor.post(MailExportTokenService, null, matchers.anything())).thenResolve(
				createMailExportTokenServicePostOut({ mailExportToken: validToken }),
			)

			const result = await facade.loadWithToken(cb)

			o(result).equals(expected)
		})

		o.test("when requesting token fails none are stored", async () => {
			const cb = func<(token: string) => Promise<string>>()
			when(cb(expiredToken)).thenReject(new AccessExpiredError("token expired"))
			when(serviceExecutor.post(MailExportTokenService, null, matchers.anything())).thenReject(new TooManyRequestsError("no more tokens :("))

			await o(() => facade.loadWithToken(cb)).asyncThrows(TooManyRequestsError)

			o(facade._getCurrentExportToken()).equals(null)
		})
	})
})
