/**
 * ChatAssistant — AI-powered Q&A assistant with model selector
 *
 * Message list + input with quick-action prompt chips.
 * Uses Gemini API via useGeminiAPI hook.
 * Shows model selector + availability badge.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useVoterProfile } from '../../context/VoterProfileContext.jsx';
import useGeminiAPI, { getQuickPrompts } from './useGeminiAPI.js';
import DOMPurify from 'dompurify';
import styles from './ChatAssistant.module.css';

export default function ChatAssistant({ initialPrompt }) {
  const { profile } = useVoterProfile();
  const {
    messages, isLoading, sendMessage, clearMessages,
    selectedModel, changeModel, models, modelsLoading
  } = useGeminiAPI();
  const [input, setInput] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasLoadedInitialRef = useRef(false);

  const quickPrompts = getQuickPrompts(profile.voterType);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial prompt (when navigating from candidates concern)
  useEffect(() => {
    if (initialPrompt && !hasLoadedInitialRef.current && messages.length === 0) {
      hasLoadedInitialRef.current = true;
      sendMessage(initialPrompt);
    }
  }, [initialPrompt, sendMessage, messages.length]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  }, [input, isLoading, sendMessage]);

  const handleQuickPrompt = useCallback((prompt) => {
    if (!isLoading) {
      sendMessage(prompt);
    }
  }, [isLoading, sendMessage]);

  /** Format AI response text — bold terms and line breaks */
  const formatResponse = (text) => {
    if (!text) return '';
    // Convert **bold** to <strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert numbered lists
    formatted = formatted.replace(/(\d+)\.\s/g, '<br/>$1. ');
    return DOMPurify.sanitize(formatted);
  };

  const currentModel = models.find((m) => m.id === selectedModel);

  return (
    <section className={styles.chat} aria-label="AI Chat Assistant">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.aiAvatar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
              <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" />
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>Ask VoteReady AI</h2>
            <p className={styles.subtitle}>Powered by Gemini — Non-partisan civic education</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearMessages} aria-label="Clear chat history">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Model Selector */}
      <div className={styles.modelBar}>
        <button
          className={styles.modelToggle}
          onClick={() => setShowModelPicker(!showModelPicker)}
          aria-expanded={showModelPicker}
          aria-label="Select AI model"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
          <span className={styles.modelName}>{currentModel?.name || selectedModel}</span>
          {currentModel?.tier && (
            <span className={styles.modelTier}>{currentModel.tier}</span>
          )}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={showModelPicker ? styles.chevronUp : ''}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showModelPicker && (
          <div className={styles.modelDropdown} role="listbox" aria-label="Available AI models">
            <div className={styles.modelDropdownHeader}>
              <span>Available Models</span>
              {modelsLoading && <span className={styles.modelLoading}>Checking…</span>}
            </div>
            {models.map((model) => (
              <button
                key={model.id}
                className={`${styles.modelOption} ${model.id === selectedModel ? styles.modelSelected : ''} ${model.available === false ? styles.modelUnavailable : ''}`}
                onClick={() => {
                  if (model.available !== false) {
                    changeModel(model.id);
                    setShowModelPicker(false);
                  }
                }}
                disabled={model.available === false}
                role="option"
                aria-selected={model.id === selectedModel}
              >
                <div className={styles.modelOptionInfo}>
                  <span className={styles.modelOptionName}>{model.name}</span>
                  <span className={styles.modelOptionTier}>{model.tier}</span>
                </div>
                <span className={`${styles.modelStatus} ${model.available === false ? styles.statusOff : styles.statusOn}`}>
                  {model.available === false ? 'Quota hit' : '●'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className={styles.messagesArea} role="log" aria-live="polite" aria-label="Chat messages">
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>How can I help you today?</h3>
            <p className={styles.emptyText}>
              I'm your personalized election assistant. Ask me anything about voting, registration, or the election process.
            </p>
            {/* Quick prompts */}
            <div className={styles.quickPrompts}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className={styles.quickPromptBtn}
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isLoading}
                  aria-label={`Ask: ${prompt}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage} ${msg.isError ? styles.errorMessage : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className={styles.msgAvatar}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" />
                </svg>
              </div>
            )}
            <div className={styles.msgBubble}>
              {msg.role === 'assistant' ? (
                <>
                  <div dangerouslySetInnerHTML={{ __html: formatResponse(msg.content) }} />
                  {msg.model && (
                    <span className={styles.msgModelTag}>{msg.model}</span>
                  )}
                </>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.message} ${styles.aiMessage}`}>
            <div className={styles.msgAvatar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" />
              </svg>
            </div>
            <div className={styles.msgBubble}>
              <div className={styles.typingIndicator}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts strip (when conversation started) */}
      {messages.length > 0 && (
        <div className={styles.quickStrip}>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              className={styles.quickStripBtn}
              onClick={() => handleQuickPrompt(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form className={styles.inputArea} onSubmit={handleSubmit}>
        <label htmlFor="chat-input" className="sr-only">Type your question about elections</label>
        <input
          ref={inputRef}
          id="chat-input"
          type="text"
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about voting, registration, or elections..."
          disabled={isLoading}
          aria-label="Type your question"
          autoComplete="off"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </section>
  );
}
