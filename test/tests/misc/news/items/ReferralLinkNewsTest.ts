import o from "ospec"
import { DateProvider } from "../../../../../src/api/common/DateProvider.js"
import { NewsModel } from "../../../../../src/misc/news/NewsModel.js"
import { object, replace, when } from "testdouble"
import { ReferralLinkViewer } from "../../../../../src/misc/news/items/ReferralLinkViewer.js"
import { getDayShifted } from "@tutao/tutanota-utils"
import { ReferralLinkNews } from "../../../../../src/misc/news/items/ReferralLinkNews.js"
import { timestampToGeneratedId } from "../../../../../src/api/common/utils/EntityUtils.js"
import { UserController } from "../../../../../src/api/main/UserController.js"
import { Customer, User } from "../../../../../src/api/entities/sys/TypeRefs.js"

o.spec("ReferralLinkNews", function () {
	let dateProvider: DateProvider
	let newsModel: NewsModel
	let referralViewModel: ReferralLinkViewer
	let referralLinkNews: ReferralLinkNews
	let userController: UserController

	o.beforeEach(function () {
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

	o("ReferralLinkNews not shown if account is not old enough", function () {
		when(userController.isGlobalAdmin()).thenReturn(true)
		when(dateProvider.now()).thenReturn(getDayShifted(new Date(0), 6).getTime())
		o(referralLinkNews.isShown()).equals(false)
	})

	o("ReferralLinkNews shown if account is old enough", function () {
		when(userController.isGlobalAdmin()).thenReturn(true)
		when(dateProvider.now()).thenReturn(getDayShifted(new Date(0), 7).getTime())
		o(referralLinkNews.isShown()).equals(true)
	})

	o("ReferralLinkNews not shown if account is not old admin", function () {
		when(userController.isGlobalAdmin()).thenReturn(false)
		when(dateProvider.now()).thenReturn(getDayShifted(new Date(0), 7).getTime())
		o(referralLinkNews.isShown()).equals(false)
	})
})
