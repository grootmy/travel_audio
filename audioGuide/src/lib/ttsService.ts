import { GoogleGenAI } from '@google/genai';

interface Speaker {
  name: string;
  voiceName: string;
}

interface TTSConfig {
  apiKey: string;
  speakers?: Speaker[];
}

export class TTSService {
  private genAI: GoogleGenAI;
  private defaultSpeakers: Speaker[] = [
    { name: 'Speaker1', voiceName: 'Kore' },
    { name: 'Speaker2', voiceName: 'Puck' },
  ];

  constructor(config: TTSConfig) {
    this.genAI = new GoogleGenAI({ apiKey: config.apiKey });
  }

  /**
   * 대화 텍스트에서 Speaker 정보를 파싱합니다
   */
  private parseSpeakerContent(content: string): { speaker: string; text: string }[] {
    const lines = content.split('\n').filter(line => line.trim());
    const speakers: { speaker: string; text: string }[] = [];
    
    for (const line of lines) {
      const match = line.match(/^(Speaker\d+|화자\d+):\s*(.+)$/i);
      if (match) {
        speakers.push({
          speaker: match[1],
          text: match[2].trim()
        });
      }
    }
    
    return speakers;
  }

  /**
   * 텍스트에 Speaker가 포함되어 있는지 확인합니다
   */
  public hasSpeakers(content: string): boolean {
    return /^(Speaker\d+|화자\d+):/im.test(content);
  }

  /**
   * 오디오 형식을 감지하고 적절한 MIME 타입을 반환합니다
   */
  private detectAudioFormat(audioBuffer: Uint8Array): string {
    if (audioBuffer.length < 16) return 'audio/wav';

    // 헤더 분석을 위한 첫 16바이트 (더 많은 정보 수집)
    const headerLength = Math.min(16, audioBuffer.length);
    const header = Array.from(audioBuffer.slice(0, headerLength))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('상세 오디오 헤더 분석:');
    console.log('전체 헤더 (16바이트):', header);
    console.log('ASCII 변환 시도:', this.tryDecodeAsASCII(audioBuffer.slice(0, 16)));
    
    // 특수 헤더 패턴 분석
    const first4 = header.slice(0, 8);
    console.log('첫 4바이트:', first4);
    
    // PCM 데이터 패턴 감지
    if (this.isPCMData(audioBuffer)) {
      console.log('🎵 PCM 오디오 데이터 감지됨!');
      return 'audio/pcm';
    }
    
    // Google TTS 특수 형식일 가능성 체크
    if (first4 === 'eaffd9ff' || first4.startsWith('ea') || first4 === 'f5fffdff') {
      console.log('Google TTS 특수 형식 감지됨 - 실험적 처리');
      return 'audio/unknown-google-tts';
    }

    // 표준 형식들 체크
    if (header.startsWith('52494646')) { // "RIFF"
      console.log('WAV 형식 감지됨');
      return 'audio/wav';
    }
    
    if (header.startsWith('fff') || header.startsWith('494433')) { // MPEG 또는 ID3
      console.log('MP3 형식 감지됨');
      return 'audio/mpeg';
    }
    
    if (header.startsWith('4f676753')) { // "OggS"
      console.log('OGG 형식 감지됨');
      return 'audio/ogg';
    }

    console.log('알 수 없는 오디오 형식');
    return 'audio/unknown';
  }

