# ALEKOV Security Agent 「빈」 학생용 실행 설명서

이 문서는 `ALEKOV Security Agent 「빈」`의 실행 위치, 제공 코드와 학생 코드의 경계, 화면 기능과 문제 확인 방법을 설명합니다. 실행 프로젝트의 실제 패키지 버전은 **0.2.14**입니다. 상위 폴더 이름 `alekov-starter-0.2.11`은 이전 배포 폴더 이름이므로 제품 버전으로 사용하지 않습니다.

## 1. 목적과 사용자

이 프로젝트는 회사 사용자가 자신의 ZTNA 접근 판정, 기기·세션 상태, 최근 접속 기록과 XDR 사건을 확인하도록 돕는 로컬 보안 화면입니다.

- 업무 앱 접속 판정은 허용·거부·추가 확인 등의 서버 정책 결과를 보여 줍니다. 허용은 실제 업무 앱 접속 성공을 보장하지 않습니다.
- 사건 화면은 현재 서버가 전달한 본인 범위의 기록과 이미 저장된 XDR 경보를 보여 줍니다. 새 탐지를 실행하지 않습니다.
- AI 연결 점검, 사건 설명, 조치 제안은 연결·근거·사람 확인·원천 결과를 구분해 표시합니다. 화면 표시만으로 실제 조치가 실행되거나 사건이 해결되지는 않습니다.
- 패키지 취약점 화면은 제공 서버가 승인된 공개 패키지와 lockfile을 바탕으로 조회한 OSV 결과를 표시합니다. 학생 화면이 lockfile을 직접 읽거나 OSV에 직접 요청하지 않습니다.

## 2. 실행 위치와 준비물

Git 저장소 최상위는 `alekov-starter-0.2.11`이고, 실행 명령은 그 아래 `on-client`에서 실행합니다.

```text
alekov-starter-0.2.11/       # Git 저장소 최상위
└─ on-client/                # 실행 프로젝트
   ├─ package.json
   ├─ tools/start-alekov.ps1
   ├─ src/server.mjs
   ├─ public/
   └─ student/
```

필요한 런타임은 Node.js입니다. `package.json`의 기준 버전은 `24.19.0`이며, 시작 도구는 Node.js 22~24을 허용합니다. 이 작업 폴더에서 확인한 런타임은 Node.js `v24.21.0`, npm.cmd `11.19.0`입니다.

이 환경에서는 PowerShell의 `npm` 별칭이 실행 정책 때문에 차단될 수 있습니다. 그 경우 `npm.cmd`를 사용합니다. 의존성을 새로 설치하거나 패키지 버전을 바꾸지 마세요.

현재 `on-client`에는 `package-lock.json`과 다른 npm lockfile이 없습니다. 패키지 취약점 조회는 학생 함수가 이 파일을 만들거나 직접 읽는 방식이 아니라, 제공 서버가 설정된 프로젝트의 lockfile을 검증해 전달한 결과만 표시합니다.

## 3. 실행·종료·재실행

`on-client` 폴더에서 PowerShell을 열고 다음 명령을 실행합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

