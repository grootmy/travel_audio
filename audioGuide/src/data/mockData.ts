import type { AudioGuide } from '@/types';

export const mockAudioGuides: AudioGuide[] = [
  { 
    id: 1, 
    title: "경복궁의 숨겨진 이야기", 
    creator: "역사 탐험가", 
    city: "서울", 
    duration: 15, 
    rating: 4.8, 
    cover: "https://placehold.co/600x400/007AFF/ffffff?text=경복궁" 
  },
  { 
    id: 2, 
    title: "해운대 밤바다 산책", 
    creator: "부산 토박이", 
    city: "부산", 
    duration: 10, 
    rating: 4.9, 
    cover: "https://placehold.co/600x400/FF3B30/ffffff?text=해운대" 
  },
  { 
    id: 3, 
    title: "제주 오름의 비밀", 
    creator: "자연 애호가", 
    city: "제주", 
    duration: 25, 
    rating: 4.7, 
    cover: "https://placehold.co/600x400/34C759/ffffff?text=제주+오름" 
  },
  { 
    id: 4, 
    title: "전주 한옥마을 맛집 투어", 
    creator: "미식가 JJ", 
    city: "전주", 
    duration: 20, 
    rating: 4.9, 
    cover: "https://placehold.co/600x400/FF9500/ffffff?text=전주+한옥마을" 
  },
  { 
    id: 5, 
    title: "서울 시티팝 야경 드라이브", 
    creator: "DJ 서울라이트", 
    city: "서울", 
    duration: 30, 
    rating: 4.6, 
    cover: "https://placehold.co/600x400/AF52DE/ffffff?text=서울+야경" 
  },
  { 
    id: 6, 
    title: "제주 해안도로 드라이브 코스", 
    creator: "드라이버 김", 
    city: "제주", 
    duration: 45, 
    rating: 4.8, 
    cover: "https://placehold.co/600x400/5856D6/ffffff?text=제주+해안도로" 
  },
];

export const cities = ["모든 도시", "서울", "부산", "제주", "전주"]; 