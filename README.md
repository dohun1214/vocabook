# 영어 단어장 앱

동생을 위한 영어 단어장 iOS 앱. 백엔드(Node.js + Express) + 앱(React Native + Expo)으로 구성.

---

## 프로젝트 구조

```
vocabulary_list/
├── backend/          # Node.js + Express + TypeScript + Prisma
└── app/              # React Native + Expo (구현 예정)
```

---

## 백엔드 로컬 실행

### 1. 사전 요구사항

- Node.js 18+
- MySQL 8.0+

### 2. 환경변수 설정

```bash
cd backend
cp .env.example .env
```

`.env` 파일을 열어서 아래 값들을 채워주세요:

```env
# MySQL 연결 정보
DATABASE_URL="mysql://유저명:비밀번호@localhost:3306/vocabulary_db"

# JWT 시크릿 (32자 이상 랜덤 문자열 권장)
JWT_SECRET="your-access-token-secret-minimum-32-characters-long"
JWT_REFRESH_SECRET="your-refresh-token-secret-minimum-32-characters-long"

# Google Gemini API 키 (OCR 파싱용)
# https://aistudio.google.com/app/apikey 에서 발급
GEMINI_API_KEY="your-gemini-api-key"

# Google Cloud TTS API 키
# https://console.cloud.google.com 에서 Text-to-Speech API 활성화 후 발급
GOOGLE_TTS_API_KEY="your-google-cloud-tts-api-key"
```

### 3. MySQL 데이터베이스 생성

```sql
CREATE DATABASE vocabulary_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 의존성 설치 및 마이그레이션

```bash
cd backend
npm install
npm run db:generate   # Prisma 클라이언트 생성
npm run db:migrate    # 마이그레이션 실행 (테이블 생성)
```

### 5. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

헬스체크: `GET http://localhost:3000/health`

---

## API 엔드포인트 목록

### Auth (인증)
| Method | URL | 설명 | 인증 필요 |
|--------|-----|------|-----------|
| POST | /auth/register | 회원가입 | X |
| POST | /auth/login | 로그인 | X |
| POST | /auth/refresh | 토큰 갱신 | X |
| DELETE | /auth/logout | 로그아웃 | X |
| DELETE | /auth/withdraw | 회원탈퇴 | O |

### Wordbooks (단어장)
| Method | URL | 설명 |
|--------|-----|------|
| GET | /wordbooks | 단어장 목록 |
| POST | /wordbooks | 단어장 생성 |
| PUT | /wordbooks/:id | 단어장 수정 |
| DELETE | /wordbooks/:id | 단어장 삭제 |

### Words (단어)
| Method | URL | 설명 |
|--------|-----|------|
| GET | /wordbooks/:wordbookId/words | 단어 목록 (search, isFavorite, isMemorized, sortBy, order 쿼리 파라미터) |
| POST | /wordbooks/:wordbookId/words | 단어 추가 |
| POST | /wordbooks/:wordbookId/words/bulk | 단어 일괄 추가 (OCR 결과 저장용) |
| PUT | /words/:id | 단어 수정 |
| DELETE | /words/:id | 단어 삭제 |
| PATCH | /words/:id/favorite | 즐겨찾기 토글 |
| PATCH | /words/:id/memorized | 암기 체크 토글 |

### OCR
| Method | URL | 설명 |
|--------|-----|------|
| POST | /ocr/parse | OCR 텍스트 → 단어 JSON 배열 파싱 (Gemini) |

### TTS
| Method | URL | 설명 |
|--------|-----|------|
| POST | /tts | 텍스트 → base64 MP3 오디오 (Google Cloud TTS) |

### Study (학습)
| Method | URL | 설명 |
|--------|-----|------|
| GET | /study/today | 오늘 복습할 단어 목록 (SM-2 기반) |
| POST | /study/log | 학습 결과 기록 |
| POST | /study/review/:wordId | SM-2 알고리즘으로 복습 간격 업데이트 |

### Stats (통계)
| Method | URL | 설명 |
|--------|-----|------|
| GET | /stats | 총 단어 수, 암기율, 스트릭, 단어장별 통계 |

---

## 인증 방식

모든 보호된 API는 요청 헤더에 Access Token을 포함해야 합니다:

```
Authorization: Bearer <access_token>
```

Access Token이 만료(15분)되면 Refresh Token으로 갱신:

```
POST /auth/refresh
Body: { "refreshToken": "..." }
```

---

## SM-2 알고리즘

`POST /study/review/:wordId` 에 `quality` (0~5) 값을 보내면 다음 복습 날짜가 자동 계산됩니다.

- `0~1`: 틀림 → 1일 후 다시 복습
- `2~5`: 맞음 → easeFactor에 따라 복습 간격 증가

---

## 앱 로컬 실행

### 1. 사전 요구사항
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode + iPhone 시뮬레이터 또는 Expo Go 앱
- Android: Android Studio 또는 Expo Go 앱

### 2. 환경변수 설정

```bash
cd app
# .env 파일에서 API URL 수정
# 실제 기기에서 테스트 시 localhost → 맥/PC의 로컬 IP로 변경
# 예: EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

### 3. 실행

```bash
cd app
npm install
npx expo start
```

QR코드를 Expo Go 앱으로 스캔하거나 `i` (iOS 시뮬레이터), `a` (Android 에뮬레이터)를 누르세요.

### 4. EAS Build (실기기 배포)

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile development
```

---

## 빌드

```bash
cd backend
npm run build   # TypeScript → dist/ 컴파일
npm start       # 프로덕션 서버 실행
```
