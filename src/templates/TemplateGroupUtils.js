// @flow


import type {TemplateGroupRoot} from "../api/entities/tutanota/TemplateGroupRoot"
import {TemplateGroupRootTypeRef} from "../api/entities/tutanota/TemplateGroupRoot"
import {logins} from "../api/main/LoginController"
import {showBusinessFeatureRequiredDialog} from "../misc/SubscriptionDialogs"
import {worker} from "../api/main/WorkerClient"
import {locator} from "../api/main/MainLocator"
import {FeatureType} from "../api/common/TutanotaConstants"
import {isCustomizationEnabledForCustomer} from "../api/common/utils/Utils"

/**
 * @return True if the group has been created.
 */
export function createInitialTemplateListIfAllowed(): Promise<?TemplateGroupRoot> {
	return logins.getUserController().loadCustomer().then(customer => {
		return isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) ||
			showBusinessFeatureRequiredDialog("businessFeatureRequiredTemplates_msg")
	}).then(allowed => {
		if (allowed) {
			return worker.createTemplateGroup("")
		}
	}).then(groupId => {
		if (groupId) {
			return locator.entityClient.load(TemplateGroupRootTypeRef, groupId)
		}
	})
}