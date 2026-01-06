import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, FolderOpen, FileText, Trash2, Edit2, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type Article = {
  id: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
};

const DEFAULT_CATEGORIES = ['Getting Started', 'Services', 'Billing', 'Account', 'Troubleshooting'];

export default function KnowledgeBase() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: DEFAULT_CATEGORIES[0],
    is_published: false
  });

  useEffect(() => {
    if (tenant?.id) loadArticles();
  }, [tenant?.id]);

  const loadArticles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('updated_at', { ascending: false });
    setArticles(data || []);
    setLoading(false);
  };

  const saveArticle = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    const payload = {
      tenant_id: tenant!.id,
      ...formData,
      updated_at: new Date().toISOString()
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('knowledge_base').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('knowledge_base').insert({ ...payload, view_count: 0 }));
    }

    if (error) {
      showToast('Failed to save article', 'error');
    } else {
      showToast(editingId ? 'Article updated' : 'Article created', 'success');
      resetForm();
      loadArticles();
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await supabase.from('knowledge_base').delete().eq('id', id);
    showToast('Article deleted', 'success');
    loadArticles();
  };

  const editArticle = (article: Article) => {
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      is_published: article.is_published
    });
    setEditingId(article.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: DEFAULT_CATEGORIES[0], is_published: false });
    setEditingId(null);
    setShowModal(false);
  };

  const categories = [...new Set(articles.map(a => a.category))];
  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="text-cyan-600" />
          Knowledge Base
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
        >
          <Plus size={18} />
          New Article
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Articles */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No articles found</h3>
          <p className="text-gray-500">Create help articles for your customers and team</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredArticles.map(article => (
            <div key={article.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="text-cyan-500 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{article.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {article.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                        {article.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${article.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {article.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Eye size={12} /> {article.view_count} views
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => editArticle(article)} className="p-2 text-gray-400 hover:text-cyan-600">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteArticle(article.id)} className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Article' : 'New Article'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="Article title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  rows={12}
                  placeholder="Write your article content here..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveArticle}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                {editingId ? 'Update' : 'Create'} Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
