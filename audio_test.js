import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import wav from 'wav';
dotenv.config();    // .env 파일 로드

// // ESM 환경에서 CommonJS 모듈을 로드하기 위한 createRequire
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);

// WAV 파일을 저장하는 함수
async function saveWaveFile(
   filename,
   pcmData,
   channels = 1,
   rate = 24000,
   sampleWidth = 2,
) {
   return new Promise((resolve, reject) => {
    //   const wav = require('wav');
      const writer = new wav.FileWriter(filename, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
   });
}


async function requestChatCompletion() {
    const headers = {
        project: 'KNTO-PROMPTON-146',
        apiKey: '774a536edd85151a8e04c879444cee77f05328d4d578ef0a31d2599eff3cffd1',
        'Content-Type': 'application/json; charset=utf-8'
    }

    const body = {
        hash: '6814121a43c93b280c00af257655dd60f379ec058339b0c03f9d74822757e773',
        params: {
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, how are you?"
                }
            ]
        }
    };

    try {
        const response = await axios.post(
            'https://api-laas.wanted.co.kr/api/preset/v2/chat/completions',
            body, 
            {
                headers
            }
        );

        console.log('Response data:', response.data);
        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const messageContent = response.data.choices[0].message.content;
            console.log('Chat completion message:', messageContent);
            return messageContent;
        }
        return null;
    } catch (error) {
        console.error('Error during chat completion request:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

async function main() {
   // 먼저 채팅 완료 메시지를 가져옵니다.
//    const chatMessage = await requestChatCompletion();
//    console.log(chatMessage);

//    if (!chatMessage) {
//        console.error('채팅 완료 메시지를 가져오지 못했습니다. TTS를 진행할 수 없습니다.');
//        return;
//    }

   // Google GenAI API 키 설정
   const apiKey = process.env.GEMINI_API_KEY;
   if (!apiKey) {
       console.error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
       return;
   }

   const ai = new GoogleGenAI({ apiKey: apiKey });

   // 채팅 메시지를 TTS 프롬프트로 사용
//    const prompt = `${chatMessage}`;
   const prompt2=`TTS the following conversation between Joe and Jane:
         Joe: How's it going today Jane?
         Jane: Not too bad, how about you?`
   console.log(prompt2);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt2 }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                   multiSpeakerVoiceConfig: {
                      speakerVoiceConfigs: [
                            {
                               speaker: 'Joe',
                               voiceConfig: {
                                  prebuiltVoiceConfig: { voiceName: 'Kore' }
                               }
                            },
                            {
                               speaker: 'Jane',
                               voiceConfig: {
                                  prebuiltVoiceConfig: { voiceName: 'Enceladus' }
                               }
                            }
                      ]
                   }
                }
            }
        });

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!data) {
            console.error('오디오 데이터를 수신하지 못했습니다.');
            return;
        }

        const audioBuffer = Buffer.from(data, 'base64');

        const fileName = 'out.wav';
        await saveWaveFile(fileName, audioBuffer);
        console.log(`오디오 파일이 ${fileName}으로 저장되었습니다.`);
   } catch (error) {
       console.error('TTS 생성 중 오류 발생:', error.message);
       if (error.response) {
           console.error('TTS Response data:', error.response.data);
       }
   }
}

// main 함수 실행
await main();

