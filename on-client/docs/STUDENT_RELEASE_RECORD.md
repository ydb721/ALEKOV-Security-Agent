# ALEKOV Security Agent 「빈」 최종 재현 기록 및 인수인계

## 1. 문서 목적과 기준

이 문서는 ALEKOV Security Agent 「빈」의 학습 과제용 최종 인수인계 기록입니다. 기능을 새로 구현하거나 운영 연결을 인증하는 문서가 아닙니다. 공식 ALEPH 판정은 제출 원문을 읽는 검토이며, 공식 서버가 앱을 실행해 운영 동작을 보증하는 절차가 아닙니다.

- 재현 시험 기준 커밋: `a5f8a8af61aa3f597b3e887de28236e0091c69be`
- 기준 브랜치: `main`
- 프로젝트 버전: `0.2.14`
- 기준 날짜와 시간대: 2026-10-26, KST
- 기록 시점의 정확한 시각: 확인하지 않아 기재하지 않음

이 기준 커밋은 이 문서 작성 **이전**의 재현 대상입니다. 이 문서가 새 커밋에 포함된 뒤에는 그 새 최종 커밋을 별도 폴더에서 다시 checkout하여 검증해야 합니다. 아직 만들어지지 않은 최종 커밋 해시는 이 문서에 적지 않습니다.

## 2. 릴리스 개요와 시스템 경계

이 프로젝트는 회사 직원이 본인 범위의 계정·기기·세션, 업무 앱 ZTNA 접근 판정, 최근 접속 기록과 XDR 사건을 확인하도록 돕는 로컬 보안 Agent입니다. AI 연결 점검·사건 설명·조치 제안 상태와 설치 패키지의 OSV 조회 결과도 표시합니다.

```text
Chrome 브라우저
  └─ http://127.0.0.1:5189/
       ├─ 제공 UI: public/index.html, public/app.js
       └─ 학생 표시: student/extension.mjs
              │
              ▼
로컬 Node 앱 서버: src/server.mjs (127.0.0.1)
  ├─ 엔진 경계: src/engine.mjs, student/engine-adapter.mjs
  │    └─ 연결된 경우에만 기존 ZTNA/XDR 데이터 소스
  ├─ AI 연결·사건 설명·조치 상태: 제공 연결·권한 경계
  └─ 패키지 조회: src/vulnerabilities/project-scan.mjs
       └─ 승인된 공개 패키지에 한한 OSV querybatch
```

`public/app.js`는 요청 시작·취소와 generation 보호를, `public/vulnerabilities-view.mjs`는 취약점 응답 정규화를 담당합니다. 학생 구현은 `student/extension.mjs`의 렌더 함수에 한정됩니다. 학생 렌더 함수는 새 API 호출, 자동 재시도, 인증 우회, 패키지 설치·변경, 실제 보안 조치를 수행하지 않습니다.

`demo`는 예제 자료이며 실제 ZTNA/XDR, AI, SDP 또는 OSV 연결 성공이 아닙니다. `disconnected`, `unknown`, 오류, 취소, 시간 초과 역시 성공이나 빈 정상 결과로 해석하지 않습니다.

## 3. 재현 시험 기록

### 3.1 원본 보존 확인

사용자가 2026-10-26 KST에 확인한 원본 저장소 기록입니다.

| 항목 | 관찰 결과 |
| --- | --- |
| 브랜치 | `main` |
| HEAD | `a5f8a8af61aa3f597b3e887de28236e0091c69be` |
| 작업 트리 | `nothing to commit, working tree clean` |

### 3.2 별도 재현용 복제

사용자는 원본을 수정하지 않고 별도 폴더에 다음 명령으로 복제했습니다. 아래 절대 경로는 당시 Windows 환경의 **증거 기록**이며 이동 절차의 필수 경로가 아닙니다.

```powershell
git clone --branch main https://github.com/ydb721/ALEKOV-Security-Agent.git "C:\Users\Administrator\Desktop\SKT_p\Aleph_Hackathon\alekov-stage22-repro"
```

관찰 결과는 Git 객체 수신 완료, 지정 커밋의 `git switch --detach` 성공, `git rev-parse HEAD`의 기준 커밋 일치, `HEAD detached at a5f8a8a`, `nothing to commit, working tree clean`입니다. 재현용 저장소는 검증 증거이며 이 문서 작성 중 수정하지 않았습니다.

