package de.tutao.tutashared

// used to signal the web app that something went wrong with a mobile payment method.
// will prompt the user to try again later.
class MobilePaymentException: Exception() {

}