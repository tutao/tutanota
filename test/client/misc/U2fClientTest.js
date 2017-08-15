// @flow
import o from "ospec/ospec.js"
import {U2fClient} from "../../../src/misc/U2fClient"
import {base64UrlToBase64, base64ToUint8Array} from "../../../src/api/common/utils/Encoding"

o.spec("U2fClientTest", function () {

	o("testDecodeRegisterResponse", function () {
		let u2f = new U2fClient();
		// test data can be extracted from the yubico java impl (compile 'com.yubico:u2flib-server-core:0.16.0')
		let registerResponse = u2f._decodeRegisterResponse({
			clientData: "dummy",
			registrationData: "BQRUb_WfRhQCbhg3taktvpvtHOlGaPvaLiHUBrL71JpLzMvK4V_U9Q4cwKNdhtscM3g7VkszTDudEZ_8oOnoY1BRQMdjkqXu2j1WUjPtc0pFU8PeQd3FSIPk3RF663RhtUuVFp94mRogR2O7opbkQXumPOouLbriKZqIPebdbcVTn2kwggJDMIIBLaADAgECAgQX8O1GMAsGCSqGSIb3DQEBCzAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowKTEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgNDAxNjY1MzUwMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQ-o66R9AJgeKoH6g3FI_WXmvdxUFy__TAreJbnl45E32rKCLQMy2nnKllZs1VfZX136Ff_pQLhUr2BB0C69RpaM7MDkwIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjIwEwYLKwYBBAGC5RwCAQEEBAMCBDAwCwYJKoZIhvcNAQELA4IBAQAvwnBqkckkOuQ35S9TJNDHSuAqdwQwRJbeF4KBDEG3ZNHdb1AcS5GL1FfzCGIiCAYVpMvaQZShExivRC204PlK7yj4zLCFds0eF7U6GH9h6JNxZnLXGcXBACk653kzkHBn7LvLIps4U--50K2w0gBQu5HM-B1ev_XXc0MDD4WWwlsY1SdL_w_OFQ-jo5uWCD_surmS-Iqcu5VlZntWzPdIpSeFznGGj7dpGzB676fQsQOizggEB0ikWmur8SqijlrNcMFAlvq0eNAzWNRDCu78b6ad1anwrAEKcanqQDrh4BbEPel9P_Gs6Ft94HYPxkfLFPFeaMJdwASMeXdV8SYVMEUCIEstAWacptwmD8f7_nN0mxag92DBFL4MjlizGmvdTpbYAiEAsb38FNfO4o1Du6Hz0H2zgZACgFSyDxXS8O1fOxSr1m4"
		})
		o(Array.from(registerResponse.userPublicKey)).deepEquals(Array.from(base64ToUint8Array(base64UrlToBase64("BFRv9Z9GFAJuGDe1qS2-m-0c6UZo-9ouIdQGsvvUmkvMy8rhX9T1DhzAo12G2xwzeDtWSzNMO50Rn_yg6ehjUFE"))))
		o(Array.from(registerResponse.keyHandle)).deepEquals(Array.from(base64ToUint8Array(base64UrlToBase64("x2OSpe7aPVZSM-1zSkVTw95B3cVIg-TdEXrrdGG1S5UWn3iZGiBHY7uiluRBe6Y86i4tuuIpmog95t1txVOfaQ"))))

	})

})

