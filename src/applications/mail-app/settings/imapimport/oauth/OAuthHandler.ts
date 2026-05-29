import * as openidClient from "./openid-client-custom"
import type { Configuration } from "openid-client"
import type { OauthConfigParams } from "../../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { assertMainOrNode, ProgrammingError } from "@tutao/app-env"
import { IServiceExecutor } from "../../../../../platform-kit/network/ServiceRequest"
import { createImapOauthConfigGetIn, ImapOauthConfigService } from "@tutao/entities/tutanota"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { $Promisable } from "../../../workerUtils/index/IndexerPromiseUtils"

const CODE_CHALLENGE_METHOD = "S256"
export type OAuthHandlerFactory = (config: OauthConfigParams, serviceExecutor: IServiceExecutor) => $Promisable<OAuthHandler>
export type OAuthClient = typeof openidClient

assertMainOrNode()

export class OAuthHandler {
	private config: Configuration | null = null
	// Visible for testing
	state: string = ""
	// Visible for testing
	parameters: Record<string, string> = {}
	// Visible for testing
	codeVerifier: string = ""

	constructor(
		private readonly OauthConfig: OauthConfigParams,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly client: OAuthClient = openidClient,
	) {}

	async setupOauthLoginParams(extraParams?: Record<any, string>): Promise<void> {
		const { server, clientId } = this.OauthConfig
		const requiresClientSecret = this.OauthConfig.requiresClientSecret ?? false
		if (requiresClientSecret) {
			const imapOauthConfigGetOut = await this.serviceExecutor.get(
				ImapOauthConfigService,
				createImapOauthConfigGetIn({ clientId }),
				DEFAULT_EXTRA_SERVICE_PARAMS,
			)
			const clientSecret = imapOauthConfigGetOut.clientSecret
			const auth = this.client.ClientSecretPost(clientSecret)
			this.config = await this.client.discovery(new URL(server), clientId, undefined, auth)
		} else {
			this.config = await this.client.discovery(new URL(server), clientId)
		}

		this.codeVerifier = this.client.randomPKCECodeVerifier()
		const code_challenge = await this.client.calculatePKCECodeChallenge(this.codeVerifier)
		this.state = this.client.randomState()

		this.parameters = {
			code_challenge,
			code_challenge_method: CODE_CHALLENGE_METHOD,
			redirect_uri: this.OauthConfig.redirectUri,
			scope: this.OauthConfig.scope,
			state: this.state,
			...this.OauthConfig.providerSpecificParams,
			...extraParams,
		}
	}

	buildAuthorizationUrl(): string {
		if (this.config == null) {
			throw new ProgrammingError("Cannot get url out of null config settings!")
		}
		const url = this.client.buildAuthorizationUrl(this.config, this.parameters)
		return url.href
	}

	async getAuthTokens(responseUrl: string) {
		if (this.config == null) {
			throw new ProgrammingError("Cannot get url out of null config settings!")
		}
		const currentUrl = new URL(responseUrl)
		return await this.client.authorizationCodeGrant(this.config, currentUrl, {
			pkceCodeVerifier: this.codeVerifier,
			expectedState: this.state,
		})
	}

	async refreshTokens(refreshToken: string) {
		if (this.config == null) {
			throw new ProgrammingError("Cannot get url out of null config settings!")
		}
		return await this.client.refreshTokenGrant(this.config, refreshToken)
	}
}
