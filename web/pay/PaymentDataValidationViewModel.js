/**
 * Created by bdeterding on 29.06.15.
 */


tutao.tutanota.pay.PaymentDataValidationViewModel = function(){
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);


    /**
     * card type from braintree fieldStateChanged event
     * {
     *      type : String // "visa", "discover",  "master-card",  "american-express"
     *      niceType: String // "Visa Discover",  "MasterCard",  "American Express"
     *      code : {
     *          name: String // "CVV",  "CID",  "CVC"
     *          size: Integer // 3 or 4
     *      }
     *      lengths;  [] // An array of integers of expected lengths of the card number*
     * }
     */
    this._creditCardType = ko.observable(null);

    this._paypalToken = ko.observable(null);

    this._inputFieldStates = {
         "number" : ko.observable("neutral"),
         "cvv" : ko.observable("neutral"),
         "expirationDate" : ko.observable("neutral")
    };
    this._parentWindowName = null;
    this._paymentType = ko.observable(null);
    this.loading = ko.observable(true);
    this.busy = ko.observable(false);
    this.siteLoadingErrorStatus = ko.observable(null);
};


tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.init = function(){
    if ( window.opener){
        window.addEventListener("message", this._receiveMessage, false);
        window.opener.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_FORM_READY , "*");
    } else {
        this.loading = ko.observable(false);
        this.siteLoadingErrorStatus(tutao.lang("invalidPageLoad_msg"));
    }
};


tutao.tutanota.pay.PaymentDataValidationViewModel.prototype._closeWindow = function(){
    window.close();
    if (this._parentWindowName != null) {
        window.open("", this._parentWindowName);
    }
};


tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.cancel = function(){
    if (this.busy()){
        return;
    }
    this._closeWindow();
};


/**
 * Message handler to receive messages from parent window. Expects clientToken, windowName and paymentMethod
 * @param event
 * @private
 */
tutao.tutanota.pay.PaymentDataValidationViewModel.prototype._receiveMessage = function(event) {
    var parts = event.data.split(":");
    if (parts.length == 2 && parts[0] == tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_CLIENT_TOKEN) {
        var clientToken = parts[1];
        console.log("client token received: " + clientToken);
        this._handleClientToken(clientToken);
    } else  if (parts.length == 2 && parts[0] == tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_WINDOW_NAME) {
        console.log(event);
        var windowName = parts[1];
        console.log("window name received: " + windowName);
        this._parentWindowName = windowName;
    } else  if (parts.length == 2 && parts[0] == tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_METHOD) {
        console.log(event);
        this._paymentType(parts[1]);
    }
};

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.getSecurityCodeStatus = function() {
    if (this._creditCardType() != null){
        return  tutao.lang('creditCardCVVFormatDetails_label', { "{1}":this._creditCardType().code.size, "{2}": this._creditCardType().code.name, "{3}": this._creditCardType().niceType });
    } else {
        return tutao.lang('creditCardCVVFormat_label');
    }
};


tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.getSubmitStatus = function(){

    if( this.busy() ){
        return {type: "neutral",  text: "save_msg"};
    } else if ( this._inputFieldStates.number() == "invalid" ){
        return { type: "invalid", text: "creditCardNumberInvalid_msg" }
    } else if (this._inputFieldStates.cvv() == "invalid"){
        return { type: "invalid", text: "creditCardCVVInvalid_msg"};
    } else if (this._inputFieldStates.expirationDate() == "invalid"){
        return {type: "invalid",  text: "creditCardExprationDateInvalid_msg"};
    } else if ( this._inputFieldStates.number() == "valid" &&  this._inputFieldStates.cvv() == "valid" && this._inputFieldStates.expirationDate() == "valid") {
        return {type: "valid", text: "emptyString_msg"};
    }else {
        return {type: "neutral",  text: "emptyString_msg"};
    }
};


tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.isSubmitEnabled = function(){
    return this.getSubmitStatus().type == "valid";
};

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.isCreditCardFormEnabled = function(){
    return !this.loading() && this.siteLoadingErrorStatus() == null && this._paymentType() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD;
};

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.isPayPalFormEnabled = function(){
    return !this.loading() && this.siteLoadingErrorStatus() == null && this._paymentType() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_PAY_PAL;
};

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.getPayPalFormTitle = function(){
    return this.isSubmitPayPalDataEnabled() ? "paymentDataPayPalConfirm_msg" : "paymentDataPayPalLogin_msg";
};

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.submitClicked = function(){
    this.busy(true);
};

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.isSubmitPayPalDataEnabled = function(){
    return this._paypalToken() != null && this._paypalToken().type == "PayPalAccount";
};

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype.submitPayPalData = function(){
    if ( !this.isSubmitPayPalDataEnabled()){
        return;
    }
    this.busy(true);

    var token = this._paypalToken().nonce;
    var paymentMethod = tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_PAY_PAL;
    var paymentMethodInfo = this._paypalToken().details.email;
    window.opener.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_TOKEN + ":" + token + ":" + paymentMethod +":" + paymentMethodInfo, "*");
    this._closeWindow();
};


