use base64::alphabet::Alphabet;
use base64::engine::GeneralPurpose;

use crate::date::DateTime;
use crate::{
	element_value::ElementValue, CustomId, GeneratedId, IdTupleCustom, IdTupleGenerated, TypeRef,
};

#[cfg(test)]
pub mod entity_test_utils;
#[cfg(test)]
pub mod test_utils;

/// A functional style wrapper around `vec.reverse()`
#[cfg(test)]
#[must_use]
pub fn get_vec_reversed<T: Clone>(vec: Vec<T>) -> Vec<T> {
	let mut copy = vec.clone();
	copy.reverse();
	copy
}

#[derive(Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this might print a key
pub struct Versioned<T> {
	pub object: T,
	pub version: u64,
}

impl<T> Versioned<T> {
	pub fn new(object: T, version: u64) -> Versioned<T> {
		Versioned { object, version }
	}
	pub fn as_ref(&self) -> Versioned<&T> {
		Versioned {
			object: &self.object,
			version: self.version,
		}
	}
}

#[must_use]
pub fn convert_version_to_u64(version: i64) -> u64 {
	version.try_into().expect("got an invalid version number")
}

#[must_use]
pub fn convert_version_to_i64(version: u64) -> i64 {
	version.try_into().expect("got an invalid version number")
}

/// Alphabet for encoding/decoding a base64ext string.
/// Base64ext uses another character set than base64 in order to make it sortable.
///
/// packages/tutanota-utils/lib/Encoding.ts
const BASE64EXT_ALPHABET: Alphabet =
	match Alphabet::new("-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz") {
		Ok(x) => x,
		Err(_) => panic!("creation of alphabet failed"),
	};

pub const BASE64_EXT: GeneralPurpose =
	GeneralPurpose::new(&BASE64EXT_ALPHABET, base64::engine::general_purpose::PAD);

/// Generates an event UID using a given timestamp and the calendar id
#[must_use]
pub fn generate_event_uid(calendar_id: &GeneratedId, timestamp: DateTime) -> String {
	format!("{}{}@tuta.com", calendar_id, timestamp.as_millis())
}

/// Returns `T` if type `F` is the same type.
#[must_use]
pub fn downcast_mut<F: 'static, T: 'static>(of: &mut F) -> Option<&mut T> {
	let a = of as &mut dyn std::any::Any;
	a.downcast_mut()
}

#[must_use]
pub fn first_bigger_than_second_custom_id(first_id: &CustomId, second_id: &CustomId) -> bool {
	first_id.to_custom_string() > second_id.to_custom_string()
}

#[must_use]
pub fn extract_parsed_entity_id(
	type_ref: &TypeRef,
	entity_id: ElementValue,
) -> (Option<GeneratedId>, String) {
	let (list_id, element_id) = match entity_id {
		ElementValue::IdTupleGeneratedElementId(IdTupleGenerated {
			list_id,
			element_id,
		}) => (Some(list_id), element_id.to_string()),

		ElementValue::IdTupleCustomElementId(IdTupleCustom {
			list_id,
			element_id,
		}) => (Some(list_id), element_id.to_string()),

		ElementValue::IdGeneratedId(element_id) => (None, element_id.to_string()),
		ElementValue::IdCustomId(element_id) => (None, element_id.to_string()),

		_ => panic!("Invalid type of _id for TypeRef: {type_ref}"),
	};
	(list_id, element_id)
}

#[cfg(test)]
mod test {
	use crate::metamodel::{AppName, TypeId};

	use super::*;

	#[tokio::test]
	#[should_panic]
	async fn negative_version_to_u64() {
		let version = -1;
		let _ = convert_version_to_u64(version);
	}

	#[tokio::test]
	async fn good_version_to_u64() {
		let version = 0;
		let _ = convert_version_to_u64(version);
	}

	#[tokio::test]
	#[should_panic]
	async fn to_large_version_to_i64() {
		let version = 3 << 62;
		let _ = convert_version_to_i64(version);
	}

	#[tokio::test]
	async fn good_version_to_i64() {
		let version = 0;
		let _ = convert_version_to_i64(version);
	}

	#[test]
	fn is_first_custom_id_bigger() {
		let first_id = CustomId::from_custom_string("1abcd");
		let second_id = CustomId::from_custom_string("1abcc");

		assert!(first_bigger_than_second_custom_id(&first_id, &second_id))
	}

	#[test]
	fn is_first_custom_id_smaller() {
		let first_id = CustomId::from_custom_string("1abcc");
		let second_id = CustomId::from_custom_string("1abcd");

		assert!(!first_bigger_than_second_custom_id(&first_id, &second_id))
	}

	#[test]
	fn test_extract_parsed_entity_id_tuple_generated() {
		let type_ref = TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(0),
		};
		let entity_id = IdTupleGenerated {
			list_id: GeneratedId::test_random(),
			element_id: GeneratedId::test_random(),
		};

		let (list_id, element_id) = extract_parsed_entity_id(
			&type_ref,
			ElementValue::IdTupleGeneratedElementId(entity_id.clone()),
		);

		assert_eq!(entity_id.list_id, list_id.unwrap());
		assert_eq!(entity_id.element_id.to_string(), element_id);
	}

	#[test]
	fn test_extract_parsed_entity_id_tuple_custom() {
		let type_ref = TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(0),
		};

		let entity_id = IdTupleCustom {
			list_id: GeneratedId::test_random(),
			element_id: CustomId::test_random(),
		};

		let (list_id, element_id) = extract_parsed_entity_id(
			&type_ref,
			ElementValue::IdTupleCustomElementId(entity_id.clone()),
		);

		assert_eq!(entity_id.list_id, list_id.unwrap());
		assert_eq!(entity_id.element_id.to_string(), element_id);
	}

	#[test]
	fn test_extract_parsed_entity_id_generated() {
		let type_ref = TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(0),
		};
		let entity_id = GeneratedId::test_random();
		let id =
			extract_parsed_entity_id(&type_ref, ElementValue::IdGeneratedId(entity_id.clone())).1;

		assert_eq!(entity_id.to_string(), id);
	}

	#[test]
	fn test_extract_parsed_entity_id_custom() {
		let type_ref = TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(0),
		};
		let entity_id = CustomId::test_random();
		let id = extract_parsed_entity_id(&type_ref, ElementValue::IdCustomId(entity_id.clone())).1;

		assert_eq!(entity_id.to_string(), id);
	}
}
