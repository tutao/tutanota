// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {load, loadAll, loadRange, update} from "../api/main/Entity"
import {getCustomMailDomains, getWhitelabelDomain, neverNull} from "../api/common/utils/Utils"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {logins} from "../api/main/LoginController"
import {lang, languageByCode} from "../misc/LanguageViewModel"
import {Dialog} from "../gui/base/Dialog"
import * as SetCustomDomainCertificateDialog from "./SetDomainCertificateDialog"
import {
	ALLOWED_IMAGE_FORMATS,
	CertificateState,
	CertificateType,
	FeatureType,
	MAX_LOGO_SIZE,
	OperationType
} from "../api/common/TutanotaConstants"
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
import {createNotAvailableForFreeButtonAttrs} from "../subscription/PriceUtils"
import * as WhitelabelBuyDialog from "../subscription/WhitelabelAndSharingBuyDialog"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {CustomerPropertiesTypeRef} from "../api/entities/sys/CustomerProperties"
import {attachDropdown} from "../gui/base/DropdownN"
import * as EditNotificationEmailDialog from "./EditNotificationEmailDialog"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {isWhitelabelActive} from "../subscription/SubscriptionUtils"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {getStartOfTheWeekOffsetForUser} from "../calendar/CalendarUtils"

assertMainOrNode()


export class WhitelabelSettingsViewer implements UpdatableSettingsViewer {
	view: Function;

	_brandingDomainField: TextField;
	_customLogoField: TextField;
	_customColorsField: TextField;
	_customMetaTagsField: TextField;
	_whitelabelImprintUrl: TextField;
	_whitelabelPrivacyUrl: TextField;
	_defaultGermanLanguageFile: ?DropDownSelector<string>;
	_whitelabelCodeField: TextField;
	_whitelabelRegistrationDomains: DropDownSelector<?string>;
	_whitelabelStatusField: TextFieldAttrs;

	_props: LazyLoaded<CustomerServerProperties>;
	_customer: LazyLoaded<Customer>;
	_customerInfo: LazyLoaded<CustomerInfo>;
	_customerProperties: LazyLoaded<CustomerProperties>;
	_lastBooking: ?Booking;
	_notificationEmailsExpanded: Stream<boolean>;

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

		this._customerProperties = new LazyLoaded(() =>
			this._customer.getAsync().then((customer) => load(CustomerPropertiesTypeRef, neverNull(customer.properties))))

		this._whitelabelStatusField = {
			label: "state_label",
			value: stream(lang.get("loading_msg")),
			disabled: true
		}
		this._notificationEmailsExpanded = stream(false)
		this._lastBooking = null

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

		const startOfTheWeekOffset = getStartOfTheWeekOffsetForUser()
		let contactFormReportFrom = new DatePicker(startOfTheWeekOffset, "dateFrom_label")
		let contactFormReportTo = new DatePicker(startOfTheWeekOffset, "dateTo_label")
		contactFormReportFrom.setDate(new Date())
		contactFormReportTo.setDate(new Date())
		let contactFormReportButton = new Button("export_action", () => this._contactFormReport(contactFormReportFrom.date(), contactFormReportTo.date()), () => Icons.Export)

