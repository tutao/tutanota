import o, { assertThrows } from "@tutao/otest"
import { OAuthHandler } from "../../../../../src/applications/mail-app/settings/imapimport/oauth/OAuthHandler"
import { matchers, object, verify, when } from "testdouble"
import { OAuthErrorHandler } from "../../../../../src/applications/mail-app/settings/imapimport/oauth/OAuthErrorHandler"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { createTestEntity } from "../../../TestUtils"
import { ImapAccountSyncStateTypeRef, ImapAccountTypeRef, OAuthTokenEndpointResponseTypeRef } from "@tutao/entities/tutanota"
import { ImapProvider } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { ImapAccountSyncStatus } from "../../../../../src/entities/tutanota/Utils"
import * as oauth from "oauth4webapi"
import { TokenEndpointResponseHelpers } from "openid-client"
import { ProgrammingError } from "../../../../../src/platform-kit/app-env"
import { IServiceExecutor } from "../../../../../src/platform-kit/network/ServiceRequest"

o.spec("OAuthErrorHandler", () => {
	let oAuthHandlerMock: OAuthHandler
	let oAuthErrorHandler: OAuthErrorHandler
	let entityClientMock: EntityClient
	let serviceExecutorMock: IServiceExecutor

	o.beforeEach(() => {
		entityClientMock = object<EntityClient>()
		oAuthHandlerMock = object<OAuthHandler>()
		serviceExecutorMock = object<IServiceExecutor>()
		oAuthErrorHandler = new OAuthErrorHandler(entityClientMock, serviceExecutorMock, () => oAuthHandlerMock)
	})

	o.test("handleAuthError - returns false and updates to error if provider is other", async () => {
		const state = createTestEntity(ImapAccountSyncStateTypeRef, {
			_id: ["listId", "elementId"],
			provider: ImapProvider.Other.toString(),
			status: ImapAccountSyncStatus.RUNNING,
		})
		when(entityClientMock.load(ImapAccountSyncStateTypeRef, state._id)).thenResolve(state)
		const shouldRetry = await oAuthErrorHandler.handleAuthError(state._id)

		o.check(shouldRetry).equals(false)
		verify(entityClientMock.update(state), { times: 1 })
		o.check(state.status).equals(ImapAccountSyncStatus.AUTH_ERROR)
	})

	o.test("handleAuthError - returns true when provider is oauth and refresh was successful", async () => {
		const updatedToken = {
			refresh_token: "updatedToken",
		} as unknown as oauth.TokenEndpointResponse & TokenEndpointResponseHelpers
		when(oAuthHandlerMock.refreshTokens(matchers.anything())).thenResolve(
			updatedToken as Partial<oauth.TokenEndpointResponse & TokenEndpointResponseHelpers>,
		)

		const state = createTestEntity(ImapAccountSyncStateTypeRef, {
			_id: ["listId", "elementId"],
			provider: ImapProvider.Gmail.toString(),
			status: ImapAccountSyncStatus.PAUSED,
			imapAccount: createTestEntity(ImapAccountTypeRef, {
				oAuthTokenEndpointResponse: createTestEntity(OAuthTokenEndpointResponseTypeRef, {
					refreshToken: "expiredToken",
				}),
			}),
		})
		when(entityClientMock.load(ImapAccountSyncStateTypeRef, state._id)).thenResolve(state)
		const shouldRetry = await oAuthErrorHandler.handleAuthError(state._id)

		o.check(shouldRetry).equals(true)
		verify(entityClientMock.update(state), { times: 1 })
		o.check(state.status).equals(ImapAccountSyncStatus.PAUSED)
		o.check(state.imapAccount.oAuthTokenEndpointResponse?.refreshToken).equals("updatedToken")
	})

	o.test("handleAuthError - returns false when provider is oauth and refresh failed", async () => {
		when(oAuthHandlerMock.refreshTokens(matchers.anything())).thenReject({ message: "I am out of tokens" })

		const state = createTestEntity(ImapAccountSyncStateTypeRef, {
			_id: ["listId", "elementId"],
			provider: ImapProvider.Gmail.toString(),
			status: ImapAccountSyncStatus.RUNNING,
			imapAccount: createTestEntity(ImapAccountTypeRef, {
				oAuthTokenEndpointResponse: createTestEntity(OAuthTokenEndpointResponseTypeRef, {
					refreshToken: "expiredToken",
				}),
			}),
		})
		when(entityClientMock.load(ImapAccountSyncStateTypeRef, state._id)).thenResolve(state)
		const shouldRetry = await oAuthErrorHandler.handleAuthError(state._id)

		o.check(shouldRetry).equals(false)
		verify(entityClientMock.update(state), { times: 1 })
		o.check(state.status).equals(ImapAccountSyncStatus.AUTH_ERROR)
		o.check(state.imapAccount.oAuthTokenEndpointResponse?.refreshToken).equals("expiredToken")
	})

	o.test("handleAuthError - throws programming error if provider is unknown", async () => {
		when(oAuthHandlerMock.refreshTokens(matchers.anything())).thenReject({ message: "I am out of tokens" })

		const state = createTestEntity(ImapAccountSyncStateTypeRef, {
			_id: ["listId", "elementId"],
			provider: "999",
			status: ImapAccountSyncStatus.RUNNING,
		})
		when(entityClientMock.load(ImapAccountSyncStateTypeRef, state._id)).thenResolve(state)
		const e = await assertThrows(ProgrammingError, async () => await oAuthErrorHandler.handleAuthError(state._id))
		o(e.message).equals("imap sync found no Oauth config")

		verify(entityClientMock.update(state), { times: 0 })
		o.check(state.status).equals(ImapAccountSyncStatus.RUNNING)
	})
})
