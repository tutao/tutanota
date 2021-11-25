// @flow
import type {SettingsSection, SettingsValue} from "./SettingsModel"
import type {EntityUpdateData} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import type {Booking} from "../../api/entities/sys/Booking"
import {BookingTypeRef} from "../../api/entities/sys/Booking"
import {isWhitelabelActive} from "../../subscription/SubscriptionUtils"
import {LazyLoaded} from "../../api/common/utils/LazyLoaded"
import type {Customer} from "../../api/entities/sys/Customer"
import {CustomerTypeRef} from "../../api/entities/sys/Customer"
import {load, loadRange, serviceRequest, update} from "../../api/main/Entity"
import {assertNotNull, downcast, getCustomMailDomains, getWhitelabelDomain, neverNull, noOp} from "../../api/common/utils/Utils"
import type {CustomerProperties} from "../../api/entities/sys/CustomerProperties"
import {CustomerPropertiesTypeRef} from "../../api/entities/sys/CustomerProperties"
import type {WhitelabelStatusSettingsAttrs} from "../whitelabel/WhitelabelStatusSettings"
import {WhitelabelStatusSettings} from "../whitelabel/WhitelabelStatusSettings"
import type {NotificationMailTemplate} from "../../api/entities/sys/NotificationMailTemplate"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import * as EditNotificationEmailDialog from "../EditNotificationEmailDialog"
import {showBuyOrSetNotificationEmailDialog} from "../EditNotificationEmailDialog"
import type {WhitelabelNotificationEmailSettingsAttrs} from "../whitelabel/WhitelabelNotificationEmailSettings"
import {WhitelabelNotificationEmailSettings} from "../whitelabel/WhitelabelNotificationEmailSettings"
import type {Theme} from "../../gui/theme"
import {themeController} from "../../gui/theme"
import type {WhitelabelConfig} from "../../api/entities/sys/WhitelabelConfig"
import {WhitelabelConfigTypeRef} from "../../api/entities/sys/WhitelabelConfig"
import type {CertificateInfo} from "../../api/entities/sys/CertificateInfo"
import type {DomainInfo} from "../../api/entities/sys/DomainInfo"
import type {WhitelabelThemeSettingsAttrs} from "../whitelabel/WhitelabelThemeSettings"
import {WhitelabelThemeSettings} from "../whitelabel/WhitelabelThemeSettings"
import type {CustomerInfo} from "../../api/entities/sys/CustomerInfo"
import {CustomerInfoTypeRef} from "../../api/entities/sys/CustomerInfo"
import type {WhitelabelBrandingDomainSettingsAttrs} from "../whitelabel/WhitelabelBrandingDomainSettings"
import {WhitelabelBrandingDomainSettings} from "../whitelabel/WhitelabelBrandingDomainSettings"
import type {WhitelabelCustomMetaTagsSettingsAttrs} from "../whitelabel/WhitelabelCustomMetaTagsSettings"
import {WhitelabelCustomMetaTagsSettings} from "../whitelabel/WhitelabelCustomMetaTagsSettings"
import type {WhitelabelImprintAndPrivacySettingsAttrs} from "../whitelabel/WhitelabelImprintAndPrivacySettings"
import {WhitelabelImprintAndPrivacySettings} from "../whitelabel/WhitelabelImprintAndPrivacySettings"
import type {GermanLanguageCode, WhitelabelGermanLanguageFileSettingsAttrs} from "../whitelabel/WhitelabelGermanLanguageFileSettings"
import {WhitelabelGermanLanguageFileSettings} from "../whitelabel/WhitelabelGermanLanguageFileSettings"
import {lang} from "../../misc/LanguageViewModel"
import {createStringWrapper} from "../../api/entities/sys/StringWrapper"
import {FeatureType, OperationType} from "../../api/common/TutanotaConstants"
import type {WhitelabelRegistrationSettingsAttrs} from "../whitelabel/WhitelabelRegistrationSettings"
import {WhitelabelRegistrationSettings} from "../whitelabel/WhitelabelRegistrationSettings"
import type {IUserController} from "../../api/main/UserController"
import {promiseMap} from "../../api/common/utils/PromiseUtils"
import m from "mithril"
import {GENERATED_MAX_ID} from "../../api/common/utils/EntityUtils"
import {SysService} from "../../api/entities/sys/Services"
import {HttpMethod} from "../../api/common/EntityFunctions"
import {BrandingDomainGetReturnTypeRef} from "../../api/entities/sys/BrandingDomainGetReturn"
import {createNotAvailableForFreeClickHandler} from "../../misc/SubscriptionDialogs"
import {showWhitelabelBuyDialog} from "../../subscription/BuyDialog"
import {logins} from "../../api/main/LoginController"
import {Icons} from "../../gui/base/icons/Icons"
import stream from "mithril/stream/stream.js"
import {ButtonN} from "../../gui/base/ButtonN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"

