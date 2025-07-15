import { locator } from "../../api/main/CommonLocator.js"
import { PaymentMethodType, PlanType, PlanTypeToName } from "../../api/common/TutanotaConstants.js"
import { PaymentInterval, PaymentIntervalToName } from "../PriceUtils.js"
import { Stage } from "@tutao/tutanota-usagetests"

const USAGE_TEST_NAME = "signup.flow"

type MetricName = "plan" | "paymentMethod"

export const getSignupFlowTest = () => {
	const usageTest = locator.usageTestController.getTest(USAGE_TEST_NAME)
	const stage = usageTest.getStage(0)
	stage.setMetric({
		name: "variant",
		value: "A",
	})
	void stage.complete()
}

export const abandonUsageTestSession = () => {
	locator.usageTestController.setTestObsolete(USAGE_TEST_NAME)
}

export enum SignupFlowStage {
	TRIGGER,
	SELECT_PLAN,
	CREATE_ACCOUNT,
	SELECT_PAYMENT_METHOD,
	CONFIRM_PAYMENT,
}

export const invalidateUsageTest = () => {
	const usageTest = locator.usageTestController.getTest(USAGE_TEST_NAME)
	usageTest.invalidateTest()
}

export const initSignupFlowUsageTest = () => {
	const usageTest = locator.usageTestController.getTest(USAGE_TEST_NAME)
	void usageTest.getStage(SignupFlowStage.TRIGGER).complete()
}

export const getUsageTestVariant = () => {
	const usageTest = locator.usageTestController.getTest(USAGE_TEST_NAME)
	return usageTest.variant
}

export const completeSignupFlowStage = (targetStage: SignupFlowStage, plan: PlanType, interval: PaymentInterval, paymentMethod?: PaymentMethodType) => {
	const usageTest = locator.usageTestController.getTest(USAGE_TEST_NAME)
	const stage = usageTest.getStage(targetStage)

	const planName = PlanTypeToName[plan]
	const intervalName = PaymentIntervalToName[interval]
	const planValue = `${planName}_${intervalName}`
	stage.setMetric({
		name: "plan",
		value: planValue,
	})
	if (paymentMethod) {
		stage.setMetric({
			name: "paymentMethod",
			value: paymentMethodTypeToString(paymentMethod),
		})
	}
	void stage.complete()
}

const paymentMethodTypeToString = (input: PaymentMethodType) => {
	const record: Record<string, string> = {
		"0": "Invoice",
		"1": "Credit_Card",
		"3": "PayPal",
	}

	return record[input] ?? "Other"
}
