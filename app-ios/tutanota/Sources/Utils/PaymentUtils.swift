func formatPlanType(_ plan: String, _ interval: UInt) -> String {
	let intervalString =
		switch interval {
		case 1: "monthly"
		case 12: "yearly"
		default: fatalError("invalid plan (\(plan)) interval (\(interval))")
		}
	let bundleID = Bundle.main.bundleIdentifier!
	let stagingLevelString = (bundleID == "de.tutao.tutanota.test") ? "testplans" : "plans"
	return "\(stagingLevelString).\(plan).\(intervalString)"
}

func productIdToPlanName(_ productId: String) -> String {
	// plans.legend.monthly -> legend
	// plans.revolutionary.yearly -> revolutionary
	String(productId.split(separator: ".")[1])
}