### 3.3 재현 환경과 명령

재현용 저장소의 `on-client`에서 사용자가 확인한 환경과 결과입니다.

| 항목 | 결과 |
| --- | --- |
| Node.js | `v24.21.0` |
| npm.cmd | `11.19.0` |
| `package.json` 버전 | `0.2.14` |
| `start` | `node src/server.mjs` |
| `demo` | `node src/server.mjs --demo` |
| `check` | `node --check student/extension.mjs` |
| `package-lock.json` | 없음 |
| `npm install` | 실행하지 않음; 외부 npm 런타임 의존성 없음 |
| `npm.cmd run check` | 정상 종료, 오류 메시지 없음 |

사용자가 실행한 예제 서버 명령과 관찰 출력은 다음과 같습니다.

```powershell
npm.cmd run demo
```

```text
> alekov-client-starter@0.2.14 demo
> node src/server.mjs --demo

케셰브 예제: http://127.0.0.1:5189
```

이는 예제 서버 시작 확인입니다. 실제 회사 SDP, 실제 AI 연결·설명 생성, 실제 원천 조치, 실제 OSV 조회 성공을 검증한 기록이 아닙니다.

### 3.4 Chrome 관찰과 종료·재시작

사용자가 2026-10-26 KST Chrome에서 `http://127.0.0.1:5189/`를 열어 확인한 범위는 다음뿐입니다.

- 「보호 현황」과 공통 UI가 표시됨
- 학생 `renderIdentity`, `renderStatus` 표시가 보임
- 예제 로그인 사용자와 기기·세션 정보가 보임
- 상단에 `예제 데이터(demo) · 실제 연결 아님` 안내가 보임
- `unknown` 상태가 정상 상태로 바뀌지 않음

이후 사용자는 서버 창에서 `Ctrl+C`를 입력했고 PowerShell 프롬프트 복귀를 확인했습니다. 같은 복제 폴더에서 `npm.cmd run demo`를 다시 실행하여 동일한 예제 서버 시작 출력을 확인했습니다. 재시작 직후의 브라우저 화면은 다시 확인하지 않았으므로 미검증입니다. 보호 현황 밖의 모든 화면이 정상 동작했다고 추정하지 않습니다.

## 4. 13~21단계 누적 기능과 판정 기록

아래의 “공식 ALEPH 판정”은 사용자가 제공한 13~21단계 **통과** 기록입니다. 이는 제출 원문 검토의 통과이며 실제 서버·AI·SDP 운영 검증과 다릅니다. 정확한 단계별 통과 시각은 제공되지 않아 적지 않습니다.

| 단계 | 구현 기능 또는 문서 | 학생 구현 파일/함수 | 공식 ALEPH 판정 | 로컬 검증 범위 | 날짜·증거 종류 | 미검증 또는 제한 |
| --- | --- | --- | --- | --- | --- | --- |
| 13 | 로그인·기기·세션 상태 | `student/extension.mjs` / `renderIdentity` | 통과 | 이전 단계 합성 DOM 기록, 이번 demo 브라우저 표시 | 이전 단계 기록; 2026-10-26 demo 화면 | 실제 계정·기기·세션 연결 미검증 |
| 14 | 업무 앱 접근 판정 | `student/extension.mjs` / `renderDecision` | 통과 | 이전 단계 합성 DOM 기록 | 정확한 시각 미기록 | 실제 업무 앱 접속·정책 연결 미검증 |
| 15 | 접속·XDR 기록, 필터·상세 | `student/extension.mjs` / `renderEvents` | 통과 | 이전 단계 합성 DOM 기록 | 정확한 시각 미기록 | 실제 XDR 원천·전체 직원 기록 조회 미검증 |
| 16 | 알림·기기·세션·진단 | `student/extension.mjs` / `renderStatus` | 통과 | 이전 단계 합성 DOM 기록, 이번 demo 브라우저 표시 | 이전 단계 기록; 2026-10-26 demo 화면 | 실제 진단·연결 오류 회복 미검증 |
| 17 | AI 연결 점검 | `student/extension.mjs` / `renderAiConnection` | 통과 | 이전 단계 합성 DOM 기록 | 정확한 시각 미기록 | 실제 AI 인증·모델 호출 미검증 |
| 18 | 근거 기반 AI 사건 설명 | `student/extension.mjs` / `renderExplanation` | 통과 | 이전 단계 합성 DOM 기록 | 정확한 시각 미기록 | 실제 AI 설명 생성·원천 근거 대응 미검증 |
| 19 | 조치 제안과 원천 처리 상태 | `student/extension.mjs` / `renderAction` | 통과 | 이전 단계 합성 DOM 기록 | 정확한 시각 미기록 | 실제 사람 확인·원천 조치·효과 관측 미검증 |
| 20 | 설치 패키지·OSV 결과 표시 | `student/extension.mjs` / `renderVulnerabilities` | 통과 | 이전 단계 합성 DOM 기록 | 정확한 시각 미기록 | 실제 공개 패키지 OSV 조회 미검증 |
| 21 | 실행 설명서·구성도 | `README.md`, `docs/STUDENT_RUNBOOK.md` | 통과 | 문서·링크 정적 확인 | 정확한 시각 미기록 | 다른 PC의 독립 문서 재현 미검증 |

