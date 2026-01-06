import { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Send, BarChart, Trash2, Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type Survey = {
  id: string;
  name: string;
  questions: { id: string; text: string; type: 'rating' | 'text' | 'choice'; options?: string[] }[];
  responses_count: number;
  avg_rating?: number;
  is_active: boolean;
  created_at: string;
};

export default function CustomerSurveys() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    questions: [{ id: '1', text: '', type: 'rating' as const, options: [] as string[] }]
  });

  useEffect(() => {
    if (tenant?.id) loadSurveys();
  }, [tenant?.id]);

  const loadSurveys = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customer_surveys')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    setSurveys(data || []);
    setLoading(false);
  };

  const createSurvey = async () => {
    if (!formData.name.trim() || formData.questions.every(q => !q.text.trim())) {
      showToast('Survey name and at least one question required', 'error');
      return;
    }

    const { error } = await supabase.from('customer_surveys').insert({
      tenant_id: tenant!.id,
      name: formData.name,
      questions: formData.questions.filter(q => q.text.trim()),
      responses_count: 0,
      is_active: true
    });

    if (error) {
      showToast('Failed to create survey', 'error');
    } else {
      showToast('Survey created', 'success');
      setShowModal(false);
      setFormData({ name: '', questions: [{ id: '1', text: '', type: 'rating', options: [] }] });
      loadSurveys();
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { id: Date.now().toString(), text: '', type: 'rating', options: [] }]
    });
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      questions: formData.questions.map(q => q.id === id ? {...q, [field]: value} : q)
    });
  };

  const removeQuestion = (id: string) => {
    if (formData.questions.length > 1) {
      setFormData({
        ...formData,
        questions: formData.questions.filter(q => q.id !== id)
      });
    }
  };

  const toggleSurvey = async (survey: Survey) => {
    await supabase.from('customer_surveys').update({ is_active: !survey.is_active }).eq('id', survey.id);
    loadSurveys();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardCheck className="text-teal-600" />
          Customer Surveys
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          Create Survey
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : surveys.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <ClipboardCheck size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No surveys yet</h3>
          <p className="text-gray-500 mb-4">Create surveys to collect customer feedback</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map(survey => (
            <div key={survey.id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow ${!survey.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{survey.name}</h3>
                <button
                  onClick={() => toggleSurvey(survey)}
                  className={`text-xs px-2 py-1 rounded ${survey.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {survey.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {survey.questions?.length || 0} question{survey.questions?.length !== 1 ? 's' : ''}
              </p>
              
              <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1 text-sm">
                  <Send size={14} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{survey.responses_count} responses</span>
                </div>
                {survey.avg_rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <BarChart size={14} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{survey.avg_rating.toFixed(1)} avg</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Survey</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Survey Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="e.g., Post-Service Feedback"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Questions</label>
                  <button onClick={addQuestion} className="text-sm text-teal-600 hover:text-teal-700">+ Add Question</button>
                </div>
                
                <div className="space-y-3">
                  {formData.questions.map((q, i) => (
                    <div key={q.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">Q{i + 1}</span>
                        <select
                          value={q.type}
                          onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        >
                          <option value="rating">Rating (1-5)</option>
                          <option value="text">Text</option>
                          <option value="choice">Multiple Choice</option>
                        </select>
                        {formData.questions.length > 1 && (
                          <button onClick={() => removeQuestion(q.id)} className="ml-auto text-red-500">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                        placeholder="Enter your question..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={createSurvey}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Create Survey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
