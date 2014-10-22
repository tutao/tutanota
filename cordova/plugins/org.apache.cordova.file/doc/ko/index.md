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

# org.apache.cordova.file

이 플러그인은 장치에 있는 파일에 대 한 읽기/쓰기 액세스를 허용 하는 파일 API를 구현 합니다.

이 플러그인을 포함 한 몇 가지 사양에 따라: HTML5 파일 API는 <http://www.w3.org/TR/FileAPI/>

(지금은 없어진) 디렉터리와 시스템 확장 최신: <http://www.w3.org/TR/2012/WD-file-system-api-20120417/> 플러그인 코드의 대부분은 때 이전 사양 작성 되었습니다 있지만 현재는: <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

그것은 또한 FileWriter 사양 구현: <http://dev.w3.org/2009/dap/file-system/file-writer.html>

사용을 참조 하십시오 HTML5 바위 ' 우수한 [파일 시스템 문서.][1]

 [1]: http://www.html5rocks.com/en/tutorials/file/filesystem/

다른 저장소 옵션에 대 한 개요, 코르도바의 [저장소 가이드][2] 를 참조합니다.

 [2]: http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html

## 설치

    cordova plugin add org.apache.cordova.file
    

## 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   블랙베리 10
*   Firefox 운영 체제
*   iOS
*   Windows Phone 7과 8 *
*   윈도우 8 *

* *가이 플랫폼을 지원 하지 않는 `FileReader.readAsArrayBuffer` 이나 `FileWriter.write(blob)` .*

## 파일을 저장할 위치를

V1.2.0, 현재 중요 한 파일 시스템 디렉터리에 Url도 제공 됩니다. 각 URL 형태 *file:///path/to/spot/*이며 변환할 수는 `DirectoryEntry` 를 사용 하 여`window.resolveLocalFileSystemURL()`.

*   `cordova.file.applicationDirectory`-읽기 전용 디렉터리는 응용 프로그램을 설치 합니다. (*iOS*, *안 드 로이드*, *블랙베리 10*)

*   `cordova.file.applicationStorageDirectory`응용 프로그램의 샌드박스;의 루트 디렉터리 iOS에이 위치에는 읽기 전용 (특정 하위 디렉토리만 [같은 `/Documents` ]은 읽기 / 쓰기). 포함 된 모든 데이터는 응용 프로그램에 전용. ( *iOS*, *안 드 로이드*, *블랙베리 10*)

*   `cordova.file.dataDirectory`-내부 메모리를 사용 하 여 응용 프로그램의 샌드박스 내에서 영구 및 개인 데이터 스토리지 (안 드 로이드, 외부 메모리를 사용 해야 하는 경우 사용 하 여 `.externalDataDirectory` ). IOS에이 디렉터리 iCloud와 동기화 되지 되 (를 사용 하 여 `.syncedDataDirectory` ). (*iOS*, *안 드 로이드*, *블랙베리 10*)

*   `cordova.file.cacheDirectory`-디렉터리 캐시 데이터 파일 또는 모든 파일을 당신의 app를 다시 쉽게 만들 수 있습니다. 운영 체제 장치 저장소 부족 하면 이러한 파일을 삭제할 수 있습니다, 그리고 그럼에도 불구 하 고, 애플 리 케이 션 여기에 파일을 삭제 하려면 운영 체제에 의존 하지 말아야 합니다. (*iOS*, *안 드 로이드*, *블랙베리 10*)

*   `cordova.file.externalApplicationStorageDirectory`-응용 프로그램 외부 저장 공간입니다. (*안 드 로이드*)

*   `cordova.file.externalDataDirectory`-외부 저장소에 응용 프로그램 특정 데이터 파일을 넣어 어디. (*안 드 로이드*)

*   `cordova.file.externalCacheDirectory`외부 저장소에 응용 프로그램 캐시입니다. (*안 드 로이드*)

*   `cordova.file.externalRootDirectory`-외부 저장 (SD 카드) 루트입니다. (*안 드 로이드*, *블랙베리 10*)

*   `cordova.file.tempDirectory`-운영 체제에서 지울 수 있습니다 임시 디렉터리 것입니다. 이 디렉터리;를 운영 체제에 의존 하지 마십시오 귀하의 응용 프로그램 항상 해당 하는 경우 파일을 제거 해야 합니다. (*iOS*)

