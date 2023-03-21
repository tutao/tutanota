import m, { Children } from "mithril"
import { assertMainOrNode } from "../../api/common/Env"
import { clear, downcast, LazyLoaded, neverNull, noOp, promiseMap } from "@tutao/tutanota-utils"
import type {
	Booking,
	CertificateInfo,
	Customer,
	CustomerInfo,
	CustomerProperties,
	DomainInfo,
	NotificationMailTemplate,
	WhitelabelConfig,
} from "../../api/entities/sys/TypeRefs.js"
import {
	BookingTypeRef,
	createStringWrapper,
	CustomerInfoTypeRef,
	CustomerPropertiesTypeRef,
	CustomerTypeRef,
	WhitelabelConfigTypeRef,
} from "../../api/entities/sys/TypeRefs.js"
import { getCustomMailDomains, getWhitelabelDomain } from "../../api/common/utils/Utils"
import { InfoLink, lang } from "../../misc/LanguageViewModel"
import { FeatureType, OperationType } from "../../api/common/TutanotaConstants"
import { progressIcon } from "../../gui/base/Icon"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import type { EntityUpdateData } from "../../api/main/EventController"
import { isUpdateForTypeRef } from "../../api/main/EventController"
import * as EditNotificationEmailDialog from "../EditNotificationEmailDialog"
import { showBuyOrSetNotificationEmailDialog } from "../EditNotificationEmailDialog"
import { isWhitelabelActive } from "../../subscription/SubscriptionUtils"
import { GENERATED_MAX_ID } from "../../api/common/utils/EntityUtils"
import { WhitelabelBrandingDomainSettings } from "./WhitelabelBrandingDomainSettings"
import { WhitelabelThemeSettings } from "./WhitelabelThemeSettings"
import { WhitelabelImprintAndPrivacySettings } from "./WhitelabelImprintAndPrivacySettings"
import { WhitelabelRegistrationSettings, WhitelabelRegistrationSettingsAttrs } from "./WhitelabelRegistrationSettings"
import { WhitelabelCustomMetaTagsSettings, WhitelabelCustomMetaTagsSettingsAttrs } from "./WhitelabelCustomMetaTagsSettings"
import { WhitelabelStatusSettings } from "./WhitelabelStatusSettings"
import { WhitelabelNotificationEmailSettings } from "./WhitelabelNotificationEmailSettings"
import type { GermanLanguageCode } from "./WhitelabelGermanLanguageFileSettings"
import { WhitelabelGermanLanguageFileSettings } from "./WhitelabelGermanLanguageFileSettings"
import type { UpdatableSettingsViewer } from "../SettingsView"
import type { ThemeCustomizations } from "../../misc/WhitelabelCustomizations"
import { getThemeCustomizations } from "../../misc/WhitelabelCustomizations"
import { EntityClient } from "../../api/common/EntityClient"
import { locator } from "../../api/main/MainLocator"
import { SelectorItem, SelectorItemList } from "../../gui/base/DropDownSelector.js"
import { BrandingDomainService } from "../../api/entities/sys/Services"
import { LoginController } from "../../api/main/LoginController.js"

assertMainOrNode()

export class WhitelabelSettingsViewer implements UpdatableSettingsViewer {
	private _whitelabelConfig: WhitelabelConfig | null = null
	private _certificateInfo: CertificateInfo | null = null
	private _whitelabelDomainInfo: DomainInfo | null = null
	private _customJsonTheme: ThemeCustomizations | null = null
	private _customer: LazyLoaded<Customer>
	private _customerInfo: LazyLoaded<CustomerInfo>
	private _customerProperties: LazyLoaded<CustomerProperties>
	private _lastBooking: Booking | null
	private _entityClient: EntityClient
	private _logins: LoginController

