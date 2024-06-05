#![allow(unused)] // TODO: remove this later
use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey, KeyLoadError};
use crate::element_value::GeneratedId;

pub struct VersionedAesKey {
    pub key: GenericAesKey,
    pub version: i64
}

#[cfg_attr(test, mockall::automock)]
pub trait KeyLoaderFacade: Send + Sync {
    fn get_current_group_key(&self, group: &GeneratedId) -> Result<VersionedAesKey, KeyLoadError>;
    fn get_current_asymmetric_key_pair(&self, group: &GeneratedId) -> Result<AsymmetricKeyPair, KeyLoadError>;
    fn get_group_key(&self, group: &GeneratedId, version: i64) -> Result<GenericAesKey, KeyLoadError>;
    fn get_asymmetric_key_pair(&self, group: &GeneratedId, version: i64) -> Result<AsymmetricKeyPair, KeyLoadError>;
}

#[derive(uniffi::Object)]
pub(crate) struct KeyLoaderFacadeImpl {}

impl KeyLoaderFacade for KeyLoaderFacadeImpl {
    fn get_current_group_key(&self, group: &GeneratedId) -> Result<VersionedAesKey, KeyLoadError> {
        todo!()
    }
    fn get_current_asymmetric_key_pair(&self, group: &GeneratedId) -> Result<AsymmetricKeyPair, KeyLoadError> {
        todo!()
    }
    fn get_group_key(&self, group: &GeneratedId, version: i64) -> Result<GenericAesKey, KeyLoadError> {
        todo!()
    }
    fn get_asymmetric_key_pair(&self, group: &GeneratedId, version: i64) -> Result<AsymmetricKeyPair, KeyLoadError> {
        todo!()
    }
}
