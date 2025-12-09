'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import RichTextEditor from '@/app/components/RichTextEditor';
import RichTextViewer from '@/app/components/RichTextViewer';
import { Newspaper, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

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

export default function NewsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Announcement');
  const [published, setPublished] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (session && !['admin', 'matchmaker'].includes((session.user as any)?.role)) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchNews();
    }
  }, [status, session, router]);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      console.log('Fetched news data:', data.news);
      setNews(data.news || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (newsItem?: NewsItem) => {
    if (newsItem) {
      setEditingNews(newsItem);
      setTitle(newsItem.title);
      setExcerpt(newsItem.excerpt);
      setContent(newsItem.content);
      setCategory(newsItem.category);
      setPublished(newsItem.published === 1);
    } else {
      setEditingNews(null);
      setTitle('');
      setExcerpt('');
      setContent('');
      setCategory('Announcement');
      setPublished(true);
    }
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingNews(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setCategory('Announcement');
    setPublished(true);
  };

  const handleSubmit = async () => {
    if (!title || !excerpt || !content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editingNews ? `/api/news/${editingNews.id}` : '/api/news';
      const method = editingNews ? 'PUT' : 'POST';

      const payload = {
        title,
        excerpt,
        content,
        category,
        published,
      };
      console.log('Submitting news with published status:', published, 'Payload:', payload);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save news');
      }

      toast.success(editingNews ? 'News updated successfully' : 'News created successfully');
      closeEditor();
      // Add delay to allow ClickHouse mutations to complete and propagate
      // ClickHouse mutations can take time to propagate across replicas
      setTimeout(() => {
        fetchNews();
      }, 3000);
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error('Failed to save news');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete news');
      }

      toast.success('News deleted successfully');
      // Add delay to allow ClickHouse mutations to complete and propagate
      setTimeout(() => {
        fetchNews();
      }, 3000);
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error('Failed to delete news');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Newspaper className="size-8 text-zinc-400" />
            <div>
              <h1 className="text-3xl font-bold text-zinc-100">News Management</h1>
              <p className="text-zinc-400">Create and manage platform news</p>
            </div>
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold transition-all"
          >
            <Plus className="size-5" />
            Create News
          </button>
        </div>

        {/* News List */}
        <div className="grid grid-cols-1 gap-4">
          {news.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 p-12 text-center">
              <Newspaper className="size-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">No News Items</h3>
              <p className="text-zinc-500 mb-6">Create your first news item to get started</p>
              <button
                onClick={() => openEditor()}
                className="px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold transition-all"
              >
                Create News
              </button>
            </div>
          ) : (
            news.map((item) => (
              <div key={item.id} className="bg-zinc-900/50 border border-zinc-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-zinc-100">{item.title}</h3>
                      {item.published === 1 ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 text-xs font-medium">
                          <Eye className="size-3" />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-medium">
                          <EyeOff className="size-3" />
                          Draft
                        </span>
                      )}
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-medium">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-zinc-400 mb-3">{item.excerpt}</p>
                    <div className="text-xs text-zinc-500">
                      By {item.created_by_name} • {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEditor(item)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all"
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/50 transition-all"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <RichTextViewer content={item.content} />
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border-2 border-zinc-700 p-6 max-w-4xl w-full my-8">
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">
              {editingNews ? 'Edit News' : 'Create News'}
            </h2>

            <div className="space-y-4 mb-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-zinc-600"
                  placeholder="Enter news title"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-zinc-600"
                >
                  <option value="Tournament">Tournament</option>
                  <option value="Update">Update</option>
                  <option value="Announcement">Announcement</option>
                </select>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Excerpt *
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-zinc-600 min-h-[80px]"
                  placeholder="Brief summary of the news"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Content *
                </label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Enter news content..."
                />
              </div>

              {/* Published */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="size-4"
                />
                <label htmlFor="published" className="text-sm text-zinc-300">
                  Publish immediately
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeEditor}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold transition-all"
              >
                {editingNews ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
