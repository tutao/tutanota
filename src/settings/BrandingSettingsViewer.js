// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {load, update} from "../api/main/Entity"
import {neverNull} from "../api/common/utils/Utils"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {logins} from "../api/main/LoginController"
import {lang} from "../misc/LanguageViewModel"
import {Dialog} from "../gui/base/Dialog"
import * as SetCustomDomainCertificateDialog from "./SetDomainCertificateDialog"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {BookingItemFeatureType, OperationType} from "../api/common/TutanotaConstants"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {TextField, Type} from "../gui/base/TextField"
import {Button} from "../gui/base/Button"
import * as EditCustomColorsDialog from "./EditCustomColorsDialog"
import {worker} from "../api/main/WorkerClient"
import {fileController} from "../file/FileController"
import {BrandingThemeTypeRef} from "../api/entities/sys/BrandingTheme"
import type {Theme} from "../gui/theme"
import {updateCustomTheme} from "../gui/theme"
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {contains} from "../api/common/utils/ArrayUtils"
import {formatDateTime} from "../misc/Formatter"
import {progressIcon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import * as BuyDialog from "./BuyDialog"

assertMainOrNode()

let MAX_LOGO_SIZE = 1024 * 100
let ALLOWED_FILE_TYPES = ["svg", "png", "jpg", "jpeg"]

export class BrandingSettingsViewer {
	view: Function;

	_brandingDomainField: TextField;
	_customLogoField: TextField;
	_customColorsField: TextField;
	_customMetaTagsField: TextField;

	_customerInfo: LazyLoaded<CustomerInfo>;

	constructor() {
		this._customerInfo = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		})

		this._updateFields()

		this.view = () => {
			return [
				m("#global-settings.fill-absolute.scroll.plr-l", (this._brandingDomainField) ? [
						m(".h4.mt-l", lang.get('brandingSettings_label')),
						m("small", lang.get("brandingDomainLinkInfo_msg") + " "),
						m("small.text-break", [m(`a[href=${this._getBrandingLink()}][target=_blank]`, this._getBrandingLink())]),
						m(this._brandingDomainField),
						m(this._customLogoField),
						m(this._customColorsField),
						m(this._customMetaTagsField),
					] : [
						m(".flex-center.items-center.button-height.mt-l", progressIcon())
					])
			]
		}
	}

	_getBrandingLink(): string {
		return lang.code == "de" ? "http://tutanota.uservoice.com/knowledgebase/articles/1180321" : "http://tutanota.uservoice.com/knowledgebase/articles/1180318"
	}

	_tryLoadCustomJsonTheme(domainInfo: ?DomainInfo): Promise<?BrandingTheme> {
		if (domainInfo && domainInfo.theme) {
			return load(BrandingThemeTypeRef, domainInfo.theme)
		} else {
			return Promise.resolve(null)
		}
	}

	_updateFields() {
		this._customerInfo.getAsync().then(customerInfo => {
			let brandingDomainInfo = customerInfo.domainInfos.find(info => info.certificate)
			return this._tryLoadCustomJsonTheme(brandingDomainInfo).then(brandingTheme => {
				let customJsonTheme = (brandingTheme) ? JSON.parse(brandingTheme.jsonTheme) : null
				// customJsonTheme is defined when brandingDomainInfo is defined

				this._brandingDomainField = new TextField("brandingDomain_label", () => {
					if (brandingDomainInfo) {
						return lang.get("certificateExpiryDate_label", {"{date}": formatDateTime(neverNull(brandingDomainInfo.certificateExpiryDate))})
					} else {
						return lang.get("emptyString_msg")
					}
				}).setValue((brandingDomainInfo) ? brandingDomainInfo.domain : lang.get("deactivated_label")).setDisabled()
				let deactivateAction = null
				if (brandingDomainInfo) {
					deactivateAction = new Button("deactivate_action", () => {
						Dialog.confirm("confirmDeactivateBrandingDomain_msg").then(ok => {
							if (ok) {
								showProgressDialog("pleaseWait_msg", BuyDialog.show(BookingItemFeatureType.Branding, 0, 0, false)).then(accepted => {
									if (accepted) {
										showProgressDialog("pleaseWait_msg", worker.deleteCertificate(neverNull(brandingDomainInfo).domain))
									}
								})
							}
						})
					}, () => Icons.Cancel)
				}
				let editAction = new Button("edit_action", () => {
					SetCustomDomainCertificateDialog.show(customerInfo)
				}, () => Icons.Edit)
				this._brandingDomainField._injectionsRight = () => [(deactivateAction) ? m(deactivateAction) : null, m(editAction)]


				let customLogoDefined = customJsonTheme && customJsonTheme.logo
				this._customLogoField = new TextField("customLogo_label", () => lang.get("customLogoInfo_msg")).setValue(lang.get(customLogoDefined ? "activated_label" : "deactivated_label")).setDisabled()
				if (customJsonTheme) {
					let deleteCustomLogo
					if (customLogoDefined) {
						deleteCustomLogo = new Button("deactivate_action", () => {
							Dialog.confirm("confirmDeactivateCustomLogo_msg").then(ok => {
								if (ok) {
									delete neverNull(customJsonTheme).logo
									neverNull(brandingTheme).jsonTheme = JSON.stringify(customJsonTheme)
									update(brandingTheme)
									updateCustomTheme(customJsonTheme)
								}
							})
						}, () => Icons.Cancel)
					}

					let chooseLogoButton = new Button("edit_action", () => {
						fileController.showFileChooser(false).then(files => {
							let extension = files[0].name.toLowerCase().substring(files[0].name.lastIndexOf(".") + 1)
							if (files[0].size > MAX_LOGO_SIZE || !contains(ALLOWED_FILE_TYPES, extension)) {
								Dialog.error("customLogoInfo_msg")
							} else {
								let imageData = "<img src=\"data:image/" + ((extension == "jpeg") ? "jpg" : extension) + ";base64," + uint8ArrayToBase64(files[0].data) + "\">"
								neverNull(customJsonTheme).logo = imageData
								neverNull(brandingTheme).jsonTheme = JSON.stringify(customJsonTheme)
								update(brandingTheme)
								updateCustomTheme(customJsonTheme)
								this._customLogoField.setValue(lang.get("activated_label"))
								m.redraw()
							}
						})
					}, () => Icons.Edit)

					this._customLogoField._injectionsRight = () => [(deleteCustomLogo) ? m(deleteCustomLogo) : null, m(chooseLogoButton)]
				}

				let customColorsDefined = this._areCustomColorsDefined(customJsonTheme)
				this._customColorsField = new TextField("customColors_label", null).setValue((customColorsDefined) ? lang.get("activated_label") : lang.get("deactivated_label")).setDisabled()
				if (customJsonTheme) {
					let deactivateColorTheme
					if (customColorsDefined) {
						deactivateColorTheme = new Button("deactivate_action", () => {
							Dialog.confirm("confirmDeactivateCustomColors_msg").then(ok => {
								if (ok) {
									Object.keys(neverNull(customJsonTheme)).forEach(key => {
										if (key != "logo") {
											delete neverNull(customJsonTheme)[key]
										}
									})
									neverNull(brandingTheme).jsonTheme = JSON.stringify(customJsonTheme)
									update(brandingTheme)
									updateCustomTheme(customJsonTheme)
								}
							})
						}, () => Icons.Cancel)
					}

					let editCustomColorButton = new Button("edit_action", () => EditCustomColorsDialog.show(neverNull(brandingTheme), neverNull(customJsonTheme),), () => Icons.Edit)

					this._customColorsField._injectionsRight = () => [(deactivateColorTheme) ? m(deactivateColorTheme) : null, m(editCustomColorButton)]
				}

				let customMetaTagsDefined = brandingTheme ? brandingTheme.metaTags.length > 0 : false
				this._customMetaTagsField = new TextField("customMetaTags_label", null).setValue(customMetaTagsDefined ? lang.get("activated_label") : lang.get("deactivated_label")).setDisabled()
				if (brandingTheme) {
					let editCustomMetaTagsButton = new Button("edit_action", () => {
						let metaTags = new TextField("customMetaTags_label")
							.setValue(neverNull(brandingTheme).metaTags)
							.setType(Type.Area)
						let dialog = Dialog.smallActionDialog(lang.get("customMetaTags_label"), {
							view: () => m(metaTags)
						}, (ok) => {
							if (ok) {
								neverNull(brandingTheme).metaTags = metaTags.value()
								update(brandingTheme)
								dialog.close()
							}
						})
					}, () => Icons.Edit)
					this._customMetaTagsField._injectionsRight = () => m(editCustomMetaTagsButton)
				}

				m.redraw()
			})
		})
	}

	_areCustomColorsDefined(theme: ?Theme): boolean {
		if (theme) {
			return Object.keys(theme).find(key => key != "logo" && neverNull(theme)[key]) != null
		} else {
			return false
		}
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, CustomerInfoTypeRef) && operation == OperationType.UPDATE) {
			this._customerInfo.reset()
			this._updateFields()
		} else if (isSameTypeRef(typeRef, BrandingThemeTypeRef) && operation == OperationType.UPDATE) {
			this._updateFields()
		}
	}
}