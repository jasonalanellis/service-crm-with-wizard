import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { MessageSquare, Send, User, Phone, Search, Loader2 } from 'lucide-react';

interface Conversation {
  customer_id: string;
  phone_number: string;
  customer_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  direction: string;
  message: string;
  created_at: string;
  status: string;
}

const SUPABASE_URL = 'https://yglaxwekbyfjmbhcwqhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbGF4d2VrYnlmam1iaGN3cWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjM5OTYsImV4cCI6MjA4MzAzOTk5Nn0.2FqbdDfX_agNp5G13nF9jx10nH3JB0REoFWQYk9nwxc';

export default function Messages() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (tenant) fetchConversations();
  }, [tenant]);

  const fetchConversations = async () => {
    if (!tenant) return;
    setLoading(true);
    
    // Get unique conversations grouped by customer
    const { data: msgs } = await supabase
      .from('sms_messages')
      .select('*, customer:customers(id, first_name, last_name, phone)')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    const convoMap = new Map<string, Conversation>();
    (msgs || []).forEach(msg => {
      const custId = msg.customer_id || msg.phone_number;
      if (!convoMap.has(custId)) {
        convoMap.set(custId, {
          customer_id: msg.customer_id,
          phone_number: msg.phone_number,
          customer_name: msg.customer ? `${msg.customer.first_name} ${msg.customer.last_name}` : msg.phone_number,
          last_message: msg.message,
          last_message_time: msg.created_at,
          unread_count: 0,
        });
      }
    });

    setConversations(Array.from(convoMap.values()));
    setLoading(false);
  };

  const selectConversation = async (convo: Conversation) => {
    setSelectedConvo(convo);
    
    const { data } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('tenant_id', tenant?.id)
      .eq('phone_number', convo.phone_number)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConvo || !tenant) return;
    setSending(true);

    try {
      // Call send-sms edge function
      await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({
          tenantId: tenant.id,
          to: selectedConvo.phone_number,
          message: newMessage,
        }),
      });

      // Save to database
      await supabase.from('sms_messages').insert({
        tenant_id: tenant.id,
        customer_id: selectedConvo.customer_id,
        phone_number: selectedConvo.phone_number,
        direction: 'outbound',
        message: newMessage,
      });

      setNewMessage('');
      selectConversation(selectedConvo);
      showToast('Message sent', 'success');
    } catch (e) {
      showToast('Failed to send', 'error');
    }
    setSending(false);
  };

  const filteredConvos = conversations.filter(c =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number.includes(search)
  );

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold text-gray-800 mb-3">Messages</h1>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredConvos.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No conversations</div>
          ) : (
            filteredConvos.map(convo => (
              <button
                key={convo.phone_number}
                onClick={() => selectConversation(convo)}
                className={`w-full p-4 text-left border-b hover:bg-gray-50 ${
                  selectedConvo?.phone_number === convo.phone_number ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={20} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{convo.customer_name}</p>
                    <p className="text-sm text-gray-500 truncate">{convo.last_message}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConvo ? (
          <>
            <div className="p-4 bg-white border-b flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="font-medium">{selectedConvo.customer_name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone size={12} /> {selectedConvo.phone_number}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      msg.direction === 'outbound'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  className="flex-1 border rounded-full px-4 py-2"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageSquare className="mx-auto mb-4" size={48} />
              <p>Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
