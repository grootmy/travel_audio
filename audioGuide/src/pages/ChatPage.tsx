import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Message, PageType } from '@/types';
import axios, { AxiosError } from 'axios';

interface ChatPageProps {
  setPage: (page: PageType) => void;
}

interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ setPage }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      from: 'bot', 
      text: '안녕하세요! 어떤 여행을 위한 오디오 가이드북을 만들어 드릴까요? 자유롭게 대화해보세요!' 
    }
  ]);
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]); // API 요청을 위한 메시지 히스토리
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isGenerating]);

  // API 호출 함수
  const requestChatCompletion = async (messagesHistory: ApiMessage[]) => {
    const headers = {
      project: 'KNTO-PROMPTON-146',
      apiKey: '774a536edd85151a8e04c879444cee77f05328d4d578ef0a31d2599eff3cffd1',
      'Content-Type': 'application/json; charset=utf-8'
    };

    const body = {
      hash: '6814121a43c93b280c00af257655dd60f379ec058339b0c03f9d74822757e773',
      messages: messagesHistory
    };

    try {
      console.log('전송할 헤더:', headers);
      console.log('전송할 데이터:', body);
      
      const response = await axios.post(
        '/api/preset/v2/chat/completions',
        body,
        { headers }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const messageContent = response.data.choices[0].message.content;
        return messageContent;
      }
      return null;
    } catch (error) {
      console.error('Error during chat completion request:', error);
      if (error instanceof AxiosError && error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput('');
    setIsGenerating(true);

    // UI에 사용자 메시지 추가
    const newMessages = [...messages, { from: 'user' as const, text: userMessage }];
    setMessages(newMessages);

    // API 메시지 히스토리에 사용자 메시지 추가
    const newApiMessages = [...apiMessages, { role: 'user' as const, content: userMessage }];

    try {
      // API 호출
      const response = await requestChatCompletion(newApiMessages);
      
      if (response) {
        // 성공적인 응답 처리
        setMessages(prev => [...prev, { from: 'bot', text: response }]);
        
        // API 메시지 히스토리에 어시스턴트 응답 추가
        setApiMessages([...newApiMessages, { role: 'assistant', content: response }]);
      } else {
        // 응답이 없는 경우
        setMessages(prev => [...prev, { 
          from: 'bot', 
          text: '죄송합니다. 응답을 생성하는데 문제가 발생했습니다. 다시 시도해주세요.' 
        }]);
      }
    } catch (error) {
      // 에러 처리
      console.error('Chat API Error:', error);
      let errorMessage = '죄송합니다. 서버와의 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      
      if (error instanceof AxiosError) {
        if (error.response?.status === 403) {
          errorMessage = '인증 오류가 발생했습니다. API 설정을 확인해주세요.';
        } else if (error.response?.status === 429) {
          errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        }
      }
      
      setMessages(prev => [...prev, { 
        from: 'bot', 
        text: errorMessage
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // 대화 히스토리 초기화 함수
  const clearHistory = () => {
    setMessages([
      { 
        from: 'bot', 
        text: '안녕하세요! 어떤 여행을 위한 오디오 가이드북을 만들어 드릴까요? 자유롭게 대화해보세요!' 
      }
    ]);
    setApiMessages([]);
  };

  return (
    <div className="flex flex-col h-full bg-background p-4">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setPage('home')}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-xl font-bold ml-2">나만의 오디오 가이드 만들기</h2>
        </div>
        <Button variant="outline" size="sm" onClick={clearHistory}>
          대화 초기화
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 p-4 space-y-6 rounded-lg bg-muted/40">
        {messages.map((msg, index) => (
          <div key={index} className={cn(
            'flex items-end gap-2', 
            msg.from === 'user' ? 'justify-end' : 'justify-start'
          )}>
            {msg.from === 'bot' && (
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot size={20}/>
                </AvatarFallback>
              </Avatar>
            )}
            <div className={cn(
              'px-4 py-2 rounded-2xl max-w-xs md:max-w-md shadow-sm whitespace-pre-wrap', 
              msg.from === 'user' 
                ? 'bg-primary text-primary-foreground rounded-br-none' 
                : 'bg-card text-card-foreground rounded-bl-none'
            )}>
              {msg.text}
            </div>
            {msg.from === 'user' && (
              <Avatar>
                <AvatarFallback>
                  <User size={20}/>
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        
        {isGenerating && (
          <div className="flex items-end gap-2 justify-start">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot size={20}/>
              </AvatarFallback>
            </Avatar>
            <div className="px-4 py-3 rounded-2xl bg-card text-card-foreground rounded-bl-none flex items-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm text-muted-foreground">AI가 응답을 생성 중입니다...</span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>
      
      <div className="flex-shrink-0 flex items-center gap-2 p-2 bg-card rounded-lg border">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          className="flex-1 bg-transparent focus:outline-none px-2 border-none focus-visible:ring-0"
          disabled={isGenerating}
        />
        <Button onClick={handleSend} disabled={isGenerating || !input.trim()} size="icon">
          <Send size={20}/>
        </Button>
      </div>
      
      {/* 메시지 히스토리 디버그 정보 (개발 모드에서만 표시) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-muted-foreground">
          총 메시지 수: {apiMessages.length}개
        </div>
      )}
    </div>
  );
}; 