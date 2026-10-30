# ALEKOV Security Agent 「빈」 빠른 실행 안내서

처음 사용하는 사람이 로컬 화면과 PC·Windows 상태 조회를 확인하기 위한 안내입니다. 실행 검증 기록과 미검증 범위는 [학생용 실행 설명서](STUDENT_RUNBOOK.md)에 있습니다.

## 1. 준비물과 폴더 확인

- Windows PowerShell
- Node.js 22~24. 검수 기준은 24.19.0이며, 개발자 PC에서는 `v24.21.0`으로 실행을 확인했습니다.
- 압축을 푼 `alekov-starter-0.2.11` 폴더와 그 안의 `on-client` 폴더

Node.js가 보이는지 먼저 확인합니다.

```powershell
node --version
```

`npm install`은 필요하지 않습니다. 이 시작 틀에는 외부 npm 의존성이 선언되어 있지 않습니다.

## 2. PowerShell을 연 위치 확인

아래 두 폴더 중 **현재 열어 둔 위치에 맞는 명령 하나만** 사용합니다.

```text
alekov-starter-0.2.11/        ← 프로젝트 최상위 폴더
└─ on-client/                 ← 실행 앱 폴더
   └─ tools/start-alekov.ps1
```

현재 위치는 다음 명령으로 확인할 수 있습니다.

```powershell
Get-Location
```

## 3. 앱 실행

처음에는 계정 연결 준비를 생략하고 로컬 화면을 확인하는 `-NoNativeHost`를 사용합니다.

프로젝트 최상위 폴더에서 실행할 때:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\on-client\tools\start-alekov.ps1 -NoNativeHost
```

`on-client` 폴더 안에서 실행할 때:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -NoNativeHost
```

서버가 시작되면 브라우저에서 [http://127.0.0.1:5189/](http://127.0.0.1:5189/)를 엽니다. 이 주소가 열렸다는 사실은 로컬 서버가 응답했다는 뜻입니다. SDP 서버, 계정, AI 연결 또는 AI 사건 설명의 성공을 뜻하지 않습니다.

`-NoNativeHost`는 데모 모드가 아닙니다. 계정 연결 준비만 생략하며, 사용자가 직접 조회하는 실제 PC·Windows 정보는 여전히 로컬 컴퓨터에서 읽습니다.

## 4. 첫 화면에서 확인할 것

보호 현황의 첫 영역에는 다음 카드가 있습니다.

1. **내 PC 상태**: `다시 조회`를 눌러 CPU, 메모리, 시스템 드라이브를 읽습니다.
2. **Windows 보안 상태**: `Windows 상태 조회`를 눌러 네트워크, 방화벽, System/Application 이벤트 집계를 읽습니다.
3. **보안 기록 및 알림**: `보안 기록으로 이동`을 눌러 기존 접속·XDR 기록 화면으로 이동합니다. Windows 이벤트 집계와는 별도입니다.

두 조회 카드 모두 처음에는 `조회 전`입니다. 실제 값을 얻으려면 사용자가 버튼을 직접 눌러야 합니다. CPU·메모리·디스크 값은 실행한 PC마다 다르고, Windows 이벤트 건수는 공격이나 침해를 확정하지 않습니다. 조회 실패는 `확인 불가`와 오류 안내로 표시되며, 로그 조회 실패를 0건으로 해석하면 안 됩니다.

`npm.cmd run demo`는 예제 자료를 표시하는 데모 모드입니다. 실제 PC 측정, SDP 연결, AI 연결의 성공을 증명하지 않습니다.

## 5. 자주 막히는 경우

| 증상 | 할 일 |
| --- | --- |
| `-File` 인수에서 `.\tools\start-alekov.ps1`을 찾지 못함 | 프로젝트 최상위에서는 `.\on-client\tools\start-alekov.ps1`을 사용합니다. 또는 `on-client` 폴더로 이동합니다. |
| Node.js를 찾지 못함 또는 22~24 밖의 버전 | Node.js 24.19.0을 설치한 뒤 새 PowerShell 창에서 다시 실행합니다. |
| 5189 포트를 사용 중이라고 표시 | 다른 프로그램을 임의로 종료하지 말고 명령 끝에 `-Port 5190`을 추가하고 `http://127.0.0.1:5190/`을 엽니다. |
| 화면에 `연결 없음` | 기본 SDP 서버·에이전트 연결이 설정되지 않은 상태일 수 있습니다. 로컬 서버 시작 성공과 혼동하지 않습니다. |
| PC 또는 Windows 조회 실패 | 실패한 항목의 안내를 읽고 설정을 바꾸지 말고 다시 조회합니다. |

## 6. 종료

실행 중인 PowerShell 창에서 `Ctrl+C`를 누릅니다. `-Background`로 실행했다면 시작 도구가 알려 준 Node 프로세스 번호를 작업 관리자에서 종료합니다.

## 7. 검증 기록

개발자 PC 실행과 Codex 별도 폴더 재현의 상세 기록, 그리고 아직 확인하지 않은 브라우저·사용성 항목은 [학생용 실행 설명서](STUDENT_RUNBOOK.md)를 참고하세요. 다른 사람의 독립 실행 결과는 아직 검증 대기입니다.
