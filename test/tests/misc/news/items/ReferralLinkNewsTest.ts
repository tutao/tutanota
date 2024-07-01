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

	o("ReferralLinkNews not shown if account is not old enough", async function () {
		when(userController.isGlobalAdmin()).thenReturn(true)
		when(dateProvider.now()).thenReturn(getDayShifted(new Date(0), 6).getTime())
		o(await referralLinkNews.isShown()).equals(false)
	})

	o("ReferralLinkNews shown if account is old enough", async function () {
		when(userController.isGlobalAdmin()).thenReturn(true)
		when(dateProvider.now()).thenReturn(getDayShifted(new Date(0), 7).getTime())
		o(await referralLinkNews.isShown()).equals(true)
	})

	o("ReferralLinkNews not shown if account is not old admin", async function () {
		when(userController.isGlobalAdmin()).thenReturn(false)
		when(dateProvider.now()).thenReturn(getDayShifted(new Date(0), 7).getTime())
		o(await referralLinkNews.isShown()).equals(false)
	})
})
