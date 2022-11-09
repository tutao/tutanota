import o from "ospec"
import {hasAllFeaturesInPlan} from "../../../src/subscription/SubscriptionUtils.js"
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
		o(hasAllFeaturesInPlan(currentSubscription, currentSubscription))
			.equals(true)("identical properties match")

        o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {orderNbrOfAliases: 0})))
			.equals(true)("more orderNbrOfAliases in current -> match")
		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {orderNbrOfAliases: 10})))
			.equals(true)("less orderNbrOfAliases in current -> match")

		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {storageGb: 10})))
			.equals(false)("less storage in current -> doesn't match")
		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {nbrOfAliases: 15})))
			.equals(false)("less aliases in current -> doesn't match")

		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {storageGb: 0})))
			.equals(true)("more storage in current -> match")
		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {nbrOfAliases: 2})))
			.equals(true)("more aliases in current ->  match")


		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {business: true})))
			.equals(false)("business feature in config, but not current")
		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {sharing: true})))
			.equals(false)("sharing feature in config, but not current")
		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {whitelabel: true})))
			.equals(false)("whitelabel feature in config, but not current")

		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {business: false})))
			.equals(true)("business feature in current, but not config")
		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {sharing: false})))
			.equals(true)("sharing feature in current, but not config")
		o(hasAllFeaturesInPlan(currentSubscription, Object.assign({}, currentSubscription, {whitelabel: false})))
			.equals(true)("whitelabel feature in current, but not config")
    })
})