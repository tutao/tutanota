import m, { Children, Component, Vnode } from "mithril"
import { Autocomplete, TextField } from "../gui/base/TextField.js"
import { SimplifiedCreditCardViewModel } from "./SimplifiedCreditCardInputModel.js"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { Stage } from "@tutao/tutanota-usagetests"
import { CreditCard } from "../api/entities/sys/TypeRefs.js"

export type SimplifiedCreditCardAttrs = {
	viewModel: SimplifiedCreditCardViewModel
}

export interface CCViewModel {
	validateCreditCardPaymentData(): TranslationKey | null

	setCreditCardData(data: CreditCard | null): void

	getCreditCardData(): CreditCard
}

// changing the content (ie grouping) sets selection to the end, this restores it after the next redraw.
function restoreSelection(domInput: HTMLInputElement) {
	const { selectionStart, selectionEnd, selectionDirection } = domInput
	const isAtEnd = domInput.value.length === selectionStart
	setTimeout(() => {
		const currentLength = domInput.value.length
		// we're adding characters, so just re-using the index fails because at the time we set the selection, the string is longer than it was.
		// this mostly works, but fails in cases where we're adding stuff in the middle of the string.
		domInput.setSelectionRange(isAtEnd ? currentLength : selectionStart, isAtEnd ? currentLength : selectionEnd, selectionDirection ?? undefined)
	}, 0)
}

export class SimplifiedCreditCardInput implements Component<SimplifiedCreditCardAttrs> {
	dateFieldLeft: boolean = false
	numberFieldLeft: boolean = false
	cvvFieldLeft: boolean = false
	ccNumberDom: HTMLInputElement | null = null
	expDateDom: HTMLInputElement | null = null

	view(vnode: Vnode<SimplifiedCreditCardAttrs>): Children {
		let { viewModel } = vnode.attrs

		return [
			m(TextField, {
				label: "creditCardNumber_label",
				helpLabel: () => this.renderCcNumberHelpLabel(viewModel),
				value: viewModel.creditCardNumber,
				oninput: (newValue) => {
					viewModel.creditCardNumber = newValue
					restoreSelection(this.ccNumberDom!)
				},
				onblur: () => (this.numberFieldLeft = true),
				autocompleteAs: Autocomplete.ccNumber,
				onDomInputCreated: (dom) => (this.ccNumberDom = dom),
			}),
			m(TextField, {
				label: "creditCardExpirationDateWithFormat_label",
				value: viewModel.expirationDate,
				// we only show the hint if the field is not empty and not selected to avoid showing errors while the user is typing.
				helpLabel: () => (this.dateFieldLeft ? lang.get(viewModel.getExpirationDateErrorHint() ?? "emptyString_msg") : lang.get("emptyString_msg")),
				onblur: () => (this.dateFieldLeft = true),
				oninput: (newValue) => {
					viewModel.expirationDate = newValue
					restoreSelection(this.expDateDom!)
				},
				onDomInputCreated: (dom) => (this.expDateDom = dom),
				autocompleteAs: Autocomplete.ccExp,
			}),
			m(TextField, {
				label: () => viewModel.getCvvLabel(),
				value: viewModel.cvv,
				helpLabel: () => this.renderCvvNumberHelpLabel(viewModel),
				oninput: (newValue) => (viewModel.cvv = newValue),
				onblur: () => (this.cvvFieldLeft = true),
				autocompleteAs: Autocomplete.ccCsc,
			}),
		]
	}

	private renderCcNumberHelpLabel(model: SimplifiedCreditCardViewModel): Children {
		const hint = model.getCreditCardNumberHint()
		const error = model.getCreditCardNumberErrorHint()
		// we only draw the hint if the number field was entered & exited before
		if (this.numberFieldLeft) {
			if (hint) {
				return error ? lang.get("creditCardHintWithError_msg", { "{hint}": hint, "{errorText}": error }) : hint
			} else {
				return error ? error : lang.get("emptyString_msg")
			}
		} else {
			return hint ?? lang.get("emptyString_msg")
		}
	}

	private renderCvvNumberHelpLabel(model: SimplifiedCreditCardViewModel): Children {
		const cvvHint = model.getCvvHint()
		const cvvError = model.getCvvErrorHint()
		if (this.cvvFieldLeft) {
			if (cvvHint) {
				return cvvError ? lang.get("creditCardHintWithError_msg", { "{hint}": cvvHint, "{errorText}": cvvError }) : cvvHint
			} else {
				return cvvError ? cvvError : lang.get("emptyString_msg")
			}
		} else {
			return cvvHint ?? lang.get("emptyString_msg")
		}
	}
}
