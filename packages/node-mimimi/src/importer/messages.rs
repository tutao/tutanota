use crate::importer::importable_mail::MailParseError;
use std::path::PathBuf;
use tutasdk::rest_error::PreconditionFailedReason::ImportFailure;
use tutasdk::rest_error::{HttpError, ImportFailureReason};
use tutasdk::ApiCallError;

#[napi_derive::napi(string_enum)]
#[derive(Debug, PartialEq)]
pub enum ImportErrorKind {
	SdkError,
	/// No import feature on the server (it's disabled)
	ImportFeatureDisabled,
	/// Blob responded with empty server url list
	EmptyBlobServerList,
	/// Some mail was too big
	TooBigChunk,
	/// Error that occured when deleting a file
	FileDeletionError,
	/// The import was finished, but some files
	/// were left behind and marked as failures.
	/// the path is the directory where the failures can be inspected
	SourceExhaustedSomeError,
}

#[napi_derive::napi(string_enum)]
#[derive(Debug)]
pub enum ImportOkKind {
	SourceExhaustedNoError,
	UserCancelInterruption,
	UserPauseInterruption,
}

/// needed because napi_rs doesn't support structured enums yet
#[napi_derive::napi(object)]
#[derive(Debug, Clone)]
pub struct MailImportErrorMessage {
	pub kind: ImportErrorKind,
	pub path: Option<String>,
}

/// note: this type can be simplified once napi have structural enum support,
/// it can be:
///```ignore
/// use std::path::PathBuf;
/// use tutao_node_mimimi::importer::messages::{ImportOkKind, MailImportErrorMessage };
///
/// enum ImportMessage {
/// 	Ok{kind: ImportOkKind},
/// 	Err{kind: MailImportErrorMessage, path: Option<PathBuf>}
/// }
/// ```
#[napi_derive::napi(object)]
#[derive(Debug, Clone)]
pub struct MailImportMessage {
	pub ok_message: Option<ImportOkKind>,
	pub error_message: Option<MailImportErrorMessage>,
}

/// Errors that can happen when we are preparing for an import.
/// i.e before we enter importer loop
#[napi_derive::napi(string_enum)]
#[repr(u8)]
#[cfg_attr(test, derive(Debug))]
#[derive(PartialEq)]
pub enum PreparationError {
	/// Can not create a native Rest client
	NoNativeRestClient,
	/// some error occurred while reading import directory
	CannotReadOldStateId,
	/// Error when trying to resume the session passed from client
	LoginError,
	/// Can not read all the eml files in import directory
	FailedToReadEmls,
	/// can not get mail group key from sdk
	NoMailGroupKey,
	/// can not load remote state
	CannotLoadRemoteState,
	/// No import feature on the server (it's disabled)
	ImportFeatureDisabled,
	/// Can not write to state file
	StateFileWriteFailed,
	/// Can not create directory to keep selected files
	CanNotCreateImportDir,
	/// Can not delete import directory
	CanNotDeleteImportDir,
	/// Can not read one of selected file
	FileReadError,
	/// Can not parse file content to Message format
	NotAValidEmailFile,
	/// Can not write eml file to import dir
	EmlFileWriteFailure,
}

/// Unification of Imap & File IterationError
#[derive(Debug)]
pub enum IterationError {
	Imap(ImapIterationError),
	File(FileIterationError),
}

/// Error that can occur when we walk through the source of imap mails
#[derive(Debug, PartialEq, Clone)]
pub enum ImapIterationError {
	/// All mail form remote server have been visited at least once,
	SourceEnd,

	/// when executing a command, received a non-ok status,
	NonOkCommandStatus,

	/// Can not convert ImapMail to ConvertableMail
	MailParseError(MailParseError),

	/// Can not log in to imap server
	NoLogin,
}

/// Error that can occur when we iterate through import directory
#[derive(Debug)]
pub enum FileIterationError {
	/// File read error
	FileReadError(PathBuf),
	/// failed to parse an eml.
	ParseError(PathBuf),
}

/// Error that can happen while changing progress action,
pub enum ProgressActionError {
	CannotJoinImportLoop,
	CannotUpdateRemoteStatus,
}

#[cfg(feature = "javascript")]
impl From<PreparationError> for napi::Error {
	fn from(prep_err: PreparationError) -> Self {
		let code = match prep_err {
			PreparationError::NoNativeRestClient => "NoNativeRestClient",
			PreparationError::CannotReadOldStateId => "ImportDirectoryPreparation",
			PreparationError::LoginError => "LoginError",
			PreparationError::FailedToReadEmls => "FailedToReadEmls",
			PreparationError::NoMailGroupKey => "NoMailGroupKey",
			PreparationError::CannotLoadRemoteState => "CannotLoadRemoteState",
			PreparationError::ImportFeatureDisabled => "ImportFeatureDisabled",
			PreparationError::StateFileWriteFailed => "StateFileWriteFailed",
			PreparationError::CanNotCreateImportDir => "CanNotCreateImportDir",
			PreparationError::CanNotDeleteImportDir => "CanNotDeleteImportDir",
			PreparationError::FileReadError => "FileReadError",
			PreparationError::NotAValidEmailFile => "NotAValidEmailFile",
			PreparationError::EmlFileWriteFailure => "EmlFileWriteFailure",
		};

		napi::Error::from_reason(code)
	}
}

#[cfg(feature = "javascript")]
impl From<ProgressActionError> for napi::Error {
	fn from(progress_action_error: ProgressActionError) -> Self {
		let code = match progress_action_error {
			ProgressActionError::CannotJoinImportLoop => "CannotJoinImportLoop",
			ProgressActionError::CannotUpdateRemoteStatus => "CannotUpdateRemoteStatus",
		};
		napi::Error::from_reason(code)
	}
}

impl ImportErrorKind {
	pub const IMPORT_DISABLED_ERROR: ApiCallError = ApiCallError::ServerResponseError {
		source: HttpError::PreconditionFailedError(Some(ImportFailure(
			ImportFailureReason::ImportDisabled,
		))),
	};
}

impl MailImportErrorMessage {
	#[must_use]
	pub fn sdk(action: &'static str, error: ApiCallError) -> Self {
		log::error!("ImportError::SdkError: {action} ({error})");

		let kind = if error == ImportErrorKind::IMPORT_DISABLED_ERROR {
			ImportErrorKind::ImportFeatureDisabled
		} else {
			ImportErrorKind::SdkError
		};

		Self { kind, path: None }
	}

	#[must_use]
	pub fn with_path(kind: ImportErrorKind, path: PathBuf) -> Self {
		Self {
			kind,
			path: Some(path.to_string_lossy().to_string()),
		}
	}
}

impl From<ImportErrorKind> for MailImportErrorMessage {
	fn from(kind: ImportErrorKind) -> Self {
		MailImportErrorMessage { kind, path: None }
	}
}

impl MailImportMessage {
	#[must_use]
	pub fn ok(ok_message: ImportOkKind) -> Self {
		Self {
			ok_message: Some(ok_message),
			error_message: None,
		}
	}

	#[must_use]
	pub fn err(err_message: MailImportErrorMessage) -> Self {
		Self {
			ok_message: None,
			error_message: Some(err_message),
		}
	}
}
