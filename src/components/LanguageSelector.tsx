// Language Selector Component - HAYQ Project

import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hy', name: 'Հայերdelays', flag: '🇦🇲' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  
  const handleChange = (value: string) => {
    changeLanguage(value as 'en' | 'hy' | 'ru');
  };

  return (
    <Select value={getCurrentLanguage()} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px] bg-card border-border">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
