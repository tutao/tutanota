import { LoginController } from "../api/main/LoginController"
import { RouteResolver } from "mithril"
import { CredentialFormatMigrator } from "../misc/credentials/CredentialFormatMigrator"
import { ProgrammingError } from "@tutao/app-env"
import { SignupView, SignupViewAttrs, SignupViewModel } from "./SignupView"
import { UsageTestModel } from "../misc/UsageTestModel"
import { UsageTestController } from "@tutao/usagetests"
import { identity } from "@tutao/utils"
import { MakeViewResolver } from "../app-common"

type SignupViewRouteCache = { viewModel: SignupViewModel; usageTestModel: UsageTestModel; usageTestController: UsageTestController }

/**
 * once the old signup dialog is removed, this proxy can be replaced by the resolver in the "new signup"
 * branch of its onmatch method.
 */
export function makeSignupViewResolver(
	makeViewResolver: MakeViewResolver,
	credentialFormatMigrator: () => Promise<CredentialFormatMigrator>,
	logins: LoginController,
	usageTestModel: UsageTestModel,
	usageTestController: UsageTestController,
): RouteResolver {
	let actualResolver: RouteResolver | null = null
	return {
		async onmatch(...args) {
			if (actualResolver == null) {
				// new signup
				actualResolver = makeViewResolver<SignupViewAttrs, SignupView, SignupViewRouteCache>(
					{
						prepareRoute: async () => {
							const { SignupView, SignupViewModel } = await import("./SignupView")
							const migrator = await credentialFormatMigrator()
							await migrator.migrate()
							return {
								component: SignupView,
								cache: {
									viewModel: new SignupViewModel(),
									usageTestModel,
									usageTestController,
								},
							}
						},
						prepareAttrs: identity,
						requireLogin: false,
					},
					logins,
				)
			}
			return actualResolver.onmatch?.(...args)
		},
		render(...args) {
			if (actualResolver == null) {
				throw new ProgrammingError("render called before onmatch?")
			}
			return actualResolver.render?.(...args)
		},
	}
}
