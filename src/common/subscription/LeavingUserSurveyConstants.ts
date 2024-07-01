import { TranslationKey } from "../misc/LanguageViewModel.js"

/**
 * File containing all types, enums, maps and helper functions for the 'leaving user survey' wizard.
 */

// Version number for the correct questions/options. Increment this when changing the dropdown options below!
export const SURVEY_VERSION_NUMBER: string = "0"

export enum CategoryType {
	Price = "0",
	Account = "1",
	Feature = "2",
	Problem = "3",
	Other = "4",
}

/**
 * Casts a NumberString to the CategoryType Enum.
 */
export function getCategoryType(category: NumberString) {
	return <CategoryType>category
}

export type CategoryImageInfo = {
	image: string
	translationKey: TranslationKey
}

/**
 * Map from CategoryType to an object containing the image and info text that will be displayed on the second page of the wizard.
 */
export const CATEGORY_TO_IMAGE: Map<CategoryType, CategoryImageInfo> = new Map([
	[CategoryType.Price, { image: "price", translationKey: "surveyPrice_label" }],
	[CategoryType.Account, { image: "account", translationKey: "surveyAccountProblems_label" }],
	[CategoryType.Feature, { image: "feature", translationKey: "surveyMissingFeature_label" }],
	[CategoryType.Problem, { image: "problem", translationKey: "surveyFeatureDesignProblems_label" }],
	[CategoryType.Other, { image: "other", translationKey: "surveyOtherReason_label" }],
])

export type Reason = {
	value: NumberString
	translationKey: TranslationKey
}

/**
 * Map from CategoryType to an object containing DropdownItems for the dropdown on the second page of the wizard.
 */
export const CATEGORY_TO_REASON: Map<CategoryType, Reason[]> = new Map([
	[
		CategoryType.Price,
		[
			{ value: "0", translationKey: "surveyPriceReasonPaidFeatures_label" },
			{ value: "1", translationKey: "surveyPriceReasonTooExpensive_label" },
			{ value: "2", translationKey: "surveyPriceReasonPricesTooHigh_label" },
			{ value: "3", translationKey: "surveyPriceReasonStudentDiscount_label" },
			{ value: "4", translationKey: "surveyPriceReasonFamilyDiscount_label" },
			{ value: "5", translationKey: "surveyPriceReasonAutoRenewal_label" },
			{ value: "6", translationKey: "surveyPriceReasonPaymentNotWorking_label" },
			{ value: "7", translationKey: "surveyOtherReasonProvideDetails_label" },
		],
	],
	[
		CategoryType.Account,
		[
			{ value: "8", translationKey: "surveyAccountReasonAccountApproval_label" },
			{ value: "9", translationKey: "surveyAccountReasonSupportNoHelp_label" },
			{ value: "10", translationKey: "surveyAccountReasonForgotPassword_label" },
			{ value: "11", translationKey: "surveyAccountReasonForgotRecoveryCode_label" },
			{ value: "12", translationKey: "surveyAccountReasonCantAddUsers_label" },
			{ value: "13", translationKey: "surveyAccountReasonServicesBlocked_label" },
			{ value: "14", translationKey: "surveyAccountReasonAccountBlocked_label" },
			{ value: "15", translationKey: "surveyOtherReasonProvideDetails_label" },
		],
	],
	[
		CategoryType.Feature,
		[
			{ value: "16", translationKey: "surveyFeatureReasonNoIMAP_label" },
			{ value: "17", translationKey: "surveyFeatureReasonNoEmailImport_label" },
			{ value: "18", translationKey: "surveyFeatureReasonNoAdjustableColumns_label" },
			{ value: "19", translationKey: "surveyFeatureReasonNoEmailLabels_label" },
			{ value: "20", translationKey: "surveyFeatureReasonMoreFormattingOptions_label" },
			{ value: "21", translationKey: "surveyFeatureReasonAutoForward_label" },
			{ value: "22", translationKey: "surveyFeatureReasonCloudStorage_label" },
			{ value: "23", translationKey: "surveyFeatureReasonEmailTranslations_label" },
			{ value: "24", translationKey: "surveyFeatureReasonOther_label" },
		],
	],
	[
		CategoryType.Problem,
		[
			{ value: "25", translationKey: "surveyProblemReasonSearch_label" },
			{ value: "26", translationKey: "surveyProblemReasonCalendar_label" },
			{ value: "27", translationKey: "surveyProblemReasonThemeCustomization_label" },
			{ value: "28", translationKey: "surveyProblemReasonSpamProtection_label" },
			{ value: "29", translationKey: "surveyProblemReasonAppAppearance_label" },
			{ value: "30", translationKey: "surveyProblemReasonTooHardToUse_label" },
		],
	],
	[
		CategoryType.Other,
		[
			{ value: "31", translationKey: "surveyOtherReasonWrongEmailAddress_label" },
			{ value: "32", translationKey: "surveyOtherReasonMergeAccounts_label" },
			{ value: "33", translationKey: "surveyOtherReasonProvideDetails_label" },
		],
	],
])
