// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {load, loadAll, loadRange, update} from "../api/main/Entity"
import {neverNull} from "../api/common/utils/Utils"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {logins} from "../api/main/LoginController"
import {lang} from "../misc/LanguageViewModel"
import {Dialog} from "../gui/base/Dialog"
import * as SetCustomDomainCertificateDialog from "./SetDomainCertificateDialog"
import {BookingItemFeatureType, FeatureType, OperationType} from "../api/common/TutanotaConstants"
import {CUSTOM_MIN_ID, GENERATED_MAX_ID} from "../api/common/EntityFunctions"
import {TextField, Type} from "../gui/base/TextField"
import {Button} from "../gui/base/Button"
import * as EditCustomColorsDialog from "./EditCustomColorsDialog"
import {worker} from "../api/main/WorkerClient"
import stream from "mithril/stream/stream.js"
import {fileController} from "../file/FileController"
import {WhitelabelConfigTypeRef} from "../api/entities/sys/WhitelabelConfig"
import type {Theme} from "../gui/theme"
import {updateCustomTheme} from "../gui/theme"
import {stringToUtf8Uint8Array, timestampToGeneratedId, uint8ArrayToBase64, utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {contains} from "../api/common/utils/ArrayUtils"
import {formatDateTime, formatSortableDate} from "../misc/Formatter"
import {progressIcon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {CustomerServerPropertiesTypeRef} from "../api/entities/sys/CustomerServerProperties"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {createStringWrapper} from "../api/entities/sys/StringWrapper"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {DatePicker} from "../gui/base/DatePicker"
import {CustomerContactFormGroupRootTypeRef} from "../api/entities/tutanota/CustomerContactFormGroupRoot"
import {ContactFormTypeRef} from "../api/entities/tutanota/ContactForm"
import {createDataFile} from "../api/common/DataFile"
import {createFile} from "../api/entities/tutanota/File"
import {DAY_IN_MILLIS} from "../api/common/utils/DateUtils"
import {UnencryptedStatisticLogEntryTypeRef} from "../api/entities/tutanota/UnencryptedStatisticLogEntry"
import {BookingTypeRef} from "../api/entities/sys/Booking"
import {getCurrentCount} from "../subscription/PriceUtils"
import * as WhitelabelBuyDialog from "../subscription/WhitelabelBuyDialog"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"

assertMainOrNode()

const MAX_LOGO_SIZE = 1024 * 100
const ALLOWED_FILE_TYPES = ["svg", "png", "jpg", "jpeg"]

export class WhitelabelSettingsViewer implements UpdatableSettingsViewer {
	view: Function;

	_brandingDomainField: TextField;
	_customLogoField: TextField;
	_customColorsField: TextField;
	_customMetaTagsField: TextField;
	_whitelabelImprintUrl: TextField;
	_defaultGermanLanguageFile: ?DropDownSelector<string>;
	_whitelabelCodeField: TextField;
	_whitelabelRegistrationDomains: DropDownSelector<?string>;

	_props: LazyLoaded<CustomerServerProperties>;
	_customer: LazyLoaded<Customer>;
	_customerInfo: LazyLoaded<CustomerInfo>;

	_contactFormsExist: ?boolean;

	constructor() {
		this._customer = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		})

		this._customerInfo = new LazyLoaded(() => {
			return this._customer.getAsync().then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		})

		this._props = new LazyLoaded(() => {
			return worker.loadCustomerServerProperties()
		})

		this._updateFields()

		this._updateWhitelabelRegistrationFields()

		this._contactFormsExist = null
		this._customer.getAsync().then(customer => {
			load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then(root => {
				loadRange(ContactFormTypeRef, root.contactForms, CUSTOM_MIN_ID, 1, false).then(contactForms => {
					this._contactFormsExist = contactForms.length > 0
					m.redraw()
				})
			})
		})

		let contactFormReportFrom = new DatePicker("dateFrom_label")
		let contactFormReportTo = new DatePicker("dateTo_label")
		contactFormReportFrom.setDate(new Date())
		contactFormReportTo.setDate(new Date())
		let contactFormReportButton = new Button("export_action", () => this._contactFormReport(contactFormReportFrom.date(), contactFormReportTo.date()), () => Icons.Download)

		this.view = () => {
			return [
				m("#global-settings.fill-absolute.scroll.plr-l", (this._brandingDomainField) ? [
					m(".h4.mt-l", lang.get('whitelabel_label')),
					m("small", lang.get("whitelabelDomainLinkInfo_msg") + " "),
					m("small.text-break", [m(`a[href=${this._getBrandingLink()}][target=_blank]`, this._getBrandingLink())]),
					m(this._brandingDomainField),
					m(this._customLogoField),
					m(this._customColorsField),
					m(this._customMetaTagsField),
					m(this._whitelabelImprintUrl),
					this._defaultGermanLanguageFile ? m(this._defaultGermanLanguageFile) : null,
					(this._isWhitelabelRegistrationVisible()) ? m("", [
						m(this._whitelabelRegistrationDomains),
						m(this._whitelabelCodeField),
					]) : null,
					this._contactFormsExist ? m(".mt-l", [
						m(".h4", lang.get("contactFormReport_label")),
						m(".small", lang.get("contactFormReportInfo_msg")),
						m(".flex-space-between.items-center.mb-s", [
							m(contactFormReportFrom),
							m(contactFormReportTo),
							m(contactFormReportButton)
						]),
					]) : null,
				] : [
					m(".flex-center.items-center.button-height.mt-l", progressIcon())
				])
			]
		}
	}

	_isWhitelabelRegistrationVisible() {
		return this._customer.isLoaded() &&
			this._customer.getLoaded().customizations.find(c => c.feature === FeatureType.WhitelabelParent) &&
			this._customerInfo.isLoaded() &&
			this._customerInfo.getLoaded().domainInfos.find(info => info.certificate) &&
			this._whitelabelCodeField &&
			this._whitelabelRegistrationDomains
	}

	_getBrandingLink(): string {
		return (lang.code === "de" || lang.code === "de_sie") ?
			"http://tutanota.uservoice.com/knowledgebase/articles/1180321" :
			"http://tutanota.uservoice.com/knowledgebase/articles/1180318"
	}

	_tryLoadWhitelabelConfig(domainInfo: ?DomainInfo): Promise<?WhitelabelConfig> {
		if (domainInfo && domainInfo.whitelabelConfig) {
			return load(WhitelabelConfigTypeRef, domainInfo.whitelabelConfig)
		} else {
			return Promise.resolve(null)
		}
	}

	_updateWhitelabelRegistrationFields() {
		this._props.getAsync().then(props => {
			this._customerInfo.getAsync().then(customerInfo => {
				this._whitelabelCodeField = new TextField("whitelabelRegistrationCode_label", null).setValue(props.whitelabelCode)
				                                                                                   .setDisabled()
				let editButton = new Button("edit_action", () => {
					Dialog.showTextInputDialog("edit_action", "whitelabelRegistrationCode_label", null, this._whitelabelCodeField.value())
					      .then(newCode => {
						      props.whitelabelCode = newCode
						      update(props)
					      })
				}, () => Icons.Edit)
				this._whitelabelCodeField._injectionsRight = () => [m(editButton)]

				let items = [{name: lang.get("deactivated_label"), value: null}]
				items = items.concat(customerInfo.domainInfos.filter(d => !d.certificate).map(d => {
					return {name: d.domain, value: d.domain}
				}))
				let initialValue = (props.whitelabelRegistrationDomains.length
					=== 0) ? null : props.whitelabelRegistrationDomains[0].value
				this._whitelabelRegistrationDomains = new DropDownSelector("whitelabelRegistrationEmailDomain_label", null, items, stream(initialValue), 250).setSelectionChangedHandler(v => {
					props.whitelabelRegistrationDomains.length = 0
					if (v) {
						let domain = createStringWrapper()
						domain.value = v
						props.whitelabelRegistrationDomains.push(domain)
					}
					update(props)
				})
				m.redraw()
			})
		})
	}

	_updateFields() {
		this._customerInfo.getAsync().then(customerInfo => {
			let brandingDomainInfo = customerInfo.domainInfos.find(info => info.certificate)
			return this._tryLoadWhitelabelConfig(brandingDomainInfo).then(whitelabelConfig => {
				loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
					.then(bookings => {
						const brandingCount = getCurrentCount(BookingItemFeatureType.Branding,
							bookings.length === 1 ? bookings[0] : null)
						let customJsonTheme = (whitelabelConfig) ? JSON.parse(whitelabelConfig.jsonTheme) : null
						// customJsonTheme is defined when brandingDomainInfo is defined
						this._brandingDomainField = new TextField("whitelabelDomain_label", () => {
							if (brandingDomainInfo) {
								return lang.get("certificateExpiryDate_label", {"{date}": formatDateTime(neverNull(brandingDomainInfo.certificateExpiryDate))})
							} else {
								return lang.get("emptyString_msg")
							}
						}).setValue((brandingDomainInfo) ? brandingDomainInfo.domain : lang.get("deactivated_label"))
						  .setDisabled()
						let deactivateAction = null
						if (brandingDomainInfo) {
							deactivateAction = new Button("deactivate_action", () => {
								Dialog.confirm("confirmDeactivateWhitelabelDomain_msg").then(ok => {
									if (ok) {
										showProgressDialog("pleaseWait_msg", worker.deleteCertificate(neverNull(brandingDomainInfo).domain))
									}

								})
							}, () => Icons.Cancel)
						}
						let editAction = new Button("edit_action", () => {
							if (logins.getUserController().isFreeAccount()) {
								showNotAvailableForFreeDialog(false)
							} else {
								const whitelabelEnabledPromise: Promise<boolean> = brandingCount === 0 ?
									WhitelabelBuyDialog.show(true) : Promise.resolve(true)
								whitelabelEnabledPromise.then(enabled => {
									if (enabled) {
										SetCustomDomainCertificateDialog.show(customerInfo)
									}
								})
							}
						}, () => Icons.Edit)
						this._brandingDomainField._injectionsRight = () => [
							(deactivateAction) ? m(deactivateAction) : null, m(editAction)
						]


						let customLogoDefined = customJsonTheme && customJsonTheme.logo
						this._customLogoField = new TextField("customLogo_label", () =>
							lang.get("customLogoInfo_msg"))
							.setValue(lang.get(customLogoDefined ? "activated_label" : "deactivated_label"))
							.setDisabled()
						if (customJsonTheme) {
							let deleteCustomLogo
							if (customLogoDefined) {
								deleteCustomLogo = new Button("deactivate_action", () => {
									Dialog.confirm("confirmDeactivateCustomLogo_msg").then(ok => {
										if (ok) {
											delete neverNull(customJsonTheme).logo
											neverNull(whitelabelConfig).jsonTheme = JSON.stringify(customJsonTheme)
											update(whitelabelConfig)
											updateCustomTheme(customJsonTheme)
										}
									})
								}, () => Icons.Cancel)
							}

							let chooseLogoButton = new Button("edit_action", () => {
								fileController.showFileChooser(false).then(files => {
									let extension = files[0].name.toLowerCase()
									                        .substring(files[0].name.lastIndexOf(".") + 1)
									if (files[0].size > MAX_LOGO_SIZE || !contains(ALLOWED_FILE_TYPES, extension)) {
										Dialog.error("customLogoInfo_msg")
									} else {
										let imageData = null
										if (extension === "svg") {
											imageData = utf8Uint8ArrayToString(files[0].data)
										} else {
											imageData = "<img src=\"data:image/" +
												((extension === "jpeg") ? "jpg" : extension)
												+ ";base64," + uint8ArrayToBase64(files[0].data) + "\">"
										}
										neverNull(customJsonTheme).logo = imageData
										neverNull(whitelabelConfig).jsonTheme = JSON.stringify(customJsonTheme)
										update(whitelabelConfig)
										updateCustomTheme(customJsonTheme)
										this._customLogoField.setValue(lang.get("activated_label"))
										m.redraw()
									}
								})
							}, () => Icons.Edit)

							this._customLogoField._injectionsRight = () => [
								(deleteCustomLogo) ? m(deleteCustomLogo) : null, m(chooseLogoButton)
							]
						}

						let customColorsDefined = this._areCustomColorsDefined(customJsonTheme)
						this._customColorsField = new TextField("customColors_label", null).setValue((customColorsDefined) ? lang.get("activated_label") : lang.get("deactivated_label"))
						                                                                   .setDisabled()
						if (customJsonTheme) {
							let deactivateColorTheme
							if (customColorsDefined) {
								deactivateColorTheme = new Button("deactivate_action", () => {
									Dialog.confirm("confirmDeactivateCustomColors_msg").then(ok => {
										if (ok) {
											Object.keys(neverNull(customJsonTheme)).forEach(key => {
												if (key !== "logo") {
													delete neverNull(customJsonTheme)[key]
												}
											})
											neverNull(whitelabelConfig).jsonTheme = JSON.stringify(customJsonTheme)
											update(whitelabelConfig)
											updateCustomTheme(customJsonTheme)
										}
									})
								}, () => Icons.Cancel)
							}

							let editCustomColorButton = new Button("edit_action", () => EditCustomColorsDialog.show(neverNull(whitelabelConfig), neverNull(customJsonTheme),), () => Icons.Edit)

							this._customColorsField._injectionsRight = () => [
								(deactivateColorTheme) ? m(deactivateColorTheme) : null, m(editCustomColorButton)
							]
						}

						let customMetaTagsDefined = whitelabelConfig ? whitelabelConfig.metaTags.length > 0 : false
						this._whitelabelImprintUrl = new TextField("imprintUrl_label", null).setValue((whitelabelConfig
							&& whitelabelConfig.imprintUrl) ? whitelabelConfig.imprintUrl : "").setDisabled()
						this._customMetaTagsField = new TextField("customMetaTags_label", null).setValue(customMetaTagsDefined ? lang.get("activated_label") : lang.get("deactivated_label"))
						                                                                       .setDisabled()
						if (whitelabelConfig) {
							let editCustomMetaTagsButton = new Button("edit_action", () => {
								let metaTags = new TextField("customMetaTags_label")
									.setValue(neverNull(whitelabelConfig).metaTags)
									.setType(Type.Area)
								let dialog = Dialog.showActionDialog({
									title: lang.get("customMetaTags_label"),
									child: {view: () => m(metaTags)},
									okAction: (ok) => {
										if (ok) {
											neverNull(whitelabelConfig).metaTags = metaTags.value()
											update(whitelabelConfig)
											dialog.close()
										}
									}
								})
							}, () => Icons.Edit)
							this._customMetaTagsField._injectionsRight = () => m(editCustomMetaTagsButton)

							let editImprintUrlButton = new Button("edit_action", () => {
								let imprintUrl = new TextField("imprintUrl_label")
									.setValue(neverNull(whitelabelConfig).imprintUrl)
								let dialog = Dialog.showActionDialog({
									title: lang.get("imprintUrl_label"),
									child: {view: () => m(imprintUrl)},
									okAction: (ok) => {
										if (ok) {
											neverNull(whitelabelConfig).imprintUrl = imprintUrl.value() ? imprintUrl.value() : null
											update(whitelabelConfig)
											dialog.close()
										}
									}
								})
							}, () => Icons.Edit)
							this._whitelabelImprintUrl._injectionsRight = () => m(editImprintUrlButton)
						}

						let customGermanLanguageFileDefined = whitelabelConfig
						&& whitelabelConfig.germanLanguageCode ? whitelabelConfig.germanLanguageCode : false
						let items = [
							{name: "Deutsch (Du)", value: "de"},
							{name: "Deutsch (Sie)", value: "de_sie"}
						]
						if (whitelabelConfig && (lang.code === 'de' || lang.code === 'de_sie')) {
							const streamValue = stream(customGermanLanguageFileDefined ? customGermanLanguageFileDefined : items[0].value)
							this._defaultGermanLanguageFile = new DropDownSelector("germanLanguageFile_label", null, items, streamValue, 250).setSelectionChangedHandler(v => {
								if (v) {
									neverNull(whitelabelConfig).germanLanguageCode = v
									update(whitelabelConfig)
									lang.setLanguage({code: v, languageTag: lang.languageTag})
								}
							})
						}

						m.redraw()
					})
			})
		})
	}

	_areCustomColorsDefined(theme: ?Theme): boolean {
		if (theme) {
			return Object.keys(theme).find(key => key !== "logo" && neverNull(theme)[key]) != null
		} else {
			return false
		}
	}


	_contactFormReport(from: ?Date, to: ?Date) {
		if ((from == null || to == null) || from.getTime() > to.getTime()) {
			Dialog.error("dateInvalidRange_msg")
		} else {
			showProgressDialog("loading_msg", load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
				.then(customer => load(CustomerContactFormGroupRootTypeRef, customer.customerGroup))
				.then(root => loadAll(UnencryptedStatisticLogEntryTypeRef, neverNull(root.statisticsLog).items,
					timestampToGeneratedId(neverNull(from).getTime()),
					timestampToGeneratedId(neverNull(to).getTime() + DAY_IN_MILLIS)))
				.then(logEntries => {
					let titleRow = `path,date`
					let rows = logEntries.map(entry => {
						return '"' + entry.contactFormPath + '",' + formatSortableDate(entry.date)
					})
					let csv = [titleRow].concat(rows).join("\n")

					let data = stringToUtf8Uint8Array(csv)
					let tmpFile = createFile()
					tmpFile.name = "report.csv"
					tmpFile.mimeType = "text/csv"
					tmpFile.size = String(data.byteLength)
					return fileController.open(createDataFile(tmpFile, data))
				}))
		}
	}


	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>) {
		for (let update of updates) {
			if (isUpdateForTypeRef(CustomerTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._customer.reset()
				this._customer.getAsync().then(() => m.redraw())
				this._updateWhitelabelRegistrationFields()
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._customerInfo.reset()
				this._updateFields()
			} else if (isUpdateForTypeRef(WhitelabelConfigTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._updateFields()
			} else if (isUpdateForTypeRef(CustomerServerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._props.reset()
				this._updateWhitelabelRegistrationFields()
			}
		}
	}
}