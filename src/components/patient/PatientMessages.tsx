import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Message } from '../../types';
import { Bell, Send, Check, Mail, MessageSquare, AlertCircle } from 'lucide-react';

export const PatientMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'general' | 'prescription_update' | 'appointment_reminder'>('general');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');

  const loadMessages = async () => {
    try {
      const res = await api.listMessages();
      setMessages(res.messages);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    setSending(true);
    setSuccess('');
    try {
      await api.sendMessage({
        subject: subject.trim(),
        content: content.trim(),
        category,
      });
      setSubject('');
      setContent('');
      setSuccess('Message dispatched to clinic staff.');
      await loadMessages();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markMessageRead(id);
      await loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-600" />
          Secure Communications & Clinic Notifications
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Confidential messaging with your healthcare team and automated clinical alerts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Received Messages & Alerts
          </h2>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Your message inbox is currently empty.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`bg-white rounded-2xl border p-5 transition-colors ${
                    m.is_read ? 'border-slate-200 shadow-xs' : 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          m.is_read ? 'bg-slate-300' : 'bg-emerald-500'
                        }`}
                      ></span>
                      <h3 className="font-bold text-sm text-slate-900">{m.subject}</h3>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(m.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed mb-3">{m.content}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    <span>
                      Sender: <strong className="capitalize">{m.sender_type}</strong>
                    </span>
                    {!m.is_read && (
                      <button
                        onClick={() => handleMarkRead(m.id)}
                        className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compose Inquiry (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs h-fit">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Message Practice Staff
          </h2>

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
              {success}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              >
                <option value="general">General Clinical Inquiry</option>
                <option value="prescription_update">Prescription / Medication Question</option>
                <option value="appointment_reminder">Appointment Follow-up</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Query regarding asthma inhaler dosage"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body</label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Please describe your non-emergency inquiry in detail..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-2 px-4 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientMessages;
