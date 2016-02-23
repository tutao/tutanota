<!---
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
-->

# cordova-plugin-file-transfer

이 플러그인을 사용 하면 업로드 및 다운로드 파일 수 있습니다.

이 플러그인 글로벌 `FileTransfer`, `FileUploadOptions` 생성자를 정의합니다.

전역 범위에서 그들은 제공 되지 않습니다 때까지 `deviceready` 이벤트 후.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(FileTransfer);
    }
    

## 설치

    cordova plugin add cordova-plugin-file-transfer
    

## 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   블랙베리 10
*   브라우저
*   파이어 폭스 OS * *
*   iOS
*   Windows Phone 7과 8 *
*   윈도우 8
*   윈도우

* *`onprogress`도 `abort()`를 지원 하지 않습니다*

* * *`onprogress`를 지원 하지 않습니다*

# FileTransfer

`FileTransfer` 개체는 HTTP 다중 파트 POST 요청을 사용 하 여 파일 업로드 뿐만 아니라 파일을 다운로드 하는 방법을 제공 합니다.

## 속성

*   **onprogress**:로 불리는 `ProgressEvent` 새로운 양의 데이터를 전송 하는 때마다. *(기능)*

## 메서드

*   **업로드**: 파일을 서버에 보냅니다.

*   **다운로드**: 서버에서 파일을 다운로드 합니다.

*   **중단**: 진행 중인 전송 중단.

## 업로드

**매개 변수**:

*   **fileURL**: 장치에 파일을 나타내는 파일 시스템 URL. 에 대 한 이전 버전과 호환성을이 수도 장치에 있는 파일의 전체 경로 수. (참조 [거꾸로 호환성 노트] 아래)

*   **서버**: 인코딩 파일 수신 서버의 URL`encodeURI()`.

*   **successCallback**: `FileUploadResult` 개체를 전달 하는 콜백. *(기능)*

*   **errorCallback**: `FileUploadResult` 검색에 오류가 발생 하면 실행 되는 콜백. `FileTransferError` 개체와 함께 호출 됩니다. *(기능)*

*   **옵션**: 선택적 매개 변수 *(개체)*. 유효한 키:
    
    *   **fileKey**: form 요소의 이름. 기본값은 `file` . (DOMString)
    *   **파일 이름**: 파일 이름을 서버에 파일을 저장할 때 사용 합니다. 기본값은 `image.jpg` . (DOMString)
    *   **httpMethod**: `넣어` 또는 `게시물`-사용 하도록 HTTP 메서드. `게시물` 기본값입니다. (DOMString)
    *   **mimeType**: 업로드 데이터의 mime 형식을. `이미지/jpeg`의 기본값입니다. (DOMString)
    *   **params**: HTTP 요청에 전달할 선택적 키/값 쌍의 집합. (개체)
    *   **chunkedMode**: 청크 스트리밍 모드에서 데이터 업로드를 합니다. 기본값은 `true`입니다. (부울)
    *   **headers**: 헤더 이름/헤더 값의 지도. 배열을 사용 하 여 하나 이상의 값을 지정 합니다. (개체)

*   **trustAllHosts**: 선택적 매개 변수는 기본적으로 `false` . 만약 설정 `true` , 그것은 모든 보안 인증서를 허용 합니다. 이 안 드 로이드 자체 서명 된 보안 인증서를 거부 하기 때문에 유용 합니다. 프로덕션 환경에서 사용 권장 되지 않습니다. 안 드 로이드와 iOS에서 지원. *(부울)*

### 예를 들어

    // !! Assumes variable fileURL contains a valid URL to a text file on the device,
    //    for example, cdvfile://localhost/persistent/path/to/file.txt
    
    var win = function (r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }
    
    var fail = function (error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }
    
    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
    options.mimeType = "text/plain";
    
    var params = {};
    params.value1 = "test";
    params.value2 = "param";
    
    options.params = params;
    
    var ft = new FileTransfer();
    ft.upload(fileURL, encodeURI("http://some.server.com/upload.php"), win, fail, options);
    

### 예를 들어 헤더 업로드 및 진행 이벤트 (안 드 로이드와 iOS만)

    function win(r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }
    
    function fail(error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }
    
    var uri = encodeURI("http://some.server.com/upload.php");
    
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=fileURL.substr(fileURL.lastIndexOf('/')+1);
    options.mimeType="text/plain";
    
    var headers={'headerParam':'headerValue'};
    
    options.headers = headers;
    
    var ft = new FileTransfer();
    ft.onprogress = function(progressEvent) {
        if (progressEvent.lengthComputable) {
          loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
        } else {
          loadingStatus.increment();
        }
    };
    ft.upload(fileURL, uri, win, fail, options);
    

## FileUploadResult

`FileUploadResult` 개체 `FileTransfer` 개체의 `원래` 방법의 성공 콜백에 전달 됩니다.

### 속성

*   **bytesSent**: 업로드의 일부로 서버에 보낸 바이트 수. (긴)

*   **responseCode**: 서버에서 반환 된 HTTP 응답 코드. (긴)

*   **response**: 서버에서 반환 되는 HTTP 응답. (DOMString)

