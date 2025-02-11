use crate::importer::importable_mail::KeyedImportableMailAttachment;
use crate::importer::messages::MailImportErrorMessage;
use crate::importer::ImportEssential;
use crate::reduce_to_chunks::{KeyedImportMailData, MailUploadDataWithAttachment};
use tutasdk::blobs::blob_facade::FileData;
use tutasdk::crypto::aes;
use tutasdk::crypto::key::GenericAesKey;
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::entities::generated::sys::BlobReferenceTokenWrapper;
use tutasdk::entities::generated::tutanota::ImportAttachment;
use tutasdk::tutanota_constants::ArchiveDataType;

/// Upload all attachments for this chunk,
/// steps:
/// 1. flatten all attachment of all mail in this chunk
/// 2. upload it via `BlobFacade::encrypt_and_upload_multiple` and get back reference tokens for all blobs
/// 3. Assemble reference token to correct attachment
#[must_use]
pub struct PerChunkAttachmentImporter;

impl PerChunkAttachmentImporter {
	/// upload all attachments in each chunk item to blob storage and assign blob access token reference
	pub async fn upload_attachments_for_chunk(
		import_essential: &ImportEssential,
		importable_chunk: Vec<MailUploadDataWithAttachment>,
	) -> Result<Vec<KeyedImportMailData>, MailImportErrorMessage> {
		// aggregate attachment data from multiple mails to upload in fewer request to the BlobService
		let flattened_attachments = Self::flatten_attachments_for_chunk(
			&import_essential.randomizer_facade,
			&importable_chunk,
		);

		// upload all attachments in this chunk in one call to the blob_facade
		// the blob_facade chunks them into efficient request to the BlobService
		let reference_tokens_per_attachment_flattened = import_essential
			.logged_in_sdk
			.blob_facade()
			.encrypt_and_upload_multiple(
				ArchiveDataType::Attachments,
				&import_essential.target_owner_group,
				flattened_attachments.iter().map(|a| &a.file_data),
			)
			.await
			.map_err(|e| MailImportErrorMessage::sdk("fail to upload multiple attachments", e))?;

		let session_keys_for_all_attachments = flattened_attachments
			.iter()
			.map(|a| a.file_data.session_key.clone())
			.collect();
		let keyed_import_mail_data = Self::assemble_import_mail_data_with_attachments(
			import_essential,
			importable_chunk,
			session_keys_for_all_attachments,
			reference_tokens_per_attachment_flattened,
		);

		Ok(keyed_import_mail_data)
	}
}

impl PerChunkAttachmentImporter {
	/// Visit all attachment of all mail in this chunk,
	/// map them to `KeyedImportableMailAttachment` and return flat list in as-is order
	fn flatten_attachments_for_chunk<'a>(
		randomizer_facade: &RandomizerFacade,
		importable_chunk: &'a [MailUploadDataWithAttachment],
	) -> Vec<KeyedImportableMailAttachment<'a>> {
		importable_chunk
			.iter()
			.flat_map(|mail_upload_data_with_attachment| {
				mail_upload_data_with_attachment
					.attachments
					.iter()
					.map(|attachment| KeyedImportableMailAttachment {
						file_data: FileData {
							session_key: GenericAesKey::Aes256(aes::Aes256Key::generate(
								randomizer_facade,
							)),
							data: &attachment.content,
						},
						meta_data: &attachment.meta_data,
					})
					.collect::<Vec<_>>()
			})
			.collect::<Vec<_>>()
	}

	/// Given list of item in one chunk, assign each `MailData::importedAttachments` to the reference token.
	///
	/// Assumes that `reference_tokens_per_attachment` is in as-is flattened order as `importable_chunk`'s attachment
	///
	/// - `importable_chunk`:
	///   Original list of upload data in this chunk
	/// - `reference_tokens_per_attachment`:
	///   Collection of reference tokens for flattened attachment in `importable_chunk`
	///   note: one attachment might have been broken into multiple blobs ( see `blob_facade.rs` ) hence there might be
	///   multiple token reference for single attachment
	fn assemble_import_mail_data_with_attachments(
		import_essential: &ImportEssential,
		importable_chunk: Vec<MailUploadDataWithAttachment>,
		session_keys_for_all_attachments: Vec<GenericAesKey>,
		mut reference_tokens_per_attachment: Vec<Vec<BlobReferenceTokenWrapper>>,
	) -> Vec<KeyedImportMailData> {
		let mut attachment_session_keys_iter = session_keys_for_all_attachments.iter();

		importable_chunk
			.into_iter()
			.map(|mail_upload_data| {
				let mut attachments_reference_tokens_iter =
					reference_tokens_per_attachment.drain(..mail_upload_data.attachments.len());

				let import_attachments = mail_upload_data
					.attachments
					.into_iter()
					.map(|attachment| {
						let session_key = attachment_session_keys_iter
							.next()
							.expect("More attachments than we have session keys for");
						let reference_tokens = attachments_reference_tokens_iter
							.next()
							.expect("Not enough reference tokens");

						attachment.make_import_attachment_data(
							import_essential,
							session_key,
							reference_tokens,
						)
					})
					.collect::<Vec<ImportAttachment>>();

				let mut keyed_import_mail_data = mail_upload_data.keyed_import_mail_data;
				keyed_import_mail_data.import_mail_data.importedAttachments = import_attachments;
				keyed_import_mail_data
			})
			.collect::<Vec<_>>()
	}
}
