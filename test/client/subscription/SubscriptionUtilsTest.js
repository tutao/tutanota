// @flow
import o from "ospec"
import {hasAllFeaturesInPlan, subscriptions, SubscriptionType} from "../../../src/subscription/SubscriptionUtils"

o.spec("subscription utils hasAllFeaturesInPlan", function () {
	o("hasAllFeaturesInPlan Premium", function () {

		const currentSubscription = {
			nbrOfAliases: 5,
			orderNbrOfAliases: 5,
			storageGb: 1,
			orderStorageGb: 1,
			sharing: false,
			business: false,
			whitelabel: false,
		}
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Premium])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.PremiumBusiness])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Teams])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.TeamsBusiness])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Pro])).equals(false)
	})

	o("hasAllFeaturesInPlan Premium Business", function () {

		const currentSubscription = {
			nbrOfAliases: 5,
			orderNbrOfAliases: 5,
			storageGb: 1,
			orderStorageGb: 1,
			sharing: false,
			business: true,
			whitelabel: false,
		}
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Premium])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.PremiumBusiness])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Teams])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.TeamsBusiness])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Pro])).equals(false)
	})

	o("hasAllFeaturesInPlan Teams", function () {

		const currentSubscription = {
			nbrOfAliases: 5,
			orderNbrOfAliases: 5,
			storageGb: 10,
			orderStorageGb: 10,
			sharing: true,
			business: false,
			whitelabel: false,
		}
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Premium])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.PremiumBusiness])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Teams])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.TeamsBusiness])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Pro])).equals(false)
	})

	o("hasAllFeaturesInPlan Teams Business", function () {

		const currentSubscription = {
			nbrOfAliases: 5,
			orderNbrOfAliases: 5,
			storageGb: 10,
			orderStorageGb: 10,
			sharing: true,
			business: true,
			whitelabel: false,
		}
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Premium])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.PremiumBusiness])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Teams])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.TeamsBusiness])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Pro])).equals(false)
	})

	o("hasAllFeaturesInPlan Pro", function () {

		const currentSubscription = {
			nbrOfAliases: 20,
			orderNbrOfAliases: 20,
			storageGb: 10,
			orderStorageGb: 10,
			sharing: true,
			business: true,
			whitelabel: true,
		}
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Premium])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.PremiumBusiness])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Teams])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.TeamsBusiness])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Pro])).equals(true)
	})

	o("hasAllFeaturesInPlan Teams with additional aliases", function () {

		const currentSubscription = {
			nbrOfAliases: 100,
			orderNbrOfAliases: 100,
			storageGb: 10,
			orderStorageGb: 10,
			sharing: true,
			business: false,
			whitelabel: false,
		}
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Premium])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.PremiumBusiness])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Teams])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.TeamsBusiness])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Pro])).equals(false)
	})

	o("hasAllFeaturesInPlan Teams Business with additional aliases", function () {

		const currentSubscription = {
			nbrOfAliases: 100,
			orderNbrOfAliases: 100,
			storageGb: 10,
			orderStorageGb: 10,
			sharing: true,
			business: true,
			whitelabel: false,
		}
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Premium])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.PremiumBusiness])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Teams])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.TeamsBusiness])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Pro])).equals(false)
	})

	o("hasAllFeaturesInPlan Premium with sharing", function () {

		const currentSubscription = {
			nbrOfAliases: 5,
			orderNbrOfAliases: 5,
			storageGb: 1,
			orderStorageGb: 1,
			sharing: true,
			business: false,
			whitelabel: false,
		}
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Premium])).equals(true)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.PremiumBusiness])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Teams])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.TeamsBusiness])).equals(false)
		o(hasAllFeaturesInPlan(currentSubscription, subscriptions[SubscriptionType.Pro])).equals(false)
	})
})