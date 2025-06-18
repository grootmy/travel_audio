import React, { useState } from 'react';
import { Play, MapPin, Star, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AudioGuide } from '@/types';

interface AudioGuideCardProps {
  guide: AudioGuide;
}

export const AudioGuideCard: React.FC<AudioGuideCardProps> = ({ guide }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="group overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] cursor-pointer border-border/50 backdrop-blur-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <img 
          src={guide.cover} 
          alt={guide.title} 
          className="w-full h-48 object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
          loading="lazy"
        />
        
        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* 재생 버튼 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
          <Button 
            variant="default" 
            size="icon" 
            className="h-16 w-16 rounded-full bg-white/90 text-black hover:bg-white hover:scale-110 transition-all duration-300 shadow-2xl backdrop-blur-sm"
          >
            <Play className="ml-1" size={24} />
          </Button>
        </div>
        
        {/* 평점 배지 */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1 transition-all duration-300 group-hover:bg-black/90">
          <Star className="fill-yellow-400 text-yellow-400" size={12} />
          <span className="text-white text-xs font-semibold">{guide.rating}</span>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300 line-clamp-2">
          {guide.title}
        </CardTitle>
        <CardDescription className="text-sm group-hover:text-foreground/80 transition-colors duration-300">
          by {guide.creator}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors duration-300">
              <MapPin size={14} />
              <span className="font-medium">{guide.city}</span>
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock size={14} />
              <span>{guide.duration}분</span>
            </div>
          </div>
          
          {/* 호버 시 나타나는 추가 정보 */}
          <div className={`text-xs text-muted-foreground transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}>
            지금 들어보기 →
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 