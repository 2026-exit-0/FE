# damda — FE

담다(DAMDA) 프로젝트의 프론트엔드 코드.
React 18 + Vite + Tailwind CSS 기반의 반응형 SPA 웹 애플리케이션으로, 기기 측정 연동 피부 분석 결과 시각화 및 맞춤 케어 정보를 제공한다.

---

## 1. 주요 페이지 구성

| 대메뉴 | 페이지명 | 주요 기능 및 연동 스펙 |
|---|---|---|
| **소개 / 인증** | `LandingPage`<br>`LoginPage` / `SignupPage` | 서비스 소개 및 브랜딩 홍보<br>JWT 토큰 기반 회원 가입 및 로그인 |
| **대시보드** | `DashboardPage` | 접속 지역 GPS 연동 실시간 날씨(기온·습도·UV) 반영<br>맞춤형 스킨 팁 & 스캔 진입 요약 대시보드 |
| **피부 진단** | `SkinCheckPage`<br>`ScanPage` | 사진 업로드 추론(카메라 캡처) 및<br>ESP32-CAM 피부 측정 하드웨어 연동 진단 흐름 |
| **분석 결과** | `AnalysisPage` | 피부 5대 지표(수분·유분·탄력·모공·색소침착) 레이더 차트 분석<br>얼굴 부위별 히트맵 시각화 및 PDF 리포트 인쇄 / PNG 요약본 다운로드 |
| **리포트** | `ReportPage` | Recharts 기반 주간/월간/3개월/전체 추이 분석 그래프 제공 |
| **추천 / 케어** | `ProductsPage`<br>`CareGuidePage` | AI 매칭률 및 제외 필터 기반 맞춤형 화장품 추천 및 찜하기<br>진단 맞춤형 아침/저녁/주간 스킨케어 루틴 가이드 |
| **마이페이지** | `MyPage` | 닉네임 수정 및 알림 설정 변경, 비밀번호 변경<br>찜한 화장품 관리(5초 되돌리기 스낵바 탑재) 및 스캔 이력 기록 |

---

## 2. 디렉터리 구조

```
FE/
├── README.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── .env.production             # 배포 환경 설정 (Mock/Real 통신 분기)
├── public/
└── src/
    ├── api/                    # Axios 클라이언트 및 백엔드 라우터 연동 (auth.js, products.js, scan.js)
    ├── components/             # 공통 레이아웃(Header, Sidebar, BottomNav) 및 공통 UI 컴포넌트(Button)
    ├── hooks/                  # 커스텀 React 훅 (useAuth, useWeather 실시간 날씨 훅 등)
    ├── pages/                  # 9대 주요 독립 페이지 화면 컴포넌트
    ├── store/                  # Zustand 전역 상태 스토어 (authStore, scanStore)
    ├── utils/                  # 공통 변수(constants.js) 및 가상 목업 데이터(mockData.js)
    └── App.jsx                 # 라우터 경로 매핑 및 인증 ProtectedRoute 구성
```

---

## 3. 설치 & 실행

### 의존성 패키지 설치
`Yarn` 또는 `NPM` 패키지 관리자를 통해 필요한 패키지를 먼저 설치한다.
```bash
# yarn 사용 시
yarn install

# npm 사용 시
npm install
```

### 로컬 개발 서버 실행
Vite 개발 서버를 기동하여 로컬 환경에서 테스트한다.
```bash
# yarn 사용 시
yarn dev

# npm 사용 시
npm run dev
```
기본 접속 주소: `http://localhost:3000`

### 배포용 빌드 컴파일
최적화 및 Minify 과정을 포함한 프로덕션 빌드 번들을 컴파일한다.
```bash
# yarn 사용 시
yarn build

# npm 사용 시
npm run build
```
결과물은 `/dist` 폴더 내에 정적 웹 파일 형태로 빌드된다.

---

## 4. 환경 변수 및 Mock 모드 스위칭

본 프론트엔드는 백엔드가 없거나 배포 대기 중인 상태에서도 독립적으로 모든 기능 시나리오(스캔, 결과, 차트, 추천 등)를 완벽하게 시뮬레이션할 수 있는 **자체 체험(Mock) 모드**를 내장하고 있다.

프로젝트 루트 폴더 내의 `.env` 또는 `.env.production` 설정을 통해 연동 모드를 스위칭할 수 있다.

```env
# 1. API 주소 (로컬 또는 배포된 백엔드 API 주소)
VITE_API_BASE=http://localhost:8000

# 2. Mock 모드 스위치
VITE_USE_MOCK=true
```

| `VITE_USE_MOCK` 값 | 동작 상태 | 설명 |
|---|---|---|
| **`true`** | **임시 체험(Mock) 모드** | 백엔드 API 연결을 우회하고 `mockData.js` 내에 적재된 다차원 데이터셋과 클라이언트 연산으로 가입, 스캔, 추천, 차트 등의 모든 UI 연동 프로세스를 완벽하게 재현한다. |
| **`false`** | **실제 백엔드 API 연동 모드** | `VITE_API_BASE` 주소로 실제 HTTP 비동기 통신을 전송하며, 로그인 토큰 인증 및 실제 DB 저장 데이터 기반으로 구동한다. |
