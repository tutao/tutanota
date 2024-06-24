use std::sync::{Arc, RwLock};

use crate::ApiCallError;
use crate::crypto::Aes256Key;
use crate::entities::sys::User;

#[derive(uniffi::Object)]
pub struct UserFacade {
    user: Arc<RwLock<User>>,
}

/// UserFacade is tied to a logged in user.
impl UserFacade {
    pub fn new(
        user: User,
    ) -> Self {
        UserFacade {
            user: Arc::new(RwLock::new(user)),
        }
    }

    pub fn get_user(&self) -> User {
        self.user.read().unwrap().clone()
    }

    // FIXME: Rebase/merge after https://github.com/tutao/tutanota/pull/7137
    pub fn unlock_user_group_key(&self, user_passphrase_key: Aes256Key) -> Result<(), ApiCallError> {
        Ok(())
    }
}
