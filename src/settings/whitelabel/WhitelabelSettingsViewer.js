// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/common/Env"
import {LazyLoaded} from "../../api/common/utils/LazyLoaded"
import type {Customer} from "../../api/entities/sys/Customer"
import {CustomerTypeRef} from "../../api/entities/sys/Customer"
import {load, loadRange, serviceRequest} from "../../api/main/Entity"
import {downcast, getCustomMailDomains, getWhitelabelDomain, neverNull, noOp} from "../../api/common/utils/Utils"
import type {CustomerInfo} from "../../api/entities/sys/CustomerInfo"
import {CustomerInfoTypeRef} from "../../api/entities/sys/CustomerInfo"
import {logins} from "../../api/main/LoginController"
import {lang} from "../../misc/LanguageViewModel"
import {FeatureType, OperationType} from "../../api/common/TutanotaConstants"
import {HttpMethod} from "../../api/common/EntityFunctions"
import type {WhitelabelConfig} from "../../api/entities/sys/WhitelabelConfig"
import {WhitelabelConfigTypeRef} from "../../api/entities/sys/WhitelabelConfig"
import {progressIcon} from "../../gui/base/Icon"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import type {Booking} from "../../api/entities/sys/Booking"
import {BookingTypeRef} from "../../api/entities/sys/Booking"
import type {EntityUpdateData} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import type {CustomerProperties} from "../../api/entities/sys/CustomerProperties"
import {CustomerPropertiesTypeRef} from "../../api/entities/sys/CustomerProperties"
import * as EditNotificationEmailDialog from "../EditNotificationEmailDialog"
import {showBuyOrSetNotificationEmailDialog} from "../EditNotificationEmailDialog"
import {isWhitelabelActive} from "../../subscription/SubscriptionUtils"
import {SysService} from "../../api/entities/sys/Services"
import {BrandingDomainGetReturnTypeRef} from "../../api/entities/sys/BrandingDomainGetReturn"
import type {DomainInfo} from "../../api/entities/sys/DomainInfo"
import type {NotificationMailTemplate} from "../../api/entities/sys/NotificationMailTemplate"
import type {CertificateInfo} from "../../api/entities/sys/CertificateInfo"
import {GENERATED_MAX_ID} from "../../api/common/utils/EntityUtils"
import {WhitelabelBrandingDomainSettings} from "./WhitelabelBrandingDomainSettings"
import {WhitelabelThemeSettings} from "./WhitelabelThemeSettings"
import type {WhitelabelImprintAndPrivacySettingsAttrs} from "./WhitelabelImprintAndPrivacySettings"
import {WhitelabelImprintAndPrivacySettings} from "./WhitelabelImprintAndPrivacySettings"
import {WhitelabelRegistrationSettings} from "./WhitelabelRegistrationSettings"
import {createStringWrapper} from "../../api/entities/sys/StringWrapper"
import {WhitelabelCustomMetaTagsSettings} from "./WhitelabelCustomMetaTagsSettings"
import {WhitelabelStatusSettings} from "./WhitelabelStatusSettings"
import {WhitelabelNotificationEmailSettings} from "./WhitelabelNotificationEmailSettings"
import type {GermanLanguageCode} from "./WhitelabelGermanLanguageFileSettings"
import {WhitelabelGermanLanguageFileSettings} from "./WhitelabelGermanLanguageFileSettings"
import type {UpdatableSettingsViewer} from "../SettingsView"
import {promiseMap} from "../../api/common/utils/PromiseUtils"
import type {ThemeCustomizations} from "../../misc/WhitelabelCustomizations"
import {EntityClient} from "../../api/common/EntityClient"

assertMainOrNode()


export class WhitelabelSettingsViewer implements UpdatableSettingsViewer {
	view: Function;

	_whitelabelConfig: ?WhitelabelConfig
	_certificateInfo: ?CertificateInfo
	_whitelabelDomainInfo: ?DomainInfo
	_customJsonTheme: ?ThemeCustomizations

	_customer: LazyLoaded<Customer>;
	_customerInfo: LazyLoaded<CustomerInfo>;
	_customerProperties: LazyLoaded<CustomerProperties>;
	_lastBooking: ?Booking;
	_entityClient: EntityClient;

