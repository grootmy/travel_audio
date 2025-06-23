// API 설정
export const API_CONFIG = {
  // 개발 환경에서는 프록시 사용, 프로덕션에서는 Vercel rewrites 사용
  baseURL: '/api',
  
  // API 요청에 필요한 헤더
  headers: {
    project: 'KNTO-PROMPTON-146',
    apiKey: '774a536edd85151a8e04c879444cee77f05328d4d578ef0a31d2599eff3cffd1',
    'Content-Type': 'application/json; charset=utf-8'
  },
  
  // 요청 본문에 포함될 고정 값
  hash: '6814121a43c93b280c00af257655dd60f379ec058339b0c03f9d74822757e773'
};

// API 엔드포인트
export const API_ENDPOINTS = {
  chatCompletions: '/preset/v2/chat/completions'
}; 