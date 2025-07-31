import { locator } from "../../api/main/CommonLocator.js"
import { AvailablePlanType, NewBusinessPlans, PaymentMethodType, PlanType, PlanTypeToName } from "../../api/common/TutanotaConstants.js"
import { PaymentInterval, PaymentIntervalToName } from "../PriceUtils.js"

export enum SignupFlowStage {
	TRIGGER,
	SELECT_PLAN,
	CREATE_ACCOUNT,
	SELECT_PAYMENT_METHOD,
	CONFIRM_PAYMENT,
}

export abstract class SignupFlowUsageTestController {
	private static readonly USAGE_TEST_NAME = "signup.flow"

	public static invalidateUsageTest() {
		if (locator.logins.isUserLoggedIn()) return
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)
		usageTest.invalidateTest()
	}

	public static deletePing(stage: SignupFlowStage) {
		if (locator.logins.isUserLoggedIn()) return
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)
		void usageTest.getStage(stage.valueOf()).deletePing()
	}

	public static initSignupFlowUsageTest() {
		if (locator.logins.isUserLoggedIn()) return
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)
		void usageTest.getStage(SignupFlowStage.TRIGGER).complete()
	}

	public static getUsageTestVariant(): number {
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)
		return usageTest.variant
	}

	public static completeStage(targetStage: SignupFlowStage, plan: PlanType, interval: PaymentInterval, paymentMethod?: PaymentMethodType) {
		if (locator.logins.isUserLoggedIn()) return
		const usageTest = locator.usageTestController.getTest(this.USAGE_TEST_NAME)

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

		void stage.complete()
	}

	private static paymentMethodTypeToString(input: PaymentMethodType): string {
		const record: Record<string, string> = {
			"0": "Invoice",
			"1": "Credit_Card",
			"3": "PayPal",
		}

		return record[input] ?? "Other"
	}
}
