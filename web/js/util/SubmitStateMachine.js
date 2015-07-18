"use strict";

tutao.provide('tutao.tutanota.util.SubmitStateMachine');

/**
 * A state machine that covers all common handling for form editing by a user in a view.
 * Defines the following states which can be checked, e.g. entering() and set, e.g. entering(true):
 * loading
 * entering (with sub-states inputValid and inputInvalid)
 * submitting
 * success
 * failure
 *
 * Use as follows:
 * Create state machine in your view model: "this.state = new tutao.tutanota.util.SubmitStateMachine()";
 * Keep in loading state (initial state) as long as some initial loading is needed before the form can be edited. Call "state.entering(true)" afterwards.
 * If the submit button record status shall show a message if one of the input fields is invalid, call "state.setInputInvalidMessageListener(listener)" with a function that returns null if all input is valid and returns an error message (id) if any input is invalid.
 * Set enable bindings for all input fields to "state.entering".
 * Set the disabled binding of the submit button to "!state.submitEnabled()".
 * In the submit button function check that "state.submitEnabled()" is true.
 * Call "state.submitting(true)" before submitting. Call "setSubmittingMessage(message)" with a submit message (id) if the default message 'save_msg' shall be replaced.
 * Call "state.success(true)" if the submit was successful. Call "setSuccessMessage(message)" with a success message (id) if the default message 'saved_msg' shall be replaced.
 * Call "state.failure(true)" if the submit was not successful. Call "setFailureMessage(message)" with a failure message (id) if the default message 'unknownError_msg' shall be replaced.
 * Set the lang binding of the submit button record status to "state.submitStatus().text" and the css binding to "state.submitStatus().type".
 * @param {boolean=} allowEnteringWhenFailure When true goes into both failure and entering state at failure.
 */
tutao.tutanota.util.SubmitStateMachine = function(allowEnteringWhenFailure) {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this._allowEnteringWhenFailure = (allowEnteringWhenFailure == undefined) ? false : allowEnteringWhenFailure;
	this._state = ko.observable("loading");

    this._inputInvalidMessageListener = function() { return null; }; // default function that says the input is valid

    this._submittingMessage = ko.observable("save_msg");
    this._successMessage = "saved_msg";
    this._failureMessage = "unknownError_msg";

    this.loading = this._createStateObservable("loading");
    this.entering = this._createStateObservable("entering");
    this.submitting = this._createStateObservable("submitting");
    this.success = this._createStateObservable("success");
    this.failure = this._createStateObservable("failure");

    this.submitEnabled = ko.computed(function() {
        // only allow entering, but not failure+allowEnteringWhenFailure
        return this._state() == "entering" && !this._inputInvalidMessageListener();
    }, this);

    this.cancelEnabled = ko.computed(function() {
        // allow entering and failure+allowEnteringWhenFailure
        return this.loading() || this.entering();
    }, this);

    this.submitStatus = ko.computed(function() {
        if (this._state() == "entering") {
            var inputInvalidMessage = this._inputInvalidMessageListener();
            if (inputInvalidMessage) {
                return {type: "invalid", text: inputInvalidMessage};
            } else {
                return {type: "neutral", text: "emptyString_msg"};
            }
        } else if (this._state() == "submitting") {
            return {type: "neutral", text: this._submittingMessage()};
        } else if (this._state() == "success") {
            return {type: "valid", text: this._successMessage};
        } else if (this._state() == "failure") {
            return {type: "invalid", text: this._failureMessage};
        } else {
            return {type: "neutral", text: "emptyString_msg"};
        }
    }, this);
};

tutao.tutanota.util.SubmitStateMachine.prototype._createStateObservable = function(name) {
    var self = this;
    return ko.computed({
        read: function () {
            if (self._allowEnteringWhenFailure && this._state() == "failure" && name == "entering") {
                return true;
            } else {
                return this._state() == name;
            }
        },
        write: function (value) {
            if (!value) {
                throw new Error("false is not allowed");
            }
            this._state(name);
        },
        owner: this
    });
};

/**
 * Set the function that specifies the sub-state of "entering" and the corresponding error message that shall be shown as saveButtonMessage.
 * @param {function():string} listener Function that returns an error message in case the input is invalid and returns null if the input is valid.
 */
tutao.tutanota.util.SubmitStateMachine.prototype.setInputInvalidMessageListener = function(listener) {
    this._inputInvalidMessageListener = listener;
};

tutao.tutanota.util.SubmitStateMachine.prototype.setSubmittingMessage = function(message) {
    this._submittingMessage(message);
};

tutao.tutanota.util.SubmitStateMachine.prototype.setSuccessMessage = function(message) {
    this._successMessage = message;
};

tutao.tutanota.util.SubmitStateMachine.prototype.setFailureMessage = function(message) {
    this._failureMessage = message;
};
