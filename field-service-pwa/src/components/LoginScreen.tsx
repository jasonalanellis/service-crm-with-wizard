import { useState } from 'react';
import { User } from 'lucide-react';

interface Props {
  onLogin: (technicianId: string) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [id, setId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id.trim()) onLogin(id.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Field Service
        </h1>
        <p className="text-gray-500 text-center mb-8">Sign in to view your schedule</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter Technician ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            autoFocus
          />
          <button
            type="submit"
            disabled={!id.trim()}
            className="w-full py-4 bg-blue-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-600 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
