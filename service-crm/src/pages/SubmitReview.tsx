import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Loader2, CheckCircle } from 'lucide-react';

export default function SubmitReview() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      fetchAppointment(token);
    } else {
      setError('Invalid review link');
      setLoading(false);
    }
  }, []);

  const fetchAppointment = async (token: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, service:services(name), tenant:tenants(name), customer:customers(first_name, last_name)')
      .eq('review_token', token)
      .single();

    if (error || !data) {
      setError('Review link not found or expired');
    } else if (data.reviewed_at) {
      setError('You have already submitted a review for this appointment');
    } else {
      setAppointment(data);
    }
    setLoading(false);
  };

  const submitReview = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('reviews').insert({
      tenant_id: appointment.tenant_id,
      customer_id: appointment.customer_id,
      appointment_id: appointment.id,
      technician_id: appointment.technician_id,
      rating,
      comment: comment.trim() || null,
    });

    if (insertError) {
      setError('Failed to submit review. Please try again.');
      setSubmitting(false);
      return;
    }

    // Mark appointment as reviewed
    await supabase
      .from('appointments')
      .update({ reviewed_at: new Date().toISOString() })
      .eq('id', appointment.id);

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="text-red-500" size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600">Your review has been submitted successfully.</p>
          <div className="mt-4 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                size={24}
                className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Rate Your Experience</h1>
          <p className="text-gray-600 mt-2">How was your service with {appointment?.tenant?.name}?</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">Service</p>
          <p className="font-medium text-gray-900">{appointment?.service?.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(appointment?.scheduled_start).toLocaleDateString()}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={36}
                className={`transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-600 mb-4">
          {rating === 0 ? 'Tap to rate' : 
           rating === 1 ? 'Poor' :
           rating === 2 ? 'Fair' :
           rating === 3 ? 'Good' :
           rating === 4 ? 'Very Good' :
           'Excellent!'}
        </p>

        <textarea
          placeholder="Tell us about your experience (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 h-24 resize-none"
        />

        <button
          onClick={submitReview}
          disabled={rating === 0 || submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : null}
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}