  /**
   * PCM 데이터인지 확인
   */
  private isPCMData(audioBuffer: Uint8Array): boolean {
    if (audioBuffer.length < 100) return false;

    // PCM 16비트 데이터의 특징:
    // 1. 값들이 일반적으로 -32768 ~ 32767 범위 (16비트)
    // 2. 연속된 값들이 급격하게 변하지 않음 (오디오 신호의 연속성)
    // 3. 완전히 0이거나 완전히 최대값인 경우는 드묾

    let validSamples = 0;
    let totalSamples = 0;

    // 처음 100개 샘플 검사 (200바이트)
    for (let i = 0; i < Math.min(200, audioBuffer.length - 1); i += 2) {
      // 16비트 리틀 엔디안으로 읽기
      const sample = audioBuffer[i] | (audioBuffer[i + 1] << 8);
      const signedSample = sample > 32767 ? sample - 65536 : sample;
      
      totalSamples++;
      
      // 유효한 PCM 샘플 범위 체크
      if (Math.abs(signedSample) <= 32767) {
        validSamples++;
      }
    }

    // 80% 이상이 유효한 범위에 있으면 PCM으로 판단
    const validRatio = validSamples / totalSamples;
    console.log(`PCM 분석: ${validSamples}/${totalSamples} (${(validRatio * 100).toFixed(1)}%) 유효한 샘플`);
    
    return validRatio > 0.8;
  }

  /**
   * PCM 데이터를 WAV 형식으로 변환
   */
  private convertPCMToWAV(pcmData: Uint8Array, sampleRate: number = 24000, channels: number = 1): Blob {
    const dataSize = pcmData.length;
    const fileSize = 44 + dataSize;
    
    console.log(`🔄 PCM → WAV 변환: ${dataSize} bytes, ${sampleRate}Hz, ${channels}채널`);
    
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    
    // WAV 헤더 작성
    let offset = 0;
    
    // RIFF chunk descriptor
    this.writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, fileSize - 8, true); offset += 4; // 파일 크기 - 8
    this.writeString(view, offset, 'WAVE'); offset += 4;
    
    // fmt sub-chunk
    this.writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4; // fmt chunk size
    view.setUint16(offset, 1, true); offset += 2; // PCM format
    view.setUint16(offset, channels, true); offset += 2; // number of channels
    view.setUint32(offset, sampleRate, true); offset += 4; // sample rate
    view.setUint32(offset, sampleRate * channels * 2, true); offset += 4; // byte rate
    view.setUint16(offset, channels * 2, true); offset += 2; // block align
    view.setUint16(offset, 16, true); offset += 2; // bits per sample
    
