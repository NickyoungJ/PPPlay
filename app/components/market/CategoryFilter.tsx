'use client';

import { useState } from 'react';

interface Category {
  slug: string;
  name: string;
  icon: string;
}

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories: Category[] = [
  { slug: 'all', name: '전체', icon: '🌟' },
  { slug: 'politics', name: '정치', icon: '🏛️' },
  { slug: 'economy', name: '경제', icon: '💰' },
  { slug: 'entertainment', name: '연예', icon: '🎬' },
  { slug: 'society', name: '사회', icon: '🌐' },
  { slug: 'tech', name: 'IT/기술', icon: '💻' },
];

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category.slug}
          onClick={() => onCategoryChange(category.slug)}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap
            transition-all duration-200 font-semibold backdrop-blur-md
            ${
              selectedCategory === category.slug
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 scale-105'
                : 'bg-background/40 border border-primary/20 text-foreground/70 hover:text-primary hover:border-primary/40 hover:scale-105'
            }
          `}
        >
          <span className="text-xl">{category.icon}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
}
