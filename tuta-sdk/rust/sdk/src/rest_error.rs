//! Contains the code to handle HTTP error responses from the REST API

use crate::ApiCallError;
use std::str::FromStr;
use thiserror::Error;

/// The error thrown when an error data string does not match any value in a failure reason enum
pub struct ParseFailureError;

/// The failed preconditions of a REST request to attempt downgrading an account
#[derive(Error, Debug, uniffi::Enum, Eq, PartialEq, Clone)]
pub enum UnsubscribeFailureReason {
	#[error("TooManyEnabledUsers")]
	TooManyEnabledUsers,
	#[error("CustomMailAddress")]
	CustomMailAddress,
	#[error("TooManyCalendars")]
	TooManyCalendars,
	#[error("CalendarType")]
	CalendarType,
	#[error("TooManyAliases")]
	TooManyAliases,
	#[error("TooMuchStorageUsed")]
	TooMuchStorageUsed,
	#[error("TooManyDomains")]
	TooManyDomains,
	#[error("HasTemplateGroup")]
	HasTemplateGroup,
	#[error("WhitelabelDomainActive")]
	WhitelabelDomainActive,
	#[error("SharedGroupActive")]
	SharedGroupActive,
	#[error("HasContactForm")]
	HasContactForm,
	#[error("NotEnoughCredit")]
	NotEnoughCredit,
	#[error("InvoiceNotPaid")]
	InvoiceNotPaid,
	#[error("HasContactListGroup")]
	HasContactListGroup,
}

impl FromStr for UnsubscribeFailureReason {
	type Err = ParseFailureError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		use UnsubscribeFailureReason::*;
		match s {
			"unsubscribe.too_many_users" => Ok(TooManyEnabledUsers),
			"unsubscribe.custom_mail_address" => Ok(CustomMailAddress),
			"unsubscribe.too_many_calendars" => Ok(TooManyCalendars),
			// This typo is also present in the backend
			"unsubscirbe.invalid_calendar_type" => Ok(CalendarType),
			"unsubscribe.too_many_aliases" => Ok(TooManyAliases),
			"unsubscribe.too_much_storage" => Ok(TooMuchStorageUsed),
			"unsubscribe.too_many_domains" => Ok(TooManyDomains),
			"unsubscribe.has_template_group" => Ok(HasTemplateGroup),
			"unsubscribe.whitelabel_domain_active" => Ok(WhitelabelDomainActive),
			"unsubscribe.shared_group_active" => Ok(SharedGroupActive),
			"unsubscribe.has_contact_form" => Ok(HasContactForm),
			"unsubscribe.not_enough_credit" => Ok(NotEnoughCredit),
			"unsubscribe.invoice_not_paid" => Ok(InvoiceNotPaid),
			"unsubscribe.has_contact_list_group" => Ok(HasContactListGroup),
			_ => Err(ParseFailureError),
		}
	}
}

// legacy, should be deleted after clients older than 3.114 have been disabled.
#[derive(Error, Debug, uniffi::Enum, Eq, PartialEq, Clone)]
pub enum BookingFailureReason {
	#[error("TooManyDomains")]
	TooManyDomains,
	#[error("TooManyAliases")]
	TooManyAliases,
	#[error("TooMuchStorageUsed")]
	TooMuchStorageUsed,
	#[error("SharedGroupActive")]
	SharedGroupActive,
	#[error("WhitelabelDomainActive")]
	WhitelabelDomainActive,
	#[error("HasTemplateGroup")]
	HasTemplateGroup,
}

impl FromStr for BookingFailureReason {
	type Err = ParseFailureError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		use BookingFailureReason::*;
		match s {
			"bookingservice.too_many_domains" => Ok(TooManyDomains),
			"bookingservice.too_many_aliases" => Ok(TooManyAliases),
			"bookingservice.too_much_storage_used" => Ok(TooMuchStorageUsed),
			"bookingservice.shared_group_active" => Ok(SharedGroupActive),
			"bookingservice.whitelabel_domain_active" => Ok(WhitelabelDomainActive),
			"bookingservice.has_template_group" => Ok(HasTemplateGroup),
			_ => Err(ParseFailureError),
		}
	}
}

