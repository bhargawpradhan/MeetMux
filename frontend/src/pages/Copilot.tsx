// MeetMux Control Tower — AI Copilot Page
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { MessageSquare, Send, Loader2, Bot, User, Sparkles, AlertTriangle } from 'lucide-react';
import { postCopilotQuery } from '../services/api';
import { DemoBadge } from '../components/ui/SharedComponents';
import { pageVariants, fadeUpItem, staggerContainer } from '../motion/variants';
import { formatINR } from '../utils';
import type { CopilotResponse } from '../types';

const SUGGESTED = [
  'Which hubs will fail this week?',
  'Why is SHP-1024 late?',
  'What happens if Mumbai Hub closes?',
  'Show me the highest-risk routes',
  'What are the top cost-saving recommendations?',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: CopilotResponse;
  timestamp: Date;
}

function CopilotCard({ card }: { card: Record<string, unknown> }) {
  const type = card.card_type as string;

  if (type === 'SHIPMENT_DETAIL') {
    return (
      <div className="glass-card p-4 mt-2 text-xs">
        <h4 className="font-bold text-rose-900 mb-2">{card.title as string}</h4>
        <div className="grid grid-cols-2 gap-2">
          {(['delay_probability', 'predicted_delay_hours', 'sla_breach_probability', 'estimated_cost_impact'] as const).map(k => (
            <div key={k} className="bg-white/40 rounded-lg p-2">
              <p className="text-rose-600/60 capitalize">{k.replace(/_/g, ' ')}</p>
              <p className="font-bold text-rose-900">{card[k] != null ? String(card[k]) : '—'}</p>
            </div>
          ))}
        </div>
        {typeof card.explanation === 'string' && <p className="mt-2 text-rose-700/80 italic">{card.explanation}</p>}
        {typeof card.counterfactual_hint === 'string' && <p className="mt-1 text-xs text-emerald-600">{card.counterfactual_hint}</p>}
      </div>
    );
  }

  if (type === 'BOTTLENECK_LIST') {
    const items = (card.items as Array<Record<string, unknown>>) ?? [];
    return (
      <div className="glass-card p-4 mt-2 text-xs">
        <h4 className="font-bold text-rose-900 mb-2">{card.title as string}</h4>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center bg-white/40 rounded-lg p-2">
              <span className="font-medium text-rose-900 truncate">{item.node_name as string}</span>
              <span className="text-red-600 font-bold shrink-0">{item.financial_exposure as string}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'SIMULATION_IMPACT') {
    return (
      <div className="glass-card p-4 mt-2 text-xs border border-amber-200/50">
        <h4 className="font-bold text-rose-900 mb-2">{card.title as string}</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/40 rounded-lg p-2">
            <p className="text-rose-600/60">Bottlenecks</p>
            <p className="font-bold">{card.critical_bottlenecks_delta as string}</p>
          </div>
          <div className="bg-white/40 rounded-lg p-2">
            <p className="text-rose-600/60">SLA Breaches</p>
            <p className="font-bold">{card.sla_breaches_delta as string}</p>
          </div>
        </div>
        <div className="mt-2 p-2 bg-red-50/60 rounded-lg">
          <p className="text-red-600/70">Financial Impact</p>
          <p className="text-base font-bold text-red-700">{card.financial_cost_impact as string}</p>
        </div>
        <p className="text-[10px] text-amber-600/70 mt-2 italic">{card.disclaimer as string}</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-3 mt-2 text-xs">
      <pre className="whitespace-pre-wrap text-rose-700">{JSON.stringify(card, null, 2)}</pre>
    </div>
  );
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to MeetMux Copilot. I can answer questions about your supply chain using live data from the network — shipments, bottlenecks, risk predictions, and what-if scenarios. Ask me anything.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: postCopilotQuery,
    onSuccess: (data, variables) => {
      setMessages(prev => [
        ...prev,
        {
          id: `resp-${Date.now()}`,
          role: 'assistant',
          content: data.answer_text,
          response: data,
          timestamp: new Date(),
        }
      ]);
    },
  });

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    mutate(text);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col h-[calc(100vh-58px)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 glass border-b border-white/60 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-rose-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-rose-900">AI Copilot</h1>
          <p className="text-xs text-rose-600/60">Grounded in live network data · <DemoBadge /></p>
        </div>
        <div className="ml-auto">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
            Rule-based · No LLM key required
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              variants={fadeUpItem}
              initial="initial"
              animate="animate"
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-purple-400 to-rose-500' : 'bg-rose-200'}`}>
                {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-rose-700" />}
              </div>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`glass-card p-4 text-sm ${msg.role === 'user' ? 'bg-rose-600/10' : ''}`}>
                  <p className="text-rose-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>

                {/* Structured Cards */}
                {msg.response?.structured_cards?.map((card, i) => (
                  <div key={i} className="w-full">
                    <CopilotCard card={card as Record<string, unknown>} />
                  </div>
                ))}

                {/* Suggested Follow-ups */}
                {msg.response?.suggested_actions && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.response.suggested_actions.map(action => (
                      <button
                        key={action}
                        onClick={() => sendMessage(action)}
                        className="text-xs px-2.5 py-1 rounded-lg glass text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200/60"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-rose-400/60 px-1">
                  {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-rose-500 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="glass-card p-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
              <span className="text-sm text-rose-600/70">Analyzing network data…</span>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && (
        <div className="px-6 py-2 flex flex-wrap gap-2 shrink-0">
          {SUGGESTED.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs px-3 py-1.5 glass rounded-xl text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200/60"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 glass border-t border-white/60 shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about shipments, bottlenecks, risk, or scenarios…"
            className="flex-1 glass px-4 py-2.5 rounded-xl text-sm text-rose-900 placeholder-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Copilot input"
            disabled={isPending}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isPending}
            className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-pink-glass hover:shadow-pink-glass-lg transition-all disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-rose-400/60 mt-1.5 text-center">Answers grounded only in demo data — no fabrication, no external AI.</p>
      </div>
    </motion.div>
  );
}
