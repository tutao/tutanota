import m, { Children, Component, Vnode } from "mithril"
import { Autocomplete } from "../gui/base/TextField.js"
import { SimplifiedCreditCardViewModel } from "./SimplifiedCreditCardInputModel.js"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { CreditCard } from "../api/entities/sys/TypeRefs.js"
import { LoginTextField, LoginTextFieldAttrs } from "../gui/base/LoginTextField"
import { Icons } from "../gui/base/icons/Icons"
import { theme } from "../gui/theme"
import { styles } from "../gui/styles"

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

export class CreditCardInput implements Component<SimplifiedCreditCardAttrs> {
	dateFieldLeft: boolean = false
	numberFieldLeft: boolean = false
	cvvFieldLeft: boolean = false
	ccNumberDom: HTMLInputElement | null = null
	expDateDom: HTMLInputElement | null = null

	view(vnode: Vnode<SimplifiedCreditCardAttrs>): Children {
		let { viewModel } = vnode.attrs
		const formGap = styles.isMobileLayout() ? ".gap-16" : ".gap-24"

		return m(`.flex.col.mtb-16${formGap}`, [
			m(LoginTextField, {
				label: "creditCardNumber_label",
				class: "",
				helpLabel: () => this.renderCcNumberHelpLabel(viewModel),
				value: viewModel.creditCardNumber,
				oninput: (newValue) => {
					viewModel.creditCardNumber = newValue
					restoreSelection(this.ccNumberDom!)
				},
				onblur: () => (this.numberFieldLeft = true),
				autocompleteAs: Autocomplete.ccNumber,
				onDomInputCreated: (dom) => (this.ccNumberDom = dom),
				leadingIcon: {
					icon: Icons.CreditCard,
					color: theme.on_surface_variant,
				},
			} satisfies LoginTextFieldAttrs),
			m(`.flex.row.flex-grow${formGap}`, [
				m(LoginTextField, {
					label: "creditCardExpirationDateWithFormat_label",
					class: "",
					value: viewModel.expirationDate,
					helpLabel: () => this.renderExpirationDateHelpLabel(viewModel),
					onblur: () => (this.dateFieldLeft = true),
					oninput: (newValue) => {
						viewModel.expirationDate = newValue
						restoreSelection(this.expDateDom!)
					},
					onDomInputCreated: (dom) => (this.expDateDom = dom),
					autocompleteAs: Autocomplete.ccExp,
					leadingIcon: {
						icon: Icons.CalendarFilled,
						color: theme.on_surface_variant,
					},
				}),
				m(LoginTextField, {
					label: lang.makeTranslation("cvv", viewModel.getCvvLabel()),
					class: "",
					value: viewModel.cvv,
					helpLabel: () => this.renderCvvNumberHelpLabel(viewModel),
					oninput: (newValue) => {
						viewModel.cvv = newValue
					},
					onblur: () => (this.cvvFieldLeft = true),
					autocompleteAs: Autocomplete.ccCsc,
					leadingIcon: {
						icon: Icons.Lock,
						color: theme.on_surface_variant,
					},
				}),
			]),
		])
	}

	private renderCcNumberHelpLabel(model: SimplifiedCreditCardViewModel): Children {
		const hint = model.getCreditCardNumberHint()
		const error = model.getCreditCardNumberErrorHint()

		if (model.getCreditCardData().number === "") {
			return m("span", lang.get("creditCardNumberFormat_msg"))
		}

		if (hint) {
			return error ? m("span", lang.get("creditCardHintWithError_msg", { "{hint}": hint, "{errorText}": error })) : m("span", hint)
		} else {
			return error ? m("span", error) : lang.get("emptyString_msg")
		}
	}

	private renderExpirationDateHelpLabel(model: SimplifiedCreditCardViewModel): Children {
		const error = model.getExpirationDateErrorHint()
		if (model.expirationDate === "") {
			return lang.getTranslationText("creditCardExpirationDate_label")
		}

		if (error) {
			return m("span", lang.getTranslationText(error))
		}

		return m("span", lang.getTranslationText("creditCardExpirationDateValid_msg"))
	}

	private renderCvvNumberHelpLabel(model: SimplifiedCreditCardViewModel): Children {
		const cvvHint = model.getCvvHint()
		const cvvError = model.getCvvErrorHint()
		const longCvvLabel = lang.makeTranslation("long_cvv", model.getLongCvvLabel()).text
		if (model.cvv === "") {
			return longCvvLabel
		}

		if (cvvHint) {
			return cvvError
				? lang.get("creditCardHintWithError_msg", {
						"{hint}": cvvHint,
						"{errorText}": cvvError,
					})
				: cvvHint
		} else {
			if (cvvError) {
				return m("span", cvvError)
			}
			return m("span", lang.getTranslationText("creditCardSpecificCVVValid_msg"))
		}
	}
}
