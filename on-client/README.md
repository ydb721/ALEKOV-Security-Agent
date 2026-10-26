# 내 보안 Agent 시작 틀 0.2.14

이 보안 Agent는 회사 직원이 자기 로그인 상태, 업무 앱 접속 결과, 최근 접속 기록과 보안 경보를 보는 보안 앱입니다. 13단계부터 22단계까지 이 프로젝트 하나로 화면을 채워 가며 완성합니다. 처음이라면 docs/GETTING_STARTED_STUDENT.md부터 읽습니다. 무엇을 왜 만드는지와 단계별 순서가 그 문서에 있습니다.

이 시작 틀을 받은 것만으로 단계를 통과하지 않습니다. 단계마다 docs/STUDENT_PROMPTS.md의 안내를 수업용 AI에 붙여 넣어 student/extension.mjs를 고치고, 화면에서 확인하고, 커밋한 뒤 ALEPH에 제출합니다. 제출하면 서버가 그 커밋의 코드를 받아 AI가 단계 과제 기준으로 읽고 판정합니다. 코드를 실행해서 판정하지 않습니다.

## 켜기

검수 환경은 Node.js 24.19.0이며 외부 npm 의존성이 없습니다. 이 폴더의 PowerShell에서 아래를 실행하고 PC 브라우저로 http://127.0.0.1:5189 를 엽니다. 자세한 켜기·끄기·다시 켜기는 docs/STUDENT_LAUNCH_GUIDE.md에 있습니다.

    powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1

npm start도 같은 서버를 켭니다. 기본 실행은 실제 회사 시스템(기존 엔진)에 연결되지 않은 상태입니다. npm run demo는 예제 자료로 화면을 보여 줄 뿐이며 실제 연결이나 성취가 아닙니다. npm run check는 student/extension.mjs의 문법만 확인합니다.

## 지킬 것

- 기존 1~3차 프로젝트와 학생 파일은 지우거나 덮어쓰지 않습니다. 새 폴더에서 시작하거나, 이미 하던 프로젝트를 이어 씁니다.
- AI 열쇠·비밀번호·토큰을 코드, 커밋, 캡처, 도움정보에 넣지 않습니다. 주소나 열쇠를 직접 입력하는 칸도 만들지 않습니다.
- .env.example에는 비밀 없는 설정만 있습니다.

## 더 읽을 곳

- 단계별 안내와 AI에 붙여 넣을 문장: docs/STUDENT_PROMPTS.md
- 단계별 확인 항목: docs/CURRICULUM.json, docs/IMPLEMENTATION_CONTRACT.md
- 오류 코드별 해결: docs/CONNECTION_TROUBLESHOOT.md
- 시작 틀 업데이트(내 파일 보존): docs/STARTER_UPDATE.md
- 실제 회사 시스템(SDP)·앱 안 AI 연결은 담당자가 따로 안내할 때만 씁니다: docs/SDP_HOST_CONNECTION.md, docs/AI_SETUP_GUIDE.md. 이 연결은 앱을 처음 켜고 13~16단계 화면을 만들거나 공식 AI 코드 판정을 받기 위한 전제 조건은 아닙니다. 다만 17단계 이후의 실제 연결과 새 환경 재현은 해당 단계의 기준에 따라 따로 확인합니다.

## 학생 작성 문서 및 구현 현황

**ALEKOV Security Agent 「빈」**은 회사 직원이 본인 계정·기기·업무 앱 접근 판정·보안 기록을 확인하는 ZTNA/XDR 보안 Agent입니다. 학생 구현은 `student/extension.mjs`의 다음 8개 렌더 함수로 구성됩니다.

- `renderIdentity`: 로그인 사용자·기기·세션 상태
- `renderDecision`: 업무 앱 접근 판정
- `renderEvents`: 접속·XDR 기록, 필터와 상세
- `renderStatus`: 알림, 기기·세션, 진단 정보
- `renderVulnerabilities`: 설치 패키지와 OSV 조회 결과
- `renderAiConnection`: AI 연결 점검 상태
- `renderExplanation`: 사건별 AI 설명·근거·제안
- `renderAction`: 조치 제안, 사람 확인, 원천 처리 결과 상태

구성은 브라우저 → 로컬 앱 서버 → 제공 엔진·AI·OSV 연동 경계입니다. 실제 연결, AI 설명, 원천 조치, OSV 조회는 제공 서버가 연결·승인·검증해 전달한 결과로만 확인합니다. `demo`는 예제 자료이며 실제 보안 시스템 연결 성공을 뜻하지 않습니다.

시작 틀 버전은 **0.2.14**이고, Node.js 검수 기준은 **24.19.0**입니다. 이 작업 환경에서 확인한 Node.js 버전은 **v24.21.0**입니다. `on-client` 폴더에서 예제 화면을 실행하려면 다음 명령을 사용합니다.

```powershell
npm.cmd run demo
```

실행, 구성, 오류 해결과 지원 범위의 상세 설명은 [학생용 실행 설명서](docs/STUDENT_RUNBOOK.md)를 참고하세요.

최종 재현 기록과 인수인계 계획은 [STUDENT_RELEASE_RECORD.md](docs/STUDENT_RELEASE_RECORD.md)를 참고하세요.
