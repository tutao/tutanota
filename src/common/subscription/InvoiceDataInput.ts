import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import type { Country } from "../api/common/CountryList"
import { Countries, CountryType } from "../api/common/CountryList"
import { HtmlEditor, HtmlEditorMode } from "../gui/editor/HtmlEditor"
import type { LocationServiceGetReturn } from "../api/entities/sys/TypeRefs.js"
import { renderCountryDropdown } from "../gui/base/GuiUtils"
import { TextField } from "../gui/base/TextField.js"
import type { InvoiceData } from "../api/common/TutanotaConstants"
import { LocationService } from "../api/entities/sys/Services"
import { locator } from "../api/main/CommonLocator"
import Stream from "mithril/stream"
import stream from "mithril/stream"

export enum InvoiceDataInputLocation {
	InWizard = 0,
	Other = 1,
}

interface InvoiceDataInputAttrs {
	isBusiness: boolean
	invoiceData: InvoiceData
	location: InvoiceDataInputLocation
}

export class InvoiceDataInput implements Component<InvoiceDataInputAttrs> {
	private readonly invoiceAddressComponent: HtmlEditor
	public readonly selectedCountry: Stream<Country | null>
	private vatNumber: string = ""

	constructor({ attrs: { invoiceData } }: Vnode<InvoiceDataInputAttrs>) {
		this.invoiceAddressComponent = new HtmlEditor()
			.setStaticNumberOfLines(5)
			.showBorders()
			.setPlaceholderId("invoiceAddress_label")
			.setMode(HtmlEditorMode.HTML)
			.setHtmlMonospace(false)
			.setValue(invoiceData.invoiceAddress)

		this.selectedCountry = stream(invoiceData.country)

		this.view = this.view.bind(this)
		this.oncreate = this.oncreate.bind(this)
	}

	view({ attrs: { isBusiness, location = InvoiceDataInputLocation.Other } }: Vnode<InvoiceDataInputAttrs>): Children {
		return [
			isBusiness || location !== InvoiceDataInputLocation.InWizard
				? m("", [
						m(".pt", m(this.invoiceAddressComponent)),
						m(".small", lang.get(isBusiness ? "invoiceAddressInfoBusiness_msg" : "invoiceAddressInfoPrivate_msg")),
					])
				: null,
			renderCountryDropdown({
				selectedCountry: this.selectedCountry(),
				onSelectionChanged: this.selectedCountry,
				helpLabel: () => lang.get("invoiceCountryInfoConsumer_msg"),
			}),
			this.isVatIdFieldVisible(isBusiness)
				? m(TextField, {
						label: "invoiceVatIdNo_label",
						value: this.vatNumber,
						oninput: (value) => (this.vatNumber = value),
						helpLabel: () => lang.get("invoiceVatIdNoInfoBusiness_msg"),
					})
				: null,
		]
	}

	oncreate() {
		locator.serviceExecutor.get(LocationService, null).then((location: LocationServiceGetReturn) => {
			if (!this.selectedCountry()) {
				const country = Countries.find((c) => c.a === location.country)

				if (country) {
					this.selectedCountry(country)
					m.redraw()
				}
			}
		})
	}

	private isVatIdFieldVisible(isBusiness: boolean): boolean {
		const selectedCountry = this.selectedCountry()
		return isBusiness && selectedCountry != null && selectedCountry.t === CountryType.EU
	}

	private getAddress(): string {
		return this.invoiceAddressComponent
			.getValue()
			.split("\n")
			.filter((line) => line.trim().length > 0)
			.join("\n")
	}
}