export class WhitelabelSettingsSection implements SettingsSection {
	heading: string
	category: string
	settingsValues: Array<SettingsValue<any>>

	lastBooking: ?Booking = null
	whitelabelActive: boolean
	customer: LazyLoaded<Customer>
	customerInfo: LazyLoaded<CustomerInfo>;
	customerProperties: LazyLoaded<CustomerProperties>
	whitelabelConfig: ?WhitelabelConfig
	certificateInfo: ?CertificateInfo
	whitelabelDomainInfo: ?DomainInfo
	customJsonTheme: ?Theme

	constructor(userController: IUserController) {
		this.heading = "Whitelabel"
		this.category = "Whitelabel"
		this.settingsValues = []

		this.lastBooking = null
		this.whitelabelActive = isWhitelabelActive(this.lastBooking)
		this.customer = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(userController.user.customer))
		})
		this.customerProperties = new LazyLoaded(() =>
			this.customer.getAsync().then((customer) => load(CustomerPropertiesTypeRef, neverNull(customer.properties))))
		this.customerInfo = new LazyLoaded(() => {
			return this.customer.getAsync().then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		})

		this.settingsValues.push(this.createWhitelabelStatusSetting())
		if (this.customerProperties.getSync()) this.settingsValues.push(this.createCustomerPropertiesSetting(assertNotNull(this.customerProperties.getSync())))
		if (this.customerInfo.getSync()) this.settingsValues.push(this.createBrandingSetting(assertNotNull(this.customerInfo.getSync())))
		this.settingsValues.push(this.createThemeSetting())
		this.settingsValues.push(this.createCustomMetaSetting())
		this.settingsValues.push(this.createImprintAndPrivacySetting())
		if (this.whitelabelConfig && lang.code === 'de' && lang.code
			=== 'de_sie') {
			this.settingsValues.push(this.createDefaultGermanFileSetting(this.whitelabelConfig))
		}
		if (this.isWhitelabelRegistrationVisible()) this.settingsValues.push()
	}

	createWhitelabelStatusSetting(): SettingsValue<TextFieldAttrs> {

		const enableWhiteLabelAction = {
			label: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(false,
				() => showWhitelabelBuyDialog(true),
				() => logins.getUserController().isPremiumAccount()),
			icon: () => Icons.Edit,
		}
		const disableWhiteLabelAction = {
			label: "whitelabelDomain_label",
			click: createNotAvailableForFreeClickHandler(false,
				() => showWhitelabelBuyDialog(false),
				() => logins.getUserController().isPremiumAccount()),
			icon: () => Icons.Cancel,
		}

		const value = isWhitelabelActive ? lang.get("active_label") : lang.get("deactivated_label")
		const textFieldAttrs: TextFieldAttrs = {
			label: "state_label",
			value: stream(value),
			helpLabel: () => lang.get("whitelabelDomainLinkInfo_msg") + " " + lang.getInfoLink("whitelabel_link"),
			disabled: true,
			injectionsRight: () => isWhitelabelActive ? m(ButtonN, disableWhiteLabelAction) : m(ButtonN, enableWhiteLabelAction),
		}

		return {
			component: TextFieldN,
			attrs: textFieldAttrs
		}
	}

	createCustomerPropertiesSetting(customerProperties: CustomerProperties): SettingsValue<WhitelabelNotificationEmailSettingsAttrs> {

		const notificationMailTemplates = customerProperties.notificationMailTemplates

		const _removeNotificationMailTemplate = (template: NotificationMailTemplate) => {
			showProgressDialog("pleaseWait_msg", this.customerProperties.getAsync().then((customerProps) => {
				const index = customerProps.notificationMailTemplates.findIndex((t) => t.language === template.language)
				if (index !== -1) {
					customerProps.notificationMailTemplates.splice(index, 1)
					update(customerProps)
				}
			}))
		}

		const onAddTemplate = () => {
			showBuyOrSetNotificationEmailDialog(this.lastBooking, this.customerProperties)
		}

		const onEditTemplate = (template) => {
			EditNotificationEmailDialog.show(template, this.customerProperties)
		}

		const onRemoveTemplate = (template) => {
			_removeNotificationMailTemplate(template)
		}

		const whitelabelNotificationEmailSettingsAttrs = {
			notificationMailTemplates,
			onAddTemplate,
			onEditTemplate,
			onRemoveTemplate,
		}
		return {
			component: WhitelabelNotificationEmailSettings,
			attrs: whitelabelNotificationEmailSettingsAttrs
		}
	}


	createThemeSetting(): SettingsValue<WhitelabelThemeSettingsAttrs> {

		const customTheme = this.customJsonTheme
		const onThemeChanged = (theme) => {
			neverNull(this.whitelabelConfig).jsonTheme = JSON.stringify(theme)
			update(neverNull(this.whitelabelConfig))
			theme.themeId = assertNotNull(this.whitelabelDomainInfo).domain
			// Make sure to not apply it always with realtime color change later
			themeController.updateCustomTheme(theme, false)
		}

		const whitelabelThemeSettingsAttrs = {
			customTheme,
			onThemeChanged,
		}

		return {
			component: WhitelabelThemeSettings,
			attrs: whitelabelThemeSettingsAttrs
		}
	}

	createBrandingSetting(customerInfo: CustomerInfo): SettingsValue<WhitelabelBrandingDomainSettingsAttrs> {

		const certificateInfo = this.certificateInfo

		const isWhitelabelFeatureEnabled = isWhitelabelActive(this.lastBooking)

		const whitelabelDomain = (this.whitelabelDomainInfo) ? this.whitelabelDomainInfo.domain : ""

		const whitelabelBrandingDomainSettingsAttrs = {
			customerInfo,
			isWhitelabelFeatureEnabled,
			certificateInfo,
			whitelabelDomain,
		}

		return {
			component: WhitelabelBrandingDomainSettings,
			attrs: whitelabelBrandingDomainSettingsAttrs
		}
	}

	createCustomMetaSetting(): SettingsValue<WhitelabelCustomMetaTagsSettingsAttrs> {

		let metaTags = ""
		let onMetaTagsChanged = null

		if (this.whitelabelConfig) {
			metaTags = this.whitelabelConfig.metaTags
			onMetaTagsChanged = (metaTags) => {
				neverNull(this.whitelabelConfig).metaTags = metaTags
				update(neverNull(this.whitelabelConfig))
			}
		}

		const whitelabelCustomMetaTagsSettingsAttrs = {
			metaTags,
			onMetaTagsChanged
		}

		return {
			component: WhitelabelCustomMetaTagsSettings,
			attrs: whitelabelCustomMetaTagsSettingsAttrs
		}
	}

	createImprintAndPrivacySetting(): SettingsValue<WhitelabelImprintAndPrivacySettingsAttrs> {
		const whitelabelConfig = this.whitelabelConfig
		const privacyStatementUrl = whitelabelConfig?.privacyStatementUrl ?? ""
		let onPrivacyStatementUrlChanged = null
		if (whitelabelConfig) {
			onPrivacyStatementUrlChanged = (privacyStatementUrl) => {
				whitelabelConfig.privacyStatementUrl = privacyStatementUrl
				update(whitelabelConfig)
			}
		}

		const imprintUrl = whitelabelConfig?.imprintUrl ?? ""
		let onImprintUrlChanged = null
		if (whitelabelConfig) {
			onImprintUrlChanged = (imprintUrl) => {
				whitelabelConfig.imprintUrl = imprintUrl
				update(whitelabelConfig)
			}
		}

		const whitelabelImprintAndPrivacySettingsAttrs: WhitelabelImprintAndPrivacySettingsAttrs = {
			privacyStatementUrl,
			onPrivacyStatementUrlChanged,
			imprintUrl,
			onImprintUrlChanged,
		}

		return {
			component: WhitelabelImprintAndPrivacySettings,
			attrs: whitelabelImprintAndPrivacySettingsAttrs
		}
	}

	createDefaultGermanFileSetting(whitelabelConfig: WhitelabelConfig): SettingsValue<WhitelabelGermanLanguageFileSettingsAttrs> {

		const customGermanLanguageFile: ?GermanLanguageCode = downcast(whitelabelConfig.germanLanguageCode)
		const onGermanLanguageFileChanged = (languageFile: GermanLanguageCode) => {
			if (languageFile) {
				neverNull(this.whitelabelConfig).germanLanguageCode = languageFile
				update(neverNull(this.whitelabelConfig))
				lang.setLanguage({code: languageFile, languageTag: lang.languageTag})
			}
		}

		const whitelabelGermanLanguageFileSettingsAttrs = {
			customGermanLanguageFile,
			onGermanLanguageFileChanged,
		}

		return {
			component: WhitelabelGermanLanguageFileSettings,
			attrs: whitelabelGermanLanguageFileSettingsAttrs
		}

	}

	createWhitelabelRegistrationSetting(): SettingsValue<WhitelabelRegistrationSettingsAttrs> {

		const possibleRegistrationDomains = [{name: lang.get("deactivated_label"), value: null}]
			.concat(getCustomMailDomains(this.customerInfo.getLoaded())
				.map(d => {
					return {name: d.domain, value: d.domain}
				}))
		let onRegistrationDomainSelected = noOp
		let currentRegistrationDomain = null
		if (this.whitelabelConfig) {
			onRegistrationDomainSelected = (domain) => {
				neverNull(this.whitelabelConfig).whitelabelRegistrationDomains.length = 0
				if (domain) {
					const domainWrapper = createStringWrapper()
					domainWrapper.value = domain
					neverNull(this.whitelabelConfig).whitelabelRegistrationDomains.push(domainWrapper)
				}
				update(neverNull(this.whitelabelConfig))
			}
			if ((this.whitelabelConfig.whitelabelRegistrationDomains.length > 0)) {
				currentRegistrationDomain = this.whitelabelConfig.whitelabelRegistrationDomains[0].value
			}
		}

		const whitelabelCode = (this.whitelabelConfig) ? this.whitelabelConfig.whitelabelCode : ""
		let onWhitelabelCodeChanged = noOp
		if (this.whitelabelConfig) {
			onWhitelabelCodeChanged = (code) => {
				neverNull(this.whitelabelConfig).whitelabelCode = code
				update(neverNull(this.whitelabelConfig))
			}
		}

		const whitelabelRegistrationSettingsAttrs = {
			whitelabelCode,
			onWhitelabelCodeChanged,
			possibleRegistrationDomains,
			currentRegistrationDomain,
			onRegistrationDomainSelected,
		}

		return {
			component: WhitelabelRegistrationSettings,
			attrs: whitelabelRegistrationSettingsAttrs
		}
	}

	isWhitelabelRegistrationVisible(): boolean {
		return this.customer.isLoaded() &&
			this.customer.getLoaded().customizations.find(c => c.feature === FeatureType.WhitelabelParent) != null &&
			this.customerInfo.isLoaded() &&
			getWhitelabelDomain(this.customerInfo.getLoaded()) != null
	}

	tryLoadWhitelabelConfig(domainInfo: ? DomainInfo): Promise<? {whitelabelConfig: WhitelabelConfig, certificateInfo: CertificateInfo}> {
		if (domainInfo && domainInfo.whitelabelConfig
		) {
			return Promise.all([
				load(WhitelabelConfigTypeRef, domainInfo.whitelabelConfig),
				serviceRequest(SysService.BrandingDomainService, HttpMethod.GET, null, BrandingDomainGetReturnTypeRef)
					.then((response) => neverNull(response.certificateInfo))
			]).then(([whitelabelConfig, certificateInfo]) => ({whitelabelConfig, certificateInfo}))
		} else {
			return Promise.resolve(null)
		}
	}

	updateFields(): Promise<void> {
		return this.customerInfo.getAsync().then(customerInfo => {
				this.whitelabelDomainInfo = getWhitelabelDomain(customerInfo, null)
				return this.tryLoadWhitelabelConfig(this.whitelabelDomainInfo).then(data => {
					this.whitelabelConfig = data && data.whitelabelConfig
					this.certificateInfo = data && data.certificateInfo
					return loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
						.then(bookings => {
							this.lastBooking = bookings.length === 1 ? bookings[0] : null
							this.customJsonTheme = (this.whitelabelConfig) ? JSON.parse(this.whitelabelConfig.jsonTheme) : null
							m.redraw()
							this.customerProperties.getAsync().then(m.redraw)
						})
				})
			}
		)
	}

	entityEventReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<mixed> {
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(CustomerTypeRef, update) && update.operation === OperationType.UPDATE) {
				this.customer.reset()
				return this.customer.getAsync().then(() => m.redraw())
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update) && update.operation === OperationType.UPDATE) {
				this.customerInfo.reset()
				return this.updateFields()
			} else if (isUpdateForTypeRef(WhitelabelConfigTypeRef, update) && update.operation === OperationType.UPDATE) {
				return this.updateFields()
			} else if (isUpdateForTypeRef(CustomerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				this.customerProperties.reset()
				return this.updateFields()
			} else if (isUpdateForTypeRef(BookingTypeRef, update)) {
				return this.updateFields()
			}
		}).then(noOp)
	}
}