*   `cordova.file.syncedDataDirectory`-(ICloud)를 예를 들어 동기화 해야 하는 응용 프로그램 관련 파일을 보유 하 고 있습니다. (*iOS*)

*   `cordova.file.documentsDirectory`-파일 애플 리 케이 션, 하지만 그 개인은 다른 응용 프로그램 (예: Office 파일)에 의미입니다. (*iOS*)

*   `cordova.file.sharedDirectory`-모든 응용 프로그램 (*블랙베리 10* 에 전세계적으로 사용 가능한 파일)

## 파일 시스템 레이아웃

비록 기술적으로 구현 세부 사항, 그것은 매우 유용할 수 있습니다 알고 어떻게 `cordova.file.*` 실제 장치에 실제 경로를 속성 지도.

### iOS 파일 시스템 레이아웃

| 장치 경로                                | `cordova.file.*`            | `iosExtraFileSystems` | r/w? |  영구?   |  OS 지웁니다  | 동기화 | 개인 |
|:------------------------------------ |:--------------------------- |:--------------------- |:----:|:------:|:---------:|:---:|:--:|
| `/ var/모바일/응용 프로그램/< UUID > /` | applicationStorageDirectory | -                     |  r   |  N/A   |    N/A    | N/A | 예  |
|    `appname.app/`                    | applicationDirectory        | 번들                    |  r   |  N/A   |    N/A    | N/A | 예  |
|       `www/`                         | -                           | -                     |  r   |  N/A   |    N/A    | N/A | 예  |
|    `Documents/`                      | documentsDirectory          | 문서                    | r/w  |   예    |    없음     |  예  | 예  |
|       `NoCloud/`                     | -                           | 문서 nosync             | r/w  |   예    |    없음     | 없음  | 예  |
|    `Library`                         | -                           | 라이브러리                 | r/w  |   예    |    없음     | 그래? | 예  |
|       `NoCloud/`                     | dataDirectory               | 라이브러리 nosync          | r/w  |   예    |    없음     | 없음  | 예  |
|       `Cloud/`                       | syncedDataDirectory         | -                     | r/w  |   예    |    없음     |  예  | 예  |
|       `Caches/`                      | cacheDirectory              | 캐시                    | r/w  |  예 *   | 예 \* * *| | 없음  | 예  |
|    `tmp/`                            | tempDirectory               | -                     | r/w  | 아니 * * | 예 \* * *| | 없음  | 예  |

* 파일 응용 프로그램 다시 시작 및 업그레이드, 유지 하지만 OS 욕망 언제 든 지이 디렉터리를 지울 수 있습니다. 앱 삭제 될 수 있습니다 모든 콘텐츠를 다시 만들 수 있어야 합니다.

* * 파일 응용 프로그램 다시 시작에서 지속 될 수 있습니다 하지만이 동작에 의존 하지 마십시오. 파일 여러 업데이트를 보장 하지 않습니다. 때 해당 앱이이 디렉터리에서 파일을 제거 해야, 이러한 파일을 제거할 때 (또는 경우에도) 운영 체제 보증 하지 않습니다으로.

\* * *| OS 그것이 필요를 느낀다 언제 든 지이 디렉터리의 내용을 취소 될 수 있습니다 하지만 이것에 의존 하지 마십시오. 이 디렉터리를 응용 프로그램에 대 한 적절 한 선택을 취소 해야 합니다.

### 안 드 로이드 파일 시스템 레이아웃

| 장치 경로                             | `cordova.file.*`                    | `AndroidExtraFileSystems` | r/w? | 영구? | OS 지웁니다 | 개인 |
|:--------------------------------- |:----------------------------------- |:------------------------- |:----:|:---:|:-------:|:--:|
| `file:///android_asset/`          | applicationDirectory                |                           |  r   | N/A |   N/A   | 예  |
| `/data/데이터/< app id > /`    | applicationStorageDirectory         | -                         | r/w  | N/A |   N/A   | 예  |
|    `cache`                        | cacheDirectory                      | 캐시                        | r/w  |  예  |   예 *   | 예  |
|    `files`                        | dataDirectory                       | 파일                        | r/w  |  예  |   없음    | 예  |
|       `Documents`                 |                                     | 문서                        | r/w  |  예  |   없음    | 예  |
| `< sdcard > /`              | externalRootDirectory               | sdcard                    | r/w  |  예  |   없음    | 없음 |
|    `Android/data/<app-id>/` | externalApplicationStorageDirectory | -                         | r/w  |  예  |   없음    | 없음 |
|       `cache`                     | externalCacheDirectry               | 외부 캐시                     | r/w  |  예  | 아니 * *  | 없음 |
|       `files`                     | externalDataDirectory               | 파일 외부                     | r/w  |  예  |   없음    | 없음 |

