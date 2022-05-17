import o from "ospec"
import {UserFacade} from "../../../../../src/api/worker/facades/UserFacade.js"
import {User} from "../../../../../src/api/entities/sys/TypeRefs.js"

o.spec("UserFacadeTest", function () {
	o("a fresh UserFacade doesn't think it's logged or partially logged in", function () {
		const facade = new UserFacade()
		o(facade.isPartiallyLoggedIn()).equals(false)
		o(facade.isFullyLoggedIn()).equals(false)
	})

	o("a user facade doesn't think it's logged in after receiving an accessToken but no user or groupKeys", function () {
		const facade = new UserFacade()
		facade.setAccessToken("hello.")
		o(facade.isPartiallyLoggedIn()).equals(false)
		o(facade.isFullyLoggedIn()).equals(false)
	})

	o("a user facade doesn't think it's logged in fully after receiving a user but no groupKeys", function () {
		const facade = new UserFacade()
		facade.setAccessToken("hello.")
		facade.setUser({} as User)
		o(facade.isPartiallyLoggedIn()).equals(true)
		o(facade.isFullyLoggedIn()).equals(false)
	})
})