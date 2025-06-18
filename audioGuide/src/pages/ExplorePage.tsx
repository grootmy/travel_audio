import React, { useState } from 'react';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AudioGuideCard } from '@/components/AudioGuideCard';
import { mockAudioGuides, cities } from '@/data/mockData';
import type { PageType } from '@/types';

interface ExplorePageProps {
  setPage: (page: PageType) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ setPage }) => {
  const [selectedCity, setSelectedCity] = useState("모든 도시");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGuides = mockAudioGuides.filter(guide =>
    (selectedCity === "모든 도시" || guide.city === selectedCity) &&
    guide.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 bg-background min-h-full">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => setPage('home')} className="-ml-2">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold ml-2">오디오 가이드 둘러보기</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            placeholder="가이드 제목으로 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="pl-10"
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGuides.length > 0 ? (
          filteredGuides.map(guide => <AudioGuideCard key={guide.id} guide={guide} />)
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">'{searchTerm}'에 대한 검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}; 