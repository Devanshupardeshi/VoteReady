/**
 * useGeminiAPI — Custom hook for Gemini API integration
 *
 * Replaces useClaudeAPI.js from the original PRD.
 * - Calls Gemini API directly via REST (client-side with API key from env)
 * - Injects VoterProfile into system prompt at runtime
 * - Manages conversation history (last 10 messages for context)
 * - Error handling + retry logic + model selector
 * - Caches responses in sessionStorage
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useVoterProfile } from '../../context/VoterProfileContext.jsx';

/** Available models — curated from the API key's model list */
const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'Recommended' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'Best Quality' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: 'Fast' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', tier: 'Fastest' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tier: 'Stable' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', tier: 'Experimental' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', tier: 'Experimental' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', tier: 'Experimental' },
];

const DEFAULT_MODEL = 'gemini-2.5-flash';

/** Build the system prompt with voter profile injected */
function buildSystemPrompt(profile) {
  const profileJson = JSON.stringify(profile, null, 2);
  return `You are VoteReady, a smart and friendly civic education assistant.
Your mission: Help Indian citizens understand and participate in the
democratic election process in a clear, non-partisan, empowering way.

VOTER PROFILE (adapt ALL responses to this context):
${profileJson}

CORE RULES:
1. PERSONALIZE: If voterType is 'first_time', explain basics clearly.
   If 'returning', skip basics and focus on their specific question.
   If 'nri', focus on overseas voting, postal ballot, and embassy
   registration steps.
   If 'student', use simplified language and focus on registration.
2. NEUTRAL: Never express preference for any party, candidate, or
   political ideology. Redirect political opinion questions to:
   'This is something to research independently at eci.gov.in'.
3. LOCALIZE: If the user's state is known, reference state-specific
   election rules where relevant (e.g. state holidays, local language
   on EVMs, state election commission contacts).
4. LANGUAGE: Respond in ${profile.language || 'English'}. Use simple, conversational tone.
   Avoid bureaucratic jargon unless explaining a term.
5. FORMAT: Use 3-5 sentences for simple questions. Use numbered steps
   for processes. Bold key terms on first mention using **term**. Never use
   markdown headers in responses.
6. ACCURACY: Base all answers on ECI guidelines, the Constitution of
   India (Articles 324-329), and the Representation of the People
   Act 1951. If uncertain, direct user to eci.gov.in.
7. SCOPE: If asked about unrelated topics (cricket, Bollywood, etc.),
   say "I'm focused on election education! Ask me anything about
   voting, registration, or the election process."`;
}

/** Dynamic quick-action prompts based on voterType */
export function getQuickPrompts(voterType) {
  switch (voterType) {
    case 'first_time':
      return [
        'How do I register to vote?',
        'What is a Voter ID card?',
        'What happens on polling day?',
      ];
    case 'returning':
      return [
        'How do I find my new booth?',
        'What is NOTA?',
        'When do election results come?',
      ];
    case 'nri':
      return [
        'How do I vote from abroad?',
        'What is the overseas ballot process?',
        'How do I register at the embassy?',
      ];
    case 'student':
      return [
        'Am I eligible to vote?',
        'How do I register at my college address?',
        'What ID do I need to vote?',
      ];
    default:
      return [
        'How do I register to vote?',
        'Where is my polling booth?',
        'What documents do I need?',
      ];
  }
}

/** Cache key generator */
function getCacheKey(message, model) {
  return `voteready_chat_${model}_${message.substring(0, 80).replace(/\s+/g, '_')}`;
}

/** Fetch live model availability from API */
async function fetchAvailableModels() {
  try {
    const res = await fetch('/api/gemini-models');
    if (!res.ok) return AVAILABLE_MODELS;
    const data = await res.json();
    const liveIds = new Set(
      (data.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => m.name.replace('models/', ''))
    );

    // Mark availability
    return AVAILABLE_MODELS.map((m) => ({
      ...m,
      available: liveIds.has(m.id),
    }));
  } catch {
    return AVAILABLE_MODELS.map((m) => ({ ...m, available: true }));
  }
}

export default function useGeminiAPI() {
  const { profile } = useVoterProfile();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem('voteready_model') || DEFAULT_MODEL
  );
  const [models, setModels] = useState(AVAILABLE_MODELS.map((m) => ({ ...m, available: true })));
  const [modelsLoading, setModelsLoading] = useState(true);
  const historyRef = useRef([]);

  // Fetch live model availability on mount
  useEffect(() => {
    fetchAvailableModels().then((result) => {
        setModels(result);
        setModelsLoading(false);
        // If selected model is unavailable, switch to first available
        const selectedAvail = result.find((m) => m.id === selectedModel);
        if (selectedAvail && !selectedAvail.available) {
          const fallback = result.find((m) => m.available);
          if (fallback) {
            setSelectedModel(fallback.id);
            localStorage.setItem('voteready_model', fallback.id);
          }
        }
      });
  }, []);

  const changeModel = useCallback((modelId) => {
    setSelectedModel(modelId);
    localStorage.setItem('voteready_model', modelId);
  }, []);

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    // Add user message
    const userMsg = { role: 'user', content: userMessage, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    historyRef.current = [...historyRef.current, userMsg].slice(-10);
    setIsLoading(true);
    setError(null);

    // Check sessionStorage cache
    const cacheKey = getCacheKey(userMessage, selectedModel);
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const aiMsg = { role: 'assistant', content: cached, timestamp: Date.now(), model: selectedModel };
        setMessages((prev) => [...prev, aiMsg]);
        historyRef.current = [...historyRef.current, aiMsg].slice(-10);
        setIsLoading(false);
        return;
      }
    } catch {
      // sessionStorage unavailable
    }

    // Build request
    const systemPrompt = buildSystemPrompt(profile);

    // Build conversation history for Gemini format
    const conversationHistory = historyRef.current.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
        topP: 0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    // Call Gemini API with retry
    let retries = 2;
    while (retries >= 0) {
      try {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelName: selectedModel, requestBody }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I couldn\'t generate a response. Please try again.';

        // Cache the response
        try {
          sessionStorage.setItem(cacheKey, text);
        } catch {
          // sessionStorage full
        }

        const aiMsg = { role: 'assistant', content: text, timestamp: Date.now(), model: selectedModel };
        setMessages((prev) => [...prev, aiMsg]);
        historyRef.current = [...historyRef.current, aiMsg].slice(-10);
        setIsLoading(false);
        return;
      } catch (err) {
        retries--;
        if (retries < 0) {
          const errorMsg = `Failed to get response: ${err.message}. Please try again.`;
          setError(errorMsg);
          setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg, timestamp: Date.now(), isError: true }]);
          setIsLoading(false);
        } else {
          // Wait before retry
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }, [profile, selectedModel]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    // Model selection
    selectedModel,
    changeModel,
    models,
    modelsLoading,
  };
}

export { AVAILABLE_MODELS };
