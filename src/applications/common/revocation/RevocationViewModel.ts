import { SessionType } from "../../../platform-kit/app-env/SessionType.js"
import { LoginState } from "../login/LoginViewModel.js"
import { InfoLink, lang, MaybeTranslation } from "../../../ui/utils/LanguageViewModel.js"
import { LoginController } from "../api/main/LoginController.js"
import { getLoginErrorStateAndMessage } from "../misc/LoginUtils.js"
import { SecondFactorHandler } from "../misc/2fa/SecondFactorHandler.js"
import { IServiceExecutor } from "../../../platform-kit/network/ServiceRequest.js"
import { EntityClient } from "../../../platform-kit/network/EntityClient.js"
import { PreconditionFailedError } from "@tutao/rest-client/error"
import {
	createCustomerAccountTerminationPostIn,
	CustomerAccountTerminationRequest,
	CustomerAccountTerminationRequestTypeRef,
	CustomerAccountTerminationService,
	SurveyData,
} from "@tutao/entities/sys"

export class RevocationViewModel {
	mailAddress: string
	password: string
	acceptedRevocationRequest: CustomerAccountTerminationRequest | null
	helpText: MaybeTranslation
	loginState: LoginState

	constructor(
		private readonly loginController: LoginController,
		private readonly secondFactorHandler: SecondFactorHandler,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
	) {
		this.mailAddress = ""
		this.password = ""
		this.acceptedRevocationRequest = null
		this.helpText = "emptyString_msg"
		this.loginState = LoginState.NotAuthenticated
	}

	async createAccountTerminationRequest(surveyData: SurveyData | null = null): Promise<void> {
		await this.authenticate()
		if (this.loginState === LoginState.LoggedIn) {
			await this.createTerminationRequest(surveyData)
		}
	}

	/**
	 * Creates the termination request based on the date option selected by the user and assumes that the authentication was successfull.
	 */
	private async createTerminationRequest(surveyData: SurveyData | null) {
		try {
			const inputData = createCustomerAccountTerminationPostIn({
				terminationDate: null,
				isContractRevocation: true,
				surveyData,
			})
			const serviceResponse = await this.serviceExecutor.post(CustomerAccountTerminationService, inputData)
			this.acceptedRevocationRequest = await this.entityClient.load(CustomerAccountTerminationRequestTypeRef, serviceResponse.terminationRequest)
		} catch (e) {
			if (e instanceof PreconditionFailedError) {
				switch (e.data) {
					case "alreadyCancelled":
						this.onRevocationRequestFailed("terminationAlreadyCancelled_msg")
						break
					case "noActiveSubscription":
						this.onRevocationRequestFailed("terminationNoActiveSubscription_msg")
						break
					case "hasAppStoreSubscription":
						this.onRevocationRequestFailed(
							lang.getTranslation("deleteAccountWithAppStoreSubscription_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }),
						)
						break
					case "olderThanTwoWeeks":
						this.onRevocationRequestFailed("revocationPeriodEnded_msg")
						break
					default:
						throw e
				}
			} else {
				throw e
			}
		} finally {
			await this.loginController.logout(false)
			this.loginState = LoginState.NotAuthenticated
		}
	}

	private onRevocationRequestFailed(errorMessage: MaybeTranslation) {
		this.helpText = errorMessage
	}

	private onAuthentication() {
		this.helpText = "emptyString_msg"
		this.loginState = LoginState.LoggedIn
	}

	private onError(helpText: MaybeTranslation, state: LoginState) {
		this.helpText = helpText
		this.loginState = state
	}

	async authenticate(): Promise<void> {
		const mailAddress = this.mailAddress
		const password = this.password

		if (mailAddress === "" || password === "") {
			this.onError("loginFailed_msg", LoginState.InvalidCredentials)
			return
		}
		this.helpText = "emptyString_msg"
		try {
			await this.loginController.createSession(mailAddress, password, SessionType.Temporary)
			this.onAuthentication()
		} catch (e) {
			const { errorMessage, state } = getLoginErrorStateAndMessage(e)
			this.onError(errorMessage, state)
		} finally {
			await this.secondFactorHandler.closeWaitingForSecondFactorDialog()
		}
	}
}
