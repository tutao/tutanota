import { locator } from "../../api/main/CommonLocator.js"
import { AvailablePlanType, NewBusinessPlans, PaymentMethodType, PlanType, PlanTypeToName } from "../../api/common/TutanotaConstants.js"
import { PaymentInterval, PaymentIntervalToName } from "../PriceUtils.js"

type MetricName = "plan" | "paymentMethod"

export enum SignupFlowStage {
	TRIGGER,
	SELECT_PLAN,
	CREATE_ACCOUNT,
	SELECT_PAYMENT_METHOD,
	CONFIRM_PAYMENT,
	ABANDONED,
}

export abstract class SignupFlowUsageTestController {
	private static readonly USAGE_TEST_NAME = "signup.flow"
	// private usageTest: UsageTest
	// private static usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)

	public static invalidateUsageTest() {
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)
		usageTest.invalidateTest()
	}

	public static initSignupFlowUsageTest() {
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)
		// void usageTest.getStage(SignupFlowStage.TRIGGER).complete()
		usageTest.meta["currentStage"] = 0
	}

	public static getUsageTestVariant() {
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)
		return usageTest.variant
	}

	public static setSignupFlowStageData(targetStage: SignupFlowStage, plan: PlanType, interval: PaymentInterval, paymentMethod?: PaymentMethodType) {
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)
		usageTest.meta["currentStage"] = targetStage
		// this.currentStage = targetStage

		const stage = usageTest.getStage(targetStage)

		const planName = PlanTypeToName[plan]
		const intervalName = PaymentIntervalToName[interval]
		let planValue
		if (NewBusinessPlans.includes(plan as AvailablePlanType)) planValue = "Business"
		else if (plan === PlanType.Free) planValue = "Free"
		else planValue = `${intervalName}_${planName}`

		stage.setMetric({
			name: "plan",
			value: planValue,
		})
		if (paymentMethod) {
			stage.setMetric({
				name: "paymentMethod",
				value: this.paymentMethodTypeToString(paymentMethod),
			})
		}

		console.log(`Set Data for Stage ${targetStage}. Variant ${this.getUsageTestVariant()}`)
	}

	public static submitUsageTest() {
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)
		if (!usageTest.meta["currentStage"]) return
		for (let i = 0; i <= usageTest.meta["currentStage"]; i++) {
			const stage = usageTest.getStage(i)
			void stage.complete()
		}
	}

	public static abandonUsageTest() {
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)
		usageTest.getStage(SignupFlowStage.ABANDONED).complete()
		this.submitUsageTest()
	}

	private static paymentMethodTypeToString(input: PaymentMethodType) {
		const record: Record<string, string> = {
			"0": "Invoice",
			"1": "Credit_Card",
			"3": "PayPal",
		}

		return record[input] ?? "Other"
	}
}
