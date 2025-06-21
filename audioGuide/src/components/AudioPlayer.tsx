import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface AudioPlayerProps {
  audioUrl?: string;
  onEnd?: () => void;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  onEnd,
  className = ""
}) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // 오디오 요소 생성 및 이벤트 리스너 설정
  useEffect(() => {
    if (!audioUrl) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    const audio = new Audio();
    audioRef.current = audio;

    // 다양한 이벤트 리스너 설정
    const handleLoadStart = () => {
      console.log('오디오 로딩 시작');
      setIsLoading(true);
    };

    const handleLoadedMetadata = () => {
      console.log('오디오 메타데이터 로딩 완료, 길이:', audio.duration);
      setDuration(audio.duration || 0);
      setIsLoading(false);
      setHasError(false);
    };

    const handleCanPlay = () => {
      console.log('오디오 재생 준비 완료');
      setIsLoading(false);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      const total = audio.duration;
      setCurrentTime(current);
      setProgress(total > 0 ? (current / total) * 100 : 0);
    };

    const handleEnded = () => {
      console.log('오디오 재생 완료');
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      onEnd?.();
    };

    const handleError = (e: Event) => {
      console.error('오디오 로딩/재생 오류:', e);
      setIsLoading(false);
      setHasError(true);
      
      // 오디오 요소의 에러 정보 가져오기
      const audioElement = e.target as HTMLAudioElement;
      let errorMsg = '오디오를 재생할 수 없습니다';
      
      if (audioElement && audioElement.error) {
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMsg = '재생이 중단되었습니다';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMsg = '네트워크 오류로 재생할 수 없습니다';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMsg = '오디오 파일 형식을 지원하지 않습니다';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = '지원되지 않는 오디오 형식입니다';
            break;
          default:
            errorMsg = '알 수 없는 오디오 오류';
        }
      }
      
      setErrorMessage(errorMsg);
    };

    const handleStalled = () => {
      console.log('오디오 로딩이 지연되고 있습니다');
    };

    const handleSuspend = () => {
      console.log('오디오 로딩이 일시 중단되었습니다');
    };

    // 이벤트 리스너 등록
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('suspend', handleSuspend);

    // 오디오 URL 설정
    console.log('오디오 URL 설정:', audioUrl);
    audio.src = audioUrl;
    
    // preload 설정으로 메타데이터 미리 로드
    audio.preload = 'metadata';
    
    // 로딩 시작
    audio.load();

    return () => {
      console.log('오디오 정리');
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('suspend', handleSuspend);
      
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [audioUrl, onEnd]);

  const handlePlayPause = useCallback(async () => {
    if (!audioRef.current || hasError) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('재생 시도 중...');
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('재생 오류:', error);
      setHasError(true);
      setErrorMessage('재생 중 오류가 발생했습니다');
    }
  }, [isPlaying, hasError]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || hasError) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const newTime = clickRatio * duration;

    audioRef.current.currentTime = newTime;
  }, [duration, hasError]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border/50 ${className}`}>
        <div className="text-sm text-muted-foreground">
          오디오가 없습니다
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-destructive/10 rounded-xl border border-destructive/20 ${className}`}>
        <AlertCircle size={20} className="text-destructive" />
        <div className="flex-1">
          <div className="text-sm text-destructive font-medium">오디오 오류</div>
          <div className="text-xs text-destructive/80">{errorMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-4 bg-accent/50 backdrop-blur-md rounded-xl border border-border/50 transition-all duration-300 hover:bg-accent/70 hover:scale-[1.02] hover:shadow-lg ${className}`}>
      <Button 
        variant="default" 
        size="icon" 
        className="h-10 w-10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50"
        onClick={handlePlayPause}
        disabled={isLoading || hasError}
        aria-label={isPlaying ? '일시정지' : '재생'}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause size={16} className="transition-transform duration-200" />
        ) : (
          <Play size={16} className="ml-0.5 transition-transform duration-200" />
        )}
      </Button>
      
      <div className="flex-1 space-y-1">
        <div 
          className="cursor-pointer"
          onClick={handleProgressClick}
        >
          <Progress 
            value={progress} 
            className="w-full h-2 transition-all duration-300 hover:h-3" 
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* 재생 중 시각적 효과 */}
      {isPlaying && (
        <div className="flex gap-1 items-center">
          <Volume2 size={16} className="text-primary" />
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
        </div>
      )}
    </div>
  );
}; 