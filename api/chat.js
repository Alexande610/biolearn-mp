// Vercel Serverless Function & Local Dev Handler
export default async function handler(req, res) {
  // CORS & method check
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Parse body if not already parsed
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { message, history = [], context = '', displayName = 'bạn' } = body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemPrompt = `Bạn là trợ lý AI Sinh học cho nền tảng học tập BioLearn (Việt Nam).
Tên học sinh: ${displayName}.
PHẠM VI CÔNG VIỆC: Hướng dẫn, giải đáp kiến thức môn Sinh học & KHTN từ lớp 6 đến lớp 12 theo chương trình SGK mới.
${context ? `\n[TÀI LIỆU SÁCH GIÁO KHOA THAM KHẢO]:\n${context}\n` : ''}
QUY TẮC TRÌNH BÀY:
1. Trình bày tự nhiên, câu từ mạch lạc, thân thiện và gần gũi với học sinh.
2. KHÔNG lạm dụng dấu sao (***) hoặc in đậm tràn lan. Khi chào hỏi, gọi tên học sinh tự nhiên (ví dụ: "Chào bạn ${displayName}!" hoặc "Xin chào ${displayName}!"), tuyệt đối không viết "**${displayName}**".
3. Đối với các ý chính hoặc danh sách đặc điểm, HÃY XUỐNG DÒNG RÕ RÀNG và dùng dấu gạch đầu dòng (-) cho từng ý, không viết dồn thành một khối văn bản dài.
4. Trả lời đúng trọng tâm câu hỏi, cô đọng, dễ hiểu trong khoảng 3-6 ý chính.
5. Nếu câu hỏi không liên quan đến Sinh học hoặc học tập, hãy lịch sự từ chối.`;

  // Read environment keys (giữ an toàn trên máy chủ, không hardcode key)
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

  // ==========================================
  // TẦNG 1: GOOGLE GEMINI FLASH (Chính thức)
  // ==========================================
  if (GEMINI_KEY) {
    const geminiModels = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite'
    ];

    // Build Gemini contents
    const contents = [];

    // Add past history (limit to last 6 messages to keep it fast & cheap)
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-6).forEach(msg => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text || msg.content || '' }]
        });
      });
    }

    // Add current user message with system instruction
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1200
      }
    };

    for (const model of geminiModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload)
        });

        if (resp.ok) {
          const data = await resp.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim()) {
            return res.status(200).json({
              success: true,
              reply: replyText.trim(),
              tier: 1,
              source: 'gemini',
              model: model
            });
          }
        } else {
          const errStatus = resp.status;
          const errJson = await resp.json().catch(() => ({}));
          console.warn(`[Tier 1: Gemini ${model}] failed (${errStatus}):`, errJson.error?.message || errStatus);
        }
      } catch (err) {
        console.warn(`[Tier 1: Gemini ${model}] network error:`, err.message);
      }
    }
  }

  // ==========================================
  // TẦNG 2: GROQ CLOUD (Dự phòng 1)
  // ==========================================
  if (GROQ_KEY) {
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    const groqMessages = [{ role: 'system', content: systemPrompt }];

    if (Array.isArray(history)) {
      history.slice(-6).forEach(msg => {
        groqMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.text || msg.content || ''
        });
      });
    }
    groqMessages.push({ role: 'user', content: message.trim() });

    for (const model of groqModels) {
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages: groqMessages,
            temperature: 0.6,
            max_tokens: 1200
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          const replyText = data.choices?.[0]?.message?.content;
          if (replyText && replyText.trim()) {
            return res.status(200).json({
              success: true,
              reply: replyText.trim(),
              tier: 2,
              source: 'groq',
              model: model
            });
          }
        }
      } catch (err) {
        console.warn(`[Tier 2: Groq ${model}] error:`, err.message);
      }
    }
  }

  // ==========================================
  // TẦNG 3: OPENROUTER FREE TIER (Dự phòng 2)
  // ==========================================
  if (OPENROUTER_KEY) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message.trim() }
          ]
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const replyText = data.choices?.[0]?.message?.content;
        if (replyText && replyText.trim()) {
          return res.status(200).json({
            success: true,
            reply: replyText.trim(),
            tier: 3,
            source: 'openrouter'
          });
        }
      }
    } catch (err) {
      console.warn('[Tier 3: OpenRouter] error:', err.message);
    }
  }

  // ==========================================
  // NẾU TẤT CẢ TẦNG ONLINE ĐỀU THẤT BẠI:
  // Trả về mã để Client kích hoạt Tầng 4 (Offline SGK)
  // ==========================================
  return res.status(503).json({
    success: false,
    fallbackToOffline: true,
    error: 'All online AI tiers are unavailable. Please use local textbook fallback.'
  });
}