* OS 수 있습니다 정기적으로이 디렉터리에 있지만이 동작에 의존 하지 마십시오. 이 응용 프로그램이 디렉터리의 내용을 취소 합니다. 사용자 수동으로 캐시 제거 해야,이 디렉터리의 내용은 제거 됩니다.

* * OS 지워지지 않습니다이 디렉터리 자동으로; 콘텐츠를 관리 하기 위한 책임이 있습니다. 사용자 수동으로 캐시 제거 합니다, 디렉터리의 내용은 제거 됩니다.

**참고**: 외부 저장소를 탑재할 수 없는 경우는 `cordova.file.external*` 속성은`null`.

### 블랙베리 10 파일 시스템 레이아웃

| 장치 경로                                               | `cordova.file.*`            | r/w? | 영구? | OS 지웁니다 | 개인 |
|:--------------------------------------------------- |:--------------------------- |:----:|:---:|:-------:|:--:|
| `file:///accounts/1000/appdata/ < app id > /` | applicationStorageDirectory |  r   | N/A |   N/A   | 예  |
|    `app/native`                                     | applicationDirectory        |  r   | N/A |   N/A   | 예  |
|    `data/webviews/webfs/temporary/local__0`         | cacheDirectory              | r/w  | 없음  |    예    | 예  |
|    `data/webviews/webfs/persistent/local__0`        | dataDirectory               | r/w  |  예  |   없음    | 예  |
| `file:///accounts/1000/removable/sdcard`            | externalRemovableDirectory  | r/w  |  예  |   없음    | 없음 |
| `file:///accounts/1000/shared`                      | sharedDirectory             | r/w  |  예  |   없음    | 없음 |

*참고*: 모든 경로 /accounts/1000-enterprise를 기준으로 응용 프로그램 경계를 작동 하도록 배포 될 때.

## 안 드 로이드 단점

### 안 드 로이드 영구 저장 위치

안 드 로이드 장치에 영구 파일을 저장할 여러 유효한 위치가 있다. 다양 한 가능성의 광범위 한 토론에 대 한 [이 페이지][3] 를 참조 하십시오.

 [3]: http://developer.android.com/guide/topics/data/data-storage.html

플러그인의 이전 버전을 시작할 때, 장치는 SD 카드 (또는 해당 스토리지 파티션) 탑재 했다 주장 하는 여부에 따라 임시 및 영구 파일의 위치를 선택 합니다. SD 카드 마운트, 또는 큰 내부 스토리지 파티션에 사용할 수 있었습니다 (같은 넥서스 장치에) 그 후에 영구 파일 공간의 루트에 저장 됩니다. 이 모든 코르 도우 바 애플 리 케이 션 카드에 모두 사용할 수 있는 파일을 볼 수 있는 의미 합니다.

SD 카드는 사용할 수 있는 경우 이전 버전에서 데이터 저장 `/data/data/<packageId>` 는 서로 다른 애플 리 케이 션을 분리 하지만 여전히 원인 데이터를 사용자 간에 공유할 수 있습니다.

내부 파일 저장 위치 또는 응용 프로그램에서 기본 설정으로 이전 논리를 사용 하 여 파일을 저장할 것인지를 선택할 수 `config.xml` 파일. 이렇게 하려면 다음 두 줄을 중 하나를 추가 `config.xml` :

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

파일 플러그인 사용이 줄이 없으면 `Compatibility` 는 기본적으로. 기본 태그,이 이러한 값 중 하나가 아닌 경우에 응용 프로그램이 시작 되지 않습니다.

이전 (사전 1.0)을 사용 하는 경우 응용 프로그램 사용자에 게 발송 되었다 이전,이 플러그인의 버전 영구 파일 시스템에 저장 된 파일은 다음 환경 설정을 설정 해야 및 `Compatibility` . "내부"의 위치 전환 그들의 응용 프로그램을 업그레이드 기존 사용자의 그들의 장치에 따라 그들의 이전에 저장 된 파일에 액세스할 수 수 있다는 뜻입니다.

