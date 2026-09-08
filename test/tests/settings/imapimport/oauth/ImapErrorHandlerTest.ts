import o, { assertThrows } from "@tutao/otest"
import { OAuthHandler } from "../../../../../src/applications/mail-app/settings/imapimport/oauth/OAuthHandler"
import { matchers, object, verify, when } from "testdouble"
import { ImapErrorHandler } from "../../../../../src/applications/mail-app/settings/imapimport/ImapErrorHandler"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { createTestEntity } from "../../../TestUtils"
import { MailboxMigrationImapConfigurationTypeRef, MailboxMigrationSyncStateTypeRef, OAuthTokenEndpointResponseLegacyTypeRef } from "@tutao/entities/tutanota"
import { MailboxMigrationProvider } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { ImapAccountSyncStatus } from "../../../../../src/entities/tutanota/Utils"
import * as oauth from "oauth4webapi"
import { TokenEndpointResponseHelpers } from "openid-client"
import { ProgrammingError } from "../../../../../src/platform-kit/app-env"
import { IServiceExecutor } from "../../../../../src/platform-kit/network/ServiceRequest"
import { GENERATED_MAX_ID } from "../../../../../src/platform-kit/meta"
import { GeneratedIdWrapperTypeRef, OAuthTokenTypeRef, UserMigrationCredentialTypeRef, UserMigrationInformationTypeRef } from "@tutao/entities/sys"
import { assertNotNull } from "../../../../../src/platform-kit/utils"