	constructor(entityClient: EntityClient, logins: LoginController) {
		this.view = this.view.bind(this)
		this._entityClient = entityClient
		this._logins = logins
		this._customer = new LazyLoaded(() => {
			return locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		})
		this._customerInfo = new LazyLoaded(() => {
			return this._customer.getAsync().then((customer) => locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo))
		})
		this._customerProperties = new LazyLoaded(() =>
			this._customer.getAsync().then((customer) => locator.entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties))),
		)
		this._lastBooking = null

		this._updateFields()
	}

	view(): Children {
		const brandingDomainConfig = this._renderBrandingDomainConfig()

		return m(
			"#global-settings.fill-absolute.scroll.plr-l",
			brandingDomainConfig
				? [
						m(".h4.mt-l", lang.get("whitelabel_label")),
						m(".small", lang.get("whitelabelDomainLinkInfo_msg") + " "),
						m("small.text-break", [m(`a[href=${InfoLink.Whitelabel}][target=_blank]`, InfoLink.Whitelabel)]),
						this._renderWhitelabelStatusSettings(),
						this._renderNotificationEmailSettings(),
						m(".h4.mt-l", lang.get("whitelabelDomain_label")),
						brandingDomainConfig,
						this._renderThemeSettings(),
						this._renderCustomMetaTagsSettings(),
						this._renderImprintAndPrivacySettings(),
						this._renderDefaultGermanLanguageFileSettings(),
						this._renderWhitelabelRegistrationSettings(),
						m(".mb-l"),
				  ]
				: [m(".flex-center.items-center.button-height.mt-l", progressIcon())],
		)
	}

	_renderImprintAndPrivacySettings(): Children {
		const whitelabelConfig = this._whitelabelConfig
		const privacyStatementUrl = whitelabelConfig?.privacyStatementUrl ?? ""
		let onPrivacyStatementUrlChanged: ((_: string) => void) | null = null

		if (whitelabelConfig) {
			onPrivacyStatementUrlChanged = (privacyStatementUrl) => {
				whitelabelConfig.privacyStatementUrl = privacyStatementUrl

				this._entityClient.update(whitelabelConfig)
			}
		}

		const imprintUrl = whitelabelConfig?.imprintUrl ?? ""
		let onImprintUrlChanged: ((_: string) => void) | null = null

		if (whitelabelConfig) {
			onImprintUrlChanged = (imprintUrl) => {
				whitelabelConfig.imprintUrl = imprintUrl

				this._entityClient.update(whitelabelConfig)
			}
		}

		return m(WhitelabelImprintAndPrivacySettings, {
			privacyStatementUrl,
			onPrivacyStatementUrlChanged,
			imprintUrl,
			onImprintUrlChanged,
		})
	}

	_renderThemeSettings(): Children {
		const customTheme = this._customJsonTheme
		const whitelabelConfig = this._whitelabelConfig
		const whitelabelDomainInfo = this._whitelabelDomainInfo
		const whitelabelThemeSettingsAttrs = {
			whitelabelData:
				whitelabelConfig && whitelabelDomainInfo && customTheme
					? {
							customTheme,
							whitelabelConfig,
							whitelabelDomainInfo,
					  }
					: null,
		}
		return m(WhitelabelThemeSettings, whitelabelThemeSettingsAttrs)
	}

	_renderWhitelabelRegistrationSettings(): Children {
		if (!this._isWhitelabelRegistrationVisible()) return null
		const possibleRegistrationDomains: SelectorItemList<string | null> = [
			{
				name: lang.get("deactivated_label"),
				value: null,
			} as SelectorItem<string | null>,
		].concat(
			getCustomMailDomains(this._customerInfo.getLoaded()).map((d) => {
				return {
					name: d.domain,
					value: d.domain,
				}
			}),
		)
		let onRegistrationDomainSelected: WhitelabelRegistrationSettingsAttrs["onRegistrationDomainSelected"] = noOp
		let currentRegistrationDomain: string | null = null

		if (this._whitelabelConfig) {
			onRegistrationDomainSelected = (domain) => {
				clear(neverNull(this._whitelabelConfig).whitelabelRegistrationDomains)

				if (domain) {
					const domainWrapper = createStringWrapper()
					domainWrapper.value = domain
					neverNull(this._whitelabelConfig).whitelabelRegistrationDomains.push(domainWrapper)
				}

				this._entityClient.update(neverNull(this._whitelabelConfig))
			}

			if (this._whitelabelConfig.whitelabelRegistrationDomains.length > 0) {
				currentRegistrationDomain = this._whitelabelConfig.whitelabelRegistrationDomains[0].value
			}
		}

		const whitelabelCode = this._whitelabelConfig ? this._whitelabelConfig.whitelabelCode : ""
		let onWhitelabelCodeChanged: (_: string) => void = noOp

		if (this._whitelabelConfig) {
			onWhitelabelCodeChanged = (code) => {
				neverNull(this._whitelabelConfig).whitelabelCode = code

				this._entityClient.update(neverNull(this._whitelabelConfig))
			}
		}

		return m(WhitelabelRegistrationSettings, {
			whitelabelCode,
			onWhitelabelCodeChanged,
			possibleRegistrationDomains,
			currentRegistrationDomain,
			onRegistrationDomainSelected,
		})
	}

	_renderDefaultGermanLanguageFileSettings(): Children {
		if (!this._whitelabelConfig) return null
		if (lang.code !== "de" && lang.code !== "de_sie") return null
		const customGermanLanguageFile: GermanLanguageCode | null = downcast(this._whitelabelConfig.germanLanguageCode)

		const onGermanLanguageFileChanged = (languageFile: GermanLanguageCode) => {
			if (languageFile) {
				neverNull(this._whitelabelConfig).germanLanguageCode = languageFile

				this._entityClient.update(neverNull(this._whitelabelConfig))

				lang.setLanguage({
					code: languageFile,
					languageTag: lang.languageTag,
				})
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
		let onMetaTagsChanged: WhitelabelCustomMetaTagsSettingsAttrs["onMetaTagsChanged"] | null = null

		if (this._whitelabelConfig) {
			metaTags = this._whitelabelConfig.metaTags

			onMetaTagsChanged = (metaTags) => {
				neverNull(this._whitelabelConfig).metaTags = metaTags

				this._entityClient.update(neverNull(this._whitelabelConfig))
			}
		}

		const whitelabelCustomMetaTagsSettingsAttrs = {
			metaTags,
			onMetaTagsChanged,
		}
		return m(WhitelabelCustomMetaTagsSettings, whitelabelCustomMetaTagsSettingsAttrs)
	}

	_renderWhitelabelStatusSettings(): Children {
		const whitelabelActive = isWhitelabelActive(this._lastBooking)
		const whitelabelStatusSettingsAttrs = {
			isWhitelabelActive: whitelabelActive,
			logins: this._logins,
		}
		return m(WhitelabelStatusSettings, whitelabelStatusSettingsAttrs)
	}

	_renderBrandingDomainConfig(): Children {
		const customerInfo = this._customerInfo.getSync()

		if (!customerInfo) return null
		const certificateInfo = this._certificateInfo
		const isWhitelabelFeatureEnabled = isWhitelabelActive(this._lastBooking)
		const whitelabelDomain = this._whitelabelDomainInfo ? this._whitelabelDomainInfo.domain : ""
		const whitelabelBrandingDomainSettingsAttrs = {
			customerInfo,
			isWhitelabelFeatureEnabled,
			certificateInfo,
			whitelabelDomain,
		}
		return m(WhitelabelBrandingDomainSettings, whitelabelBrandingDomainSettingsAttrs)
	}

	_isWhitelabelRegistrationVisible(): boolean {
		return (
			this._customer.isLoaded() &&
			this._customer.getLoaded().customizations.find((c) => c.feature === FeatureType.WhitelabelParent) != null &&
			this._customerInfo.isLoaded() &&
			getWhitelabelDomain(this._customerInfo.getLoaded()) != null
		)
	}

	_tryLoadWhitelabelConfig(domainInfo: DomainInfo | null): Promise<
		| {
				whitelabelConfig: WhitelabelConfig
				certificateInfo: CertificateInfo
		  }
		| null
		| undefined
	> {
		if (domainInfo && domainInfo.whitelabelConfig) {
			return Promise.all([
				locator.entityClient.load(WhitelabelConfigTypeRef, domainInfo.whitelabelConfig),
				locator.serviceExecutor.get(BrandingDomainService, null).then((response) => neverNull(response.certificateInfo)),
			]).then(([whitelabelConfig, certificateInfo]) => ({
				whitelabelConfig,
				certificateInfo,
			}))
		} else {
			return Promise.resolve(null)
		}
	}

	_updateFields(): Promise<void> {
		return this._customerInfo.getAsync().then((customerInfo) => {
			this._whitelabelDomainInfo = getWhitelabelDomain(customerInfo)
			return this._tryLoadWhitelabelConfig(this._whitelabelDomainInfo).then((data) => {
				this._whitelabelConfig = data?.whitelabelConfig ?? null
				this._certificateInfo = data?.certificateInfo ?? null
				return locator.entityClient.loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true).then((bookings) => {
					this._lastBooking = bookings.length === 1 ? bookings[0] : null
					this._customJsonTheme = this._whitelabelConfig ? getThemeCustomizations(this._whitelabelConfig) : null
					m.redraw()

					this._customerProperties.getAsync().then(m.redraw)
				})
			})
		})
	}

	_renderNotificationEmailSettings(): Children {
		const customerProperties = this._customerProperties.getSync()

		if (!customerProperties) return null
		const notificationMailTemplates = customerProperties.notificationMailTemplates

		const onAddTemplate = () => {
			showBuyOrSetNotificationEmailDialog(this._lastBooking, this._customerProperties)
		}

		const onEditTemplate = (template: NotificationMailTemplate) => {
			EditNotificationEmailDialog.show(template, this._customerProperties)
		}

		const onRemoveTemplate = (template: NotificationMailTemplate) => {
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
		showProgressDialog(
			"pleaseWait_msg",
			this._customerProperties.getAsync().then((customerProps) => {
				const index = customerProps.notificationMailTemplates.findIndex((t) => t.language === template.language)

				if (index !== -1) {
					customerProps.notificationMailTemplates.splice(index, 1)

					this._entityClient.update(customerProps)
				}
			}),
		)
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
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
