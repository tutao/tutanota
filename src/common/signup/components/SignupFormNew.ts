import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Dialog } from "../../gui/base/Dialog"
import { Autocomplete } from "../../gui/base/TextField.js"
import {
	DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN,
	DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN,
	PlanType,
	TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS,
} from "../../api/common/TutanotaConstants"

import { Checkbox, CheckboxAttrs } from "../../gui/base/Checkbox.js"
import { defer, DeferredObject, getFirstOrThrow, lazy } from "@tutao/tutanota-utils"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { locator } from "../../api/main/CommonLocator"
import { EmailDomainData, isPaidPlanDomain } from "../../settings/mailaddress/MailAddressesUtils.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { deviceConfig } from "../../misc/DeviceConfig"
import { PowSolution } from "../../api/common/pow-worker"
import { NewAccountData } from "../../subscription/UpgradeSubscriptionWizard"
import { runPowChallenge } from "../../subscription/captcha/Captcha"
import { CURRENT_TERMS_VERSION, renderTermsAndConditionsButton, TermsSection } from "../../subscription/TermsAndConditions"
import { LoginTextField } from "../../gui/base/LoginTextField"
import { SelectMailAddressFormAttrs, SelectMailAddressFormNew } from "./SelectMailAddressFormNew"
import { PasswordFormNew, PasswordModel } from "./PasswordFormNew.js"
import { styles } from "../../gui/styles"
import { SignupViewModel } from "../SignupView"
import { getWhitelabelRegistrationDomains } from "../../misc/WhitelabelCustomizations"

export type SignupFormAttrs = {
	onComplete: (
		result:
			| {
					type: "success"
					registrationCode: string
					powChallengeSolutionPromise: Promise<PowSolution>
					emailInputStore: string
					passwordInputStore: string
					registrationDataId: string
			  }
			| { type: "failure" },
	) => void
	onNext: () => void
	onChangePlan: () => void
	isBusinessUse: lazy<boolean>
	isPaidSubscription: lazy<boolean>
	campaignToken: lazy<string | null>
	// only used if readonly is true
	prefilledMailAddress?: string | undefined
	newAccountData?: NewAccountData | null
	emailInputStore?: string
	passwordInputStore?: string
	signupViewModel: SignupViewModel
}

export class SignupFormNew implements Component<SignupFormAttrs> {
	private readonly passwordModel: PasswordModel
	private readonly _confirmTerms: Stream<boolean>
	private _confirmPersonalAccountLimit: boolean
	private readonly _code: Stream<string>
	private selectedDomain: EmailDomainData
	private _mailAddressFormErrorId: TranslationKey | null = null
	private _mailAddress!: string
	private _isMailVerificationBusy: boolean
	private _isFinalAvailabilityCheckBusy: boolean
	private readonly __mailValid: Stream<boolean>
	private powChallengeSolution: DeferredObject<PowSolution> = defer()
	private readonly: boolean = false
	private dom: HTMLElement | null = null

	private readonly availableDomains: readonly EmailDomainData[] = (locator.domainConfigProvider().getCurrentDomainConfig().firstPartyDomain
		? TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS
		: getWhitelabelRegistrationDomains()
	).map((domain) => ({ domain, isPaid: isPaidPlanDomain(domain) }))

	private domainFrom(addr?: string) {
		if (!addr) return null
		const i = addr.lastIndexOf("@")
		return i >= 0 ? addr.slice(i + 1) : null
	}

	private getDefaultDomain(isPaid: boolean): EmailDomainData {
		const preferredDomain = isPaid ? DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN : DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN
		return (
			this.availableDomains.find((domain) => domain.domain === preferredDomain) ??
			this.availableDomains.find((domain) => domain.isPaid === isPaid) ??
			getFirstOrThrow(this.availableDomains)
		)
	}

