use crate::entity_client::IdType;

#[cfg_attr(test, mockall::automock)]
pub trait OwnerEncSessionKeysUpdateQueue: Send + Sync {
    fn queue_update_instance_session_key(&mut self, id: IdType, sym_enc_key: Vec<u8>, sym_key_version: i64);
}
