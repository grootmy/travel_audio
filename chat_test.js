import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function requestChatCompletion() {
    const headers = {
        project: 'KNTO-PROMPTON-146',
        apiKey: '774a536edd85151a8e04c879444cee77f05328d4d578ef0a31d2599eff3cffd1',
        'Content-Type': 'application/json; charset=utf-8'
    }

    const body = {
        hash: '6814121a43c93b280c00af257655dd60f379ec058339b0c03f9d74822757e773',
        "messages": [
            {
                "role": "user",
                "content": "Hello, how are you?"
            }
        ]
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

requestChatCompletion();