응용 프로그램은 새로운, 또는 이전 영구 파일 시스템에 파일을 저장 하는 경우는 `Internal` 일반적으로 권장 됩니다.

## iOS 단점

*   `cordova.file.applicationStorageDirectory`읽기 전용; 루트 디렉터리 내에서 파일을 저장 하려고에 실패 합니다. 다른 중 하나를 사용 하 여 `cordova.file.*` iOS에 대해 정의 된 속성 (만 `applicationDirectory` 와 `applicationStorageDirectory` 는 읽기 전용).
*   `FileReader.readAsText(blob, encoding)` 
    *   `encoding`매개 변수는 지원 되지 않습니다, 및 효과에 항상 u t F-8 인코딩을 합니다.

### iOS 영구 저장소 위치

IOS 디바이스에 영구 파일을 저장할 두 개의 유효한 위치가 있다: 문서 디렉터리 및 라이브러리 디렉터리. 플러그인의 이전 버전은 오직 문서 디렉토리에 영구 파일을 저장. 이 부작용 보다는 아니었다 수시로 특히 많은 작은 파일을 처리 하는 응용 프로그램에 대 한 의도, iTunes에 표시 모든 응용 프로그램 파일을 만드는 디렉터리의 용도 내보내기에 대 한 완전 한 문서를 생산 했다.

문서 또는 응용 프로그램에서 기본 설정으로 라이브러리 디렉토리에 파일을 저장할 것인지를 선택할 수 `config.xml` 파일. 이렇게 하려면 다음 두 줄을 중 하나를 추가 `config.xml` :

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

파일 플러그인 사용이 줄이 없으면 `Compatibility` 는 기본적으로. 기본 태그,이 이러한 값 중 하나가 아닌 경우에 응용 프로그램이 시작 되지 않습니다.

이전 (사전 1.0)을 사용 하는 경우 응용 프로그램 사용자에 게 발송 되었다 이전,이 플러그인의 버전 영구 파일 시스템에 저장 된 파일은 다음 환경 설정을 설정 해야 및 `Compatibility` . 위치를 스위칭 `Library` 기존 사용자에 게 응용 프로그램을 업그레이 드의 그들의 이전에 저장 된 파일에 액세스할 수 것을 의미할 것입니다.

응용 프로그램은 새로운, 또는 이전 영구 파일 시스템에 파일을 저장 하는 경우는 `Library` 일반적으로 권장 됩니다.

## 파이어 폭스 OS 단점

파일 시스템 API Firefox 운영 체제에서 기본적으로 지원 하지 및 indexedDB 위에 심으로 구현 됩니다.

*   비어 있지 않은 디렉터리를 제거할 때 실패 하지 않습니다.
*   디렉터리에 대 한 메타 데이터를 지원 하지 않습니다.
*   메서드 `copyTo` 및 `moveTo` 디렉터리를 지원 하지 않습니다

다음 데이터 경로 지원 됩니다: * `applicationDirectory` -를 사용 하 여 `xhr` 응용 프로그램으로 패키지 된 로컬 파일을. * `dataDirectory` -영구 응용 프로그램 특정 데이터 파일에 대 한. * `cacheDirectory` -캐시 응용 프로그램 다시 시작 해야 하는 파일 (애플 리 케이 션은 여기에 파일을 삭제 하려면 운영 체제에 의존 하지 말아야).

## 업그레이드 노트

이 플러그인의 v1.0.0에는 `FileEntry` 와 `DirectoryEntry` 구조 변경, 게시 된 사양에 맞춰 더 많은 것.

플러그인의 이전 (pre-1.0.0) 버전 저장 장치-절대--있는 파일 위치는 `fullPath` 속성의 `Entry` 개체. 이러한 경로 일반적으로 같습니다.

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

이러한 경로 또한 반환한 했다는 `toURL()` 의 메서드는 `Entry` 개체.

V1.0.0와 `fullPath` 특성은 *HTML 파일 시스템의 루트에 상대적인*파일의 경로를. 그래서, 위의 경로 지금 둘 다에 의해 대표 될 것 이라고는 `FileEntry` 개체는 `fullPath` 의

    /path/to/file
    

