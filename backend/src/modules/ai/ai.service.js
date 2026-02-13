// backend/src/modules/ai/ai.service.js
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = "https://api.openai.com/v1";
  }

  async generateSmartReply(conversationId, messageContext) {
    try {
      if (!this.apiKey) {
        return this.getFallbackReplies(messageContext);
      }

      // Get conversation history for context
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          contact: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 10, // Last 10 messages for context
          },
        },
      });

      if (!conversation) {
        return this.getFallbackReplies(messageContext);
      }

      // Build context for AI
      const context = this.buildContext(conversation, messageContext);
      
      // Generate AI suggestions
      const suggestions = await this.callOpenAI(context);
      
      return suggestions.length > 0 ? suggestions : this.getFallbackReplies(messageContext);
    } catch (error) {
      console.error("Error generating smart reply:", error);
      return this.getFallbackReplies(messageContext);
    }
  }

  buildContext(conversation, messageContext) {
    const { contact, messages } = conversation;
    
    // Build message history
    const messageHistory = messages.map(msg => ({
      role: msg.senderType === "CONTACT" ? "user" : "assistant",
      content: msg.content,
      timestamp: msg.createdAt,
    })).reverse(); // Reverse to chronological order

    return {
      businessInfo: {
        name: "CareOps Business", // This would come from workspace settings
        type: "service_business",
      },
      customerInfo: {
        name: `${contact.firstName} ${contact.lastName || ""}`.trim(),
        email: contact.email,
        phone: contact.phone,
      },
      messageHistory,
      currentMessage: messageContext.currentMessage,
      conversationType: this.detectConversationType(messageHistory),
      urgency: this.detectUrgency(messageContext.currentMessage),
    };
  }

  detectConversationType(messages) {
    const recentMessages = messages.slice(-5);
    const text = recentMessages.map(m => m.content.toLowerCase()).join(" ");
    
    if (text.includes("booking") || text.includes("appointment") || text.includes("schedule")) {
      return "booking_inquiry";
    }
    if (text.includes("price") || text.includes("cost") || text.includes("how much")) {
      return "pricing_inquiry";
    }
    if (text.includes("complaint") || text.includes("problem") || text.includes("issue")) {
      return "complaint";
    }
    if (text.includes("question") || text.includes("how to") || text.includes("help")) {
      return "support";
    }
    if (text.includes("thank") || text.includes("appreciate")) {
      return "appreciation";
    }
    
    return "general_inquiry";
  }

  detectUrgency(message) {
    const urgentKeywords = ["urgent", "asap", "immediately", "emergency", "as soon as possible"];
    const text = message.toLowerCase();
    
    return urgentKeywords.some(keyword => text.includes(keyword)) ? "high" : "normal";
  }

  async callOpenAI(context) {
    const prompt = this.buildPrompt(context);
    
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant for a service business. Generate 3 professional, friendly, and contextually appropriate reply suggestions. 
            Consider the conversation type, urgency, and customer information provided. Keep replies concise but complete.
            
            Return ONLY a JSON array of strings, like: ["Reply 1", "Reply 2", "Reply 3"]`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, extract text between brackets or return as single suggestion
      const match = content.match(/\[(.*?)\]/s);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return [content];
        }
      }
      return [content];
    }
  }

  buildPrompt(context) {
    const { businessInfo, customerInfo, messageHistory, currentMessage, conversationType, urgency } = context;
    
    return `
Business: ${businessInfo.name} (${businessInfo.type})
Customer: ${customerInfo.name} (${customerInfo.email})
Conversation Type: ${conversationType}
Urgency: ${urgency}

Recent Messages:
${messageHistory.map(msg => `[${msg.role}]: ${msg.content}`).join('\n')}

Current Customer Message: "${currentMessage}"

Generate 3 appropriate reply suggestions for this customer message. Consider:
1. The conversation context and history
2. The customer's apparent needs
3. The urgency level
4. Professional and friendly tone
5. Business-appropriate responses

The suggestions should be ready to send as-is.
    `.trim();
  }

  getFallbackReplies(messageContext) {
    const { currentMessage } = messageContext;
    const text = currentMessage.toLowerCase();
    
    let replies = [];
    
    // Contextual fallback replies
    if (text.includes("booking") || text.includes("appointment")) {
      replies = [
        "I'd be happy to help you schedule an appointment! What service are you interested in and what dates work for you?",
        "Thank you for your interest! You can book directly through our scheduling page or let me know your preferred time.",
        "I can help you book an appointment. What type of service are you looking for?"
      ];
    } else if (text.includes("price") || text.includes("cost")) {
      replies = [
        "Thank you for asking about pricing! Our services vary based on your specific needs. Could you tell me more about what you're looking for?",
        "I'd be happy to provide pricing information. What service are you interested in learning more about?",
        "Our pricing depends on the specific service and duration. Let me know what you need and I'll give you a detailed quote."
      ];
    } else if (text.includes("complaint") || text.includes("problem")) {
      replies = [
        "I'm sorry to hear you're experiencing an issue. I want to help resolve this quickly. Could you provide more details about what happened?",
        "Thank you for bringing this to our attention. I take this seriously and will work to make it right. Can you tell me more about the problem?",
        "I apologize for the inconvenience. Let me help resolve this for you right away. What specific issue are you facing?"
      ];
    } else if (text.includes("thank")) {
      replies = [
        "You're very welcome! We're glad we could help. Is there anything else you need assistance with?",
        "It's our pleasure to help! Thank you for choosing us. Don't hesitate to reach out if you need anything else.",
        "You're welcome! We appreciate your business. Let us know if there's anything else we can do for you!"
      ];
    } else {
      replies = [
        "Thank you for your message! I'm here to help. Could you provide more details about what you need assistance with?",
        "I appreciate you reaching out! How can I help you today?",
        "Thank you for contacting us! What can I assist you with?"
      ];
    }
    
    return replies;
  }

  async analyzeSentiment(text) {
    try {
      if (!this.apiKey) {
        return this.getFallbackSentiment(text);
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Analyze the sentiment of the given text and return a JSON object with:
              - sentiment: "positive", "negative", or "neutral"
              - confidence: number between 0 and 1
              - emotions: array of detected emotions (max 3)
              
              Return ONLY the JSON object, no additional text.`
            },
            {
              role: "user",
              content: text
            }
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      try {
        return JSON.parse(content);
      } catch (parseError) {
        return this.getFallbackSentiment(text);
      }
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      return this.getFallbackSentiment(text);
    }
  }

  getFallbackSentiment(text) {
    const lowerText = text.toLowerCase();
    
    const positiveWords = ["thank", "great", "excellent", "amazing", "love", "perfect", "wonderful", "fantastic"];
    const negativeWords = ["bad", "terrible", "awful", "hate", "worst", "disappointed", "angry", "frustrated"];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    let sentiment = "neutral";
    let confidence = 0.5;
    
    if (positiveCount > negativeCount) {
      sentiment = "positive";
      confidence = Math.min(0.8, 0.5 + (positiveCount * 0.1));
    } else if (negativeCount > positiveCount) {
      sentiment = "negative";
      confidence = Math.min(0.8, 0.5 + (negativeCount * 0.1));
    }
    
    return {
      sentiment,
      confidence,
      emotions: sentiment === "positive" ? ["happy", "satisfied"] : sentiment === "negative" ? ["frustrated", "disappointed"] : ["neutral"]
    };
  }

  async generateConversationSummary(conversationId) {
    try {
      if (!this.apiKey) {
        return "Conversation summary not available without AI integration.";
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          contact: true,
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation || conversation.messages.length === 0) {
        return "No conversation history available.";
      }

      const messageText = conversation.messages
        .map(msg => `[${msg.senderType}]: ${msg.content}`)
        .join('\n');

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Summarize this customer conversation in 2-3 sentences. Focus on:
              - Main topics discussed
              - Customer's needs or issues
              - Any actions taken or needed
              - Current status of the conversation
              
              Keep it concise and professional.`
            },
            {
              role: "user",
              content: `Customer: ${conversation.contact.firstName} ${conversation.contact.lastName || ""}\n\nConversation:\n${messageText}`
            }
          ],
          max_tokens: 200,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "Summary generation failed.";
    } catch (error) {
      console.error("Error generating conversation summary:", error);
      return "Unable to generate conversation summary.";
    }
  }
}

export default new AIService();
