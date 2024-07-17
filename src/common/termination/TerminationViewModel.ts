import { SessionType } from "../api/common/SessionType.js"
import { LoginState } from "../login/LoginViewModel.js"
import { InfoLink, lang, TranslationText } from "../misc/LanguageViewModel.js"
import { LoginController } from "../api/main/LoginController.js"
import { getLoginErrorStateAndMessage } from "../misc/LoginUtils.js"
import { SecondFactorHandler } from "../misc/2fa/SecondFactorHandler.js"
import { TerminationPeriodOptions } from "../api/common/TutanotaConstants.js"
import { IServiceExecutor } from "../api/common/ServiceRequest.js"
import { CustomerAccountTerminationService } from "../api/entities/sys/Services.js"
import {
	createCustomerAccountTerminationPostIn,
	CustomerAccountTerminationRequest,
	CustomerAccountTerminationRequestTypeRef,
	SurveyData,
} from "../api/entities/sys/TypeRefs.js"
import { EntityClient } from "../api/common/EntityClient.js"
import { PreconditionFailedError } from "../api/common/error/RestError.js"
import { incrementDate } from "@tutao/tutanota-utils"

export class TerminationViewModel {
	mailAddress: string
	password: string
	date: Date
	terminationPeriodOption: TerminationPeriodOptions
	acceptedTerminationRequest: CustomerAccountTerminationRequest | null
	helpText: TranslationText
	loginState: LoginState

	constructor(
		private readonly loginController: LoginController,
		private readonly secondFactorHandler: SecondFactorHandler,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
	) {
		this.mailAddress = ""
		this.password = ""
		this.date = incrementDate(new Date(), 1)
		this.acceptedTerminationRequest = null
		this.terminationPeriodOption = TerminationPeriodOptions.EndOfCurrentPeriod
		this.helpText = "emptyString_msg"
		this.loginState = LoginState.NotAuthenticated
	}

	async createAccountTerminationRequest(surveyData: SurveyData | null = null): Promise<void> {
		await this.authenticate()
		if (this.loginState == LoginState.LoggedIn) {
			await this.createTerminationRequest(surveyData)
		}
	}

	/**
	 * Creates the termination request based on the date option selected by the user and assument that the authentication was successfull.
	 */
	private async createTerminationRequest(surveyData: SurveyData | null) {
		try {
			const inputData = createCustomerAccountTerminationPostIn({
				terminationDate: this.getTerminationDate(),
				surveyData: surveyData,
			})
			let serviceResponse = await this.serviceExecutor.post(CustomerAccountTerminationService, inputData)
			this.acceptedTerminationRequest = await this.entityClient.load(CustomerAccountTerminationRequestTypeRef, serviceResponse.terminationRequest)
		} catch (e) {
			if (e instanceof PreconditionFailedError) {
				switch (e.data) {
					case "invalidTerminationDate":
						this.onTerminationRequestFailed("terminationInvalidDate_msg")
						break
					case "alreadyCancelled":
						this.onTerminationRequestFailed("terminationAlreadyCancelled_msg")
						break
					case "noActiveSubscription":
						this.onTerminationRequestFailed("terminationNoActiveSubscription_msg")
						break
					case "hasAppStoreSubscription":
						this.onTerminationRequestFailed(() =>
							lang.get("deleteAccountWithAppStoreSubscription_msg", { "{AppStorePayment}": InfoLink.AppStorePayment }),
						)
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

	private onTerminationRequestFailed(errorMessage: TranslationText) {
		this.helpText = errorMessage
	}

	private onAuthentication() {
		this.helpText = "emptyString_msg"
		this.loginState = LoginState.LoggedIn
	}

	private onError(helpText: TranslationText, state: LoginState) {
		this.helpText = helpText
		this.loginState = state
	}

	private getTerminationDate(): Date | null {
		return this.terminationPeriodOption === TerminationPeriodOptions.EndOfCurrentPeriod
			? // The server will use the end of the current subscription period to cancel the account if the terminationDate is null.
			  null
			: this.date
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
