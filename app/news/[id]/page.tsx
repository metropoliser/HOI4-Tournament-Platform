'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/app/components/Navbar';
import RichTextViewer from '@/app/components/RichTextViewer';
import { Newspaper, Calendar, User, ArrowLeft } from 'lucide-react';
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

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isAdmin = session?.user && ['admin', 'matchmaker'].includes((session.user as any)?.role);

  useEffect(() => {
    fetchNews();
  }, [params.id]);

  const fetchNews = async () => {
    try {
      const response = await fetch(`/api/news/${params.id}`);

      console.log('News detail response status:', response.status);

      if (!response.ok) {
        console.error('Failed to fetch news, status:', response.status);
        setError(true);
        return;
      }

      const data = await response.json();
      console.log('News detail data:', data);

      // Check if it's a draft (published can be 0 or "0")
      const isPublished = data.published === 1 || data.published === '1' || data.published === true;

      // Only show drafts to admins
      if (!isPublished && !isAdmin) {
        console.log('News is a draft, published value:', data.published);
        setError(true);
        return;
      }

      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Navbar />
        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="bg-zinc-900/50 border border-zinc-800 p-12 text-center">
            <Newspaper className="size-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">News Not Found</h3>
            <p className="text-zinc-500 mb-6">This news article doesn't exist or has been removed</p>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold transition-all"
            >
              <ArrowLeft className="size-4" />
              Back to News
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-100 mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to News
        </Link>

        {/* Article */}
        <article className="bg-zinc-900/50 border border-zinc-800 p-8">
          {/* Draft Warning for Admins */}
          {isAdmin && news.published === 0 && (
            <div className="mb-4 p-4 bg-amber-950/30 border border-amber-900/50 text-amber-400">
              <p className="text-sm font-medium">⚠️ This is a draft article. Only admins can view this.</p>
            </div>
          )}

          {/* Category and Date */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 text-xs font-medium border ${categoryColors[news.category] || categoryColors.Announcement}`}>
              {news.category}
            </span>
            {isAdmin && news.published === 0 && (
              <>
                <span className="text-xs text-zinc-500">•</span>
                <span className="px-3 py-1 text-xs font-medium border bg-zinc-800 text-zinc-400 border-zinc-700">
                  DRAFT
                </span>
              </>
            )}
            <span className="text-xs text-zinc-500">•</span>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Calendar className="size-3" />
              {new Date(news.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-zinc-100 mb-4">
            {news.title}
          </h1>

          {/* Excerpt */}
          <p className="text-zinc-400 text-xl mb-6 pb-6 border-b border-zinc-800">
            {news.excerpt}
          </p>

          {/* Content */}
          <div className="prose prose-invert prose-zinc max-w-none mb-6">
            <RichTextViewer content={news.content} />
          </div>

          {/* Author */}
          <div className="flex items-center gap-2 text-sm text-zinc-500 pt-6 border-t border-zinc-800">
            <User className="size-4" />
            <span>Posted by {news.created_by_name}</span>
          </div>
        </article>
      </main>
    </div>
  );
}
