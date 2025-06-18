import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { cn } from '@/lib/utils';
import type { Message, PageType } from '@/types';

interface ChatPageProps {
  setPage: (page: PageType) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ setPage }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      from: 'bot', 
      text: '안녕하세요! 어떤 여행을 위한 오디오 가이드북을 만들어 드릴까요? 먼저 여행가고 싶은 도시를 알려주세요. (예: 서울)' 
    }
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isGenerating]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;

    const newMessages = [...messages, { from: 'user' as const, text: input }];
    setMessages(newMessages);
    setInput('');

    setTimeout(() => {
      let botResponse = '';
      if (step === 0) {
        botResponse = `좋아요, ${input}! 누구와 함께하는 여행인가요? (예: 혼자, 친구와, 가족과 함께)`;
        setStep(1);
      } else if (step === 1) {
        botResponse = '그렇군요! 여행 일정은 어떻게 되시나요? (예: 2박 3일, 당일치기)';
        setStep(2);
      } else if (step === 2) {
        botResponse = '알겠습니다. 마지막으로, 특별히 원하시는 여행 스타일이나 꼭 가보고 싶은 곳이 있다면 알려주세요! 이 내용을 바탕으로 멋진 오디오 가이드를 만들어 드릴게요.';
        setStep(3);
      } else {
        botResponse = '모든 정보가 준비되었어요! 잠시만 기다려주시면 맞춤 오디오 가이드 대본과 오디오를 생성해 드릴게요.';
        setIsGenerating(true);
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            from: 'bot', 
            text: '짜잔! 나만의 오디오 가이드가 완성되었어요. 아래에서 바로 들어보세요!' 
          }]);
          setIsGenerating(false);
          setAudioReady(true);
        }, 3000);
      }
      
      if (!isGenerating && step < 3) {
        setMessages(prev => [...prev, { from: 'bot', text: botResponse }]);
      } else if (step === 3) {
        setMessages(prev => [...prev, { from: 'bot', text: botResponse }]);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-4">
      <div className="flex items-center mb-4 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setPage('home')}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold ml-2">나만의 오디오 가이드 만들기</h2>
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
              'px-4 py-2 rounded-2xl max-w-xs md:max-w-md shadow-sm', 
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
              <span className="text-sm text-muted-foreground">AI가 가이드를 생성 중입니다...</span>
            </div>
          </div>
        )}
        
        {audioReady && (
          <div className="flex items-end gap-2 justify-start">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot size={20}/>
              </AvatarFallback>
            </Avatar>
            <AudioPlayer onEnd={() => setMessages(prev => [...prev, {
              from: 'bot', 
              text: '오디오 가이드 어떠셨나요? 언제든지 새로운 여행 계획으로 다시 만들어보세요!'
            }])}/>
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
          disabled={isGenerating || audioReady}
        />
        <Button onClick={handleSend} disabled={isGenerating || audioReady} size="icon">
          <Send size={20}/>
        </Button>
      </div>
    </div>
  );
}; 