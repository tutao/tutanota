//! General purpose functions for testing various objects

use rand::random;
use crate::crypto::Aes256Key;
use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
use crate::custom_id::CustomId;
use crate::entities::sys::{ArchiveRef, ArchiveType, Group, TypeInfo};
use crate::generated_id::GeneratedId;
use crate::IdTuple;

/// Generates a URL-safe random string of length `Size`.
pub fn generate_random_string<const SIZE: usize>() -> String {
    use base64::engine::Engine;
    let random_bytes: [u8; SIZE] = make_thread_rng_facade().generate_random_array();
    base64::engine::general_purpose::URL_SAFE.encode(random_bytes)
}

pub fn generate_random_group() -> Group {
    Group {
        _format: 0,
        _id: GeneratedId::test_random(),
        _ownerGroup: None,
        _permissions: GeneratedId::test_random(),
        groupInfo: IdTuple::new(GeneratedId::test_random(), GeneratedId::test_random()),
        administratedGroups: None,
        archives: vec![ArchiveType {
            _id: CustomId::test_random(),
            active: ArchiveRef {
                _id: CustomId::test_random(),
                archiveId: GeneratedId::test_random(),
            },
            inactive: vec![],
            r#type: TypeInfo {
                _id: CustomId::test_random(),
                application: "app".to_string(),
                typeId: 1,
            },
        }],
        currentKeys: None,
        customer: None,
        formerGroupKeys: None,
        invitations: GeneratedId::test_random(),
        members: GeneratedId::test_random(),
        groupKeyVersion: 1,
        admin: None,
        r#type: 46,
        adminGroupEncGKey: None,
        adminGroupKeyVersion: None,
        enabled: true,
        external: false,
        pubAdminGroupEncGKey: Some(vec![1, 2, 3]),
        storageCounter: None,
        user: None,
    }
}

pub fn random_aes256_key() -> Aes256Key {
    Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap()
}

/// Moves the object T into heap and leaks it.
#[inline(always)]
pub fn leak<T>(what: T) -> &'static T {
    Box::leak(Box::new(what))
}
