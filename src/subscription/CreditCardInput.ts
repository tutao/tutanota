import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { lang, TranslationKey } from "../misc/LanguageViewModel"
import type { CreditCard } from "../api/entities/sys/TypeRefs.js"
import { createCreditCard } from "../api/entities/sys/TypeRefs.js"
import { TextField } from "../gui/base/TextField.js"
import { CCViewModel } from "./SimplifiedCreditCardInput.js"
import { Stage } from "@tutao/tutanota-usagetests"
import { isValidCreditCardNumber } from "../misc/FormatValidator.js"

export type OldCreditCardAttrs = {
	viewModel: OldCreditCardViewModel
}

export class OldCreditCardViewModel implements CCViewModel {
	cardHolderName: Stream<string>
	creditCardNumber: Stream<string>
	cvv: Stream<string>
	expirationDate: Stream<string>

	constructor() {
		this.creditCardNumber = stream("")
		this.cardHolderName = stream("")
		this.cvv = stream("")
		this.expirationDate = stream("")
	}

	getCreditCardData(): CreditCard {
		let monthAndYear = this.expirationDate().split("/")
		let cc = createCreditCard()
		cc.number = this.creditCardNumber()
		cc.cardHolderName = this.cardHolderName()
		cc.cvv = this.cvv()
		cc.expirationMonth = monthAndYear.length > 0 ? monthAndYear[0] : ""
		cc.expirationYear = monthAndYear.length > 1 ? monthAndYear[1] : ""
		return cc
	}

	setCreditCardData(data: CreditCard | null): void {
		if (data) {
			this.creditCardNumber(data.number)
			this.cardHolderName(data.cardHolderName)
			this.cvv(data.cvv)

			if (data.expirationMonth && data.expirationYear) {
				this.expirationDate(data.expirationMonth + "/" + data.expirationYear)
			}
		} else {
			this.creditCardNumber("")
			this.cardHolderName("")
			this.cvv("")
			this.expirationDate("")
		}
	}

	validateCreditCardNumber(number: string, stage: Stage | undefined): TranslationKey | null {
		if (number === "") {
			stage?.setMetric({
				name: "validationFailure",
				value: "ccNumberMissing",
			})
			stage?.complete()
			return "creditCardNumberFormat_msg"
		} else if (!isValidCreditCardNumber(number)) {
			stage?.setMetric({
				name: "validationFailure",
				value: "ccNumberFormat",
			})
			stage?.complete()
			return "creditCardNumberInvalid_msg"
		}
		return null
	}

	validateCardHolderName(cardHolderName: string, stage: Stage | undefined): TranslationKey | null {
		if (cardHolderName === "") {
			stage?.setMetric({
				name: "validationFailure",
				value: "ccHolderMissing",
			})
			stage?.complete()
			return "creditCardCardHolderName_msg"
		}
		return null
	}

	validateCVV(cvv: string, stage: Stage | undefined): TranslationKey | null {
		if (cvv === "" || cvv.length < 3 || cvv.length > 4) {
			// CVV2 is 3- or 4-digit
			stage?.setMetric({
				name: "validationFailure",
				value: "cvvFormat",
			})
			stage?.complete()
			return "creditCardCVVFormat_label"
		}
		return null
	}

	validateCreditCardExpirationDate(expirationMonth: string, expirationYear: string, stage: Stage | undefined): TranslationKey | null {
		if (
			expirationMonth.length !== 2 ||
			(expirationYear.length !== 4 && expirationYear.length !== 2) ||
			parseInt(expirationMonth) < 1 ||
			parseInt(expirationMonth) > 12
		) {
			stage?.setMetric({
				name: "validationFailure",
				value: "expirationDateFormat",
			})
			stage?.complete()
			return "creditCardExprationDateInvalid_msg"
		}
		return null
	}

	validateCreditCardPaymentData(stage: Stage | undefined): TranslationKey | null {
		let cc = this.getCreditCardData()

		const invalidNumber = this.validateCreditCardNumber(cc.number, stage)
		if (invalidNumber) {
			return invalidNumber
		}
		const invalidCardHolderName = this.validateCardHolderName(cc.cardHolderName, stage)
		if (invalidCardHolderName) {
			return invalidCardHolderName
		}
		const invalidCVV = this.validateCVV(cc.cvv, stage)
		if (invalidCVV) {
			return invalidCVV
		}
		const invalidExpirationDate = this.validateCreditCardExpirationDate(cc.expirationMonth, cc.expirationYear, stage)
		if (invalidExpirationDate) {
			return invalidExpirationDate
		}

		stage?.setMetric({
			name: "validationFailure",
			value: "none",
		})
		stage?.complete()
		return null
	}
}

export class CreditCardInput implements Component<OldCreditCardAttrs> {
	view(vnode: Vnode<OldCreditCardAttrs>): Children {
		let { viewModel } = vnode.attrs
		return [
			m(TextField, {
				label: "creditCardNumber_label",
				value: viewModel.creditCardNumber(),
				oninput: viewModel.creditCardNumber,
			}),
			m(TextField, {
				label: "creditCardCardHolderName_label",
				value: viewModel.cardHolderName(),
				oninput: viewModel.cardHolderName,
			}),
			m(TextField, {
				label: "creditCardCVV_label",
				value: viewModel.cvv(),
				oninput: viewModel.cvv,
			}),
			m(TextField, {
				label: "creditCardExpirationDate_label",
				helpLabel: () => lang.get("creditCardExpirationDateFormat_msg"),
				value: viewModel.expirationDate(),
				oninput: viewModel.expirationDate,
			}),
		]
	}
}
