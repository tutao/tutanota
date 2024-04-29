import m, { Children, Component } from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import type { Country } from "../api/common/CountryList"
import { Countries, CountryType } from "../api/common/CountryList"
import type { LocationServiceGetReturn } from "../api/entities/sys/TypeRefs.js"
import { renderCountryDropdown } from "../gui/base/GuiUtils"
import { BorderTextField, BorderTextFieldType } from "../gui/base/BorderTextField.js"
import type { InvoiceData } from "../api/common/TutanotaConstants"
import { LocationService } from "../api/entities/sys/Services"
import { locator } from "../api/main/MainLocator"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { UsageTest } from "@tutao/tutanota-usagetests"

export enum InvoiceDataInputLocation {
	InWizard = 0,
	Other = 1,
}

export class InvoiceDataInput implements Component {
	public readonly selectedCountry: Stream<Country | null>
	private vatNumber: string = ""
	private __paymentPaypalTest?: UsageTest
	private invoiceAddressStream: stream<string>

	constructor(private businessUse: boolean, invoiceData: InvoiceData, private readonly location = InvoiceDataInputLocation.Other) {
		this.__paymentPaypalTest = locator.usageTestController.getTest("payment.paypal")
		this.invoiceAddressStream = stream(invoiceData.invoiceAddress)
		this.selectedCountry = stream(invoiceData.country)

		this.view = this.view.bind(this)
		this.oncreate = this.oncreate.bind(this)
	}

	view(): Children {
		return [
			this.businessUse || this.location !== InvoiceDataInputLocation.InWizard
				? m("", [
						m(
							".pt",
							m(BorderTextField, {
								value: this.invoiceAddressStream(),
								oninput: this.invoiceAddressStream,
								areaTextFieldLines: 5,
								type: BorderTextFieldType.Area,
								label: "invoiceAddress_label",
							}),
						),
						m(".small", lang.get(this.businessUse ? "invoiceAddressInfoBusiness_msg" : "invoiceAddressInfoPrivate_msg")),
				  ])
				: null,
			renderCountryDropdown({
				selectedCountry: this.selectedCountry(),
				onSelectionChanged: this.selectedCountry,
				helpLabel: () => lang.get("invoiceCountryInfoConsumer_msg"),
			}),
			this.isVatIdFieldVisible()
				? m(BorderTextField, {
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

	validateInvoiceData(): TranslationKey | null {
		const address = this.getAddress()
		const countrySelected = this.selectedCountry() != null

		if (this.businessUse) {
			if (address.trim() === "" || address.split("\n").length > 5) {
				return "invoiceAddressInfoBusiness_msg"
			} else if (!countrySelected) {
				return "invoiceCountryInfoBusiness_msg"
			}
		} else {
			if (!countrySelected) {
				return "invoiceCountryInfoBusiness_msg" // use business text here because it fits better
			} else if (address.split("\n").length > 4) {
				return "invoiceAddressInfoBusiness_msg"
			}
		}
		this.__paymentPaypalTest?.getStage(3).complete()
		// no error
		return null
	}

	getInvoiceData(): InvoiceData {
		const address = this.getAddress()
		const selectedCountry = this.selectedCountry()
		return {
			invoiceAddress: address,
			country: selectedCountry,
			vatNumber: selectedCountry?.t === CountryType.EU && this.businessUse ? this.vatNumber : "",
		}
	}

	private isVatIdFieldVisible(): boolean {
		const selectedCountry = this.selectedCountry()
		return this.businessUse && selectedCountry != null && selectedCountry.t === CountryType.EU
	}

	private getAddress(): string {
		return this.invoiceAddressStream()
			.split("\n")
			.filter((line) => line.trim().length > 0)
			.join("\n")
	}
}
