// @flow
import m from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import type {Country} from "../api/common/CountryList"
import {Countries, CountryType} from "../api/common/CountryList"
import {HtmlEditor, Mode} from "../gui/editor/HtmlEditor"
import {serviceRequest} from "../api/main/Entity"
import {HttpMethod} from "../api/common/EntityFunctions"
import {SysService} from "../api/entities/sys/Services"
import type {LocationServiceGetReturn} from "../api/entities/sys/LocationServiceGetReturn"
import {LocationServiceGetReturnTypeRef} from "../api/entities/sys/LocationServiceGetReturn"
import {createCountryDropdown} from "../gui/base/GuiUtils"
import {TextFieldN} from "../gui/base/TextFieldN"


export class InvoiceDataInput {
	view: Function;
	oncreate: Function;
	selectedCountry: Stream<?Country>;
	_invoiceAddressComponent: HtmlEditor;
	_businessUse: boolean;
	_vatNumber: string

	constructor(businessUse: boolean, invoiceData: InvoiceData) {
		this._businessUse = businessUse
		this._invoiceAddressComponent = new HtmlEditor()
			.setMinHeight(120)
			.showBorders()
			.setPlaceholderId("invoiceAddress_label")
			.setMode(Mode.HTML)
			.setHtmlMonospace(false)


		this._vatNumber = ""
		const vatNumberFieldAttrs = {
			label: "invoiceVatIdNo_label",
			value: stream(this._vatNumber),
			helpLabel: () => lang.get("invoiceVatIdNoInfoBusiness_msg"),
			oninput: (value) => this._vatNumber = value,
		}

		this.selectedCountry = stream(null)
		const countryInput = createCountryDropdown(this.selectedCountry, () => lang.get("invoiceCountryInfoConsumer_msg"))

		this._invoiceAddressComponent.setValue(invoiceData.invoiceAddress)
		this.selectedCountry(invoiceData.country)

		this.view = () => [
			m(".pt", m(this._invoiceAddressComponent)),
			m(".small", lang.get(businessUse ? "invoiceAddressInfoBusiness_msg" : "invoiceAddressInfoPrivate_msg")),
			m(countryInput),
			this._isVatIdFieldVisible() ? m(TextFieldN, vatNumberFieldAttrs) : null
		]

		this.oncreate = () => {
			serviceRequest(SysService.LocationService, HttpMethod.GET, null, LocationServiceGetReturnTypeRef)
				.then((location: LocationServiceGetReturn) => {
					if (!this.selectedCountry()) {
						let country = Countries.find(c => c.a === location.country)
						if (country) {
							this.selectedCountry(country)
							m.redraw()
						}
					}
				})
		}
	}

	validateInvoiceData(): ? TranslationKey {
		let address = this._getAddress()
		if (this._businessUse) {
			if (address.trim() === "" || address.split('\n').length > 5) {
				return "invoiceAddressInfoBusiness_msg"
			} else if (!this.selectedCountry()) {
				return "invoiceCountryInfoBusiness_msg"
			}
		} else {
			if (!this.selectedCountry()) {
				return "invoiceCountryInfoBusiness_msg" // use business text here because it fits better
			} else if (address.split('\n').length > 4) {
				return "invoiceAddressInfoBusiness_msg"
			}
		}
		// no error
		return null
	}

	_isVatIdFieldVisible(): boolean {
		const selectedCountry = this.selectedCountry()
		return this._businessUse && selectedCountry != null && selectedCountry.t === CountryType.EU
	}

	getInvoiceData(): InvoiceData {
		let address = this._getAddress()
		const selectedCountry = this.selectedCountry()
		return {
			invoiceAddress: address,
			country: selectedCountry,
			vatNumber: (selectedCountry && selectedCountry.t === CountryType.EU
				&& this._businessUse) ? this._vatNumber : ""
		}
	}

	_getAddress(): string {
		const address = this._invoiceAddressComponent.getValue()
		return address.split('\n').filter(line => line.trim().length > 0).join('\n')
	}


}