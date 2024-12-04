use crate::importer::importable_mail::{ImportableMail, ImportableMailAttachment};
use std::iter::Peekable;
use tutasdk::crypto::aes;
use tutasdk::crypto::key::{GenericAesKey, VersionedAesKey};
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::entities::generated::tutanota::ImportMailData;

pub struct UnitImport {
	pub import_mail_data: ImportMailData,
	pub attachments: Vec<ImportableMailAttachment>,
	pub session_key: GenericAesKey,
}

impl UnitImport {
	pub fn create_from_importable_mail(
		randomizer_facade: &RandomizerFacade,
		mail_group_key: &VersionedAesKey,
		mut importable_mail: ImportableMail,
	) -> Self {
		let session_key = GenericAesKey::Aes256(aes::Aes256Key::generate(randomizer_facade));
		let owner_enc_session_key =
			mail_group_key.encrypt_key(&session_key, aes::Iv::generate(randomizer_facade));

		let attachments = importable_mail.take_out_attachments();
		let import_mail_data = importable_mail
			.make_import_mail_data(owner_enc_session_key.object, owner_enc_session_key.version);

		UnitImport {
			import_mail_data,
			attachments,
			session_key,
		}
	}
}

pub struct Butcher<
	// Butcher will gurantee every chunk is equal or less than this limit
	const CHUNK_LIMIT: usize,
	// type of element which is to be chunked
	ResolvingElement,
	// streamer for all the ResolvingElement till end
	Source: Iterator<Item = ResolvingElement>,
> {
	// Butcher will try to adjust every element into one chunk,
	// but if CHUNK_LIMIT is surpassed, it should put the element back in same position it was before,
	// hence, we should be able to peek one element ahead
	provider: Peekable<Source>,

	// given a ResolvingElement, estimate it's size
	sizer: fn(&ResolvingElement) -> usize,
}

impl<const CL: usize, Re, Src: Iterator<Item = Re>> Butcher<CL, Re, Src> {
	pub fn new(source: Src, sizer: fn(&Re) -> usize) -> Self {
		Self {
			provider: source.peekable(),
			sizer,
		}
	}
}

impl<const CHUNK_LIMIT: usize, ResolvingElement, Source> Iterator
	for Butcher<CHUNK_LIMIT, ResolvingElement, Source>
where
	Source: Iterator<Item = ResolvingElement>,
{
	type Item = Result<Vec<ResolvingElement>, ResolvingElement>;

	fn next(&mut self) -> Option<Self::Item> {
		let Self { provider, sizer } = self;
		let mut imports_in_this_chunk = Vec::new();

		let mut cumulative_import_size: usize = 0;
		while let Some(next_element_to_include) = provider.peek() {
			cumulative_import_size =
				cumulative_import_size.saturating_add(sizer(next_element_to_include));

			if cumulative_import_size <= CHUNK_LIMIT {
				let next_element_to_include =
					provider.next().expect("was peekable item must be there");
				imports_in_this_chunk.push(next_element_to_include);
			} else {
				break;
			}
		}

		let item = if imports_in_this_chunk.is_empty() {
			let too_big_import = self.provider.next()?;
			// not a single item was added to chunk,
			// because single chunk was too big, return as-is as failure,
			Err(too_big_import)
		} else {
			Ok(imports_in_this_chunk)
		};
		Some(item)
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	fn run_butcher<const L: usize>(data: Vec<usize>) -> Vec<Result<Vec<usize>, usize>> {
		Butcher::<L, usize, std::vec::IntoIter<usize>>::new(data.into_iter(), usize::clone)
			.into_iter()
			.collect()
	}

	#[test]
	fn should_optimize_for_maximum_chunk() {
		assert_eq!(
			run_butcher::<6>(vec![1, 2, 3, 4, 5, 6]),
			vec![Ok(vec![1, 2, 3]), Ok(vec![4]), Ok(vec![5]), Ok(vec![6])]
		);
	}

	#[test]
	fn should_err_on_too_big_of_chunk() {
		assert_eq!(
			run_butcher::<6>(vec![0, 2, 10, 1, 2, 3]),
			vec![Ok(vec![0, 2]), Err(10), Ok(vec![1, 2, 3])]
		);
	}

	#[test]
	fn element_with_maximum_size_is_accepted() {
		assert_eq!(
			run_butcher::<5>(vec![5, 5, 1, 4, 1]),
			vec![Ok(vec![5]), Ok(vec![5]), Ok(vec![1, 4]), Ok(vec![1])]
		);
	}

	#[test]
	fn should_greedy_chunk() {
		assert_eq!(
			run_butcher::<10_000>(vec![2; 5_000]),
			vec![Ok(vec![2; 5_000])]
		);
	}

	#[test]
	fn should_accept_empty_source() {
		assert_eq!(run_butcher::<10>(vec![]), vec![]);
	}

	#[test]
	fn should_accept_all_big_source() {
		assert_eq!(run_butcher::<5>(vec![6; 10]), vec![Err(6); 10]);
	}
}