	constructor(vnode: Vnode<SignupFormAttrs>) {
		this.selectedDomain = getFirstOrThrow(this.availableDomains)

		// tuta.com gets preference user is signing up for a paid account and it is available
		const defaultDomain = vnode.attrs.isPaidSubscription() ? DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN : DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN
		const desiredDomain = this.domainFrom(vnode.attrs.emailInputStore) ?? defaultDomain
		const match = this.availableDomains.find((d) => d.domain === desiredDomain)
		if (match) this.selectedDomain = match

		if (vnode.attrs.emailInputStore) {
			const domainString = vnode.attrs.emailInputStore.split("@")[1]
			const domain = this.availableDomains.find((emailDomainData) => emailDomainData.domain === domainString)
			if (domain) {
				this.selectedDomain = domain
			}
		}

		this.__mailValid = stream(false)
		this.passwordModel = new PasswordModel(
			locator.usageTestController,
			locator.logins,
			{
				checkOldPassword: false,
				enforceStrength: true,
				reservedStrings: () => (this._mailAddress ? [this._mailAddress.split("@")[0]] : []),
			},
			this.__mailValid,
		)

		this._confirmTerms = stream<boolean>(false)
		this._confirmPersonalAccountLimit = false
		this._code = stream("")
		this._isMailVerificationBusy = false
		this._isFinalAvailabilityCheckBusy = false
		this._mailAddressFormErrorId = "mailAddressNeutral_msg"
	}

	async oninit() {
		runPowChallenge(deviceConfig.getSignupToken())
			.then((solution) => this.powChallengeSolution.resolve(solution))
			.catch((e) => this.powChallengeSolution.reject(e))
		return this.powChallengeSolution.promise
	}

	onbeforeupdate(vnode: Vnode<SignupFormAttrs>) {
		if (!vnode.attrs.isPaidSubscription() && this.selectedDomain.isPaid) {
			this.selectedDomain = this.getDefaultDomain(false)
		}
		return true
	}

	async oncreate(vnode: VnodeDOM<SignupFormAttrs>) {
		this.dom = vnode.dom as HTMLElement
		try {
			const userController = locator.logins.getUserController()
			this.readonly = (await userController.loadCustomer()) !== null
		} catch (e) {
			this.readonly = false
		}

		if (vnode.attrs.passwordInputStore) {
			this.passwordModel.setNewPassword(vnode.attrs.passwordInputStore)
			this.passwordModel.setRepeatedPassword(vnode.attrs.passwordInputStore)
			this._confirmTerms(true)
		}
		m.redraw()
	}

