import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Mic, Sparkles, Bot, User, Send, Loader2, Volume2, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TTSService } from '@/lib/ttsService';
import { cn } from '@/lib/utils';
import type { PageType, Message } from '@/types';
import axios, { AxiosError } from 'axios';

interface HomePageProps {
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

export const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<MessageWithAudio[]>([
    { 
      from: 'bot', 
      text: '안녕하세요! 어떤 여행을 위한 오디오 가이드북을 만들어 드릴까요? 자유롭게 대화해보세요!' 
    }
  ]);
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [ttsService, setTtsService] = useState<TTSService | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isGenerating]);

  // TTS 서비스 초기화
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      setTtsService(new TTSService({ apiKey }));
    }
  }, []);

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
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput('');
    setIsGenerating(true);

    const newMessages = [...messages, { from: 'user' as const, text: userMessage }];
    setMessages(newMessages);

    const newApiMessages = [...apiMessages, { role: 'user' as const, content: userMessage }];

    try {
      const response = await requestChatCompletion(newApiMessages);
      
      if (response) {
        setMessages(prev => [...prev, { from: 'bot', text: response }]);
        setApiMessages([...newApiMessages, { role: 'assistant', content: response }]);
      } else {
        setMessages(prev => [...prev, { 
          from: 'bot', 
          text: '죄송합니다. 응답을 생성하는데 문제가 발생했습니다. 다시 시도해주세요.' 
        }]);
      }
    } catch (error) {
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

    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, isGeneratingAudio: true } : msg
    ));

    try {
      const result = await ttsService.generateAudio(message.text);
      
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
      alert('오디오 생성에 실패했습니다. 다시 시도해주세요.');
      
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { ...msg, isGeneratingAudio: false } : msg
      ));
    }
  };

  const downloadAudio = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message?.audioBlob) return;

    const url = URL.createObjectURL(message.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-guide-${messageIndex}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (showChat) {
    return (
      <div className="flex flex-col h-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm">
          <Button 
            variant="ghost" 
            onClick={() => setShowChat(false)}
            className="flex items-center gap-2"
          >
            <Headphones size={20} />
            <span>오디오 트립</span>
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              setMessages([
                { 
                  from: 'bot', 
                  text: '안녕하세요! 어떤 여행을 위한 오디오 가이드북을 만들어 드릴까요? 자유롭게 대화해보세요!' 
                }
              ]);
              setApiMessages([]);
            }}
          >
            새 대화
          </Button>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom duration-300",
                message.from === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.from === 'bot' && (
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2 relative group",
                  message.from === 'user'
                    ? 'bg-primary text-primary-foreground ml-12'
                    : 'bg-muted text-foreground mr-12'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                
                {message.from === 'bot' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                    {message.audioUrl ? (
                      <div className="flex items-center gap-2 w-full">
                        <AudioPlayer audioUrl={message.audioUrl} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAudio(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Download size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateAudio(index)}
                        disabled={message.isGeneratingAudio}
                        className="text-xs"
                      >
                        {message.isGeneratingAudio ? (
                          <>
                            <Loader2 size={14} className="animate-spin mr-1" />
                            생성 중...
                          </>
                        ) : (
                          <>
                            <Volume2 size={14} className="mr-1" />
                            오디오 생성
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {message.from === 'user' && (
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom duration-300">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot size={16} />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted text-foreground rounded-lg px-4 py-2 max-w-[80%] mr-12">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">답변을 생성하고 있습니다...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="border-t bg-card/50 backdrop-blur-sm p-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="여행에 대해 자유롭게 이야기해보세요..."
              disabled={isGenerating}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              size="icon"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-background via-background to-accent/20">
      {/* 메인 헤더 */}
      <div className="flex items-center gap-4 mb-6 animate-in fade-in slide-in-from-top duration-700">
        <div className="relative">
          <Headphones className="text-primary" size={48}/>
          <Sparkles className="absolute -top-2 -right-2 text-primary/60 animate-pulse" size={20} />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          오디오 트립
        </h1>
      </div>
      
      {/* 서브 타이틀 */}
      <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl leading-relaxed animate-in fade-in slide-in-from-bottom duration-700 delay-200">
        <span className="text-primary font-semibold">AI가 만드는</span> 당신만의 특별한 오디오 가이드로<br />
        <span className="text-foreground">새로운 여행의 경험</span>을 시작해보세요
      </p>

      {/* 메인 액션 카드 */}
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom duration-700 delay-300">
        <Card 
          onClick={() => setShowChat(true)}
          className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:scale-[1.02] border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
        >
          <CardHeader className="items-center pb-6">
            <div className="relative mb-4">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-6 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Mic size={40} className="text-primary" />
              </div>
              <div className="absolute -inset-2 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <CardTitle className="text-2xl md:text-3xl group-hover:text-primary transition-colors duration-300">
              나만의 오디오 가이드 만들기
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription className="text-base leading-relaxed mb-4 group-hover:text-foreground/90 transition-colors duration-300">
              AI와 대화하며 당신의 여행 스타일에 완벽하게 맞는<br />
              <span className="text-primary font-medium">맞춤형 오디오 가이드</span>를 생성해보세요
            </CardDescription>
            <div className="bg-primary/10 rounded-lg p-3 mb-4">
              <p className="text-sm text-muted-foreground">
                💡 <strong>데모 체험:</strong> 바로 시작해서 채팅 후 오디오 생성까지!
              </p>
            </div>
            <Button className="w-full group-hover:scale-105 transition-transform duration-300">
              지금 시작하기
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* 하단 장식 요소 */}
      <div className="mt-16 flex gap-4 opacity-60 animate-in fade-in duration-1000 delay-500">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}; 