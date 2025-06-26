import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Sparkles, Bot, Volume2, Download, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TTSService } from '@/lib/ttsService';
import type { PageType } from '@/types';
import axios, { AxiosError } from 'axios';
import { Select } from "@/components/ui/select";
import { API_CONFIG, API_ENDPOINTS } from '@/lib/apiConfig';

interface HomePageProps {
  setPage: (page: PageType) => void;
}

interface GuideResponse {
  content: string;
  audioUrl?: string;
  audioBlob?: Blob;
  isGeneratingAudio?: boolean;
}

const companions = ['혼자', '연인과', '친구와', '가족과'];
const styles = ['느긋한 힐링', '활기찬 액티비티', '맛집 탐방', '문화 예술', '역사 유적'];

export const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
  const [guideResponse, setGuideResponse] = useState<GuideResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selections, setSelections] = useState({ location: '', companion: '', style: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ttsService, setTtsService] = useState<TTSService | null>(null);

  // TTS 서비스 초기화
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      setTtsService(new TTSService({ apiKey }));
    }
  }, []);

  // API 호출 함수 - params 객체 형태로 변경
  const requestChatCompletion = async (params: { place: string; people: string; purpose: string }) => {
    const body = {
      hash: 'ff751b70b5e3502cad191e16fd3d3917d0796879834ab21053d1431f82edfc96',
      params: params
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

  const handleInitialSubmit = async () => {
    if (!selections.location || !selections.companion || !selections.style || isGenerating) return;

    setIsGenerating(true);
    setIsSubmitted(true);

    // selections를 params 형태로 매핑
    const params = {
      place: selections.location,
      people: selections.companion,
      purpose: selections.style
    };

    try {
      const response = await requestChatCompletion(params);
      
      if (response) {
        setGuideResponse({ content: response });
      } else {
        setGuideResponse({ 
          content: '죄송합니다. 응답을 생성하는데 문제가 발생했습니다. 다시 시도해주세요.' 
        });
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
      
      setGuideResponse({ content: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  };

  // TTS 오디오 생성 함수
  const generateAudio = async () => {
    if (!ttsService || !guideResponse) {
      alert('TTS 서비스가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
      return;
    }

    if (!ttsService.hasSpeakers(guideResponse.content)) {
      alert('Speaker 형태의 대본이 아닙니다.');
      return;
    }

    setGuideResponse(prev => prev ? { ...prev, isGeneratingAudio: true } : null);

    try {
      const result = await ttsService.generateAudio(guideResponse.content);
      
      setGuideResponse(prev => prev ? { 
        ...prev, 
        audioUrl: result.audioUrl, 
        audioBlob: result.audioBlob,
        isGeneratingAudio: false 
      } : null);
    } catch (error) {
      console.error('오디오 생성 오류:', error);
      alert('오디오 생성에 실패했습니다. 다시 시도해주세요.');
      
      setGuideResponse(prev => prev ? { ...prev, isGeneratingAudio: false } : null);
    }
  };

  const downloadAudio = () => {
    if (!guideResponse?.audioBlob) return;

    const url = URL.createObjectURL(guideResponse.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-guide-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setGuideResponse(null);
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

      {/* 컨테이너 */}
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

        {/* 가이드 응답 표시 영역 */}
        {(isSubmitted || guideResponse) && (
          <Card className="animate-in fade-in duration-500 mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={20} className="text-primary" />
                  <CardTitle>생성된 오디오 가이드</CardTitle>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  새 가이드 만들기
                </Button>
              </div>
              <CardDescription>
                {selections.location && selections.companion && selections.style && 
                  `${selections.location}에서 ${selections.companion} 즐기는 ${selections.style} 여행 가이드`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">AI가 맞춤형 오디오 가이드를 생성 중입니다...</p>
                  </div>
                </div>
              ) : guideResponse ? (
                <div className="space-y-4">
                  {/* TTS 기능 */}
                  {ttsService?.hasSpeakers(guideResponse.content) && (
                    <div className="space-y-3 p-4 bg-accent/10 rounded-lg border">
                      <h4 className="font-medium flex items-center gap-2">
                        <Volume2 size={16} />
                        오디오 가이드
                      </h4>
                      
                      {guideResponse.isGeneratingAudio ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          오디오를 생성하는 중입니다...
                        </div>
                      ) : guideResponse.audioUrl ? (
                        <div className="flex flex-col gap-3">
                          <AudioPlayer audioUrl={guideResponse.audioUrl} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadAudio}
                            className="w-fit"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            오디오 파일 다운로드
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={generateAudio}
                          className="w-fit"
                        >
                          <Volume2 className="mr-2 h-4 w-4" />
                          오디오 생성하기
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <div className="p-4 bg-muted/40 rounded-lg">
                    <p className="whitespace-pre-wrap">{guideResponse.content}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

      </div>
      
      {/* 하단 여백 */}
      <div className="p-4"></div>
    </div>
  );
}; 