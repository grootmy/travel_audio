import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface AudioPlayerProps {
  onEnd?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ onEnd }) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handlePlayPause = useCallback(() => {
    startTransition(() => {
      setIsPlaying(!isPlaying);
    });
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          if (onEnd) onEnd();
          return 100;
        }
        return prev + 2; // 더 부드러운 진행
      });
    }, 100); // 더 부드러운 애니메이션

    return () => clearInterval(interval);
  }, [isPlaying, onEnd]);

  const currentTime = Math.round((progress / 100) * 50); // 50초 총 길이
  const totalTime = 50;

  return (
    <div className="flex items-center gap-3 p-4 bg-accent/50 backdrop-blur-md rounded-xl border border-border/50 w-full max-w-sm transition-all duration-300 hover:bg-accent/70 hover:scale-[1.02] hover:shadow-lg">
      <Button 
        variant="default" 
        size="icon" 
        className="h-10 w-10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50"
        onClick={handlePlayPause}
        disabled={isPending}
        aria-label={isPlaying ? '일시정지' : '재생'}
      >
        {isPlaying ? (
          <Pause size={16} className="transition-transform duration-200" />
        ) : (
          <Play size={16} className="ml-0.5 transition-transform duration-200" />
        )}
      </Button>
      
      <div className="flex-1 space-y-1">
        <Progress 
          value={progress} 
          className="w-full h-2 transition-all duration-300 hover:h-3" 
        />
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{String(Math.floor(currentTime / 60)).padStart(2, '0')}:{String(currentTime % 60).padStart(2, '0')}</span>
          <span>{String(Math.floor(totalTime / 60)).padStart(2, '0')}:{String(totalTime % 60).padStart(2, '0')}</span>
        </div>
      </div>
      
      {/* 진동 효과 */}
      {isPlaying && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: '12px',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 