o.spec("ImapErrorHandler", () => {
	let oAuthHandlerMock: OAuthHandler
	let imapErrorHandler: ImapErrorHandler
	let entityClientMock: EntityClient
	let serviceExecutorMock: IServiceExecutor
	let userMigrationInfosListId: string | null

	o.beforeEach(() => {
		entityClientMock = object<EntityClient>()
		oAuthHandlerMock = object<OAuthHandler>()
		serviceExecutorMock = object<IServiceExecutor>()
		userMigrationInfosListId = GENERATED_MAX_ID
		imapErrorHandler = new ImapErrorHandler(
			entityClientMock,
			serviceExecutorMock,
			() => userMigrationInfosListId,
			async (config, serviceExecutor) => oAuthHandlerMock,
		)
	})

	o.test("handleAuthError - returns false and updates to error if provider is other", async () => {
		userMigrationInfosListId = null
		const state = createTestEntity(MailboxMigrationSyncStateTypeRef, {
			_id: ["listId", "elementId"],
			legacyProvider: MailboxMigrationProvider.Other.toString(),
			status: ImapAccountSyncStatus.RUNNING,
			imapConfiguration: createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
				sharedUsername: "required",
				sharedOauthToken: createTestEntity(OAuthTokenEndpointResponseLegacyTypeRef, {
					refreshToken: "expiredToken",
				}),
			}),
		})
		when(entityClientMock.load(MailboxMigrationSyncStateTypeRef, state._id)).thenResolve(state)
		const shouldRetry = await imapErrorHandler.handleAuthError(state._id)

		o.check(shouldRetry).equals(false)
		verify(entityClientMock.update(state), { times: 1 })
		o.check(state.status).equals(ImapAccountSyncStatus.AUTH_ERROR)
	})

	o.test("handleAuthError - returns true when provider is oauth and refresh was successful", async () => {
		userMigrationInfosListId = null
		const updatedToken = {
			refresh_token: "updatedToken",
		} as unknown as oauth.TokenEndpointResponse & TokenEndpointResponseHelpers
		when(oAuthHandlerMock.refreshTokens(matchers.anything())).thenResolve(
			updatedToken as Partial<oauth.TokenEndpointResponse & TokenEndpointResponseHelpers>,
		)

		const state = createTestEntity(MailboxMigrationSyncStateTypeRef, {
			_id: ["listId", "elementId"],
			legacyProvider: MailboxMigrationProvider.Gmail.toString(),
			status: ImapAccountSyncStatus.PAUSED,
			imapConfiguration: createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
				sharedUsername: "required",
				sharedOauthToken: createTestEntity(OAuthTokenEndpointResponseLegacyTypeRef, {
					refreshToken: "expiredToken",
				}),
			}),
		})
		when(entityClientMock.load(MailboxMigrationSyncStateTypeRef, state._id)).thenResolve(state)
		const shouldRetry = await imapErrorHandler.handleAuthError(state._id)

		o.check(shouldRetry).equals(true)
		verify(entityClientMock.update(state), { times: 1 })
		o.check(state.status).equals(ImapAccountSyncStatus.PAUSED)
		o.check(state.imapConfiguration!.sharedOauthToken?.refreshToken).equals("updatedToken")
	})

	o.test("handleAuthError - returns true when provider is oauth and refresh was successful for userMigrationInfo", async () => {
		const updatedToken = {
			refresh_token: "updatedToken",
		} as unknown as oauth.TokenEndpointResponse & TokenEndpointResponseHelpers
		when(oAuthHandlerMock.refreshTokens(matchers.anything())).thenResolve(
			updatedToken as Partial<oauth.TokenEndpointResponse & TokenEndpointResponseHelpers>,
		)

		const state = createTestEntity(MailboxMigrationSyncStateTypeRef, {
			_id: ["listId", "elementId"],
			status: ImapAccountSyncStatus.PAUSED,
			imapConfiguration: createTestEntity(MailboxMigrationImapConfigurationTypeRef, {}),
		})
		const userMigrationInformation = createTestEntity(UserMigrationInformationTypeRef, {
			provider: MailboxMigrationProvider.Gmail.toString(),
			credential: createTestEntity(UserMigrationCredentialTypeRef, {
				username: "username",
				oAuthToken: createTestEntity(OAuthTokenTypeRef, {
					refreshToken: "some-refresh",
				}),
			}),
			mailboxMigrationSyncStates: createTestEntity(GeneratedIdWrapperTypeRef, {
				value: "listId",
			}),
		})
		when(entityClientMock.load(MailboxMigrationSyncStateTypeRef, state._id)).thenResolve(state)
		when(entityClientMock.loadAll(UserMigrationInformationTypeRef, assertNotNull(userMigrationInfosListId))).thenResolve([userMigrationInformation])
		const shouldRetry = await imapErrorHandler.handleAuthError(state._id)

		o.check(shouldRetry).equals(true)
		verify(entityClientMock.update(userMigrationInformation), { times: 1 })
		o.check(state.status).equals(ImapAccountSyncStatus.PAUSED)
		o.check(userMigrationInformation.credential.oAuthToken?.refreshToken).equals("updatedToken")
		o.check(state.imapConfiguration?.sharedOauthToken?.refreshToken).equals(undefined)
	})

	o.test("handleAuthError - returns false when provider is oauth and refresh failed", async () => {
		userMigrationInfosListId = null
		when(oAuthHandlerMock.refreshTokens(matchers.anything())).thenReject({ message: "I am out of tokens" })

		const state = createTestEntity(MailboxMigrationSyncStateTypeRef, {
			_id: ["listId", "elementId"],
			legacyProvider: MailboxMigrationProvider.Gmail.toString(),
			status: ImapAccountSyncStatus.RUNNING,
			imapConfiguration: createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
				sharedUsername: "required",
				sharedOauthToken: createTestEntity(OAuthTokenEndpointResponseLegacyTypeRef, {
					refreshToken: "expiredToken",
				}),
			}),
		})
		when(entityClientMock.load(MailboxMigrationSyncStateTypeRef, state._id)).thenResolve(state)

		const shouldRetry = await imapErrorHandler.handleAuthError(state._id)

		o.check(shouldRetry).equals(false)
		verify(entityClientMock.update(state), { times: 1 })
		o.check(state.status).equals(ImapAccountSyncStatus.AUTH_ERROR)
		o.check(state.imapConfiguration!.sharedOauthToken?.refreshToken).equals("expiredToken")
	})

	o.test("handleAuthError - throws programming error if provider is unknown", async () => {
		userMigrationInfosListId = null
		when(oAuthHandlerMock.refreshTokens(matchers.anything())).thenReject({ message: "I am out of tokens" })

		const state = createTestEntity(MailboxMigrationSyncStateTypeRef, {
			_id: ["listId", "elementId"],
			legacyProvider: "999",
			status: ImapAccountSyncStatus.RUNNING,
			imapConfiguration: createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
				sharedUsername: "required",
				sharedOauthToken: createTestEntity(OAuthTokenEndpointResponseLegacyTypeRef, {
					refreshToken: "expiredToken",
				}),
			}),
		})
		when(entityClientMock.load(MailboxMigrationSyncStateTypeRef, state._id)).thenResolve(state)
		const e = await assertThrows(ProgrammingError, async () => await imapErrorHandler.handleAuthError(state._id))
		o(e.message).equals("imap sync found no Oauth config")

		verify(entityClientMock.update(state), { times: 0 })
		o.check(state.status).equals(ImapAccountSyncStatus.RUNNING)
	})
})
