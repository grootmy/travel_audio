import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ message: 'Missing messages in request body' });
  }

  const wantedApiKey = process.env.WANTED_API_KEY;
  const wantedProject = process.env.WANTED_PROJECT;
  const wantedHash = process.env.WANTED_HASH;

  if (!wantedApiKey || !wantedProject || !wantedHash) {
    return res.status(500).json({ message: 'API environment variables are not configured correctly on the server.' });
  }

  const headers = {
    'project': wantedProject,
    'apiKey': wantedApiKey,
    'Content-Type': 'application/json; charset=utf-8',
  };

  const body = {
    hash: wantedHash,
    messages: messages,
  };

  try {
    const response = await fetch('https://api-laas.wanted.co.kr/api/preset/v2/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Wanted API Error:', errorData);
      return res.status(response.status).json({ message: 'Error from Wanted API', details: errorData });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error during chat completion request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
} 