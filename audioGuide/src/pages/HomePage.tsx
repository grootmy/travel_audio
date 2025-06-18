import React from 'react';
import { Headphones, Mic, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { PageType } from '@/types';

interface HomePageProps {
  setPage: (page: PageType) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
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

      {/* 메인 액션 카드들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl animate-in fade-in slide-in-from-bottom duration-700 delay-300">
        <Card 
          onClick={() => setPage('chat')}
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
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors duration-300">
              <span>시작하기</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>
        
        <Card 
          onClick={() => setPage('explore')}
          className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:scale-[1.02] border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
        >
          <CardHeader className="items-center pb-6">
            <div className="relative mb-4">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-6 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Headphones size={40} className="text-primary" />
              </div>
              <div className="absolute -inset-2 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <CardTitle className="text-2xl md:text-3xl group-hover:text-primary transition-colors duration-300">
              오디오 가이드 둘러보기
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription className="text-base leading-relaxed mb-4 group-hover:text-foreground/90 transition-colors duration-300">
              다른 여행자들이 만든 다양한 오디오 가이드를 탐색하고<br />
              <span className="text-primary font-medium">새로운 여행 영감</span>을 발견해보세요
            </CardDescription>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors duration-300">
              <span>둘러보기</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </div>
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