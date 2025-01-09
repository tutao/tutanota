use crate::importer::importable_mail::MailParseError;
use std::path::{Path, PathBuf};
use tutasdk::ApiCallError;

#[napi_derive::napi(string_enum)]
#[derive(Debug)]
pub enum ImportMessageKind {
	SdkError,
	/// import feature is not available for this user
	NoImportFeature,
	/// Blob responded with empty server url list
	EmptyBlobServerList,
	/// Some mail was too big
	TooBigChunk,
	/// Error that occured when deleting a file
	FileDeletionError,
	/// The import was finished, but some files
	/// were left behind and marked as failures.
	/// the path is the directory where the failures can be inspected
	ImportIncomplete,
	/// Generic counterpart for SdkError
	// note: do not throw this manually
	GenericSdkError,
	/// Import finished without any error
	Success,
}

/// needed because napi_rs doesn't support structured enums yet
#[napi_derive::napi(object)]
#[derive(Debug, Clone)]
pub struct MailImportMessage {
	pub kind: ImportMessageKind,
	pub path: Option<String>,
}

/// Errors that can happen when we are preparing for an import.
/// i.e before we enter importer loop
#[napi_derive::napi(string_enum)]
#[repr(u8)]
#[cfg_attr(test, derive(Debug))]
pub enum PreparationError {
	/// import state file does not exist at all
	NoStateFile,
	/// import state file exists, but it's content can not be deserialized to valid idTuple
	MalformedStateFile,
	/// Can not create a native Rest client
	NoNativeRestClient,
	/// Can not log in through sdk
	CanNotLoginToSdk,
	/// Can not create a sdk
	CannotCreateSdk,
	/// some error occurred while preparing import directory
	ImportDirectoryPreparation,
	/// Error when trying to resume the session passed from client
	LoginError,
	/// Can not read all the eml files in import directory
	FailedToReadEmls,
	/// can not get mail group key from sdk
	NoMailGroupKey,
	/// can not load remote state
	CannotLoadRemoteState,
	/// No import feature on the server (it's disabled)
	NoImportFeature,
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

#[cfg(feature = "javascript")]
impl From<MailImportMessage> for napi::Error {
	fn from(import_err: MailImportMessage) -> Self {
		napi::Error::from_reason(format!("{:?}", import_err))
	}
}

#[cfg(feature = "javascript")]
impl From<PreparationError> for napi::Error {
	fn from(prep_err: PreparationError) -> Self {
		let code = match prep_err {
			PreparationError::NoStateFile => "NoStateFile",
			PreparationError::MalformedStateFile => "MalformedStateFile",
			PreparationError::NoNativeRestClient => "NoNativeRestClient",
			PreparationError::CanNotLoginToSdk => "CanNotLoginToSdk",
			PreparationError::CannotCreateSdk => "CannotCreateSdk",
			PreparationError::ImportDirectoryPreparation => "ImportDirectoryPreparation",
			PreparationError::LoginError => "LoginError",
			PreparationError::FailedToReadEmls => "FailedToReadEmls",
			PreparationError::NoMailGroupKey => "NoMailGroupKey",
			PreparationError::CannotLoadRemoteState => "CannotLoadRemoteState",
			PreparationError::NoImportFeature => "NoImportFeature",
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

impl MailImportMessage {
	pub fn sdk(action: &'static str, error: ApiCallError) -> Self {
		log::error!("ImportError::SdkError: {action} ({error})");
		Self {
			kind: ImportMessageKind::SdkError,
			path: None,
		}
	}

	pub fn with_path(kind: ImportMessageKind, path: PathBuf) -> Self {
		Self {
			kind,
			path: Some(path.to_string_lossy().to_string()),
		}
	}
}

impl From<ImportMessageKind> for MailImportMessage {
	fn from(kind: ImportMessageKind) -> Self {
		Self { kind, path: None }
	}
}
