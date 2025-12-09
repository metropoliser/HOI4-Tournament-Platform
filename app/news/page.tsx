'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import RichTextViewer from '@/app/components/RichTextViewer';
import { Newspaper, Calendar, User } from 'lucide-react';
import Link from 'next/link';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  published: number;
  created_by_name: string;
  created_at: string;
}

const categoryColors: Record<string, string> = {
  Tournament: 'bg-red-950/30 text-red-400 border-red-900/50',
  Update: 'bg-blue-950/30 text-blue-400 border-blue-900/50',
  Announcement: 'bg-amber-950/30 text-amber-400 border-amber-900/50',
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      setNews(data.news || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = selectedCategory === 'All'
    ? news
    : news.filter(item => item.category === selectedCategory);

  const categories = ['All', 'Tournament', 'Update', 'Announcement'];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Newspaper className="size-10 text-zinc-400" />
            <div>
              <h1 className="text-4xl font-bold text-zinc-100">Latest News</h1>
              <p className="text-zinc-400 mt-1">Stay updated with the latest announcements and updates</p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* News List */}
        {filteredNews.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 p-12 text-center">
            <Newspaper className="size-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">No News Available</h3>
            <p className="text-zinc-500">Check back later for updates</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredNews.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="block bg-zinc-900/50 border border-zinc-800 p-6 hover:border-zinc-700 transition-all group"
              >
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 text-xs font-medium border ${categoryColors[item.category] || categoryColors.Announcement}`}>
                    {item.category}
                  </span>
                  <span className="text-xs text-zinc-500">•</span>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Calendar className="size-3" />
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-zinc-100 mb-3 group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h2>

                {/* Excerpt */}
                <p className="text-zinc-400 mb-4 text-lg">
                  {item.excerpt}
                </p>

                {/* Author */}
                <div className="flex items-center gap-2 text-sm text-zinc-500 pt-4 border-t border-zinc-800">
                  <User className="size-4" />
                  <span>Posted by {item.created_by_name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