## 5. 이동 가능한 실행 및 인수인계 절차

다른 Windows 환경에서는 기존 폴더를 덮어쓰지 말고 새 빈 폴더에서 시작합니다. 다음은 개인 절대경로에 의존하지 않는 예시입니다.

```powershell
# 새 빈 상위 폴더에서
git clone --branch main https://github.com/ydb721/ALEKOV-Security-Agent.git alekov-stage22-repro
Set-Location .\alekov-stage22-repro
git switch --detach a5f8a8af61aa3f597b3e887de28236e0091c69be
git rev-parse HEAD
git status --short

Set-Location .\on-client
node --version
npm.cmd --version
Get-Content .\package.json -Raw
npm.cmd run check
npm.cmd run demo
```

브라우저에서 `http://127.0.0.1:5189/`를 열고, 예제 모드임을 확인합니다. 종료하려면 서버를 실행한 PowerShell 창에서 `Ctrl+C`를 누릅니다. 재실행은 같은 `on-client` 폴더에서 `npm.cmd run demo`를 다시 실행합니다.

`package.json`에는 외부 npm 런타임 의존성이 없고 현재 `package-lock.json`도 없으므로, 이 재현 기록에서는 `npm install`을 실행하지 않았습니다. 향후 `package.json` 또는 의존성 정책이 달라지면 설치 필요 여부를 그 시점의 공식 파일 기준으로 다시 판단해야 합니다.

이 절차는 예제 모드 기준입니다. 사용자 계정 승인, AI 연결 승인, 회사 SDP 연결, 외부 데이터 원천의 복구는 Git 복제만으로 자동 복구되지 않으며 별도 공식 절차와 재승인이 필요합니다. 이번 재현 시험에서는 `tools/start-alekov.ps1`을 직접 실행해 성공을 확인하지 않았습니다.

## 6. 데이터 보존·백업·복원 계획

### 6.1 Git으로 보존하는 항목

Git과 원격 저장소에는 다음의 비밀 없는 원문을 보존합니다.

- 학생 구현 코드 `student/extension.mjs`
- README와 학생 문서
- `.env.example` 같은 비밀 없는 설정 예시
- 제공 파일과 버전·커밋 기록

백업은 원격 Git 저장소와 제출한 커밋 기록을 사용합니다. 복원은 검증된 커밋을 새 빈 폴더에 clone/checkout하고 `git rev-parse HEAD`, `git status`, `package.json` 버전으로 확인합니다. 이 계획은 코드·문서 복원 계획이며, 이번 작업에서 원격 백업 복구 자체를 새로 실행한 것은 아닙니다.

### 6.2 Git으로 자동 복구되지 않는 항목

실제 코드와 시작 도구 기준으로 다음 항목은 Git 복제로 자동 복구되지 않거나 외부 시스템이 책임집니다.

- 시작 도구가 Windows 사용자 홈의 프로젝트별 `.aleph-keshev-*` 경로에 준비하는 native 설정·registry·vault
- 개인 계정 연결과 승인 결과, AI 앱 권한·자격 정보
- 외부 SDP 시스템의 사용자별 기기·세션·접속·XDR 원천 데이터
- 외부 AI 서비스의 승인·운영 상태와 실제 설명 결과
- `ON_PROJECT_DIRECTORY`가 가리킬 수 있는 외부 프로젝트의 lockfile과 공개 패키지 조회 승인 목록

