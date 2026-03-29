# vocabook

영어 단어장 iOS 앱. SQLite 기반 오프라인 동작, OCR 단어 추가, 플래시카드·퀴즈 학습, TTS 지원.

---

## 프로젝트 구조

```
vocabook/
├── app_offline/      # React Native + Expo (메인 앱, SQLite 오프라인)
├── app/              # React Native + Expo (백엔드 연동 버전)
└── backend/          # Node.js + Express + TypeScript + Prisma
```

---

## 주요 기능

- 단어장 생성 · 수정 · 삭제
- 단어 추가 / 수정 / 삭제 (직접 입력 또는 사진 OCR)
- 즐겨찾기
- 플래시카드 학습
- 객관식 / 주관식 퀴즈
- 오늘의 단어 (랜덤 20개)
- TTS 발음 듣기
- 다크 모드 지원
- 완전 오프라인 동작 (OCR만 인터넷 필요)

---

## 앱 실행 (app_offline)

### 1. 사전 요구사항

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode + 시뮬레이터 또는 실기기

### 2. 환경변수 설정

```bash
cd app_offline
cp .env.example .env
```

`.env` 파일에 Gemini API 키를 입력하세요 (OCR 사용 시):

```env
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

Gemini API 키는 [Google Cloud Console](https://console.cloud.google.com)에서 발급받을 수 있습니다.

### 3. 실행

```bash
cd app_offline
npm install
npx expo start
```

### 4. TestFlight 배포 (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | React Native + Expo SDK 54 |
| 데이터베이스 | expo-sqlite (로컬 SQLite) |
| 상태 관리 | Zustand |
| 네비게이션 | React Navigation |
| OCR | Google Gemini 2.5 Flash API |
| TTS | expo-speech |
| 빌드/배포 | EAS Build + TestFlight |
