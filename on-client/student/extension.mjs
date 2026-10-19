// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions }) {
      const root = document.createElement('div');

      const modeLabel = (mode) => ({
        connected: '연결됨',
        demo: '예제 자료 · 실제 연결 아님',
        disconnected: '연결 없음',
        unknown: '연결 상태 확인 불가',
      })[mode] || '연결 상태 확인 중';

      const deviceLabel = (status) => ({
        compliant: '보안 기준 충족 (compliant)',
        noncompliant: '보안 기준 미충족 (noncompliant)',
        unknown: '확인 불가 (unknown)',
      })[status] || '확인 불가';

      const sessionLabel = (status) => ({
        active: '활성 (active)',
        expired: '만료 (expired)',
        revoked: '철회됨 (revoked)',
        unknown: '확인 불가 (unknown)',
      })[status] || '확인 불가';

      const line = (label, value) => {
        const paragraph = document.createElement('p');
        const name = document.createElement('strong');
        name.textContent = `${label}: `;
        const content = document.createElement('span');
        content.textContent = value;
        paragraph.append(name, content);
        return paragraph;
      };

      const section = (title, resource, renderOk) => {
        const area = document.createElement('section');
        const heading = document.createElement('h3');
        heading.textContent = `${title} · ${modeLabel(resource.mode)}`;
        area.append(heading);

        if (resource.status === 'loading') {
          area.append(line('상태', `${title} 불러오는 중`));
        } else if (resource.status === 'error') {
          const message = resource.error && typeof resource.error.message === 'string'
            ? resource.error.message
            : '서버 오류 내용을 확인할 수 없습니다.';
          area.append(line('상태', `연결 실패 또는 확인 불가: ${message}`));
        } else if (resource.status === 'ok') {
          renderOk(area, resource.data);
        } else {
          area.append(line('상태', '확인 불가'));
        }

        root.append(area);
      };

      section('로그인 정보', me, (area, data) => {
        area.append(
          line('사용자', data.user.label),
          line('기기', `${data.device.label} · ${deviceLabel(data.device.status)}`),
          line('세션', sessionLabel(data.session.status)),
        );
      });

      section('내 기기', devices, (area, data) => {
        if (data.length === 0) {
          area.append(line('기기', '등록된 기기 없음'));
          return;
        }
        for (const device of data) {
          area.append(line('기기', `${device.label} · ${deviceLabel(device.status)}`));
        }
      });

      section('내 세션', sessions, (area, data) => {
        if (data.length === 0) {
          area.append(line('세션', '현재 세션 없음'));
          return;
        }
        for (const session of data) {
          area.append(line('세션', `${session.id} · ${sessionLabel(session.status)}`));
        }
      });

      return root;
    },
    renderDecision({ status, mode, data, error, appId }) {
      const root = document.createElement('div');
      const modeLabel = ({
        connected: '연결됨',
        demo: '예제 자료 · 실제 연결 아님',
        disconnected: '연결 없음',
        unknown: '연결 상태 확인 불가',
      })[mode] || '연결 상태 확인 중';
      const heading = document.createElement('h3');
      heading.textContent = `접속 판정 · ${modeLabel}`;
      root.append(heading);

      const line = (label, value) => {
        const paragraph = document.createElement('p');
        const name = document.createElement('strong');
        name.textContent = `${label}: `;
        const content = document.createElement('span');
        content.textContent = value;
        paragraph.append(name, content);
        root.append(paragraph);
      };

      if (status === 'idle') {
        line('상태', '업무 앱을 선택해 접속을 요청하세요.');
      } else if (status === 'loading') {
        line('업무 앱', typeof appId === 'string' ? appId : '확인 불가');
        line('상태', '해당 앱의 접속 판정을 확인하는 중입니다.');
      } else if (status === 'error') {
        const message = error && typeof error.message === 'string'
          ? error.message
          : '오류 내용을 확인할 수 없습니다.';
        line('업무 앱', typeof appId === 'string' ? appId : '확인 불가');
        line('요청 실패', message);
        line('판정', '요청 실패는 접근 거부 판정(deny)이 아닙니다. 접근 허용 여부를 확인할 수 없습니다.');
      } else if (status === 'ok') {
        const decision = data && ['allow', 'deny', 'challenge', 'unknown'].includes(data.decision)
          ? data.decision
          : 'unknown';
        const labels = {
          allow: '접근 허용 (allow)',
          deny: '접근 거부 (deny)',
          challenge: '추가 확인 필요 (challenge)',
          unknown: '판정 확인 불가 (unknown)',
        };
        const selectedAppId = data && typeof data.appId === 'string' ? data.appId : appId;
        line('업무 앱 ID', typeof selectedAppId === 'string' ? selectedAppId : '확인 불가');
        line('판정', labels[decision]);
        line('이유', data && typeof data.reason === 'string' ? data.reason : '확인할 수 없습니다.');
        line('판정 시각', data && typeof data.checkedAt === 'string' ? data.checkedAt : '확인 불가');
        if (decision === 'challenge') {
          line('안내', '이 화면은 추가 인증을 대신 수행하지 않습니다.');
        } else if (decision === 'unknown') {
          line('안내', '접근 허용 여부를 확인할 수 없습니다. 허용으로 간주하지 마세요.');
        } else if (decision === 'allow') {
          line('안내', '서버 정책상 허용된 판정이며 실제 업무 앱 접속 성공을 보장하지 않습니다.');
        }
      } else {
        line('판정', '확인 불가 (unknown)');
      }

      return root;
    },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
