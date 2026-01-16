import o from "@tutao/otest"
import { simplifyMailAddress } from "../../../../../src/common/api/worker/facades/lazy/CustomerFacade"

o.spec("CustomerFacadeTest", function () {
	o("simplifyMailAddress", function () {
		o(simplifyMailAddress("hello_there@tuta.io")).equals("hello_there_at_tuta_io")
		o(simplifyMailAddress("hello-there@tutao.de")).equals("hello_there_at_tutao_de")
		o(simplifyMailAddress("dot.dot.dot@blabla.com")).equals("dot_dot_dot_at_blabla_com")
		o(simplifyMailAddress("plus+minus@tutao.de")).equals("plus_minus_at_tutao_de")
		o(simplifyMailAddress("PLUS+MINUS@tutao.de")).equals("PLUS_MINUS_at_tutao_de")
		o(simplifyMailAddress("123hund@blabla.de")).equals("123hund_at_blabla_de")
		o(simplifyMailAddress("has_underscores@mail.mail")).equals("has_underscores_at_mail_mail")
	})
})
