const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search' };
const MAX_TURNS = 10;

async function callAnthropic(apiKey, body) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05'
    },
    body: JSON.stringify(body)
  });
  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const messages = [...req.body.messages];
    let requestBody = {
      ...req.body,
      max_tokens: 2000,
      tools: [WEB_SEARCH_TOOL],
      messages
    };

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const data = await callAnthropic(apiKey, requestBody);

      if (data.error) {
        return res.status(502).json(data);
      }

      // If no tool_use blocks, we have the final text response — return it
      const toolUseBlocks = (data.content || []).filter(b => b.type === 'tool_use');
      if (toolUseBlocks.length === 0) {
        return res.status(200).json(data);
      }

      // Build tool_result blocks for every tool_use in this response
      const toolResults = toolUseBlocks.map(b => ({
        type: 'tool_result',
        tool_use_id: b.id,
        content: b.type === 'web_search_20250305' ? b.content : []
      }));

      // Append the assistant turn and the tool results, then loop
      requestBody = {
        ...requestBody,
        messages: [
          ...requestBody.messages,
          { role: 'assistant', content: data.content },
          { role: 'user', content: toolResults }
        ]
      };
    }

    return res.status(500).json({ error: 'Exceeded maximum agentic turns' });
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', detail: err.message });
  }
}