*   **headers**: 서버에서 HTTP 응답 헤더. (개체)
    
    *   현재 ios만 지원 합니다.

### iOS 단점

*   지원 하지 않는 `responseCode` 또는`bytesSent`.

## download

**매개 변수**:

*   **source**: URL로 인코딩된 파일, 다운로드 서버`encodeURI()`.

*   **target**: 장치에 파일을 나타내는 파일 시스템 url. 에 대 한 이전 버전과 호환성을이 수도 장치에 있는 파일의 전체 경로 수. (참조 [거꾸로 호환성 노트] 아래)

*   **successCallback**: 콜백 전달 되는 `FileEntry` 개체. *(기능)*

*   **errorCallback**: `FileEntry`를 검색할 때 오류가 발생 하면 실행 되는 콜백. `FileTransferError` 개체와 함께 호출 됩니다. *(기능)*

*   **trustAllHosts**: 선택적 매개 변수는 기본적으로 `false` . 만약 설정 `true` , 그것은 모든 보안 인증서를 허용 합니다. 안 드 로이드 자체 서명 된 보안 인증서를 거부 하기 때문에 유용 합니다. 프로덕션 환경에서 사용 권장 되지 않습니다. 안 드 로이드와 iOS에서 지원. *(부울)*

*   **options**: 선택적 매개 변수를 현재 지 원하는 머리글만 (예: 인증 (기본 인증), 등).

### 예를 들어

    // !! Assumes variable fileURL contains a valid URL to a path on the device,
    //    for example, cdvfile://localhost/persistent/path/to/downloads/
    
    var fileTransfer = new FileTransfer();
    var uri = encodeURI("http://some.server.com/download.php");
    
    fileTransfer.download(
        uri,
        fileURL,
        function(entry) {
            console.log("download complete: " + entry.toURL());
        },
        function(error) {
            console.log("download error source " + error.source);
            console.log("download error target " + error.target);
            console.log("upload error code" + error.code);
        },
        false,
        {
            headers: {
                "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
            }
        }
    );
    

## abort

진행 중인 전송을 중단합니다. onerror 콜백 FileTransferError.ABORT_ERR의 오류 코드는 FileTransferError 개체를 전달 합니다.

### 예를 들어

    // !! Assumes variable fileURL contains a valid URL to a text file on the device,
    //    for example, cdvfile://localhost/persistent/path/to/file.txt
    
    var win = function(r) {
        console.log("Should not be called.");
    }
    
    var fail = function(error) {
        // error.code == FileTransferError.ABORT_ERR
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }
    
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName="myphoto.jpg";
    options.mimeType="image/jpeg";
    
    var ft = new FileTransfer();
    ft.upload(fileURL, encodeURI("http://some.server.com/upload.php"), win, fail, options);
    ft.abort();
    

## FileTransferError

`FileTransferError` 개체 오류가 발생 하면 오류 콜백에 전달 됩니다.

### 속성

*   **code**: 미리 정의 된 오류 코드 중 하나가 아래에 나열 된. (수)

*   **source**: 소스 URL. (문자열)

*   **target**: 대상 URL. (문자열)

*   **http_status**: HTTP 상태 코드. 이 특성은 응답 코드를 HTTP 연결에서 수신에 사용할 수 있습니다. (수)

*   **body** 응답 본문입니다. 이 특성은 HTTP 연결에서 응답을 받을 때에 사용할 수 있습니다. (문자열)

*   **exception**: 어느 e.getMessage 또는 e.toString (문자열)

### 상수

*   1 = `FileTransferError.FILE_NOT_FOUND_ERR`
*   2 = `FileTransferError.INVALID_URL_ERR`
*   3 = `FileTransferError.CONNECTION_ERR`
*   4 = `FileTransferError.ABORT_ERR`
*   5 = `FileTransferError.NOT_MODIFIED_ERR`

## 이전 버전과 호환성 노트

이 플러그인의 이전 버전만 업로드에 대 한 소스 또는 다운로드에 대 한 대상 장치 절대 파일 경로 받아들일 것 이다. 이러한 경로 일반적으로 폼의 것

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

대 한 뒤 호환성, 이러한 경로 여전히 허용, 그리고 응용 프로그램이 영구 저장소에서 이와 같은 경로 기록 했다, 그때 그들은 계속할 수 있다면 사용할 수.

이러한 경로 `FileEntry` 및 파일 플러그인에 의해 반환 된 `DirectoryEntry` 개체의 `fullPath` 속성에 노출 되었던. 그러나 파일 플러그인의,, 더 이상 새로운 버전 자바 스크립트이 경로 노출.

새로 업그레이드 하는 경우 (1.0.0 이상) 버전의 파일, 및 이전 사용 하 고 `entry.fullPath` `download()` 또는 `upload()` 인수로 다음 대신 파일 시스템 Url을 사용 하 여 코드를 변경 해야 합니다.

폼의 파일 URL을 반환 하는 `FileEntry.toURL()` 및 `DirectoryEntry.toURL()`

    cdvfile://localhost/persistent/path/to/file
    

어떤 `download()` 및 `upload()` 방법에서 절대 파일 경로 대신 사용할 수 있습니다.
