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
    renderEvents({ status, mode, data, error }) {
      const root = document.createElement('div');
      const modeLabel = ({
        connected: '연결됨',
        demo: '예제 자료 · 실제 연결 아님',
        disconnected: '연결 없음',
        unknown: '연결 상태 확인 불가',
      })[mode] || '연결 상태 확인 중';
      const heading = document.createElement('h3');
      heading.textContent = `내 접속 기록과 XDR · ${modeLabel}`;
      root.append(heading);

      const text = (tag, value) => {
        const element = document.createElement(tag);
        element.textContent = value;
        return element;
      };
      const appName = (appId) => typeof appId === 'string' && appId.length > 0
        ? appId
        : '앱 확인 불가';
      const labels = {
        kind: { access: '접속 기록 (access)', xdr: 'XDR 경보 (xdr)' },
        access: { allowed: '접근 허용 (allowed)', denied: '접근 거부 (denied)', unknown: '확인 불가(unknown)' },
        session: { active: '활성 (active)', expired: '만료 (expired)', revoked: '철회됨 (revoked)', unknown: '확인 불가(unknown)' },
        device: { compliant: '보안 기준 충족 (compliant)', noncompliant: '보안 기준 미충족 (noncompliant)', unknown: '확인 불가(unknown)' },
      };

      if (status === 'loading') {
        root.append(text('p', '접속 기록과 XDR 경보를 불러오는 중입니다.'));
        return root;
      }
      if (status === 'error') {
        const message = error && typeof error.message === 'string'
          ? error.message
          : '오류 내용을 확인할 수 없습니다.';
        if (error && ['CONTRACT_MISMATCH', 'ENGINE_RESULT_UNVERIFIED'].includes(error.code)) {
          root.append(text('p', `기록을 확인할 수 없습니다: ${message}`));
        } else {
          root.append(text('p', `기록을 불러오지 못했습니다: ${message}`));
        }
        return root;
      }
      if (status !== 'ok' || !Array.isArray(data)) {
        root.append(text('p', '기록을 확인할 수 없습니다.'));
        return root;
      }
      if (data.length === 0) {
        root.append(text('p', '표시할 기록이 없습니다.'));
        return root;
      }

      const events = [...data].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
      root.append(
        text('p', '현재 사용자에게 속한 최근 기록만 표시합니다. 전체 직원 기록이나 실시간 전체 위협 탐지가 아닙니다.'),
        text('p', '서버에서 받은 최근 최대 40건 안에서만 표시하며 전체 기록 수는 추정하지 않습니다. XDR은 이미 저장된 경보이며 새 탐지는 수행하지 않습니다.'),
      );

      const filterArea = document.createElement('div');
      const makeFilter = (labelText, values, display = value => value) => {
        const label = document.createElement('label');
        label.textContent = labelText;
        const select = document.createElement('select');
        select.setAttribute('aria-label', labelText);
        const all = document.createElement('option');
        all.value = 'all';
        all.textContent = '전체';
        select.append(all);
        for (const value of values) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = display(value);
          select.append(option);
        }
        label.append(select);
        filterArea.append(label);
        return select;
      };

      const kinds = [...new Set(events.map(event => event.kind))];
      const apps = [...new Set(events.map(event => event.appId == null || event.appId === '' ? '' : event.appId))];
      const accesses = [...new Set(events.map(event => event.state.access))];
      const kindFilter = makeFilter('기록 종류', kinds, value => labels.kind[value] || value);
      const appFilter = makeFilter('업무 앱', apps, value => value === '' ? '앱 확인 불가' : value);
      const accessFilter = makeFilter('접속 상태', accesses, value => labels.access[value] || '확인 불가(unknown)');
      root.append(filterArea);

      const count = text('p', '');
      count.setAttribute('role', 'status');
      count.setAttribute('aria-live', 'polite');
      const list = document.createElement('ul');
      root.append(count, list);

      const renderList = () => {
        const selectedKind = kindFilter.value;
        const selectedApp = appFilter.value;
        const selectedAccess = accessFilter.value;
        const filtered = events.filter(event =>
          (selectedKind === 'all' || event.kind === selectedKind)
          && (selectedApp === 'all' || (selectedApp === '' ? event.appId == null || event.appId === '' : event.appId === selectedApp))
          && (selectedAccess === 'all' || event.state.access === selectedAccess));
        count.textContent = `표시 건수: ${filtered.length}`;
        const rows = [];

        if (filtered.length === 0) {
          rows.push(text('li', '선택한 조건에 맞는 기록이 없습니다.'));
        }

        for (const event of filtered) {
          const row = document.createElement('li');
          row.setAttribute('data-student-event-id', event.id);
          row.append(
            text('h4', `사건 ${event.id} · ${event.at}`),
            text('p', `종류: ${labels.kind[event.kind] || event.kind}`),
            text('p', `업무 앱: ${appName(event.appId)}`),
            text('p', `요약: ${event.summary}`),
          );

          const detailButton = document.createElement('button');
          detailButton.type = 'button';
          detailButton.setAttribute('aria-label', `${event.id} 상세`);
          detailButton.textContent = `${event.id} 상세`;
          detailButton.addEventListener('click', () => {
            const detail = document.createElement('section');
            detail.setAttribute('data-student-event-detail', event.id);
            detail.append(
              text('h4', `사건 ID: ${event.id}`),
              text('p', `업무 앱: ${appName(event.appId)}`),
            );

            const appendEntries = (title, entries) => {
              detail.append(text('h5', title));
              if (!Array.isArray(entries) || entries.length === 0) {
                detail.append(text('p', '내용이 비어 있습니다.'));
                return;
              }
              const entryList = document.createElement('ul');
              for (const entry of entries) {
                entryList.append(text('li', `${entry.id}: ${entry.text}`));
              }
              detail.append(entryList);
            };

            appendEntries('근거 (evidence)', event.evidence);
            appendEntries('규칙 (rules)', event.rules);
            for (const key of ['access', 'session', 'device']) {
              const value = event.state[key];
              const meaning = labels[key][value] || '확인 불가(unknown)';
              detail.append(text('p', `${key}: ${meaning}`));
            }
            if (Array.isArray(event.supportedActions) && event.supportedActions.length > 0) {
              detail.append(text('p', '조치 실행 연결은 준비 중입니다. 이 화면은 조치를 실행하지 않습니다.'));
              for (const action of event.supportedActions) {
                const unsupported = document.createElement('button');
                unsupported.type = 'button';
                unsupported.disabled = true;
                unsupported.textContent = `${action} 미지원`;
                detail.append(unsupported);
              }
            }
            row.append(detail);
          });
          row.append(detailButton);
          rows.push(row);
        }
        list.replaceChildren(...rows);
      };

      for (const select of [kindFilter, appFilter, accessFilter]) {
        select.addEventListener('change', renderList);
      }
      renderList();
      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode }) {
      const root = document.createElement('div');
      const text = (tag, value) => {
        const element = document.createElement(tag);
        element.textContent = value;
        return element;
      };
      const line = (container, label, value) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = `${label}: `;
        const span = document.createElement('span');
        span.textContent = value;
        p.append(strong, span);
        container.append(p);
      };
      const modeName = value => ({
        connected: '연결됨 (connected)',
        demo: '예제 자료 (demo)',
        disconnected: '연결 없음 (disconnected)',
        unknown: '확인 불가 (unknown)',
      })[value] || (value == null ? '연결 모드가 전달되지 않음' : `확인 불가 (${String(value)})`);
      root.append(text('h3', `기기·세션·알림 상태 · ${modeName(mode)}`));

      const deviceNames = {
        compliant: '보안 기준 충족 (compliant)',
        noncompliant: '보안 기준 미충족 (noncompliant)',
        unknown: '확인 불가 (unknown)',
      };
      const sessionNames = {
        active: '활성 (active)',
        expired: '만료 (expired)',
        revoked: '철회됨 (revoked)',
        unknown: '확인 불가 (unknown)',
      };
      const renderResource = (title, resource, kind) => {
        const area = document.createElement('section');
        area.append(text('h4', `${title} · 모드: ${modeName(resource && resource.mode)}`));
        const status = resource && resource.status;
        if (status === 'loading') {
          area.append(text('p', `${title}을(를) 불러오는 중입니다.`));
        } else if (status === 'error') {
          const error = resource.error || {};
          const code = typeof error.code === 'string' ? error.code : '';
          const message = typeof error.message === 'string' ? error.message : '오류 메시지를 확인할 수 없습니다.';
          const timeout = /timeout|timed out|시간\s*초과/i.test(`${code} ${message}`);
          area.append(text('p', timeout ? `${title} 요청 시간 초과` : `${title}을(를) 불러오지 못했습니다.`));
          line(area, '오류 내용', message);
        } else if (status === 'ok') {
          if (!Array.isArray(resource.data)) {
            area.append(text('p', `${title} 응답을 확인할 수 없습니다 (CONTRACT_MISMATCH).`));
          } else if (resource.data.length === 0) {
            area.append(text('p', kind === 'devices' ? '등록된 기기가 없습니다.' : '현재 연결된 세션이 없습니다.'));
          } else {
            for (const item of resource.data) {
              if (kind === 'devices') {
                line(area, '기기', `${item.label ?? '이름 확인 불가'} · ID ${item.id ?? '확인 불가'}`);
                line(area, '기기 보안 상태', `${deviceNames[item.status] || '확인 불가 (unknown)'} · 코드 ${item.status ?? 'unknown'}`);
              } else {
                line(area, '세션 ID', item.id ?? '확인 불가');
                line(area, '세션 상태', `${sessionNames[item.status] || '확인 불가 (unknown)'} · 코드 ${item.status ?? 'unknown'}`);
              }
            }
          }
        } else if (status === 'idle') {
          area.append(text('p', `${title} 정보를 아직 요청하지 않았습니다 (idle).`));
        } else {
          area.append(text('p', `${title} 상태를 확인할 수 없습니다.`));
        }
        root.append(area);
      };

      renderResource('등록 기기', devices, 'devices');
      root.append(text('p', '기기는 제공 서버가 돌려준 등록 기기 최대 100개 관측 범위입니다. 전체 기기 현황을 뜻하지 않습니다.'));
      renderResource('현재 세션', sessions, 'sessions');
      root.append(text('p', '세션은 현재 검증된 연결 한 개만 나타내며 과거 세션 전체 목록이 아닙니다.'));

      const notices = document.createElement('section');
      notices.append(text('h4', '알림'));
      if (Array.isArray(notifications) && notifications.length > 0) {
        for (const notification of notifications) {
          const item = document.createElement('article');
          line(item, 'resource', notification.resource ?? '확인 불가');
          line(item, 'code', notification.code ?? '확인 불가');
          line(item, 'message', notification.message ?? '확인 불가');
          const notificationText = `${notification.code ?? ''} ${notification.message ?? ''}`;
          if (/timeout|timed out|시간\s*초과/i.test(notificationText)) {
            item.append(text('p', '요청 시간 초과가 확인되었습니다.'));
          }
          notices.append(item);
        }
      } else if (Array.isArray(notifications)) {
        notices.append(text('p', '주의할 알림이 없습니다.'));
      } else {
        notices.append(text('p', '알림을 확인할 수 없습니다.'));
      }
      root.append(notices);

      const notificationFailure = Array.isArray(notifications) && notifications.some(notification =>
        /timeout|timed out|시간\s*초과|error|fail|unavailable|disconnected|unverified|mismatch|unknown|연결\s*불가|확인\s*불가|오류|실패/i.test(`${notification.code ?? ''} ${notification.message ?? ''}`));
      const resources = [devices, sessions, diagnostics];
      const invalidResource = resource => !resource || (
        !['idle', 'loading', 'ok', 'error'].includes(resource.status)
        || (resource.status === 'ok' && (resource === diagnostics
          ? !resource.data || typeof resource.data !== 'object' || Array.isArray(resource.data)
          : !Array.isArray(resource.data)))
      );
      const failed = !Array.isArray(notifications) || notificationFailure
        || resources.some(resource => resource && resource.status === 'error')
        || resources.some(invalidResource);
      if (failed) root.append(text('p', '다시 시도하려면 화면 위쪽의 다시 불러오기 버튼을 직접 누르세요.'));

      const diagnosticArea = document.createElement('section');
      diagnosticArea.append(text('h4', `진단 정보 · 모드: ${modeName(diagnostics && diagnostics.mode)}`));
      const diagnosticStatus = diagnostics && diagnostics.status;
      let safeValues = null;
      if (diagnosticStatus === 'idle') {
        diagnosticArea.append(text('p', '진단 정보를 아직 불러오지 않았습니다 (idle).'));
      } else if (diagnosticStatus === 'loading') {
        diagnosticArea.append(text('p', '진단 정보를 불러오는 중입니다.'));
      } else if (diagnosticStatus === 'error') {
        const error = diagnostics.error || {};
        const code = typeof error.code === 'string' ? error.code : '';
        const message = typeof error.message === 'string' ? error.message : '오류 메시지를 확인할 수 없습니다.';
        const timeout = /timeout|timed out|시간\s*초과/i.test(`${code} ${message}`);
        diagnosticArea.append(text('p', timeout ? '진단 정보 요청 시간 초과' : '진단 정보를 불러오지 못했습니다.'));
        line(diagnosticArea, '오류 내용', message);
      } else if (diagnosticStatus === 'ok' && diagnostics.data && typeof diagnostics.data === 'object' && !Array.isArray(diagnostics.data)) {
        const source = diagnostics.data;
        const engine = source.engine && typeof source.engine === 'object' ? source.engine : {};
        const safeValue = value => ['string', 'number', 'boolean'].includes(typeof value) ? String(value) : '확인 불가';
        safeValues = [
          ['requestId', safeValue(source.requestId)],
          ['component', safeValue(source.component)],
          ['version', safeValue(source.version)],
          ['checkedAt', safeValue(source.checkedAt)],
          ['engine.mode', safeValue(engine.mode)],
          ['engine.code', safeValue(engine.code)],
        ];
        for (const [key, value] of safeValues) line(diagnosticArea, key, value);
      } else {
        diagnosticArea.append(text('p', '진단 정보를 확인할 수 없습니다.'));
      }
      diagnosticArea.append(text('p', '도움이 필요한 경우 위 진단 정보를 복사해 전달할 수 있습니다. 민감한 인증정보는 포함하지 않습니다.'));
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.textContent = '도움정보 복사';
      copyButton.disabled = !safeValues;
      const copyStatus = text('p', safeValues ? '버튼을 눌러 진단 정보를 직접 복사하세요.' : '복사할 진단 정보가 없습니다.');
      copyStatus.setAttribute('role', 'status');
      copyButton.addEventListener('click', async () => {
        if (!safeValues) {
          copyStatus.textContent = '복사할 진단 정보가 없습니다.';
          return;
        }
        const payload = safeValues.map(([key, value]) => `${key}: ${value}`).join('\n');
        copyStatus.textContent = '복사 중입니다.';
        try {
          if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
            throw new Error('클립보드를 사용할 수 없습니다.');
          }
          await navigator.clipboard.writeText(payload);
          copyStatus.textContent = '도움정보를 클립보드에 복사했습니다.';
        } catch {
          copyStatus.textContent = '복사하지 못했습니다. 브라우저 클립보드 권한을 확인하세요.';
        }
      });
      diagnosticArea.append(copyButton, copyStatus);
      root.append(diagnosticArea);
      return root;
    },
    renderVulnerabilities({ status, mode, data, error }) {
      const root = document.createElement('section');
      const text = (tag, value) => {
        const node = document.createElement(tag);
        node.textContent = value;
        return node;
      };
      const secretLike = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i;
      const safeText = (value, limit = 500) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit
        && !secretLike.test(value) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
      const safeCode = value => typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value);
      const time = value => typeof value === 'string'
        && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
        && Number.isFinite(Date.parse(value));
      const line = (label, value) => root.append(text('p', `${label}: ${value}`));
      const modeText = {
        demo: '예제 자료(demo)이며 실제 서비스 조회 결과가 아닙니다.',
        connected: '연결됨(connected)',
        disconnected: '연결 없음(disconnected)',
        unknown: '연결 상태 확인 불가(unknown)',
      };
      const scanText = {
        complete: '모두 조회(complete)',
        partial: '일부 조회 실패(partial)',
        not_checked: '아직 조회 안 함(not_checked)',
        not_configured: '조회 준비 미완료(not_configured)',
        unverifiable: 'lock 파일 확인 불가(unverifiable)',
      };
      const packageText = {
        known_vulnerabilities: '알려진 취약 항목 있음(known_vulnerabilities)',
        none_found: '조회 범위에서 알려진 취약 항목 없음(none_found)',
        unverifiable: '조회 확인 불가(unverifiable)',
      };

      if (status === 'idle') {
        root.append(text('p', '패키지 취약점 조회 전(idle)입니다. 이전 조회 결과는 표시하지 않습니다.'));
        return root;
      }
      if (status === 'loading') {
        root.append(text('p', '패키지 취약점 정보를 조회 중(loading)입니다. 이전 결과는 현재 결과가 아닙니다.'));
        return root;
      }
      if (status === 'error') {
        const code = error && safeCode(error.code) ? error.code : 'RESULT_UNVERIFIED';
        const message = error && safeText(error.message) ? error.message : '안전하지 않거나 제공되지 않은 오류 메시지는 표시하지 않았습니다.';
        root.append(text('h3', '패키지 조회 실패(error)'));
        line('오류 코드', code);
        line('오류 메시지', message);
        root.append(text('p', '취소·시간 초과·응답 오류는 조회 성공이나 취약 항목 없음이 아닙니다. 이전 결과도 현재 확인 결과가 아닙니다.'));
        root.append(text('p', '제공 UI에서 직접 다시 조회하세요.'));
        return root;
      }
      if (status !== 'ok' || !data || typeof data !== 'object' || !Object.hasOwn(scanText, data.status)) {
        root.append(text('p', '패키지 조회 결과를 확인할 수 없습니다(unverifiable). 취약 항목 없음으로 판단하지 마세요.'));
        return root;
      }

      root.append(text('h3', '설치 패키지 취약점 조회 결과'));
      line('전체 조회 상태', scanText[data.status]);
      if (mode != null) root.append(text('p', modeText[mode] || '연결 상태 확인 불가(unknown)'));
      if (safeText(data.lockfileVersion, 100)) line('lockfile 버전', data.lockfileVersion);
      if (safeText(data.lockfileHash, 128)) line('lockfile 해시', data.lockfileHash);
      if (time(data.checkedAt)) line('전체 확인 시각', data.checkedAt);

      if (data.status === 'not_checked') root.append(text('p', '승인된 패키지가 없어 아직 조회하지 않았습니다. 취약 항목 없음이나 안전을 뜻하지 않습니다.'));
      if (data.status === 'not_configured') root.append(text('p', '프로젝트 조회 준비가 완료되지 않았습니다. 취약 항목 없음이나 안전을 뜻하지 않습니다.'));
      if (data.status === 'unverifiable') root.append(text('p', 'lock 파일 또는 전체 조회를 확인할 수 없습니다. 일부 전달된 결과만 표시하며 전체 결과로 판단하지 마세요.'));
      if (data.status === 'partial') root.append(text('p', '일부 패키지 조회가 실패했습니다. 아래 확인된 결과는 유지하지만 전체 조회 성공은 아닙니다.'));

      if (!Array.isArray(data.packages)) {
        root.append(text('p', '패키지 목록을 확인할 수 없습니다. 취약 항목 없음으로 표시하지 않습니다.'));
        return root;
      }
      if (data.packages.length === 0) {
        root.append(text('p', data.status === 'complete'
          ? '조회할 허용 공개 패키지가 없습니다.'
          : '표시할 패키지 결과가 없습니다.'));
        return root;
      }

      for (const pkg of data.packages) {
        const row = document.createElement('article');
        const validPackage = pkg && typeof pkg === 'object' && safeText(pkg.name, 200) && safeText(pkg.version, 100)
          && Object.hasOwn(packageText, pkg.status) && safeText(pkg.source, 200) && time(pkg.checkedAt)
          && Array.isArray(pkg.vulnerabilities);
        if (!validPackage) {
          row.append(text('p', '패키지 결과를 확인할 수 없습니다(unverifiable).'));
          root.append(row);
          continue;
        }
        row.setAttribute('data-student-package-name', pkg.name);
        row.setAttribute('data-student-package-version', pkg.version);
        row.append(text('h4', `${pkg.name} ${pkg.version}`));
        row.append(text('p', `정확한 설치 버전: ${pkg.version}`));
        row.append(text('p', `패키지 상태: ${packageText[pkg.status]}`));
        row.append(text('p', `출처: ${pkg.source}`));
        row.append(text('p', `패키지 확인 시각: ${pkg.checkedAt}`));
        if (pkg.status === 'unverifiable') {
          row.append(text('p', pkg.vulnerabilities.length > 0
            ? '일부 확인 · 전체 조회 확인 불가입니다. 아래 전달된 항목만 표시합니다.'
            : '조회 확인 불가입니다. 알려진 취약 항목 없음이나 안전을 뜻하지 않습니다.'));
        }
        if (pkg.status === 'none_found') row.append(text('p', '조회 범위에서 알려진 취약 항목이 발견되지 않았습니다. 전체 보안 상태를 보장하지 않습니다.'));
        for (const finding of pkg.vulnerabilities) {
          if (!finding || !safeText(finding.id, 200) || !time(finding.modified)) {
            row.append(text('p', '전달된 취약 항목 일부를 확인할 수 없습니다.'));
            continue;
          }
          row.append(text('p', `취약 항목 ID: ${finding.id}`), text('p', `수정 시각: ${finding.modified}`));
        }
        root.append(row);
      }
      return root;
    },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted }) {
      const root = document.createElement('div');
      const text = (tag, value) => {
        const element = document.createElement(tag);
        element.textContent = value;
        return element;
      };
      const modeLabels = {
        connected: '연결됨 (connected)',
        demo: '예제 자료 (demo) · 실제 연결 아님',
        disconnected: '연결 없음 (disconnected)',
        unknown: '연결 상태 확인 불가 (unknown)',
      };
      const modeLabel = Object.hasOwn(modeLabels, mode) ? modeLabels[mode] : '연결 상태 확인 불가 (unknown)';
      root.append(text('h3', `알레프게이트 AI 연결 점검 · ${modeLabel}`));

      const errorTypes = {
        ON_AI_PROVISIONING_PENDING: '권한 준비 중', WB_CLCO_AUTH_REQUIRED: '인증 필요',
        WB_CLCO_ACCESS_BLOCKED: '앱 접근 제한', WB_CLCO_COHORT_BUDGET_EXHAUSTED: '반 사용량 한도',
        WB_CLCO_RATE_LIMITED: '요청 제한', WB_CLCO_LIMIT_REACHED: '이용 한도',
        WB_CLCO_SESSION_CLOSED: '이용 시간이 아님', WB_CLCO_TIMEOUT: '요청 시간 초과',
        REQUEST_TIMEOUT: '요청 시간 초과', ENGINE_TIMEOUT: '요청 시간 초과', TIMEOUT: '요청 시간 초과',
        NETWORK_ERROR: '네트워크 연결 실패', INVALID_RESPONSE: '응답 형식 확인 실패',
        WB_CLCO_CANCELLED: '요청 취소', CANCELLED: '요청 취소', REQUEST_CANCELLED: '요청 취소',
        MODEL_NOT_CONFIGURED: '사용할 모델 없음', ON_AI_MODEL_LIST_EMPTY: '사용할 모델 없음',
        ON_AI_AUTHORIZATION_CHANGED: '앱 권한 변경', SUBJECT_SCOPE_UNVERIFIED: '사용자·사건 범위 확인 불가',
        ON_AI_INVALID_INPUT: '사건 입력 확인 실패', ON_AI_INVALID_OUTPUT: 'AI 응답 검증 실패',
        AI_REQUEST_UNVERIFIED: '요청 또는 응답 확인 불가',
      };
      const safeError = value => {
        const code = value && typeof value.code === 'string' && Object.hasOwn(errorTypes, value.code) ? value.code : null;
        if (!code) return { code: 'AI_REQUEST_UNVERIFIED', category: '오류 유형 확인 불가', message: '오류 유형을 확인할 수 없습니다. 연결 상태를 성공으로 간주하지 마세요.' };
        const message = value && typeof value.message === 'string' ? value.message : '';
        const secretLike = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i;
        const safe = message.length <= 500 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(message) && !secretLike.test(message);
        return { code, category: errorTypes[code], message: safe ? (message || '오류 메시지가 제공되지 않았습니다.') : '안전하지 않은 오류 메시지는 표시하지 않았습니다.' };
      };

      if (status === 'idle') {
        root.append(text('p', 'AI 연결 점검 전'));
      } else if (status === 'loading') {
        root.append(text('p', 'AI 연결 점검 중'), text('p', '이전 점검 결과는 현재 상태로 표시하지 않습니다.'));
      } else if (status === 'ok') {
        root.append(text('p', 'AI 연결 점검 결과'));
        root.append(text('p', `전송 확인: ${data && data.transportChecked === true ? '확인됨 (true)' : '확인 불가'}`));
        if (data && data.audienceAuthorization === 'test') {
          root.append(text('p', '시험 연결 점검(test) · 실제 앱 권한 확인이 아닙니다.'));
        } else if (data && data.audienceAuthorization === 'verified') {
          root.append(text('p', '앱 권한 확인 후 점검(verified)'));
        } else {
          root.append(text('p', '앱 권한 상태 확인 불가 (unknown)'));
        }
        const count = data && Number.isInteger(data.modelCount) && data.modelCount >= 0 ? String(data.modelCount) : '확인 불가';
        root.append(text('p', `받은 모델 수: ${count}`));
        root.append(text('p', `점검 시각: ${typeof checkedAt === 'string' && checkedAt ? checkedAt : '확인 불가'}`));
        root.append(text('p', explanationAccepted === false
          ? '사건 설명은 아직 실행하지 않았습니다.'
          : '사건 설명 실행 여부는 이 연결 점검으로 확인되지 않습니다.'));
        root.append(text('p', '연결 점검 결과는 실제 보안 사건 설명이나 사건 해결의 성공을 뜻하지 않습니다.'));
      } else if (status === 'error') {
        const info = safeError(error);
        root.append(text('p', 'AI 연결 점검 실패'), text('p', `오류 유형: ${info.category}`), text('p', `오류 코드: ${info.code}`), text('p', `오류 메시지: ${info.message}`));
        const accountAndAuthorizationCodes = [
          'ON_AI_PROVISIONING_PENDING', 'SUBJECT_SCOPE_UNVERIFIED', 'AI_REQUEST_UNVERIFIED',
        ];
        if (info.code === 'ON_AI_PROVISIONING_PENDING') {
          root.append(text('p', '학생 앱 이용 권한을 준비 중입니다. 담당자에게 현재 계정 연결 상태와 앱 이용 권한을 확인해 달라고 요청하세요.'));
        } else if (info.code === 'WB_CLCO_AUTH_REQUIRED') {
          root.append(text('p', 'AI 인증에 필요한 계정 연결을 다시 확인하고 담당자에게 문의하세요. API 키나 Workbench 열쇠를 직접 입력하지 마세요.'));
        } else if (info.code === 'WB_CLCO_ACCESS_BLOCKED') {
          root.append(text('p', '앱 접근이 제한됐습니다. 현재 계정 연결과 앱 이용 권한을 확인하고 담당자에게 문의하세요.'));
        } else if (info.code === 'ON_AI_AUTHORIZATION_CHANGED') {
          root.append(text('p', '앱 권한이 변경됐습니다. 현재 계정 연결을 다시 확인하고 담당자에게 앱 권한을 확인해 달라고 요청하세요.'));
        } else if (accountAndAuthorizationCodes.includes(info.code)) {
          root.append(text('p', '현재 연결 또는 권한을 확인할 수 없습니다. 담당자에게 현재 계정 연결과 앱 이용 권한을 확인해 달라고 요청하세요.'));
        }
        if (info.category === '요청 취소') root.append(text('p', '취소된 요청은 성공한 점검이 아닙니다. 이전 결과는 현재 결과가 아닙니다.'));
        if (info.category === '요청 시간 초과') root.append(text('p', '시간 초과로 점검 결과를 확인하지 못했습니다.'));
        root.append(text('p', '다시 점검하려면 제공 화면에서 사용자가 직접 점검 버튼을 누르세요.'));
      } else {
        root.append(text('p', 'AI 연결 점검 상태를 확인할 수 없습니다 (unknown).'));
      }
      return root;
    },
    renderExplanation({ event, explanation, checkedAt }) {
      const root = document.createElement('div');
      const text = (tag, value) => {
        const element = document.createElement(tag);
        element.textContent = value;
        return element;
      };
      const secretLike = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i;
      const validId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(value) && !secretLike.test(value);
      const validText = (value, limit) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit
        && !secretLike.test(value) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
      const safeErrorCodes = new Set([
        'ON_AI_PROVISIONING_PENDING', 'WB_CLCO_AUTH_REQUIRED', 'WB_CLCO_ACCESS_BLOCKED',
        'WB_CLCO_COHORT_BUDGET_EXHAUSTED', 'WB_CLCO_RATE_LIMITED', 'WB_CLCO_LIMIT_REACHED',
        'WB_CLCO_SESSION_CLOSED', 'WB_CLCO_TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT', 'TIMEOUT',
        'NETWORK_ERROR', 'INVALID_RESPONSE', 'WB_CLCO_CANCELLED', 'CANCELLED', 'REQUEST_CANCELLED',
        'MODEL_NOT_CONFIGURED', 'ON_AI_MODEL_LIST_EMPTY', 'ON_AI_AUTHORIZATION_CHANGED',
        'SUBJECT_SCOPE_UNVERIFIED', 'ON_AI_INVALID_INPUT', 'ON_AI_INVALID_OUTPUT', 'AI_REQUEST_UNVERIFIED',
      ]);
      const status = explanation && explanation.status;
      if (status === 'error') {
        const error = explanation.error;
        const code = error && safeErrorCodes.has(error.code) ? error.code : 'AI_REQUEST_UNVERIFIED';
        const message = error && validText(error.message, 500) ? error.message : '안전하지 않거나 제공되지 않은 오류 메시지는 표시하지 않았습니다.';
        root.append(text('p', 'AI 사건 설명 실패'), text('p', `오류 코드: ${code}`), text('p', `오류 메시지: ${message}`), text('p', '기록은 그대로입니다.'));
        return root;
      }
      if (!event) {
        root.append(text('p', '보안 기록에서 기록을 먼저 고르세요.'));
        return root;
      }
      if (status === 'idle') {
        root.append(text('p', 'AI 사건 설명 전'));
        return root;
      }
      if (status === 'loading') {
        root.append(text('p', 'AI 사건 설명 중입니다. 이전 설명은 현재 결과로 표시하지 않습니다.'));
        return root;
      }
      if (status !== 'ok') {
        root.append(text('p', 'AI 사건 설명 상태를 확인할 수 없습니다 (unknown).'));
        return root;
      }

      const data = explanation.data;
      const evidence = Array.isArray(event.evidence) ? event.evidence : null;
      const rules = Array.isArray(event.rules) ? event.rules : null;
      const supportedActions = Array.isArray(event.supportedActions) ? event.supportedActions : null;
      const states = event.state && typeof event.state === 'object' ? event.state : null;
      const stateValid = states
        && ['allowed', 'denied', 'unknown'].includes(states.access)
        && ['active', 'expired', 'revoked', 'unknown'].includes(states.session)
        && ['compliant', 'noncompliant', 'unknown'].includes(states.device);
      const eventValid = validId(event.id) && validText(event.summary, 2000)
        && Array.isArray(evidence) && evidence.length > 0 && evidence.length <= 20
        && Array.isArray(rules) && rules.length > 0 && rules.length <= 20
        && Array.isArray(supportedActions) && stateValid
        && evidence.every(row => row && validId(row.id) && validText(row.text, 500))
        && rules.every(row => row && validId(row.id) && validText(row.text, 300))
        && supportedActions.every(validId)
        && new Set(evidence.map(row => row.id)).size === evidence.length
        && new Set(rules.map(row => row.id)).size === rules.length;
      const evidenceIds = data && data.evidenceIds;
      const references = ids => Array.isArray(evidence) && Array.isArray(ids) && ids.length > 0 && new Set(ids).size === ids.length
        && ids.every(id => validId(id) && evidence.some(row => row.id === id));
      const proposalsValid = data && Array.isArray(supportedActions) && Array.isArray(data.proposals) && data.proposals.length <= 3
        && data.proposals.every(proposal => proposal && Object.keys(proposal).length === 3
          && validId(proposal.action) && supportedActions.includes(proposal.action)
          && validText(proposal.reason, 500) && references(proposal.evidenceIds));
      const explanationValid = eventValid && data && Object.keys(data).length === 5
        && validText(data.summary, 1500) && references(evidenceIds) && evidenceIds.length === evidence.length
        && proposalsValid && data.requiresHumanConfirmation === true && data.executed === false;
      if (!explanationValid) {
        root.append(text('p', '사건 설명을 사용할 수 없습니다. 사건 근거·규칙·조치 연결 또는 AI 응답이 현재 기록과 맞지 않습니다.'));
        return root;
      }

      root.setAttribute('data-student-explanation-event', event.id);
      root.append(text('h3', 'AI 설명(참고용)'), text('p', `사건 ID: ${event.id}`), text('p', data.summary));
      const cited = document.createElement('section');
      cited.append(text('h4', '인용한 근거'));
      for (const id of evidenceIds) {
        const row = evidence.find(item => item.id === id);
        cited.append(text('p', `${row.id}: ${row.text}`));
      }
      root.append(cited);
      const ruleArea = document.createElement('section');
      ruleArea.append(text('h4', '현재 규칙'));
      for (const rule of rules) ruleArea.append(text('p', `${rule.id}: ${rule.text}`));
      root.append(ruleArea);

      const stateArea = document.createElement('section');
      stateArea.append(text('h4', '확인 불가인 현재 상태'));
      const names = { access: '접속', session: '세션', device: '기기' };
      const unknowns = Object.keys(names).filter(key => states[key] === 'unknown');
      if (unknowns.length === 0) stateArea.append(text('p', '없음'));
      else for (const key of unknowns) stateArea.append(text('p', `${names[key]}: 확인 불가(unknown)`));
      root.append(stateArea);

      const proposalArea = document.createElement('section');
      proposalArea.append(text('h4', 'AI 조치 제안'));
      if (data.proposals.length === 0) {
        proposalArea.append(text('p', supportedActions.length === 0
          ? '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).'
          : 'AI가 제안한 조치가 없습니다.'));
      } else {
        for (const proposal of data.proposals) {
          proposalArea.append(text('p', `조치: ${proposal.action}`), text('p', `이유: ${proposal.reason}`), text('p', `관련 근거: ${proposal.evidenceIds.join(', ')}`), text('p', '사람 확인이 필요하며 실행되지 않았습니다.'));
        }
      }
      root.append(proposalArea);
      if (typeof checkedAt === 'string'
        && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(checkedAt)
        && Number.isFinite(Date.parse(checkedAt))) root.append(text('p', `확인 시각: ${checkedAt}`));
      root.append(text('p', '이 설명은 참고용이며 AI는 실제 조치를 수행하거나 보안 사건을 해결하지 않았습니다.'));
      return root;
    },
    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error }) {
      const root = document.createElement('section');
      const text = (tag, value) => {
        const node = document.createElement(tag);
        node.textContent = value;
        return node;
      };
      const secretLike = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i;
      const validId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(value) && !secretLike.test(value);
      const validUuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      const validText = (value, limit = 500) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit
        && !secretLike.test(value) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
      const validTime = value => typeof value === 'string'
        && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
        && Number.isFinite(Date.parse(value));
      const line = (label, value) => root.append(text('p', `${label}: ${value}`));
      const statuses = new Set(['idle', 'loading', 'executing', 'prepared', 'pending', 'succeeded', 'denied', 'failed', 'unknown', 'error', 'expired']);
      const safeErrorCodes = new Set([
        'ACTION_CONFIRMATION_EXPIRED', 'ACTION_SCOPE_UNVERIFIED', 'SUBJECT_SCOPE_UNVERIFIED',
        'ACTION_SNAPSHOT_CHANGED', 'ACTION_EVENT_UNAVAILABLE', 'ACTION_TIMEOUT', 'ACTION_STORE_FAILED',
        'ACTION_RESULT_UNVERIFIED',
      ]);
      const eventValid = event && validId(event.id) && Array.isArray(event.evidence)
        && event.evidence.every(item => item && validId(item.id));
      const targetValid = target && typeof target === 'object' && typeof target.id === 'string'
        && /^(?:subject|device):[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(target.id)
        && !secretLike.test(target.id) && Number.isSafeInteger(target.generation) && target.generation > 0;
      const receiptValid = receipt && typeof receipt === 'object'
        && validUuid(receipt.requestId) && validUuid(receipt.receiptId)
        && validId(receipt.eventId) && validId(receipt.actionId)
        && ['prepared', 'pending', 'succeeded', 'denied', 'failed', 'unknown'].includes(receipt.status)
        && Number.isSafeInteger(receipt.version) && receipt.version > 0 && typeof receipt.replayed === 'boolean';
      const intentMatches = eventValid && Array.isArray(event.supportedActions) && validId(actionId)
        && event.supportedActions.includes(actionId) && receiptValid && receipt.status === 'succeeded'
        && receipt.eventId === event.id && receipt.actionId === actionId;
      const observationValid = observation && typeof observation === 'object'
        && validTime(observation.observedAt) && typeof observation.effectApplied === 'boolean';

      if (status === 'error') {
        const code = error && safeErrorCodes.has(error.code) ? error.code : 'ACTION_RESULT_UNVERIFIED';
        const detail = error && validText(error.message) ? error.message : '안전하지 않거나 제공되지 않은 오류 메시지는 표시하지 않았습니다.';
        root.append(text('h3', '조치 요청 처리 오류(error)'));
        line('오류 코드', code);
        line('오류 메시지', detail);
        return root;
      }
      if (!statuses.has(status)) {
        root.append(text('p', '조치 상태를 확인할 수 없습니다(unknown). 성공 또는 효과 없음으로 판단하지 마세요.'));
        return root;
      }
      if (status === 'idle') {
        root.append(text('p', '아직 미실행(idle)입니다. 이전 사건·요청·영수증·결과는 표시하지 않습니다.'));
        return root;
      }
      if (status === 'loading') {
        root.append(text('p', '조치 준비 또는 결과 조회 중(loading)입니다. 아직 완료되지 않았습니다.'));
        return root;
      }

      const showIntent = () => {
        if (!eventValid || !validId(actionId)) {
          root.append(text('p', '현재 사건 또는 조치 정보를 확인할 수 없습니다. 이전 요청을 현재 요청으로 표시하지 않습니다.'));
          return false;
        }
        line('현재 사건 ID', event.id);
        line('현재 사건 근거 ID', event.evidence.map(item => item.id).join(', ') || '없음');
        line('조치 ID', actionId);
        if (targetValid) {
          line('실제 실행 대상', target.id);
          line('대상 세대', String(target.generation));
        } else root.append(text('p', '실제 실행 대상을 확인할 수 없습니다.'));
        return true;
      };
      const showReceipt = () => {
        if (!receiptValid) return false;
        line('요청 ID', receipt.requestId);
        line('영수증 ID', receipt.receiptId);
        line('결과 버전', String(receipt.version));
        line('재사용된 요청', receipt.replayed ? '예(replayed): 새 실행이 아닙니다.' : '아니오');
        if (receipt.superseded === true) root.append(text('p', '이전 조회 결과는 최신 결과를 대체하지 못합니다(superseded).'));
        return true;
      };

      if (status === 'prepared') {
        root.append(text('h3', '준비됨(prepared) · 아직 미실행'));
        showIntent();
        showReceipt();
        if (validTime(confirmationExpiresAt)) line('사람 확인 기한', confirmationExpiresAt);
        else root.append(text('p', '사람 확인 기한을 확인할 수 없습니다. 실행하지 마세요.'));
        root.append(text('p', '사람 확인이 필요하며, 제공 화면의 확인 절차 전에는 실제 실행되지 않습니다.'));
        return root;
      }
      if (status === 'executing') {
        root.append(text('h3', '원천에 전달 중(executing) · 결과 미확인'));
        showIntent();
        root.append(text('p', '처리가 끝났거나 성공했다고 판단하지 마세요.'));
        return root;
      }
      if (status === 'pending') {
        root.append(text('h3', '서버 접수·처리 중(pending) · 결과 미확인'));
        showIntent();
        showReceipt();
        root.append(text('p', 'ACK는 실제 효과 확인이나 완료를 뜻하지 않습니다.'));
        return root;
      }
      if (status === 'succeeded') {
        const confirmed = intentMatches && observationValid && observation.effectApplied === true;
        if (!confirmed) {
          root.append(text('h3', '원천 결과 확인 불가(unknown)'));
          root.append(text('p', '성공 또는 효과 없음으로 판단하지 마세요. 현재 사건·조치·요청 연결과 관측 효과를 직접 확인하세요.'));
          return root;
        }
        root.setAttribute('data-student-action-event', event.id);
        root.setAttribute('data-student-action-request', receipt.requestId);
        root.append(text('h3', '원천 효과 확인(succeeded)'));
        showIntent();
        showReceipt();
        line('관측 시각', observation.observedAt);
        line('효과 적용', 'true');
        return root;
      }
      if (status === 'denied' || status === 'failed') {
        root.append(text('h3', status === 'denied' ? '원천 거절(denied)' : '원천 실패(failed)'));
        showIntent();
        root.append(text('p', validText(message) ? message : '현재 안내 메시지를 확인할 수 없습니다.'));
        return root;
      }
      if (status === 'expired') {
        root.append(text('h3', '사람 확인 기한 만료(expired)'));
        showIntent();
        root.append(text('p', '새 조치 준비가 필요합니다. 이 준비 결과로는 실행할 수 없습니다.'));
        return root;
      }
      root.append(text('h3', '결과 불명(unknown)'));
      showIntent();
      showReceipt();
      root.append(text('p', '성공·실패·효과 없음으로 판단하지 마세요. 제공 화면에서 원천 결과를 직접 재조회하세요.'));
      return root;
    },
  };
}
