import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, ArrowLeft, Send, Loader2, Volume2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TTSService } from '@/lib/ttsService';
import { cn } from '@/lib/utils';
import type { Message, PageType } from '@/types';
import axios, { AxiosError } from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/apiConfig';

interface ChatPageProps {
  setPage: (page: PageType) => void;
}

interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageWithAudio extends Message {
  audioUrl?: string;
  audioBlob?: Blob;
  isGeneratingAudio?: boolean;
}

export const ChatPage: React.FC<ChatPageProps> = ({ setPage }) => {
  const [messages, setMessages] = useState<MessageWithAudio[]>([
    { 
      from: 'bot', 
      text: '안녕하세요! 자유롭게 대화하며 오디오 가이드를 만들어보세요. 예: "부산 해운대에서 친구와 함께 힐링 여행 가이드 만들어줘"' 
    }
  ]);
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ttsService, setTtsService] = useState<TTSService | null>(null);

  // TTS 서비스 초기화
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      setTtsService(new TTSService({ apiKey }));
    }
  }, []);

  // 기존 채팅 방식 API 호출 함수 (fallback으로 사용)
  const requestChatCompletion = async (messagesHistory: ApiMessage[]) => {
    const body = {
      hash: API_CONFIG.hash,
      messages: messagesHistory
    };

    try {
      console.log('전송할 헤더:', API_CONFIG.headers);
      console.log('전송할 데이터:', body);
      
      const response = await axios.post(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.chatCompletions}`,
        body,
        { headers: API_CONFIG.headers }
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
        text: '안녕하세요! 자유롭게 대화하며 오디오 가이드를 만들어보세요. 예: "부산 해운대에서 친구와 함께 힐링 여행 가이드 만들어줘"' 
      }
    ]);
    setApiMessages([]);
  };

  // TTS 오디오 생성 함수
  const generateAudio = async (messageIndex: number) => {
    if (!ttsService) {
      alert('TTS 서비스가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
      return;
    }

    const message = messages[messageIndex];
    if (!message || !ttsService.hasSpeakers(message.text)) {
      alert('Speaker 형태의 대본이 아닙니다.');
      return;
    }

    // 오디오 생성 중 상태 업데이트
    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, isGeneratingAudio: true } : msg
    ));

    try {
      const result = await ttsService.generateAudio(message.text);
      
      // 오디오 URL과 Blob 업데이트
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { 
          ...msg, 
          audioUrl: result.audioUrl, 
          audioBlob: result.audioBlob,
          isGeneratingAudio: false 
        } : msg
      ));
    } catch (error) {
      console.error('오디오 생성 오류:', error);
      
      // 구체적인 에러 처리
      let errorMessage = '오디오 생성에 실패했습니다.';
      let shouldShowAlternatives = false;
      
      if (error instanceof Error) {
        if (error.message.includes('브라우저에서 직접 재생할 수 없는 형식')) {
          errorMessage = 'Google TTS 형식 호환성 문제가 발생했습니다.';
          shouldShowAlternatives = true;
        } else if (error.message.includes('API 키')) {
          errorMessage = 'API 키를 확인해주세요.';
        } else if (error.message.includes('할당량')) {
          errorMessage = 'API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (shouldShowAlternatives) {
        const shouldContinue = confirm(
          `${errorMessage}\n\n` +
          '해결 방법:\n' +
          '1. 다운로드된 파일을 외부 프로그램으로 재생\n' +
          '2. 서버 사이드 처리 구현\n' +
          '3. 다른 TTS 서비스 사용\n\n' +
          '계속해서 다른 대본으로 시도해보시겠습니까?'
        );
        
        if (!shouldContinue) {
          // 페이지를 홈으로 돌아가거나 다른 액션
        }
      } else {
        alert(errorMessage);
      }
      
      // 오디오 생성 중 상태 해제
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { ...msg, isGeneratingAudio: false } : msg
      ));
    }
  };

  // 오디오 다운로드 함수
  const downloadAudio = (messageIndex: number) => {
    if (!ttsService) return;

    const message = messages[messageIndex];
    if (!message.audioBlob) return;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `audio-guide-${timestamp}.wav`;
    
    ttsService.downloadAudio(message.audioBlob, filename);
  };

  return (
    <div className="flex flex-col h-full bg-background p-4">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setPage('home')}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-xl font-bold ml-2">자유 대화로 오디오 가이드 만들기</h2>
        </div>
        <Button variant="outline" size="sm" onClick={clearHistory}>
          대화 초기화
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 p-4 space-y-6 rounded-lg bg-muted/40">
        {messages.map((msg, index) => (
          <div key={index} className={cn(
            'flex flex-col gap-2', 
            msg.from === 'user' ? 'items-end' : 'items-start'
          )}>
            {/* TTS 기능 - Bot 메시지이고 Speaker 형태일 때만 표시 */}
            {msg.from === 'bot' && ttsService && ttsService.hasSpeakers(msg.text) && (
              <div className="flex flex-col gap-2 w-full max-w-md mb-2">
                {!msg.audioUrl && !msg.isGeneratingAudio && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => generateAudio(index)}
                    className="flex items-center gap-2"
                  >
                    <Volume2 size={16} />
                    오디오 생성하기
                  </Button>
                )}
                
                {msg.isGeneratingAudio && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="animate-spin" size={16} />
                    오디오 생성 중...
                  </div>
                )}
                
                {msg.audioUrl && (
                  <div className="flex flex-col gap-2">
                    <AudioPlayer 
                      audioUrl={msg.audioUrl}
                      className="w-full"
                      onEnd={() => {
                        console.log('오디오 재생 완료');
                      }}
                    />
                    {msg.audioBlob && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadAudio(index)}
                        className="flex items-center gap-2 self-start"
                      >
                        <Download size={16} />
                        오디오 다운로드
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className={cn(
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

      </div>
      
      <div className="flex-shrink-0 flex items-center gap-2 p-2 bg-card rounded-lg border">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="예: 부산 해운대에서 친구와 함께 힐링 여행 가이드 만들어줘"
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
          총 메시지 수: {apiMessages.length}개 | 채팅 방식 (기존 messages 형태)
          {!ttsService && (
            <span className="ml-2 text-orange-500">
              • TTS 서비스 비활성화 (API 키 설정 필요)
            </span>
          )}
        </div>
      )}
    </div>
  );
}; 