기본 주소는 [http://127.0.0.1:5189/](http://127.0.0.1:5189/)입니다. 이 명령의 `-ExecutionPolicy Bypass`는 해당 실행에만 적용되며 PC 전체 실행 정책을 바꾸지 않습니다.

대체 포트, 예제 모드, 연결 없이 화면을 확인하는 모드는 다음과 같습니다.

```powershell
# 포트 5190 사용
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Port 5190

# 예제 자료로 실행: 실제 연결이나 실제 보안 결과가 아님
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Demo

# 계정 연결 기능 없이 로컬 화면 확인
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -NoNativeHost
```

서버만 직접 시작할 때는 다음 스크립트를 사용합니다.

```powershell
npm.cmd start
# 또는 예제 모드
npm.cmd run demo
```

시작 도구가 브라우저 주소를 출력한 것은 로컬 서버가 응답했다는 뜻입니다. 기존 서버 연결, 로그인, AI 연결 또는 AI 사건 설명의 성공을 뜻하지 않습니다.

종료하려면 실행 중인 PowerShell 창에서 `Ctrl+C`를 누릅니다. 같은 `on-client` 폴더에서 같은 시작 명령을 다시 실행하면 재실행할 수 있습니다. `-Background`로 시작했다면 도구가 출력한 프로세스 번호의 `node` 프로세스를 작업 관리자에서 종료합니다.

## 4. 설정과 연결 상태

`.env.example`에는 포트, 엔진 어댑터 경로, AI 모델 이름과 공개 패키지 조회 예시만 있습니다. 이 프로젝트는 `.env.example`을 자동으로 읽는다고 문서화되어 있지 않으므로, 파일을 복사하거나 값을 추가해 연결을 우회하지 마세요.

기본 실행에서 다음 상태는 실제 연결 성공이 아닙니다.

| 화면 상태 | 의미 |
| --- | --- |
| `demo` | 예제 자료입니다. |
| `disconnected` | 기존 서버 또는 연결 어댑터가 연결되지 않았습니다. |
| `unknown` / 확인 불가 | 결과를 판단할 수 없습니다. |
| `connected` | 해당 시각의 제공 연결 상태입니다. AI 설명 또는 원천 조치 성공을 뜻하지 않습니다. |

개인 인증 설정, 토큰, API 키, 비밀번호, native host 설정 파일과 SDP 설정 파일은 저장소·채팅·Git 커밋에 넣지 않습니다. 담당자가 별도 설정 파일을 제공한 경우에만 시작 도구의 `-NativeHostConfig` 또는 `-SdpHostConfig` 옵션을 사용합니다. 설정의 실제 내용은 이 문서에 기록하지 않습니다.

## 5. 시스템 구성도

```text
브라우저 (http://127.0.0.1:5189)
  ├─ public/index.html, public/app.js
  │    ├─ 제공 UI: 메뉴, 요청 시작/취소, 세대(generation) 보호, 상태 관리
  │    └─ 학생 UI: student/extension.mjs 의 render* 함수
  │
  └─ HTTP API ──> 로컬 Node 서버 (src/server.mjs, 127.0.0.1)
                       ├─ 엔진 로더/어댑터: src/engine.mjs
                       │                     student/engine-adapter.mjs
                       │                     └─ 기존 접속·ZTNA·XDR 데이터 소스(연결된 경우)
                       ├─ AI 연결·사건 설명·조치 상태: 제공 서버 경로와 제공 UI
                       └─ 패키지 조회: src/vulnerabilities/project-scan.mjs
                                             └─ 승인된 공개 패키지에 한해 OSV querybatch
```

`public/vulnerabilities-view.mjs`는 제공된 패키지 조회 응답을 정규화해 공통 화면에 표시합니다. `public/app.js`는 새 요청 시 이전 응답이 현재 화면을 덮지 않도록 요청 취소와 generation 검사를 담당합니다.

## 6. 제공 코드와 학생 작성 코드

제공 코드는 서버, 엔진 연결, 인증·연결 관리, API 요청·취소, 정책 판정, OSV 조회와 공통 UI를 담당합니다. 다음 파일은 제공 코드이며 수정 대상이 아닙니다.

- `src/server.mjs`, `src/engine.mjs`, `src/vulnerabilities/project-scan.mjs`
- `public/app.js`, `public/vulnerabilities-view.mjs`, `public/index.html`
- `tools/start-alekov.ps1`, `.env.example`
- `student/engine-adapter.mjs`의 연결 어댑터 계약

학생 화면 구현은 `student/extension.mjs`의 다음 렌더 함수입니다.

| 함수 | 화면 책임 |
| --- | --- |
| `renderIdentity` | 로그인 사용자, 기기, 세션 상태 |
| `renderDecision` | 업무 앱 접속 판정 |
| `renderEvents` | 최근 접속/XDR 기록, 필터, 상세 |
| `renderStatus` | 알림, 기기·세션, 진단 정보 |
| `renderVulnerabilities` | 설치 패키지·OSV 조회 결과 |
| `renderAiConnection` | AI 연결 점검 상태 |
| `renderExplanation` | 사건별 AI 설명, 근거, 제안 |
| `renderAction` | 조치 준비·확인·원천 결과 상태 |

학생 함수는 전달받은 입력을 안전한 DOM 텍스트로 표시합니다. 새 API 호출, 자동 재시도, 인증 우회, AI 모델 선택, 패키지 설치·변경, 실제 보안 조치 실행은 학생 함수의 역할이 아닙니다.

## 7. 화면 기능과 지원 범위

1. **보호 현황**: 로그인한 사용자, 기기 준수 여부, 세션 상태, 알림과 진단 정보를 표시합니다.
2. **업무 앱**: 선택한 앱에 대한 서버의 ZTNA 정책 판정을 표시합니다.
3. **보안 기록**: 현재 서버가 전달한 최근 기록(최대 관측 범위 내)을 보고, 필터·상세·근거·규칙을 확인합니다.
4. **AI 연결과 설명**: 연결 점검과 사건 설명을 별도로 보여 줍니다. 연결 점검 성공은 사건 설명 성공이 아닙니다.
5. **조치 제안**: AI 제안, 사람 확인, 서버 접수, 원천 관측 결과를 분리합니다. `pending`은 완료가 아니고, `unknown`은 성공·실패·효과 없음의 판정이 아닙니다.
6. **패키지 취약점**: 정확한 설치 버전과 OSV 조회 시각·출처·부분 결과를 표시합니다. `none_found`는 조회 범위에서 알려진 항목이 없다는 뜻이며 전체 보안을 보장하지 않습니다.

현재 지원 범위는 제공 서버가 연결·승인·검증해 전달하는 데이터입니다. 연결 없음, 예제 자료, 권한 대기, 오류, 시간 초과, 취소와 확인 불가 상태는 실제 성공으로 해석하지 않습니다.

## 8. 오류와 확인 방법

| 증상 또는 코드 | 먼저 할 일 | 다음 단계 |
| --- | --- | --- |
| Node.js 없음 또는 버전 오류 | Node.js 24.19.0을 설치하고 새 PowerShell을 엽니다. | 다시 시작합니다. |
| 포트 5189 사용 중 | 기존 프로그램을 임의로 종료하지 말고 `-Port 5190`으로 시작합니다. | 브라우저도 `:5190`으로 엽니다. |
| 앱 폴더가 아님 / 링크 폴더 오류 | 실제 `on-client` 폴더에서 시작했는지 확인합니다. | 시작 도구를 다시 실행합니다. |
| `disconnected`, `ENGINE_NOT_CONNECTED` | 기존 서버/연결 어댑터 상태를 확인합니다. | 제공된 연결 안내 또는 담당자 안내를 따릅니다. |
| `CONTRACT_MISMATCH`, `*_UNVERIFIED`, `unknown` | 결과를 성공·정상·안전으로 판단하지 않습니다. | 화면의 다시 불러오기 또는 결과 조회를 사용하고 계속되면 진단 정보를 담당자에게 전달합니다. |
| `TIMEOUT`, 네트워크 오류, 취소 | 이전 결과를 현재 결과로 보지 않습니다. | 자동 재시도 없이 사용자가 직접 다시 시도합니다. |
| AI 인증/권한 오류 | 계정 연결과 앱 권한을 확인하고 담당자에게 문의합니다. | API 키나 Workbench 열쇠를 직접 입력하지 않습니다. |
| 패키지 조회 `not_checked`/`not_configured`/`unverifiable` | 취약 항목 없음으로 판단하지 않습니다. | 제공 UI에서 설정·승인 상태를 확인하거나 직접 다시 조회합니다. |

오류 코드별 상세 설명은 [CONNECTION_TROUBLESHOOT.md](CONNECTION_TROUBLESHOOT.md)에 있습니다. 도움이 필요하면 화면의 진단 정보 기능으로 표시된 범위만 직접 확인해 전달합니다. 비밀값, 전체 환경 설정, 인증 헤더는 전달하지 않습니다.

## 9. 점검과 제출 전 확인

학생 렌더 함수의 문법 점검은 다음 명령으로 실행합니다.

```powershell
npm.cmd run check
```

실행 점검과 ALEPH 공식 판정은 다릅니다. 로컬 화면이나 예제 모드의 결과만으로 실제 연결·AI 호출·원천 조치·공식 제출 성공을 주장하지 않습니다. Git 커밋과 제출 절차는 수업 포털의 현재 안내를 따릅니다.

## 10. 관련 제공 문서

- [README.md](../README.md): 시작 틀 개요
- [STUDENT_LAUNCH_GUIDE.md](STUDENT_LAUNCH_GUIDE.md): 시작 도구의 상세 사용법
- [GETTING_STARTED_STUDENT.md](GETTING_STARTED_STUDENT.md): 단계 진행 안내
- [CONNECTION_TROUBLESHOOT.md](CONNECTION_TROUBLESHOOT.md): 연결·AI·조회 오류 코드
- [IMPLEMENTATION_CONTRACT.md](IMPLEMENTATION_CONTRACT.md): HTTP·표시 계약
- [STUDENT_PROMPTS.md](STUDENT_PROMPTS.md): 단계별 학생 구현 요구사항
