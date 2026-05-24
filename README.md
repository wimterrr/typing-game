# Key Tempo

한국어, 영어, 혼합 문장으로 플레이할 수 있는 정적 웹 타자게임입니다.

## Game Modes

### Acid Rain
단어가 화면 위에서 떨어지며, 바닥에 닿기 전에 타이핑합니다.
- 5개 라이프 시스템
- 난이도: mobile / easy / normal / hard
- 속도 점진 가속
- 테마: terminal / arcade

### Classic
제한 시간 내 문장을 타이핑합니다.
- 30초 / 60초 / 90초 타이머
- WPM, 정확도, 실수, 콤보 추적

## Features

- 한글 / 영문 / 혼합 문장 모드
- 한글 IME 조합 처리
- 반응형 레이아웃 (모바일 지원)
- localStorage 기반 최고 점수 저장

## Tech Stack

- Vanilla JavaScript (ES Modules)
- Vite 8
- CSS (프레임워크 없음)

## Getting Started

```bash
npm install --include=dev
npm run dev
```

## Build

```bash
npm run build
```

빌드 결과물은 `dist/`에 생성되며 Vercel, Netlify, Cloudflare Pages 같은 정적 호스팅에 바로 배포할 수 있습니다.

## License

MIT
