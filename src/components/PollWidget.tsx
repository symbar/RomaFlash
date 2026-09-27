"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3 } from 'lucide-react';

interface PollProps {
  articleId: string;
  poll: {
    question: string;
    options: string[];
  };
}

export default function PollWidget({ articleId, poll }: PollProps) {
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [results, setResults] = useState<{ [key: number]: number }>({});
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    // Carica i voti esistenti per questo articolo
    const fetchVotes = async () => {
      const { data } = await supabase
        .from('poll_votes')
        .select('option_index')
        .eq('article_id', articleId);
        
      if (data) {
        const counts: { [key: number]: number } = {};
        poll.options.forEach((_, i) => counts[i] = 0);
        
        data.forEach(vote => {
          if (vote.option_index !== undefined) {
            counts[vote.option_index] = (counts[vote.option_index] || 0) + 1;
          }
        });
        
        setResults(counts);
        setTotalVotes(data.length);
      }
    };
    
    // Controlla se l'utente ha già votato in questa sessione
    const savedVote = localStorage.getItem(`vote_${articleId}`);
    if (savedVote !== null) {
      setVotedOption(parseInt(savedVote, 10));
    }
    
    fetchVotes();
  }, [articleId, poll.options]);

  const handleVote = async (index: number) => {
    if (votedOption !== null) return; // Ha già votato
    
    // Ottimistico update
    setVotedOption(index);
    setResults(prev => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
    setTotalVotes(prev => prev + 1);
    localStorage.setItem(`vote_${articleId}`, index.toString());

    // Salva su Supabase
    await supabase.from('poll_votes').insert({
      article_id: articleId,
      option_index: index
    });
  };

  return (
    <div className="my-8 bg-card border border-border rounded-xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      
      <div className="flex items-center gap-2 mb-4 text-primary">
        <BarChart3 className="w-5 h-5" />
        <h3 className="font-bold text-lg text-white">Sondaggio RomaFlash</h3>
      </div>
      
      <p className="text-xl font-serif font-bold mb-6 text-white leading-snug">
        {poll.question}
      </p>

      <div className="space-y-3">
        {poll.options.map((option, index) => {
          const votesForOption = results[index] || 0;
          const percentage = totalVotes > 0 ? Math.round((votesForOption / totalVotes) * 100) : 0;
          const isSelected = votedOption === index;
          const showResults = votedOption !== null;

          return (
            <div key={index} className="relative">
              <button
                onClick={() => handleVote(index)}
                disabled={votedOption !== null}
                className={`w-full text-left relative z-10 px-4 py-3 rounded-lg border transition-all duration-300 flex justify-between items-center
                  ${isSelected ? 'border-primary bg-primary/10 text-white font-bold' : 'border-border bg-black/50 text-gray-300'}
                  ${votedOption === null ? 'hover:border-primary/50 hover:bg-gray-800' : 'cursor-default'}
                `}
              >
                <span>{option}</span>
                {showResults && (
                  <span className={`text-sm ${isSelected ? 'text-primary font-bold' : 'text-gray-500'}`}>
                    {percentage}%
                  </span>
                )}
              </button>
              
              {/* Barra di progresso dello sfondo */}
              {showResults && (
                <div 
                  className={`absolute top-0 left-0 h-full rounded-lg transition-all duration-1000 ease-out z-0
                    ${isSelected ? 'bg-primary/20' : 'bg-gray-800'}
                  `}
                  style={{ width: `${percentage}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {votedOption !== null && (
        <p className="text-center text-xs text-gray-500 mt-4">
          Hanno votato {totalVotes} tifosi
        </p>
      )}
    </div>
  );
}
