/**
 * Created by bdeterding on 29.06.15.
 */


tutao.tutanota.pay.CreditCardValidationViewModel = function(){
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

    this._inputFieldStates = {
         "number" : ko.observable("neutral"),
         "cvv" : ko.observable("neutral"),
         "expirationDate" : ko.observable("neutral")
    };
    this._parentWindowName = null;
    this._paymentType = ko.observable(null);
    this.loading = ko.observable(true);
    this.busy = ko.observable(false);
};


tutao.tutanota.pay.CreditCardValidationViewModel.prototype.init = function(){
    window.addEventListener("message", this._receiveMessage, false);
    window.opener.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_FORM_READY , "*");
};



tutao.tutanota.pay.CreditCardValidationViewModel.prototype._handlePaymentToken = function(paymentToken){
    window.opener.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_TOKEN + ":" + paymentToken.nonce, "*");
    window.opener.postMessage(tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_METHOD_DETAILS + ":" + paymentToken.details.cardType + " " + "******" + paymentToken.details.lastTwo, "*");
    this._closeWindow();
};

tutao.tutanota.pay.CreditCardValidationViewModel.prototype._closeWindow = function(){
    window.close();
    if (this._parentWindowName != null) {
        window.open("", this._parentWindowName);
    }
};


tutao.tutanota.pay.CreditCardValidationViewModel.prototype.cancel = function(){
    if (this.busy()){
        return;
    }
    this._closeWindow();
};


tutao.tutanota.pay.CreditCardValidationViewModel.prototype._onPaymentMethodReceived = function(paymentMethod) {
    console.log(paymentMethod);
    this._handlePaymentToken(paymentMethod);
};

tutao.tutanota.pay.CreditCardValidationViewModel.prototype._onReady = function() {
    console.log("onReady");
    this.loading(false);
};

tutao.tutanota.pay.CreditCardValidationViewModel.prototype._onError = function(type, message) {
    console.log(type, message);
};

tutao.tutanota.pay.CreditCardValidationViewModel.prototype._receiveMessage = function(event) {
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
    } else  if (parts.length == 2 && parts[0] == tutao.entity.tutanota.TutanotaConstants.PAYMENT_MESSAGE_PAYMENT_TYPE) {
        console.log(event);
        this._paymentType(parts[1]);
    }
};


tutao.tutanota.pay.CreditCardValidationViewModel.prototype._handleClientToken = function(clientToken){
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
            onPaymentMethodReceived: self._onPaymentMethodReceived,
            onReady: self._onReady,
            onError: self._onError
        });
    }
};


tutao.tutanota.pay.CreditCardValidationViewModel.prototype._handleFieldEvent = function(event){
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



tutao.tutanota.pay.CreditCardValidationViewModel.prototype.getSecurityCodeStatus = function() {
    if (this._creditCardType() != null){
        return  tutao.lang('creditCardCVVFormatDetails_label', { "{1}":this._creditCardType().code.size, "{2}": this._creditCardType().code.name, "{3}": this._creditCardType().niceType });
    } else {
        return tutao.lang('creditCardCVVFormat_label');
    }
};


tutao.tutanota.pay.CreditCardValidationViewModel.prototype.getSubmitStatus = function(){
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

tutao.tutanota.pay.CreditCardValidationViewModel.prototype.isSubmitEnabled = function(){
    return this.getSubmitStatus().type == "valid";
};

tutao.tutanota.pay.CreditCardValidationViewModel.prototype.isCreditCardFormEnabled = function(){
    return !this.loading() && (this._paymentType() == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD);
};

tutao.tutanota.pay.CreditCardValidationViewModel.prototype.submitClicked = function(){
    this.busy(true);
};