    // data sub-chunk
    this.writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, dataSize, true); offset += 4;
    
    // PCM 데이터 복사
    const uint8View = new Uint8Array(buffer);
    uint8View.set(pcmData, offset);
    
    console.log('✅ WAV 변환 완료');
    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * 바이트 배열을 ASCII 문자로 변환 시도
   */
  private tryDecodeAsASCII(bytes: Uint8Array): string {
    try {
      return Array.from(bytes)
        .map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')
        .join('');
    } catch {
      return 'decode failed';
    }
  }

  /**
   * Web Audio API를 사용한 오디오 디코딩 시도
   */
  private async tryWebAudioDecode(audioBuffer: Uint8Array): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Web Audio API 사용 가능 여부 확인
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        return { success: false, error: 'Web Audio API not supported' };
      }

      const audioContext = new AudioContextClass();

      console.log('Web Audio API 디코딩 시도 중...');
      
      // ArrayBuffer로 변환
      const arrayBuffer = audioBuffer.buffer.slice(
        audioBuffer.byteOffset,
        audioBuffer.byteOffset + audioBuffer.byteLength
      );

      // 오디오 디코딩
      const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);
      console.log('Web Audio API 디코딩 성공:', {
        duration: decodedAudio.duration,
        sampleRate: decodedAudio.sampleRate,
        numberOfChannels: decodedAudio.numberOfChannels
      });

      // WAV 형식으로 재인코딩
      const wavBlob = this.encodeWAV(decodedAudio);
      const url = URL.createObjectURL(wavBlob);

      await audioContext.close();
      return { success: true, url };
    } catch (error) {
      console.error('Web Audio API 디코딩 실패:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * AudioBuffer를 WAV 형식으로 인코딩
   */
  private encodeWAV(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioBuffer.length * blockAlign;
    const chunkSize = 36 + dataSize;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, chunkSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Convert float32 audio data to int16
    let offset = 44;
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * DataView에 문자열 쓰기
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * 브라우저 호환성을 위한 오디오 테스트
   */
  private async testAudioCompatibility(audioBlob: Blob): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(audioBlob);
      
      const cleanup = () => {
        URL.revokeObjectURL(url);
        audio.removeEventListener('canplaythrough', onSuccess);
        audio.removeEventListener('error', onError);
      };

      const onSuccess = () => {
        cleanup();
        resolve(true);
      };

      const onError = () => {
        cleanup();
        resolve(false);
      };

      audio.addEventListener('canplaythrough', onSuccess);
      audio.addEventListener('error', onError);
      
      // 3초 타임아웃
      setTimeout(() => {
        cleanup();
        resolve(false);
      }, 3000);

      audio.src = url;
    });
  }

  /**
   * 대화 텍스트를 TTS로 변환합니다
   */
  public async generateAudio(content: string): Promise<{ audioUrl: string; audioBlob: Blob }> {
    try {
      const speakers = this.parseSpeakerContent(content);
      
      if (speakers.length === 0) {
        throw new Error('유효한 Speaker 형식을 찾을 수 없습니다');
      }

      // 대화 내용을 TTS 프롬프트로 변환 (공식 문서 스타일로)
      const conversationText = speakers
        .map(s => `${s.speaker}: ${s.text}`)
        .join('\n');

      // Google 공식 문서에 따른 정확한 설정
      const speakerVoiceConfigs = [
        {
          speaker: 'Speaker1',
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        },
        {
          speaker: 'Speaker2', 
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }
          }
        }
      ];

      // 더 명확한 프롬프트 (공식 문서 스타일)
      const prompt = `Generate natural speech for the following conversation with appropriate intonation and pacing:\n\n${conversationText}`;

      console.log('🎙️ Google Gemini TTS API 호출 중...');
      console.log('사용 모델: gemini-2.5-flash-preview-tts');

      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs
            }
          }
        }
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!audioData) {
        throw new Error('TTS API에서 오디오 데이터를 반환하지 않았습니다');
      }

      console.log('✅ API 응답 수신:', {
        'Base64 길이': audioData.length,
        '예상 바이너리 크기': Math.round(audioData.length * 0.75) + ' bytes'
      });

      // Base64 데이터를 Uint8Array로 변환
      const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
      console.log('🔄 바이너리 변환 완료:', audioBuffer.length, 'bytes');

      // 헤더 분석
      const detectedMimeType = this.detectAudioFormat(audioBuffer);
      
      // PCM 데이터 감지 시 WAV로 변환
      if (detectedMimeType === 'audio/pcm') {
        console.log('🎯 PCM 데이터를 WAV로 변환 중...');
        
        // Google TTS는 일반적으로 24kHz, 16비트, 모노 PCM을 사용
        const wavBlob = this.convertPCMToWAV(audioBuffer, 24000, 1);
        const audioUrl = URL.createObjectURL(wavBlob);
        
        console.log('🎉 PCM → WAV 변환 성공!', {
          '원본 크기': audioBuffer.length + ' bytes',
          'WAV 크기': wavBlob.size + ' bytes',
          '예상 재생 시간': Math.round(audioBuffer.length / (24000 * 2)) + '초'
        });
        
        return { audioUrl, audioBlob: wavBlob };
      }
      
      // Google TTS 특수 형식 감지 시 추가 처리
      if (detectedMimeType === 'audio/unknown-google-tts') {
        console.log('🔧 Google TTS 특수 형식 감지 - 특별 처리 시도');
        
        // 헤더 제거 시도 (Google이 메타데이터를 앞에 붙일 가능성)
        const headerSkipSizes = [0, 8, 16, 32, 44, 64, 128]; // 일반적인 헤더 크기들
        
        for (const skipSize of headerSkipSizes) {
          if (audioBuffer.length <= skipSize) continue;
          
          console.log(`📋 헤더 ${skipSize}바이트 건너뛰기 시도...`);
          const trimmedBuffer = audioBuffer.slice(skipSize);
          const trimmedMimeType = this.detectAudioFormat(trimmedBuffer);
          
          if (trimmedMimeType === 'audio/pcm') {
            console.log(`✅ 헤더 제거 후 PCM 데이터 발견!`);
            const wavBlob = this.convertPCMToWAV(trimmedBuffer, 24000, 1);
            const audioUrl = URL.createObjectURL(wavBlob);
            return { audioUrl, audioBlob: wavBlob };
          }
          
          if (trimmedMimeType !== 'audio/unknown' && trimmedMimeType !== 'audio/unknown-google-tts') {
            console.log(`✅ 헤더 제거 후 ${trimmedMimeType} 형식 감지됨!`);
            
            // 트리밍된 버퍼로 재시도
            const result = await this.tryMultipleMimeTypes(trimmedBuffer, trimmedMimeType);
            if (result) return result;
          }
        }
      }

      // 원본 데이터를 분석용으로 다운로드 (개발 모드에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 원본 파일 다운로드 (분석용)');
        const originalBlob = new Blob([audioBuffer], { type: 'application/octet-stream' });
        this.downloadAudio(originalBlob, 'google-tts-original.bin');
      }

      // Web Audio API 디코딩 시도
      console.log('🎵 Web Audio API 디코딩 시도...');
      const webAudioResult = await this.tryWebAudioDecode(audioBuffer);
      
      if (webAudioResult.success && webAudioResult.url) {
        console.log('✅ Web Audio API 성공!');
        const response = await fetch(webAudioResult.url);
        const audioBlob = await response.blob();
        return { audioUrl: webAudioResult.url, audioBlob };
      }

      // 표준 MIME 타입들로 시도
      const result = await this.tryMultipleMimeTypes(audioBuffer, detectedMimeType);
      if (result) return result;

      // 모든 시도 실패
      console.log('❌ 모든 형식 변환 실패');
      console.log('📝 해결 방법:');
      console.log('  1. 다운로드된 google-tts-original.bin 파일을 FFmpeg로 분석');
      console.log('  2. 서버 사이드에서 형식 변환 구현');
      console.log('  3. 다른 TTS 서비스 검토');
      
      throw new Error('Google TTS는 현재 브라우저에서 직접 재생할 수 없는 형식을 반환합니다. 서버 사이드 처리가 필요합니다.');

    } catch (error) {
      console.error('🚨 TTS 생성 오류:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('INVALID_ARGUMENT')) {
          throw new Error('TTS API 요청 형식이 올바르지 않습니다.');
        } else if (error.message.includes('PERMISSION_DENIED')) {
          throw new Error('API 키가 유효하지 않거나 권한이 없습니다.');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('API 할당량이 초과되었습니다.');
        }
      }
      
      throw error;
    }
  }

  /**
   * 여러 MIME 타입으로 시도하는 헬퍼 메서드
   */
  private async tryMultipleMimeTypes(audioBuffer: Uint8Array, detectedMimeType: string): Promise<{ audioUrl: string; audioBlob: Blob } | null> {
    const mimeTypesToTry = [
      detectedMimeType,
      'audio/wav',
      'audio/mpeg',
      'audio/ogg',
      'audio/webm',
      'audio/mp4',
      'audio/x-wav',
      'audio/x-mpeg'
    ].filter(type => type !== 'audio/unknown-google-tts' && type !== 'audio/unknown');

    for (const mimeType of mimeTypesToTry) {
      console.log(`🔍 ${mimeType} 테스트 중...`);
      const testBlob = new Blob([audioBuffer], { type: mimeType });
      
      const isCompatible = await this.testAudioCompatibility(testBlob);
      if (isCompatible) {
        console.log(`✅ ${mimeType} 성공!`);
        const audioUrl = URL.createObjectURL(testBlob);
        return { audioUrl, audioBlob: testBlob };
      }
    }

    return null;
  }

  /**
   * 오디오 파일을 다운로드합니다
   */
  public downloadAudio(audioBlob: Blob, filename: string = 'audio-guide.wav'): void {
    const downloadUrl = URL.createObjectURL(audioBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }

  /**
   * 생성된 오디오 URL을 정리합니다
   */
  public revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
} 