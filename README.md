# Realtime Recreation Scaffold

20명 내외 레크리에이션을 위한 Next.js + TypeScript + SCSS + Socket.IO 스캐폴드입니다.
게임 상세 로직은 제외하고, 빔프로젝터용 메인 화면, 사회자 제어 화면, 참가자 스마트폰 화면의 실시간 통신 구조를 제공합니다.

## 화면 구조

- `/display`: 빔프로젝터에 띄우는 모두가 보는 메인 화면
- `/host`: 사회자가 노트북으로 조작하는 제어 화면
- `/player`: 참가자가 스마트폰으로 접속하는 화면

기본 roomId는 `src/lib/room.ts`의 `main`입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 다음 주소를 엽니다.

```txt
http://localhost:3000/display
http://localhost:3000/host
http://localhost:3000/player
```

같은 Wi-Fi의 스마트폰에서 접속하려면 노트북의 로컬 IP를 사용합니다.

```txt
http://<노트북 로컬 IP>:3000/player
```

## 주요 Socket.IO 이벤트

### 참가자

- `player:join`: 닉네임으로 입장 또는 재접속
- `player:buzzer`: 버저 누르기
- `player:answer-submit`: 정답 제출
- `player:joined`: 신규 참가자 입장 브로드캐스트
- `player:rejoined`: 기존 참가자 재접속 브로드캐스트

### 사회자

- `host:join`: 사회자/디스플레이가 room 상태 구독
- `host:command`: phase, screen, message 변경
- `host:reset-buzzer`: 현재 버저 선점자 초기화
- `host:score-adjust`: 참가자 점수 조정

### 공통 수신

- `room:state`: room 전체 상태 동기화
- `room:error`: 오류 메시지
- `buzzer:accepted`: 첫 번째 버저 수락
- `answer:received`: 정답 제출 수신
- `screen:effect`: 화면 효과 트리거

## 참가자 재접속 방식

참가자가 `/player`에서 닉네임을 입력하면 서버가 `participant.id`를 발급합니다.
클라이언트는 이 값을 `localStorage`에 저장합니다.

저장 키:

```txt
recreation.participantId
recreation.nickname
```

새로고침이나 재접속 시 이 값을 `player:join`에 다시 보내고, 서버는 기존 참가자로 복구합니다.

## 확장 포인트

- `src/types/socket.ts`: 이벤트 타입과 room 상태 타입 확장
- `server/roomStore.ts`: 인메모리 room 상태 관리. 운영 배포 시 Redis/DB로 교체 권장
- `server/index.ts`: Socket.IO 이벤트 핸들러
- `src/app/display/page.tsx`: 빔 화면 애니메이션/효과 추가
- `src/app/host/page.tsx`: 게임별 사회자 제어 패널 추가
- `src/app/player/page.tsx`: 답안 입력, 버저, 투표 등 참가자 UI 추가

## 배포/운영 메모

현재 구조는 커스텀 Node 서버에서 Next.js와 Socket.IO를 함께 띄웁니다.
Vercel의 일반 Serverless 배포보다는 장시간 연결을 지원하는 Node 서버 환경이 적합합니다.
예: Railway, Render, Fly.io, EC2, 사내 서버 등.

다중 인스턴스로 확장할 경우 `@socket.io/redis-adapter`와 Redis pub/sub을 연결하세요.
관련 패키지는 `package.json`에 포함해두었지만 기본 코드는 인메모리 단일 인스턴스 기준입니다.