	constructor(entityClient: EntityClient) {
		this.view = this.view.bind(this)
		this._entityClient = entityClient

		this._customer = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		})

		this._customerInfo = new LazyLoaded(() => {
			return this._customer.getAsync().then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		})

		this._customerProperties = new LazyLoaded(() =>
			this._customer.getAsync().then((customer) => load(CustomerPropertiesTypeRef, neverNull(customer.properties))))

		this._lastBooking = null

		this._updateFields()
	}

	view(vnode: Vnode<any>): Children {
		const brandingDomainConfig = this._renderBrandingDomainConfig()

		return m("#global-settings.fill-absolute.scroll.plr-l", (brandingDomainConfig)
			?
			[
				m(".h4.mt-l", lang.get('whitelabel_label')),
				m(".small", lang.get("whitelabelDomainLinkInfo_msg") + " "),
				m("small.text-break", [
						m(
							`a[href=${lang.getInfoLink("whitelabel_link")}][target=_blank]`,
							lang.getInfoLink("whitelabel_link"))
					]
				),
				this._renderWhitelabelStatusSettings(),
				this._renderNotificationEmailSettings(),
				m(".h4.mt-l", lang.get('whitelabelDomain_label')),
				brandingDomainConfig,
				this._renderThemeSettings(),
				this._renderCustomMetaTagsSettings(),
				this._renderImprintAndPrivacySettings(),
				this._renderDefaultGermanLanguageFileSettings(),
				this._renderWhitelabelRegistrationSettings(),
				m(".mb-l")
			]
			: [m(".flex-center.items-center.button-height.mt-l", progressIcon())]
		)
	}

	_renderImprintAndPrivacySettings(): Children {
		const whitelabelConfig = this._whitelabelConfig
		const privacyStatementUrl = whitelabelConfig?.privacyStatementUrl ?? ""
		let onPrivacyStatementUrlChanged = null
		if (whitelabelConfig) {
			onPrivacyStatementUrlChanged = (privacyStatementUrl) => {
				whitelabelConfig.privacyStatementUrl = privacyStatementUrl
				this._entityClient.update(whitelabelConfig)
			}
		}

		const imprintUrl = whitelabelConfig?.imprintUrl ?? ""
		let onImprintUrlChanged = null
		if (whitelabelConfig) {
			onImprintUrlChanged = (imprintUrl) => {
				whitelabelConfig.imprintUrl = imprintUrl
				this._entityClient.update(whitelabelConfig)
			}
		}

		const whitelabelImprintAndPrivacySettingsAttrs: WhitelabelImprintAndPrivacySettingsAttrs = {
			privacyStatementUrl,
			onPrivacyStatementUrlChanged,
			imprintUrl,
			onImprintUrlChanged,
		}

		return m(WhitelabelImprintAndPrivacySettings, whitelabelImprintAndPrivacySettingsAttrs)
	}

	_renderThemeSettings(): Children {
		const customTheme = this._customJsonTheme
		const whitelabelConfig = this._whitelabelConfig
		const whitelabelDomainInfo = this._whitelabelDomainInfo

		const whitelabelThemeSettingsAttrs = {
			whitelabelData: whitelabelConfig && whitelabelDomainInfo && customTheme
				? {
					customTheme,
					whitelabelConfig,
					whitelabelDomainInfo
				}
				: null
		}

		return m(WhitelabelThemeSettings, whitelabelThemeSettingsAttrs)
	}

	_renderWhitelabelRegistrationSettings(): Children {
		if (!this._isWhitelabelRegistrationVisible()) return null

		const possibleRegistrationDomains = [{name: lang.get("deactivated_label"), value: null}]
			.concat(getCustomMailDomains(this._customerInfo.getLoaded())
				.map(d => {
					return {name: d.domain, value: d.domain}
				}))
		let onRegistrationDomainSelected = noOp
		let currentRegistrationDomain = null
		if (this._whitelabelConfig) {
			onRegistrationDomainSelected = (domain) => {
				neverNull(this._whitelabelConfig).whitelabelRegistrationDomains.length = 0
				if (domain) {
					const domainWrapper = createStringWrapper()
					domainWrapper.value = domain
					neverNull(this._whitelabelConfig).whitelabelRegistrationDomains.push(domainWrapper)
				}
				this._entityClient.update(neverNull(this._whitelabelConfig))
			}
			if ((this._whitelabelConfig.whitelabelRegistrationDomains.length > 0)) {
				currentRegistrationDomain = this._whitelabelConfig.whitelabelRegistrationDomains[0].value
			}
		}

		const whitelabelCode = (this._whitelabelConfig) ? this._whitelabelConfig.whitelabelCode : ""
		let onWhitelabelCodeChanged = noOp
		if (this._whitelabelConfig) {
			onWhitelabelCodeChanged = (code) => {
				neverNull(this._whitelabelConfig).whitelabelCode = code
				this._entityClient.update(neverNull(this._whitelabelConfig))
			}
		}

		const whitelabelRegistrationSettingsAttrs = {
			whitelabelCode,
			onWhitelabelCodeChanged,
			possibleRegistrationDomains,
			currentRegistrationDomain,
			onRegistrationDomainSelected,
		}

		return m(WhitelabelRegistrationSettings, whitelabelRegistrationSettingsAttrs)
	}

	_renderDefaultGermanLanguageFileSettings(): Children {
		if (!this._whitelabelConfig) return null
		if (!lang.code === 'de' && !lang.code === 'de_sie') return null

		const customGermanLanguageFile: ?GermanLanguageCode = downcast(this._whitelabelConfig.germanLanguageCode)
		const onGermanLanguageFileChanged = (languageFile: GermanLanguageCode) => {
			if (languageFile) {
				neverNull(this._whitelabelConfig).germanLanguageCode = languageFile
				this._entityClient.update(neverNull(this._whitelabelConfig))
				lang.setLanguage({code: languageFile, languageTag: lang.languageTag})
			}
		}

		const whitelabelGermanLanguageFileSettingsAttrs = {
			customGermanLanguageFile,
			onGermanLanguageFileChanged,
		}

		return m(WhitelabelGermanLanguageFileSettings, whitelabelGermanLanguageFileSettingsAttrs)
	}

	_renderCustomMetaTagsSettings(): Children {
		let metaTags = ""
		let onMetaTagsChanged = null

		if (this._whitelabelConfig) {
			metaTags = this._whitelabelConfig.metaTags
			onMetaTagsChanged = (metaTags) => {
				neverNull(this._whitelabelConfig).metaTags = metaTags
				this._entityClient.update(neverNull(this._whitelabelConfig))
			}
		}

		const whitelabelCustomMetaTagsSettingsAttrs = {
			metaTags,
			onMetaTagsChanged
		}

		return m(WhitelabelCustomMetaTagsSettings, whitelabelCustomMetaTagsSettingsAttrs)
	}

	_renderWhitelabelStatusSettings(): Children {
		const whitelabelActive = isWhitelabelActive(this._lastBooking)

		const whitelabelStatusSettingsAttrs = {
			isWhitelabelActive: whitelabelActive
		}

		return m(WhitelabelStatusSettings, whitelabelStatusSettingsAttrs)
	}

	_renderBrandingDomainConfig(): Children {
		const customerInfo = this._customerInfo.getSync()
		if (!customerInfo) return null
		const certificateInfo = this._certificateInfo

		const isWhitelabelFeatureEnabled = isWhitelabelActive(this._lastBooking)

		const whitelabelDomain = (this._whitelabelDomainInfo) ? this._whitelabelDomainInfo.domain : ""

		const whitelabelBrandingDomainSettingsAttrs = {
			customerInfo,
			isWhitelabelFeatureEnabled,
			certificateInfo,
			whitelabelDomain,
		}
		return m(WhitelabelBrandingDomainSettings, whitelabelBrandingDomainSettingsAttrs)
	}

	_isWhitelabelRegistrationVisible(): boolean {
		return this._customer.isLoaded() &&
			this._customer.getLoaded().customizations.find(c => c.feature === FeatureType.WhitelabelParent) != null &&
			this._customerInfo.isLoaded() &&
			getWhitelabelDomain(this._customerInfo.getLoaded()) != null
	}

	_tryLoadWhitelabelConfig(domainInfo: ? DomainInfo): Promise<? {whitelabelConfig: WhitelabelConfig, certificateInfo: CertificateInfo}> {
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

	_updateFields(): Promise<void> {
		return this._customerInfo.getAsync().then(customerInfo => {
				this._whitelabelDomainInfo = getWhitelabelDomain(customerInfo, null)
				return this._tryLoadWhitelabelConfig(this._whitelabelDomainInfo).then(data => {
					this._whitelabelConfig = data && data.whitelabelConfig
					this._certificateInfo = data && data.certificateInfo
					return loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
						.then(bookings => {
							this._lastBooking = bookings.length === 1 ? bookings[0] : null
							this._customJsonTheme = (this._whitelabelConfig) ? JSON.parse(this._whitelabelConfig.jsonTheme) : null
							m.redraw()
							this._customerProperties.getAsync().then(m.redraw)
						})
				})
			}
		)
	}

	_renderNotificationEmailSettings(): Children {
		const customerProperties = this._customerProperties.getSync()
		if (!customerProperties) return null

		const notificationMailTemplates = customerProperties.notificationMailTemplates

		const onAddTemplate = () => {
			showBuyOrSetNotificationEmailDialog(this._lastBooking, this._customerProperties)
		}

		const onEditTemplate = (template) => {
			EditNotificationEmailDialog.show(template, this._customerProperties)
		}

		const onRemoveTemplate = (template) => {
			this._removeNotificationMailTemplate(template)
		}

		const whitelabelNotificationEmailSettingsAttrs = {
			notificationMailTemplates,
			onAddTemplate,
			onEditTemplate,
			onRemoveTemplate,
		}

		return m(WhitelabelNotificationEmailSettings, whitelabelNotificationEmailSettingsAttrs)
	}

	_removeNotificationMailTemplate(template: NotificationMailTemplate) {
		showProgressDialog("pleaseWait_msg", this._customerProperties.getAsync().then((customerProps) => {
			const index = customerProps.notificationMailTemplates.findIndex((t) => t.language === template.language)
			if (index !== -1) {
				customerProps.notificationMailTemplates.splice(index, 1)
				this._entityClient.update(customerProps)
			}
		}))
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(CustomerTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._customer.reset()
				return this._customer.getAsync().then(() => m.redraw())
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._customerInfo.reset()
				return this._updateFields()
			} else if (isUpdateForTypeRef(WhitelabelConfigTypeRef, update) && update.operation === OperationType.UPDATE) {
				return this._updateFields()
			} else if (isUpdateForTypeRef(CustomerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._customerProperties.reset()
				return this._updateFields()
			} else if (isUpdateForTypeRef(BookingTypeRef, update)) {
				return this._updateFields()
			}
		}).then(noOp)
	}
}