/// The failed preconditions of a REST request to attempt setting a whitelabel domain
#[derive(Error, Debug, uniffi::Enum, Eq, PartialEq, Clone)]
pub enum DomainFailureReason {
	// Renamed from FAILURE_CONTACT_FORM_ACTIVE
	#[error("ContactFormActive")]
	ContactFormActive,
	#[error("NotASubdomain")]
	NotASubdomain,
	#[error("Invalid")]
	Invalid,
	#[error("InvalidCDomain")]
	InvalidCDomain,
	#[error("Exists")]
	Exists,
}

impl FromStr for DomainFailureReason {
	type Err = ParseFailureError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		use DomainFailureReason::*;
		match s {
			"domain.contact_form_active" => Ok(ContactFormActive),
			"domain.not_a_subdomain" => Ok(NotASubdomain),
			"domain.invalid" => Ok(Invalid),
			"domain.invalid_cname" => Ok(InvalidCDomain),
			"domain.exists" => Ok(Exists),
			_ => Err(ParseFailureError),
		}
	}
}

/// The failed preconditions of a REST request to attempt setting a custom domain
/// for an email address
#[derive(Error, Debug, uniffi::Enum, Eq, PartialEq, Clone)]
pub enum CustomDomainFailureReason {
	#[error("LimitReached")]
	LimitReached,
	#[error("DomainInUse")]
	DomainInUse,
}

impl FromStr for CustomDomainFailureReason {
	type Err = ParseFailureError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		use CustomDomainFailureReason::*;
		match s {
			"customdomainservice.limit_reached" => Ok(LimitReached),
			"customdomainservice.domain_in_use" => Ok(DomainInUse),
			_ => Err(ParseFailureError),
		}
	}
}

/// The failed preconditions of unsuccessful template group operations
#[derive(Error, Debug, uniffi::Enum, Eq, PartialEq, Clone)]
pub enum TemplateGroupFailureReason {
	#[error("BusinessFeatureRequired")]
	BusinessFeatureRequired,
	#[error("UnlimitedRequired")]
	UnlimitedRequired,
}

impl FromStr for TemplateGroupFailureReason {
	type Err = ParseFailureError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		use TemplateGroupFailureReason::*;
		match s {
			"templategroup.business_feature_required" => Ok(BusinessFeatureRequired),
			"templategroup.unlimited_required" => Ok(UnlimitedRequired),
			_ => Err(ParseFailureError),
		}
	}
}

/// The failed preconditions of unsuccessful usage test operations
#[derive(Error, Debug, uniffi::Enum, Eq, PartialEq, Clone)]
pub enum UsageTestFailureReason {
	#[error("InvalidState")]
	InvalidState,
	#[error("InvalidRestart")]
	InvalidRestart,
	#[error("InvalidStage")]
	InvalidStage,
	#[error("InvalidStageSkip")]
	InvalidStageSkip,
	#[error("InvalidStageRepetition")]
	InvalidStageRepetition,
}

impl FromStr for UsageTestFailureReason {
	type Err = ParseFailureError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		use UsageTestFailureReason::*;
		match s {
			"invalid_state" => Ok(InvalidState),
			"invalid_restart" => Ok(InvalidRestart),
			"invalid_stage" => Ok(InvalidStage),
			"invalid_stage_skip" => Ok(InvalidStageSkip),
			"invalid_stage_repetition" => Ok(InvalidStageSkip),
			_ => Err(ParseFailureError),
		}
	}
}