		this.view = () => {
			return [
				m("#global-settings.fill-absolute.scroll.plr-l", (this._brandingDomainField) ? [
					m(".h4.mt-l", lang.get('whitelabel_label')),
					m(".small", lang.get("whitelabelDomainLinkInfo_msg") + " "),
					m("small.text-break", [m(`a[href=${lang.getInfoLink("whitelabel_link")}][target=_blank]`, lang.getInfoLink("whitelabel_link"))]),
					m(TextFieldN, this._whitelabelStatusField),
					this.notificationEmailSettings(),
					m(".h4.mt-l", lang.get('whitelabelDomain_label')),
					m(this._brandingDomainField),
					m(this._customLogoField),
					m(this._customColorsField),
					m(this._customMetaTagsField),
					m(this._whitelabelImprintUrl),
					m(this._whitelabelPrivacyUrl),
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
			getWhitelabelDomain(this._customerInfo.getLoaded()) &&
			this._whitelabelCodeField &&
			this._whitelabelRegistrationDomains
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
				items = items.concat(getCustomMailDomains(customerInfo).map(d => {
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
			const whitelabelDomainInfo = getWhitelabelDomain(customerInfo)
			return this._tryLoadWhitelabelConfig(whitelabelDomainInfo).then(whitelabelConfig => {
				loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
					.then(bookings => {
						this._lastBooking = bookings.length === 1 ? bookings[0] : null
						const whitelabelActive = isWhitelabelActive(this._lastBooking)

						const enableWhiteLabelAction = createNotAvailableForFreeButtonAttrs("whitelabelDomain_label", () => WhitelabelBuyDialog.showWhitelabelBuyDialog(true), () => Icons.Edit, false)
						const disableWhiteLabelAction = createNotAvailableForFreeButtonAttrs("whitelabelDomain_label", () => WhitelabelBuyDialog.showWhitelabelBuyDialog(false), () => Icons.Cancel, false)

						this._whitelabelStatusField.value(whitelabelActive ? lang.get("active_label") : lang.get("deactivated_label"))
						this._whitelabelStatusField.injectionsRight = () => whitelabelActive ? m(ButtonN, disableWhiteLabelAction) : m(ButtonN, enableWhiteLabelAction)


						let customJsonTheme = (whitelabelConfig) ? JSON.parse(whitelabelConfig.jsonTheme) : null
						// customJsonTheme is defined when brandingDomainInfo is defined
						this._brandingDomainField = new TextField("whitelabelDomain_label", this._whitelabelInfo(whitelabelConfig))
							.setValue((whitelabelDomainInfo) ? whitelabelDomainInfo.domain : lang.get("deactivated_label"))
							.setDisabled()
						let deactivateAction = null
						if (whitelabelDomainInfo) {
							deactivateAction = new Button("deactivate_action", () => {
								Dialog.confirm("confirmDeactivateWhitelabelDomain_msg").then(ok => {
									if (ok) {
										showProgressDialog("pleaseWait_msg", worker.deleteCertificate(neverNull(whitelabelDomainInfo).domain))
									}

								})
							}, () => Icons.Cancel)
						}
						let editAction = new Button("edit_action", () => {
							if (logins.getUserController().isFreeAccount()) {
								showNotAvailableForFreeDialog(false)
							} else {
								const whitelabelEnabledPromise: Promise<boolean> = whitelabelActive ? Promise.resolve(true) : WhitelabelBuyDialog.showWhitelabelBuyDialog(true)
								whitelabelEnabledPromise.then(enabled => {
									if (enabled) {
										SetCustomDomainCertificateDialog.show(customerInfo, whitelabelConfig)
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
									if (files[0].size > MAX_LOGO_SIZE || !contains(ALLOWED_IMAGE_FORMATS, extension)) {
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
						this._whitelabelPrivacyUrl = new TextField("privacyPolicyUrl_label", null).setValue((whitelabelConfig
							&& whitelabelConfig.privacyStatementUrl) ? whitelabelConfig.privacyStatementUrl : "").setDisabled()
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
									allowOkWithReturn: true,
									okAction: (ok) => {
										if (ok) {
											neverNull(whitelabelConfig).imprintUrl = imprintUrl.value() ? imprintUrl.value() : null
											update(whitelabelConfig)
											dialog.close()
										}
									}
								})
							}, () => Icons.Edit)
							let editPrivacyUrlButton = new Button("edit_action", () => {
								let privacyUrl = new TextField("privacyPolicyUrl_label")
									.setValue(neverNull(whitelabelConfig).privacyStatementUrl)
								let dialog = Dialog.showActionDialog({
									title: lang.get("privacyLink_label"),
									child: {view: () => m(privacyUrl)},
									allowOkWithReturn: true,
									okAction: (ok) => {
										if (ok) {
											neverNull(whitelabelConfig).privacyStatementUrl = privacyUrl.value() ? privacyUrl.value() : null
											update(whitelabelConfig)
											dialog.close()
										}
									}
								})
							}, () => Icons.Edit)
							this._whitelabelImprintUrl._injectionsRight = () => m(editImprintUrlButton)
							this._whitelabelPrivacyUrl._injectionsRight = () => m(editPrivacyUrlButton)
						}

						let customGermanLanguageFileDefined = whitelabelConfig
						&& whitelabelConfig.germanLanguageCode ? whitelabelConfig.germanLanguageCode : false
						let items = [
							{name: "Deutsch (Du)", value: "de"},
							{name: "Deutsch (Sie)", value: "de_sie"}
						]
						if (whitelabelConfig && (lang.code === 'de' || lang.code === 'de_sie')) {
							const streamValue = stream(customGermanLanguageFileDefined
								? neverNull(whitelabelConfig.germanLanguageCode)
								: items[0].value)
							this._defaultGermanLanguageFile = new DropDownSelector("germanLanguageFile_label", null, items, streamValue, 250).setSelectionChangedHandler(v => {
								if (v) {
									neverNull(whitelabelConfig).germanLanguageCode = v
									update(whitelabelConfig)
									lang.setLanguage({code: v, languageTag: lang.languageTag})
								}
							})
						}

						m.redraw()
						this._customerProperties.getAsync().then(m.redraw)
					})
			})
		})
	}

	_whitelabelInfo(whitelabelConfig: ?WhitelabelConfig): (() => Children) {
		let components: Array<string>
		if (whitelabelConfig) {
			switch (whitelabelConfig.certificateInfo.state) {
				case CertificateState.VALID:
					components = [
						lang.get("certificateExpiryDate_label", {"{date}": formatDateTime(neverNull(whitelabelConfig.certificateInfo.expiryDate))}),
						this._certificateTypeString(whitelabelConfig)
					]
					break
				case CertificateState.VALIDATING:
					components = [lang.get("certificateStateProcessing_label")]
					break
				case CertificateState.INVALID:
					components = [lang.get("certificateStateInvalid_label")];
					break
				default:
					components = [lang.get("emptyString_msg")]
			}
		} else {
			components = [lang.get("emptyString_msg")]
		}
		return () => m(".flex", components.map(c => m(".pr-s", c)))
	}

	_certificateTypeString(whitelabelConfig: WhitelabelConfig): string {
		switch (whitelabelConfig.certificateInfo.type) {
			case CertificateType.LETS_ENCRYPT:
				return lang.get("certificateTypeAutomatic_label")
			case CertificateType.MANUAL:
				return lang.get("certificateTypeManual_label")
			default:
				return lang.get("emptyString_msg")
		}
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

	notificationEmailSettings(): Children {
		const customerProperties = this._customerProperties.getSync()
		if (!customerProperties) return null

		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get("customNotificationEmails_label")),
				m(ExpanderButtonN, {label: "show_action", expanded: this._notificationEmailsExpanded})
			]),
			m(ExpanderPanelN, {expanded: this._notificationEmailsExpanded}, m(TableN, {
				columnHeading: ["language_label", "subject_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				showActionButtonColumn: true,
				addButtonAttrs: {
					label: "add_action",
					click: () => {
						this._showBuyOrSetNotificationEmailDialog()
					},
					type: ButtonType.Action,
					icon: () => Icons.Add
				},
				lines: customerProperties.notificationMailTemplates.map((template) => {
					const langName = lang.get(languageByCode[template.language].textId)
					return {
						cells: [langName, template.subject],
						actionButtonAttrs: attachDropdown(
							{
								label: "edit_action",
								type: ButtonType.Action,
								icon: () => Icons.Edit
							},
							() => [
								{
									label: "edit_action",
									click: () => EditNotificationEmailDialog.show(template, this._customerProperties),
									type: ButtonType.Dropdown,
								},
								{
									label: "remove_action",
									click: () => this._removeNotificationMailTemplate(template),
									type: ButtonType.Dropdown,
								}
							]
						)
					}

				})
			})),
			m(".small", lang.get("customNotificationEmailsHelp_msg")),
		]
	}

	_showBuyOrSetNotificationEmailDialog(existingTemplate: ?NotificationMailTemplate) {
		if (logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(false)
		} else {

			const whitelabelEnabledPromise: Promise<boolean> = isWhitelabelActive(this._lastBooking) ?
				Promise.resolve(true) : WhitelabelBuyDialog.showWhitelabelBuyDialog(true)
			whitelabelEnabledPromise.then(enabled => {
				if (enabled) {
					EditNotificationEmailDialog.show(existingTemplate, this._customerProperties)
				}
			})
		}
	}


	_removeNotificationMailTemplate(template: NotificationMailTemplate) {
		showProgressDialog("pleaseWait_msg", this._customerProperties.getAsync().then((customerProps) => {
			const index = customerProps.notificationMailTemplates.findIndex((t) => t.language === template.language)
			if (index !== -1) {
				customerProps.notificationMailTemplates.splice(index, 1)
				update(customerProps)
			}
		}))
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
			} else if (isUpdateForTypeRef(CustomerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._customerProperties.reset()
				this._updateFields()
			} else if (isUpdateForTypeRef(BookingTypeRef, update)) {
				this._updateFields()
			}
		}
	}
}