개인 설정·인증서·개인키·토큰·비밀번호는 프로젝트·Git·제출물에 넣지 않으며, 기존 프로젝트에서 새 프로젝트로 무단 복사하지 않습니다. 외부 원천 데이터의 보존 기간, 백업 방식과 복구 가능 여부는 이 저장소에서 확인하지 못했으므로 임의로 정하지 않습니다.

### 6.3 복구 절차와 한계

1. Git 원격 저장소에서 검증된 커밋을 새 폴더로 복제합니다.
2. HEAD·작업 트리·프로젝트 버전·Node/npm 버전을 확인합니다.
3. 문법 검사와 예제 모드 실행을 다시 수행합니다.
4. 필요한 경우 담당자의 공식 절차로 개인 계정 연결·AI 승인·SDP 연결을 새로 확인합니다.
5. 외부 데이터 원천의 상태는 해당 신뢰된 시스템에서 별도로 확인합니다.
6. 복구 뒤 실제 API 상태와 화면 결과를 재검증합니다.

위는 복구 계획입니다. 외부 데이터 백업·복원, 개인 자격 재승인, 실제 API 재검증의 성공은 이번 작업에서 검증하지 않았습니다.

## 7. 지원 범위와 미검증 항목

현재 원문이 지원하는 표시 기능은 13~20단계의 계정·기기·세션·접근 판정·기록·진단·AI 연결·근거 기반 설명·조치 상태·패키지 취약점 결과와 21단계 문서입니다. 버전은 `0.2.14`이고 Node.js 검수 기준은 `24.19.0`입니다.

이번 사용자 재현 환경은 Windows PowerShell과 Chrome, Node.js `v24.21.0`, npm.cmd `11.19.0`입니다. `package-lock.json`은 없으며, 예제 모드의 보호 현황에서 일부 학생 렌더링만 브라우저로 확인했습니다.

다음은 미검증 또는 운영 지원 범위 밖입니다.

- 실제 회사 SDP 연결과 실제 사용자·기기·접근·XDR 원천 데이터
- 실제 AI 연결, 모델 호출, 사건 설명 생성과 AI 권한
- 실제 조치 집행, 사람 확인, 원천 시스템의 효과 관측
- 설치 패키지 OSV 실제 조회 성공
- 재시작 뒤 브라우저 화면 재확인
- 서로 다른 PC에서의 독립 실행
- 문서 작성 후 생성될 최종 커밋의 별도 복제·checkout 재현

따라서 22단계 문서는 v1.0 운영 인증이 아니라 학습 과제의 최종 원문·재현 기록입니다. 공식 단계 통과와 운영 서비스 검증을 같은 의미로 사용하지 않습니다.

## 8. 인수인계 체크리스트

- [ ] 새 문서 커밋을 만들기 전 `git diff --check`와 `git status --short`를 확인한다.
- [ ] 새 문서 커밋 뒤 생성된 **새 HEAD**를 기록한다. 이 문서의 재현 기준 커밋과 혼동하지 않는다.
- [ ] 새 빈 폴더에서 새 HEAD를 clone/checkout한다.
- [ ] `node --version`, `npm.cmd --version`, `npm.cmd run check`를 다시 확인한다.
- [ ] `npm.cmd run demo`로 예제 서버를 실행하고 브라우저 화면을 별도로 기록한다.
- [ ] 실행 코드와 제공 파일이 문서 커밋에서 바뀌지 않았는지 `git diff`로 확인한다.
- [ ] 실제 SDP·AI·조치·OSV 연결을 검증하려면 담당자의 공식 권한·연결 절차를 사용한다.
- [ ] 비밀값·개인 설정·외부 원천 데이터를 Git 또는 제출물에 넣지 않는다.

## 9. 관련 문서

- [README.md](../README.md): 시작 틀과 학생 구현 요약
- [STUDENT_RUNBOOK.md](STUDENT_RUNBOOK.md): 실행·구성·오류 안내
- [STUDENT_LAUNCH_GUIDE.md](STUDENT_LAUNCH_GUIDE.md): 시작 도구 사용법
- [GETTING_STARTED_STUDENT.md](GETTING_STARTED_STUDENT.md): 단계별 학습 흐름
- [IMPLEMENTATION_CONTRACT.md](IMPLEMENTATION_CONTRACT.md): 제공 HTTP·표시 계약
- [CONNECTION_TROUBLESHOOT.md](CONNECTION_TROUBLESHOOT.md): 오류 코드별 확인 방법
