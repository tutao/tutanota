import o from "@tutao/otest"
import { DateProvider } from "../../../../../src/common/api/common/DateProvider.js"
import { NewsModel } from "../../../../../src/common/misc/news/NewsModel.js"
import { object, replace, when } from "testdouble"
import { ReferralLinkViewer } from "../../../../../src/common/misc/news/items/ReferralLinkViewer.js"
import { getDayShifted } from "@tutao/tutanota-utils"
import { ReferralLinkNews } from "../../../../../src/common/misc/news/items/ReferralLinkNews.js"
import { timestampToGeneratedId } from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { UserController } from "../../../../../src/common/api/main/UserController.js"
import { Customer, User } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { initCommonLocator } from "../../../../../src/common/api/main/CommonLocator.js"
import { IMailLocator } from "../../../../../src/mail-app/mailLocator.js"

o.spec("ReferralLinkNews", function () {
	let dateProvider: DateProvider
	let newsModel: NewsModel
	let referralViewModel: ReferralLinkViewer
	let referralLinkNews: ReferralLinkNews
	let userController: UserController
	let locator: IMailLocator = object()
	let domainConfig: DomainConfig = {
		firstPartyDomain: true,
		partneredDomainTransitionUrl: "https://test.tutanota.com",
		apiUrl: "https://app.test.tuta.com",
		paymentUrl: "https://pay.test.tutanota.com/braintree.html",
		webauthnUrl: "https://app.test.tuta.com/webauthn",
		legacyWebauthnUrl: "https://test.tutanota.com/webauthn",
		webauthnMobileUrl: "https://app.test.tuta.com/webauthnmobile",
		legacyWebauthnMobileUrl: "https://test.tutanota.com/webauthnmobile",
		webauthnRpId: "tuta.com",
		u2fAppId: "https://app.test.tuta.com/u2f-appid.json",
		giftCardBaseUrl: "https://app.test.tuta.com/giftcard",
		referralBaseUrl: "https://app.test.tuta.com/signup",
		websiteBaseUrl: "https://tuta.com",
	}

	o.beforeEach(function () {
		initCommonLocator(locator)
		dateProvider = object()
		newsModel = object()
		referralViewModel = object()
		userController = object()
		const user: User = object()
		const customer: Customer = object()

		replace(userController, "user", user)
		replace(user, "customer", timestampToGeneratedId(0))
		replace(customer, "referralCode", "referralCodeId")
		when(userController.loadCustomer()).thenResolve(customer)

		referralLinkNews = new ReferralLinkNews(newsModel, dateProvider, userController)
	})

	o("ReferralLinkNews not shown if account is not old enough", async function () {
		when(locator.domainConfigProvider()).thenReturn({
			getCurrentDomainConfig: () => domainConfig,
		})

		when(userController.isGlobalAdmin()).thenReturn(true)
		when(dateProvider.now()).thenReturn(getDayShifted(new Date(0), 6).getTime())
		o(await referralLinkNews.isShown()).equals(false)
	})

	o("ReferralLinkNews shown if account is old enough", async function () {
		when(locator.domainConfigProvider()).thenReturn({
			getCurrentDomainConfig: () => domainConfig,
		})

		when(userController.isGlobalAdmin()).thenReturn(true)
		when(dateProvider.now()).thenReturn(getDayShifted(new Date(0), 7).getTime())
		o(await referralLinkNews.isShown()).equals(true)
	})

	o("ReferralLinkNews not shown if account is not old admin", async function () {
		when(locator.domainConfigProvider()).thenReturn({
			getCurrentDomainConfig: () => domainConfig,
		})

		when(userController.isGlobalAdmin()).thenReturn(false)
		when(dateProvider.now()).thenReturn(getDayShifted(new Date(0), 7).getTime())
		o(await referralLinkNews.isShown()).equals(false)
	})
})