장치 절대 경로, 응용 프로그램 작동 하 고 이전을 통해 그 경로 검색 하는 경우는 `fullPath` 속성의 `Entry` 개체를 사용 하 여 코드를 업데이트 해야 하는 다음 `entry.toURL()` 대신.

대 한 뒤 호환성는 `resolveLocalFileSystemURL()` 장치-절대-경로, 수락할 메서드와 반환 합니다는 `Entry` 파일 중 하나에 내 존재 하는 경우, 해당 개체는 `TEMPORARY` 또는 `PERSISTENT` 파일 시스템.

이 특히 이전 장치 절대 경로 사용 하는 파일 전송 플러그인에 문제가 있다 (그리고 아직도 그들을 받아들일 수.) 파일 시스템 Url, 그래서 대체 올바르게 작동 하도록 업데이 트 되었습니다 `entry.fullPath` 함께 `entry.toURL()` 장치에 파일을 사용 하는 플러그인을 지 고 문제를 해결 해야 합니다.

V1.1.0 반환 값에서에서의 `toURL()` 변경 되었습니다 (\[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394) 참조)는 'file://' 절대 URL을 반환 합니다. 가능 하다 면. 보장 하는 ' cdvfile:'-URL을 사용할 수 있습니다 `toInternalURL()` 지금. 이 메서드 이제 양식의 파일 Url을 반환 합니다.

    cdvfile://localhost/persistent/path/to/file
    

어떤 파일을 고유 하 게 식별 하려면 사용할 수 있습니다.

## 오류 코드 및 의미의 목록

오류가 throw 됩니다 때 다음 코드 중 하나가 사용 됩니다.

| 코드 | 상수                            |
| --:|:----------------------------- |
|  1 | `NOT_FOUND_ERR`               |
|  2 | `SECURITY_ERR`                |
|  3 | `ABORT_ERR`                   |
|  4 | `NOT_READABLE_ERR`            |
|  5 | `ENCODING_ERR`                |
|  6 | `NO_MODIFICATION_ALLOWED_ERR` |
|  7 | `INVALID_STATE_ERR`           |
|  8 | `SYNTAX_ERR`                  |
|  9 | `INVALID_MODIFICATION_ERR`    |
| 10 | `QUOTA_EXCEEDED_ERR`          |
| 11 | `TYPE_MISMATCH_ERR`           |
| 12 | `PATH_EXISTS_ERR`             |

## (선택 사항) 플러그인 구성

사용 가능한 파일 시스템의 집합 플랫폼 당 구성된 될 수 있습니다. IOS와 안 드 로이드를 인식 한 <preference> 태그에 대 한 `config.xml` 는 설치 될 파일 시스템의 이름. 기본적으로 모든 파일 시스템 루트 사용할 수 있습니다.

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### 안 드 로이드

*   `files`: 응용 프로그램의 내부 파일 저장 디렉토리
*   `files-external`: 응용 프로그램의 외부 파일 저장 디렉토리
*   `sdcard`: 글로벌 외부 파일 저장 디렉토리 (이것은 SD 카드의 루트 설치 된 경우). 가지고 있어야 합니다는 `android.permission.WRITE_EXTERNAL_STORAGE` 이 사용 하는 허가.
*   `cache`: 응용 프로그램의 내부 캐시 디렉터리
*   `cache-external`: 응용 프로그램의 외부 캐시 디렉터리
*   `root`: 전체 장치 파일 시스템

안 드 로이드는 또한 "파일" 파일 시스템 내에서 "/ 문서 /" 하위 디렉토리를 나타내는 "문서" 라는 특별 한 파일을 지원 합니다.

### iOS

*   `library`: 응용 프로그램의 라이브러리 디렉터리
*   `documents`: 응용 프로그램의 문서 디렉토리
*   `cache`: 응용 프로그램의 캐시 디렉터리
*   `bundle`: 응용 프로그램의 번들; (읽기 전용) 디스크에 응용 프로그램 자체의 위치
*   `root`: 전체 장치 파일 시스템

기본적으로 라이브러리 및 문서 디렉토리 iCloud에 동기화 할 수 있습니다. 또한 2 개의 추가적인 파일 시스템을 요청할 수 있습니다 `library-nosync` 과 `documents-nosync` , 어떤 특별 한 비 동기화 디렉터리 내에서 대표는 `/Library` 또는 `/Documents` 파일 시스템.