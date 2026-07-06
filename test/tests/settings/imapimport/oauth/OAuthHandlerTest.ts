import o, { assertThrows } from "@tutao/otest"
import { OAuthClient, OAuthHandler } from "../../../../../src/applications/mail-app/settings/imapimport/oauth/OAuthHandler"
import { matchers, object, verify, when } from "testdouble"
import { ProgrammingError } from "../../../../../src/platform-kit/app-env"
import { noOp } from "../../../../../src/platform-kit/utils"
import { IServiceExecutor } from "../../../../../src/platform-kit/network/ServiceRequest"
import { createImapOauthConfigGetIn, createImapOauthConfigGetOut, ImapOauthConfigService } from "@tutao/entities/tutanota"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../src/platform-kit/instance-pipeline/RestClientOptions"
import { OauthConfigParams } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapKnownConfigs"

o.spec("OAuthHandler", () => {
	let clientMock: OAuthClient
	let oauthConfigMock: OauthConfigParams
	let handler: OAuthHandler
	let serviceExecutorMock: IServiceExecutor

	const configMock = { client_id: "test" } as any
	const urlMock = new URL("https://example.com/authorize")
	const tokensMock = { access_token: "token123" }
	const codeVerifierMock = "verifierABC"
	const codeChallengeMock = "challengeXYZ"
	const stateMock = "state123"

	o.beforeEach(() => {
		clientMock = object<OAuthClient>()
		oauthConfigMock = {
			server: "https://login.microsoftonline.com/common/v2.0",
			clientId: "test-client",
			redirectUri: "https://myapp.com/callback",
			scope: "openid email",
			providerSpecificParams: { prompt: "consent" },
		}
		serviceExecutorMock = object<IServiceExecutor>()
		handler = new OAuthHandler(oauthConfigMock, serviceExecutorMock, clientMock)
	})

	o.test("setupOauthLoginParams - without clientSecret uses discovery without auth", async () => {
		when(
			clientMock.discovery(
				matchers.argThat((url: URL) => url.href === oauthConfigMock.server),
				oauthConfigMock.clientId,
			),
		).thenResolve(configMock)
		when(clientMock.randomPKCECodeVerifier()).thenReturn(codeVerifierMock)
		when(clientMock.calculatePKCECodeChallenge(codeVerifierMock)).thenResolve(codeChallengeMock)
		when(clientMock.randomState()).thenReturn(stateMock)

		await handler.setupOauthLoginParams()

		verify(
			clientMock.discovery(
				matchers.argThat((url: URL) => url.href === oauthConfigMock.server),
				oauthConfigMock.clientId,
			),
			{ times: 1 },
		)
		o.check(handler.codeVerifier).equals(codeVerifierMock)
		o.check(handler.state).equals(stateMock)
		o.check(handler.parameters).deepEquals({
			code_challenge: codeChallengeMock,
			code_challenge_method: "S256",
			redirect_uri: oauthConfigMock.redirectUri,
			scope: oauthConfigMock.scope,
			state: stateMock,
			...oauthConfigMock.providerSpecificParams,
		})
		verify(serviceExecutorMock.get(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
	})

	o.test("setupOauthLoginParams - with clientSecret uses ClientSecretPost auth", async () => {
		oauthConfigMock.requiresClientSecret = true
		handler = new OAuthHandler(oauthConfigMock, serviceExecutorMock, clientMock)
		when(
			serviceExecutorMock.get(ImapOauthConfigService, createImapOauthConfigGetIn({ clientId: "test-client" }), DEFAULT_EXTRA_SERVICE_PARAMS),
		).thenResolve(createImapOauthConfigGetOut({ clientSecret: "secret123" }))
		const authMock = noOp
		when(clientMock.ClientSecretPost("secret123")).thenReturn(authMock)
		when(
			clientMock.discovery(
				matchers.argThat((url: URL) => url.href === oauthConfigMock.server),
				oauthConfigMock.clientId,
				undefined,
				authMock,
			),
		).thenResolve(configMock)
		when(clientMock.randomPKCECodeVerifier()).thenReturn(codeVerifierMock)
		when(clientMock.calculatePKCECodeChallenge(codeVerifierMock)).thenResolve(codeChallengeMock)
		when(clientMock.randomState()).thenReturn(stateMock)

		await handler.setupOauthLoginParams()

		verify(
			clientMock.discovery(
				matchers.argThat((url: URL) => url.href === oauthConfigMock.server),
				oauthConfigMock.clientId,
				undefined,
				authMock,
			),
			{ times: 1 },
		)
		verify(serviceExecutorMock.get(ImapOauthConfigService, createImapOauthConfigGetIn({ clientId: "test-client" }), DEFAULT_EXTRA_SERVICE_PARAMS), {
			times: 1,
		})
	})

	o.test("buildAuthorizationUrl - returns URL when config is set", async () => {
		when(
			clientMock.discovery(
				matchers.argThat((url: URL) => url.href === oauthConfigMock.server),
				oauthConfigMock.clientId,
			),
		).thenResolve(configMock)
		await handler.setupOauthLoginParams()
		when(clientMock.buildAuthorizationUrl(configMock, handler.parameters)).thenReturn(urlMock)

		const result = handler.buildAuthorizationUrl()

		o.check(result).equals(urlMock.href)
		verify(clientMock.buildAuthorizationUrl(configMock, handler["parameters"]), { times: 1 })
	})

	o.test("buildAuthorizationUrl - throws ProgrammingError when config is null", async () => {
		await assertThrows(ProgrammingError, async () => handler.buildAuthorizationUrl())
	})

	o.test("getAuthTokens - returns tokens when config is set", async () => {
		when(
			clientMock.discovery(
				matchers.argThat((url: URL) => url.href === oauthConfigMock.server),
				oauthConfigMock.clientId,
			),
		).thenResolve(configMock)
		when(clientMock.randomPKCECodeVerifier()).thenReturn(codeVerifierMock)
		when(clientMock.randomState()).thenReturn(stateMock)
		await handler.setupOauthLoginParams()
		const responseUrl = "https://myapp.com/callback?code=abc"

		when(
			clientMock.authorizationCodeGrant(
				configMock,
				matchers.argThat((url: URL) => url.href === responseUrl),
				{
					pkceCodeVerifier: codeVerifierMock,
					expectedState: stateMock,
				},
			),
		).thenResolve(tokensMock)

		const result = await handler.getAuthTokens(responseUrl)

		o.check(result.access_token).equals(tokensMock.access_token)
		verify(
			clientMock.authorizationCodeGrant(
				configMock,
				matchers.argThat((url: URL) => url.href === responseUrl),
				{
					pkceCodeVerifier: codeVerifierMock,
					expectedState: stateMock,
				},
			),
			{ times: 1 },
		)
	})

	o.test("getAuthTokens - throws ProgrammingError when config is null", async () => {
		await assertThrows(ProgrammingError, () => handler.getAuthTokens("https://example.com"))
	})

	o.test("refreshTokens - returns refreshed tokens when config is set", async () => {
		when(
			clientMock.discovery(
				matchers.argThat((url: URL) => url.href === oauthConfigMock.server),
				oauthConfigMock.clientId,
			),
		).thenResolve(configMock)
		await handler.setupOauthLoginParams()
		const refreshToken = "refresh123"
		when(clientMock.refreshTokenGrant(configMock, refreshToken)).thenResolve(tokensMock)

		const result = await handler.refreshTokens(refreshToken)

		o.check(result.access_token).equals(tokensMock.access_token)
		verify(clientMock.refreshTokenGrant(configMock, refreshToken), { times: 1 })
	})

	o.test("refreshTokens - throws ProgrammingError when config is null", async () => {
		await assertThrows(ProgrammingError, () => handler.refreshTokens("refresh"))
	})
})