/// The possible failed preconditions when unsuccessfully performing an operation on the backend
#[derive(Error, Debug, uniffi::Enum, Eq, PartialEq, Clone)]
pub enum PreconditionFailedReason {
	#[error("UnsubscribeFailure")]
	UnsubscribeFailure(#[from] UnsubscribeFailureReason),
	#[error("BookingFailure")]
	BookingFailure(#[from] BookingFailureReason),
	#[error("DomainFailure")]
	DomainFailure(#[from] DomainFailureReason),
	#[error("CustomDomainFailure")]
	CustomDomainFailure(#[from] CustomDomainFailureReason),
	#[error("TemplateGroupFailure")]
	TemplateGroupFailure(#[from] TemplateGroupFailureReason),
	#[error("UsageTestFailure")]
	UsageTestFailure(#[from] UsageTestFailureReason),
	#[error("FailureLocked")]
	FailureLocked,
	#[error("FailureUserDisabled")]
	FailureUserDisabled,
	#[error("FailureUpgradeRequired")]
	FailureUpgradeRequired,
}

impl FromStr for PreconditionFailedReason {
	type Err = ParseFailureError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		use PreconditionFailedReason::*;

		// Check and return if the string matches a value of `UnsubscribeFailureReason`
		if let Ok(reason) = UnsubscribeFailureReason::from_str(s) {
			Ok(UnsubscribeFailure(reason))
		} else if let Ok(reason) = BookingFailureReason::from_str(s) {
			Ok(BookingFailure(reason))
		} else if let Ok(reason) = DomainFailureReason::from_str(s) {
			Ok(DomainFailure(reason))
		} else if let Ok(reason) = CustomDomainFailureReason::from_str(s) {
			Ok(CustomDomainFailure(reason))
		} else if let Ok(reason) = TemplateGroupFailureReason::from_str(s) {
			Ok(TemplateGroupFailure(reason))
		} else if let Ok(reason) = UsageTestFailureReason::from_str(s) {
			Ok(UsageTestFailure(reason))
		} else {
			match s {
				"lock.locked" => Ok(FailureLocked),
				"mailaddressaliasservice.group_disabled" => Ok(FailureUserDisabled),
				"outofoffice.not_available_on_current_plan" => Ok(FailureUpgradeRequired),
				_ => Err(ParseFailureError),
			}
		}
	}
}

/// The possible error responses from the server
#[derive(Error, Debug, uniffi::Error, Eq, PartialEq, Clone)]
pub enum HttpError {
	#[error("Connection lost")]
	ConnectionError,
	#[error("Bad request")]
	BadRequestError,
	#[error("Not authenticated")]
	NotAuthenticatedError,
	#[error("Not Authorized")]
	NotAuthorizedError,
	#[error("Not Found")]
	NotFoundError,
	#[error("Method Not Allowed")]
	MethodNotAllowedError,
	#[error("Request Timeout")]
	RequestTimeoutError,
	#[error("Precondition Failed")]
	PreconditionFailedError(Option<PreconditionFailedReason>),
	#[error("Locked")]
	LockedError,
	#[error("Too Many Requests")]
	TooManyRequestsError,
	#[error("Session Expired")]
	SessionExpiredError,
	#[error("Access Deactivated")]
	AccessDeactivatedError,
	/// Happens to external users exclusively, due to password changes
	#[error("Access Expired")]
	AccessExpiredError,
	#[error("Access Blocked")]
	AccessBlockedError,
	#[error("Invalid Data")]
	InvalidDataError,
	#[error("Invalid Software Version")]
	InvalidSoftwareVersionError,
	#[error("Limit Reached")]
	LimitReachedError,
	#[error("Internal Server")]
	InternalServerError,
	#[error("Bad gateway")]
	BadGatewayError,
	#[error("Service Unavailable")]
	ServiceUnavailableError,
	#[error("Insufficient Storage")]
	InsufficientStorageError,
	#[error("Resource")]
	ResourceError,
	#[error("Payload Too Large")]
	PayloadTooLargeError,
}

impl HttpError {
	/// Converts an HTTP response code into a `NetworkError`
	pub fn from_http_response(
		status: u32,
		precondition: Option<&String>,
	) -> Result<HttpError, ApiCallError> {
		use HttpError::*;
		match status {
			0 => Ok(ConnectionError),
			400 => Ok(BadRequestError),
			401 => Ok(NotAuthenticatedError),
			403 => Ok(NotAuthorizedError),
			404 => Ok(NotFoundError),
			405 => Ok(MethodNotAllowedError),
			408 => Ok(RequestTimeoutError),
			412 => {
				let reason = match precondition {
					Some(x) => Some(PreconditionFailedReason::from_str(x)?),
					None => None,
				};
				Ok(PreconditionFailedError(reason))
			},
			423 => Ok(LockedError),
			429 => Ok(TooManyRequestsError),
			440 => Ok(SessionExpiredError),
			470 => Ok(AccessDeactivatedError),
			471 => Ok(AccessExpiredError),
			472 => Ok(AccessBlockedError),
			473 => Ok(InvalidDataError),
			474 => Ok(InvalidSoftwareVersionError),
			475 => Ok(LimitReachedError),
			500 => Ok(InternalServerError),
			502 => Ok(BadGatewayError),
			503 => Ok(ServiceUnavailableError),
			507 => Ok(InsufficientStorageError),
			413 => Ok(PayloadTooLargeError),
			200..=299 => Err(ApiCallError::InternalSdkError {
				error_message: format!("HTTP Response code {status} is not an error"),
			}),
			_ => Ok(ResourceError),
		}
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn from_http_response_connection_error_test() {
		let error = assert_from_http_response(0, None);
		assert_eq!(error, HttpError::ConnectionError)
	}

	#[test]
	fn from_http_response_unknown_error_test() {
		let error = assert_from_http_response(402, None);
		assert_eq!(error, HttpError::ResourceError)
	}

	#[test]
	fn from_http_response_unused_precondition_test() {
		let error = assert_from_http_response(0, Some("lock.locked"));
		assert_eq!(error, HttpError::ConnectionError)
	}

	#[test]
	fn from_http_response_non_error_test() {
		let error = HttpError::from_http_response(202, None);
		error.expect_err("from_http_response_non_error_test received an Ok value!");
	}

	#[test]
	fn from_http_response_precondition_failed_error_test() {
		assert_precondition_failed_error(
			Some("lock.locked"),
			Some(PreconditionFailedReason::FailureLocked),
		)
	}

	#[test]
	fn from_http_response_precondition_failed_error_no_reason_test() {
		assert_precondition_failed_error(None, None)
	}

	#[test]
	fn from_http_response_precondition_failed_error_booking_reason_test() {
		let expected_reason =
			PreconditionFailedReason::BookingFailure(BookingFailureReason::TooMuchStorageUsed);
		assert_precondition_failed_error(
			Some("bookingservice.too_much_storage_used"),
			Some(expected_reason),
		)
	}

	/// Returns the Ok value from `from_http_response` and panics if the value is None
	fn assert_from_http_response(status: u32, precondition: Option<&str>) -> HttpError {
		// Convert the `str` contained within `precondition` into a `String`
		let string_precondition = precondition.map(|inner_str: &str| inner_str.to_owned());
		let result = HttpError::from_http_response(status, string_precondition.as_ref());
		result.expect("An error occurred while testing precondition_failed!")
	}

	/**
	Asserts `from_http_response` returns the reason `reason` given `precondition`
	for a `PreconditionFailedError`
	 */
	fn assert_precondition_failed_error(
		precondition: Option<&str>,
		reason: Option<PreconditionFailedReason>,
	) {
		let error = assert_from_http_response(412, precondition);
		assert_eq!(error, HttpError::PreconditionFailedError(reason))
	}
}