	view(vnode: Vnode<SignupFormAttrs>): Children {
		const a = vnode.attrs

		const mailAddressFormAttrs: SelectMailAddressFormAttrs = {
			selectedDomain: this.selectedDomain,
			onDomainChanged: (domain) => {
				if (!domain.isPaid || a.isPaidSubscription()) {
					this.selectedDomain = domain
				} else {
					Dialog.confirm(lang.makeTranslation("confirm_msg", `${lang.get("paidEmailDomainSignup_msg")}\n${lang.get("changePaidPlan_msg")}`)).then(
						(confirmed) => {
							if (confirmed) {
								this.selectedDomain = domain
								vnode.attrs.onChangePlan()
							}
						},
					)
				}
			},
			availableDomains: this.availableDomains,
			onValidationResult: (email, validationResult) => {
				this.__mailValid(validationResult.isValid)

				if (validationResult.isValid) {
					this._mailAddress = email
					this.passwordModel.recalculatePasswordStrength()
					this._mailAddressFormErrorId = null
				} else {
					this._mailAddressFormErrorId = validationResult.errorId
				}
			},
			onBusyStateChanged: (isBusy) => {
				this._isMailVerificationBusy = isBusy
			},
			messageIdOverride: this._mailAddressFormErrorId,
			signupToken: deviceConfig.getSignupToken(),
			username: vnode.attrs.emailInputStore?.split("@")[0] ?? "",
		}
		const confirmTermsCheckBoxAttrs: CheckboxAttrs = {
			label: () => lang.get("termsAndConditions_label"),
			checked: this._confirmTerms(),
			onChecked: this._confirmTerms,
		}
		const confirmAccountLimitCheckboxAttrs: CheckboxAttrs = {
			label: () => (a.signupViewModel.targetPlanType === PlanType.Free ? lang.get("confirmFreeLimits_msg") : lang.get("confirmPrivateUse_msg")),
			checked: this._confirmPersonalAccountLimit,
			onChecked: (val: boolean) => (this._confirmPersonalAccountLimit = val),
		}
		const submit = async () => {
			if (this.readonly) {
				// Email field is read-only, account has already been created but user switched from different subscription.
				// return a.onComplete({ type: "success", newAccountData: null })
				a.onNext()
				return
			}
			if (this._isMailVerificationBusy || this._isFinalAvailabilityCheckBusy) return

			const errorMessage =
				this._mailAddressFormErrorId || this.passwordModel.getErrorMessageId() || (!this._confirmTerms() ? "termsAcceptedNeutral_msg" : null)

			if (errorMessage) {
				Dialog.message(errorMessage)
				return
			}

			this._isFinalAvailabilityCheckBusy = true
			try {
				const available = await locator.mailAddressFacade.isMailAddressAvailable(this._mailAddress, deviceConfig.getSignupToken())
				if (!available) {
					this._mailAddressFormErrorId = "mailAddressNA_msg"
					this.__mailValid(false)
					m.redraw()
					Dialog.message("mailAddressNA_msg")
					return
				}
			} catch (e) {
				if (e instanceof AccessDeactivatedError) {
					this._mailAddressFormErrorId = "mailAddressDelay_msg"
					this.__mailValid(false)
					m.redraw()
					Dialog.message("mailAddressDelay_msg")
					return
				}
				throw e
			} finally {
				this._isFinalAvailabilityCheckBusy = false
			}

			a.onComplete({
				type: "success",
				registrationCode: this._code(),
				powChallengeSolutionPromise: this.powChallengeSolution.promise,
				emailInputStore: this._mailAddress,
				passwordInputStore: this.passwordModel.getNewPassword(),
				registrationDataId: deviceConfig.getSignupToken(),
			})
		}

		return m(
			"#signup-account-dialog.flex-start",
			m(`.flex.flex-column.max-width-l.pb-16.full-width${styles.isMobileLayout() ? ".gap-8" : ".gap-16"}`, [
				this.readonly
					? m(LoginTextField, {
							class: "",
							label: "mailAddress_label",
							value: a.prefilledMailAddress ?? "",
							autocompleteAs: Autocomplete.newPassword,
							isReadOnly: true,
						})
					: [
							m(SelectMailAddressFormNew, mailAddressFormAttrs), // Leave as is
							m(PasswordFormNew, {
								model: this.passwordModel,
							}),
							getWhitelabelRegistrationDomains().length > 0
								? m(LoginTextField, {
										value: this._code(),
										oninput: this._code,
										label: "whitelabelRegistrationCode_label",
									})
								: null,
							m(".flex.col.gap-4.smaller.justify-start.mt-16", [
								!a.signupViewModel.options.businessUse() && m(Checkbox, confirmAccountLimitCheckboxAttrs),
								m(Checkbox, confirmTermsCheckBoxAttrs),
								m("div", renderTermsAndConditionsButton(TermsSection.Terms, CURRENT_TERMS_VERSION)),
							]),
						],
				m(
					`.flex.flex-end${styles.isMobileLayout() ? ".mt-24.mb-24" : ".mt-32.mb-32"}`,
					m(LoginButton, {
						label: this.readonly ? "continue_action" : "create_new_account_label",
						onclick: submit,
						disabled: !this.readonly && (!this._confirmTerms() || (!a.signupViewModel.options.businessUse() && !this._confirmPersonalAccountLimit)),
						width: styles.isMobileLayout() ? "full" : "flex",
					}),
				),
			]),
		)
	}
}
