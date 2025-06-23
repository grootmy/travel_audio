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
import { Select } from "@/components/ui/select";

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


const companions = ['혼자', '연인과', '친구와', '가족과'];
const styles = ['느긋한 힐링', '활기찬 액티비티', '맛집 탐방', '문화 예술', '역사 유적'];

export const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
  const [messages, setMessages] = useState<MessageWithAudio[]>([
    { 
      from: 'bot', 
      text: '안녕하세요! 어떤 여행을 위한 오디오 가이드북을 만들어 드릴까요? 아래에서 원하는 여행 스타일을 선택하고 시작해보세요!' 
    }
  ]);
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selections, setSelections] = useState({ location: '', companion: '', style: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
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
      project: import.meta.env.VITE_WANTED_PROJECT,
      apiKey: import.meta.env.VITE_WANTED_API_KEY,
      'Content-Type': 'application/json; charset=utf-8'
    };

    const body = {
      hash: import.meta.env.VITE_WANTED_HASH,
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

  const handleInitialSubmit = async () => {
    if (!selections.location || !selections.companion || !selections.style || isGenerating) return;

    const userMessage = `${selections.location}에서 ${selections.companion} 즐기는 ${selections.style} 여행을 위한 오디오 가이드를 만들어줘.`;
    
    setIsGenerating(true);
    setIsSubmitted(true);

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

  const handleReset = () => {
    setMessages([
      { 
        from: 'bot', 
        text: '안녕하세요! 어떤 여행을 위한 오디오 가이드북을 만들어 드릴까요? 아래에서 원하는 여행 스타일을 선택하고 시작해보세요!' 
      }
    ]);
    setApiMessages([]);
    setSelections({ location: '', companion: '', style: '' });
    setIsSubmitted(false);
    setIsGenerating(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* 메인 헤더 섹션 */}
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-background to-accent/20">
        <div className="flex items-center gap-4 mb-6 animate-in fade-in slide-in-from-top duration-700">
          <div className="relative">
            <Headphones className="text-primary" size={48}/>
            <Sparkles className="absolute -top-2 -right-2 text-primary/60 animate-pulse" size={20} />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            오디오 트립
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl leading-relaxed text-center animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          <span className="text-primary font-semibold">AI가 만드는</span> 당신만의 특별한 오디오 가이드로<br />
          <span className="text-foreground">새로운 여행의 경험</span>을 시작해보세요
        </p>
      </div>

      {/* 채팅 컨테이너 */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
        {/* 선택 UI */}
        {!isSubmitted && (
          <Card className="animate-in fade-in duration-500 mb-4">
            <CardHeader>
              <CardTitle>어떤 여행을 떠나시나요?</CardTitle>
              <CardDescription>원하는 옵션을 선택하고 맞춤형 오디오 가이드를 생성해보세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">어디로 가시나요?</label>
                  <Input
                    placeholder="부산 해운대"
                    value={selections.location}
                    onChange={(e) => setSelections(s => ({ ...s, location: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">누구와 함께가나요?</label>
                  <Select 
                    onChange={(e) => setSelections(s => ({ ...s, companion: e.target.value }))} 
                    value={selections.companion}
                    required
                  >
                    <option value="" disabled>동행 선택</option>
                    {companions.map(companion => <option key={companion} value={companion}>{companion}</option>)}
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <label className="text-sm font-medium mb-2 block">어떤 스타일을 원하세요?</label>
                  <Select 
                    onChange={(e) => setSelections(s => ({ ...s, style: e.target.value }))} 
                    value={selections.style}
                    required
                  >
                    <option value="" disabled>스타일 선택</option>
                    {styles.map(style => <option key={style} value={style}>{style}</option>)}
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleInitialSubmit}
                disabled={!selections.location || !selections.companion || !selections.style || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                나만의 오디오 가이드 생성
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 채팅 헤더 */}
        <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-primary" />
            <span className="font-medium">AI 가이드와 채팅하기</span>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            새 대화
          </Button>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card/30 min-h-[400px]">
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
                  "p-3 rounded-lg max-w-xl",
                  message.from === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.from === 'bot' && ttsService?.hasSpeakers(message.text) && (
                  <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                    {message.isGeneratingAudio ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        오디오를 생성하는 중입니다...
                      </div>
                    ) : message.audioUrl ? (
                      <div className="flex flex-col gap-2">
                         <AudioPlayer audioUrl={message.audioUrl} />
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => downloadAudio(index)}
                           className="w-full"
                         >
                           <Download className="mr-2 h-4 w-4" />
                           오디오 파일 다운로드
                         </Button>
                      </div>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => generateAudio(index)}
                        className="w-full bg-primary/80 hover:bg-primary"
                      >
                        <Volume2 className="mr-2 h-4 w-4" />
                        이 대본으로 오디오 생성하기
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {message.from === 'user' && (
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback>
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start gap-3">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot size={16} />
                </AvatarFallback>
              </Avatar>
              <div className="p-3 rounded-lg bg-muted flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>가이드를 생성 중입니다...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        {/* 입력창 */}
        <div className="p-4 border-t bg-card/50 backdrop-blur-sm rounded-b-lg">
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isSubmitted ? "추가 질문을 입력하세요..." : "먼저 위에서 옵션을 선택하여 가이드를 생성해주세요."}
              className="pr-10"
              disabled={!isSubmitted || isGenerating}
            />
            <Button
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleSend}
              disabled={!isSubmitted || !input.trim() || isGenerating}
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* 하단 여백 */}
      <div className="p-4"></div>
    </div>
  );
}; 