/**
 * Converts the current language in the correct format for the PayPal checkout form.
 * @returns {string} current language in supported PayPal format.
 * @private
 */
tutao.tutanota.pay.PaymentDataValidationViewModel.prototype._getCurrentLanguage = function(){
    var currentLanguage = tutao.locator.languageViewModel.getCurrentLanguage();
    var items = currentLanguage.split("_");
    if ( items.length >0){
        return items[0] + "_" + items[0];
    } else {
        return "en_en";
    }
};

/**
 * Handle the client token and set up the braintree facade.
 * @param clientToken
 * @private
 */
tutao.tutanota.pay.PaymentDataValidationViewModel.prototype._handleClientToken = function(clientToken){
    var self = this;
    if ( this._paymentType() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD){
        braintree.setup(clientToken, "custom", {
            id: "creditCardPaymentDataForm",
            hostedFields: {
                number: {
                    selector: "#paymentCreditCardNumber"
                },
                cvv: {
                    selector: "#paymentCreditCardCVV"
                },
                expirationDate: {
                    selector: "#paymentCreditCardExpirationDate"
                },
                styles: {
                    "input": {
                        "font-family":' "Source Sans Pro", "Trebuchet MS", Helvetica, sans-serif',
                        "font-size": "18px"
                    }
                },
                onFieldEvent: self._handleFieldEvent
            },
            onPaymentMethodReceived: self._handlePaymentToken,
            onReady: self._onReady,
            onError: self._onError
        });
    }
    else if (this._paymentType() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_PAY_PAL){
        braintree.setup(clientToken, "paypal", {
            container: "paymentPaypalContainer",
            singleUse: false,
            enableShippingAddress: false,
            enableBillingAddress: false,
            onReady: self._onReady,
            onPaymentMethodReceived: self._handlePaymentToken,
            locale: self._getCurrentLanguage(),
            onUnsupported: self._onUnsupported,
            onCancelled: self._onCancelPayPalForm,
        });
    } else {
        this.loading = ko.observable(false);
        this.siteLoadingErrorStatus(tutao.lang("invalidPageLoad_msg"));
    }
};




/**
 * Callback functions for braintree.setup()
 */

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype._handlePaymentToken = function(paymentToken){
    if ( "PayPalAccount" == paymentToken.type) {
        this._paypalToken(paymentToken);
    } else if ("CreditCard" == paymentToken.type) {
        var token = paymentToken.nonce;
        var paymentMethod = tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD;
        var paymentMethodInfo =  paymentToken.details.cardType + " " + "******" + paymentToken.details.lastTwo;
        window.opener.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_TOKEN + ":" + token + ":" + paymentMethod +":" + paymentMethodInfo, "*");
        this._closeWindow();
    }
};

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype._handleFieldEvent = function(event){
    if (event.type === "focus") {
        // Handle focus
    } else if (event.type === "blur") {
        // Handle blur
    } else if (event.type === "fieldStateChange") {
        console.log(event);
        // check if the associated input is fully qualified for submission
        var fieldKey = event.target.fieldKey;

        if (event.isValid) {
            this._inputFieldStates[fieldKey]("valid");
        } else if (event.isEmpty) {
            this._inputFieldStates[fieldKey]("neutral");
        } else {
            this._inputFieldStates[fieldKey]("invalid");
        }

        // Handle a change in validation or card type
        if (event.card) {
            this._creditCardType(event.card);
        } else {
            this._creditCardType(null);
        }
    }
};


tutao.tutanota.pay.PaymentDataValidationViewModel.prototype._onReady = function() {
    console.log("onReady");
    if ( tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_PAY_PAL == this._paymentType() ) {
        document.getElementById('braintree-paypal-button').click();
    }
    this.loading(false);
};

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype._onError = function(error) {
    this.loading(false);
    if (error.message){
        this.siteLoadingErrorStatus(error.message);
    }else {
        this.siteLoadingErrorStatus(tutao.lang("invalidPageLoad_msg"));
    }
};


tutao.tutanota.pay.PaymentDataValidationViewModel.prototype._onCancelPayPalForm = function() {
    this._paypalToken(null);
};

tutao.tutanota.pay.PaymentDataValidationViewModel.prototype._onUnsupported = function() {
    this.loading(false);
    this.siteLoadingErrorStatus(tutao.lang("invalidPageLoadUnsupported_msg") );
};




