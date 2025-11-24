"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: "user" | "assistant";
  content: string;
  author?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI Agent assistant. How can I help you build your AI agent today?",
      author: "Agent4Agents",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [sessionId, setSessionId] = useState("");
  const [isSessionCreated, setIsSessionCreated] = useState(false);

  useEffect(() => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);

    // Create session on backend
    fetch(`http://localhost:8000/apps/agent4agents/users/user/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: newSessionId }),
    })
      .then((res) => {
        if (res.ok) setIsSessionCreated(true);
        else console.error("Failed to create session");
      })
      .catch((err) => console.error("Error creating session", err));

    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isSessionCreated) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_name: "agent4agents",
          user_id: "user",
          session_id: sessionId,
          newMessage: {
            role: "user",
            parts: [{ text: userMessage }],
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch response: ${response.status} ${errorText}`
        );
      }

      const events = await response.json();
      let assistantMessage = "";
      let author = "Agent4Agents";

      // Iterate in reverse to find the latest response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event.content && event.content.role === "model") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const textPart = event.content.parts?.find((p: any) => p.text);
          if (textPart) {
            assistantMessage = textPart.text;
            if (event.author) {
                author = event.author;
            }
            break;
          }
        }
      }

      if (!assistantMessage) {
        assistantMessage = "No response from agent.";
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage, author: author },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 font-sans">
      {/* Supergraphic Bar */}
      <div className="w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/supergraphicbar.svg"
          alt="Bosch Supergraphic"
          className="w-full h-2 object-cover"
        />
      </div>

      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-20 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Bosch Logo" className="h-12 w-auto" />
            <div className="h-8 w-px bg-gray-300 mx-2"></div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Agent4Agents
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-4xl flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex w-full gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[80%]">
                    {message.role === "assistant" && message.author && (
                      <span className="mb-1 ml-1 text-xs font-medium text-gray-500">
                        {message.author}
                      </span>
                    )}
                    <div
                      className={cn(
                        "relative px-4 py-3 text-sm sm:text-base shadow-sm",
                        message.role === "user"
                          ? "bg-[#005691] text-white"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      <ReactMarkdown
                        className={cn(
                          "prose prose-sm max-w-none wrap-break-word",
                          message.role === "user" ? "prose-invert" : ""
                        )}
                        components={{
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          pre: ({ node, ...props }: any) => (
                            <div
                              className="overflow-auto w-full my-2 bg-black/10 p-2 rounded"
                              {...props}
                            />
                          ),
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          code: ({ node, ...props }: any) => (
                            <code
                              className="bg-black/10 rounded px-1"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex w-full gap-4 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <Bot size={16} />
                  </div>
                  <div className="bg-gray-100 text-gray-800 px-4 py-3 shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-gray-200 bg-white p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-500 focus:border-[#005691] focus:outline-none focus:ring-1 focus:ring-[#005691]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 flex h-10 w-10 items-center justify-center bg-[#005691] text-white transition-colors hover:bg-[#00497a] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-gray-400">
            Agent4Agents can make mistakes. Consider checking important
            information.
          </p>
        </div>
      </footer>
    </div>
  );
}
