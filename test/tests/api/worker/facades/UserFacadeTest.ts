import o from "ospec"
import {UserFacade} from "../../../../../src/api/worker/facades/UserFacade.js"
import {User} from "../../../../../src/api/entities/sys/TypeRefs.js"

o.spec("UserFacadeTest", function () {
	o("a UserFacade doesn't think it's logged in before getting groupKeys", function () {
		const facade = new UserFacade()
		o(facade.isFullyLoggedIn()).equals(false)
		facade.setAccessToken("hello.")
		facade.setUser({} as User)
		o(facade.isPartiallyLoggedIn()).equals(true)
		o(facade.isFullyLoggedIn()).equals(false)
	})
})