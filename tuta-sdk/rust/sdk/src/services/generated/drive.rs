// @generated
#![allow(unused_imports, dead_code, unused_variables)]
use crate::ApiCallError;
use crate::entities::Entity;
use crate::services::{PostService, GetService, PutService, DeleteService, Service, Executor, ExtraServiceParams};
use crate::bindings::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::entities::generated::drive::DriveCopyServicePostIn;
use crate::entities::generated::drive::DriveCopyServicePostOut;
use crate::entities::generated::drive::DriveFileShareServicePostIn;
use crate::entities::generated::drive::DriveFileShareServicePutIn;
use crate::entities::generated::drive::DriveFileShareServiceDeleteIn;
use crate::entities::generated::drive::DriveFileShareTokenServicePostIn;
use crate::entities::generated::drive::DriveFileShareTokenServicePostOut;
use crate::entities::generated::drive::DriveFolderServicePostIn;
use crate::entities::generated::drive::DriveFolderServicePostOut;
use crate::entities::generated::drive::DriveFolderServicePutIn;
use crate::entities::generated::drive::DriveFolderServiceDeleteIn;
use crate::entities::generated::drive::DriveItemPostIn;
use crate::entities::generated::drive::DriveItemPostOut;
use crate::entities::generated::drive::DriveItemPutIn;
use crate::entities::generated::drive::DriveItemDeleteIn;
use crate::entities::generated::drive::DriveItemServiceDeleteOut;
use crate::entities::generated::drive::DrivePostIn;
pub struct DriveCopyService;

crate::service_impl!(declare, DriveCopyService, "drive/drivecopyservice", 6);
crate::service_impl!(POST, DriveCopyService, DriveCopyServicePostIn, DriveCopyServicePostOut);


pub struct DriveFileShareService;

crate::service_impl!(declare, DriveFileShareService, "drive/drivefileshareservice", 6);
crate::service_impl!(POST, DriveFileShareService, DriveFileShareServicePostIn, ());
crate::service_impl!(PUT, DriveFileShareService, DriveFileShareServicePutIn, ());
crate::service_impl!(DELETE, DriveFileShareService, DriveFileShareServiceDeleteIn, ());


pub struct DriveFileShareTokenService;

crate::service_impl!(declare, DriveFileShareTokenService, "drive/drivefilesharetokenservice", 6);
crate::service_impl!(POST, DriveFileShareTokenService, DriveFileShareTokenServicePostIn, DriveFileShareTokenServicePostOut);


pub struct DriveFolderService;

crate::service_impl!(declare, DriveFolderService, "drive/drivefolderservice", 6);
crate::service_impl!(POST, DriveFolderService, DriveFolderServicePostIn, DriveFolderServicePostOut);
crate::service_impl!(PUT, DriveFolderService, DriveFolderServicePutIn, ());
crate::service_impl!(DELETE, DriveFolderService, DriveFolderServiceDeleteIn, ());


pub struct DriveItemService;

crate::service_impl!(declare, DriveItemService, "drive/driveitemservice", 6);
crate::service_impl!(POST, DriveItemService, DriveItemPostIn, DriveItemPostOut);
crate::service_impl!(PUT, DriveItemService, DriveItemPutIn, ());
crate::service_impl!(DELETE, DriveItemService, DriveItemDeleteIn, DriveItemServiceDeleteOut);


pub struct DriveService;

crate::service_impl!(declare, DriveService, "drive/driveservice", 6);
crate::service_impl!(POST, DriveService, DrivePostIn, ());
