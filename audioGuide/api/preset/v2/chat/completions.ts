import type { VercelRequest, VercelResponse } from '@vercel/node';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, project, apiKey');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // 요청 헤더에서 필요한 정보 추출
    const { project, apiKey } = req.headers;
    const { hash, messages } = req.body;

    // 헤더 검증
    if (!project || !apiKey) {
      res.status(400).json({ error: 'Missing required headers: project, apiKey' });
      return;
    }

    // 요청 본문 검증
    if (!hash || !messages) {
      res.status(400).json({ error: 'Missing required body fields: hash, messages' });
      return;
    }

    // 외부 API로 요청 전송
    const response = await fetch('https://api-laas.wanted.co.kr/api/preset/v2/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'project': req.headers.project as string,
        'apiKey': req.headers.apiKey as string,
        'User-Agent': 'vercel-api/1.0.0'
      },
      body: JSON.stringify({
        hash,
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API Error:', response.status, errorText);
      res.status(response.status).json({ 
        error: 'External API request failed',
        details: errorText
      });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('API Handler Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default handler; 