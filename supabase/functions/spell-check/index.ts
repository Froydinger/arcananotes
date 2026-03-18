import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('spell-check: Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('spell-check: Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('spell-check: Authenticated request from user:', user.id);

    const { content, action = 'spell', instructions, title, originalHTML, isSelectedText = false } = await req.json();
    
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Content is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate content length (50,000 characters max)
    if (content.length > 50000) {
      return new Response(
        JSON.stringify({ error: 'Content exceeds maximum length of 50,000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate instructions length (500 characters max)
    if (instructions && typeof instructions === 'string' && instructions.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Instructions exceed maximum length of 500 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate title length (200 characters max)
    if (title && typeof title === 'string' && title.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Title exceeds maximum length of 200 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`${action} checking text:`, content.substring(0, 100) + '...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano', // Fast and efficient model
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(action)
          },
          {
            role: 'user',
            content: getUserPrompt(action, content, instructions, title, originalHTML, isSelectedText)
          }
        ],
        max_tokens: 1500, // Fast responses
        temperature: 0.3, // More focused output
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to process spell check' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    let result = data.choices[0]?.message?.content;

    console.log(`${action} completed successfully. Raw result:`, result);
    console.log('Data choices:', data.choices);

    // Ensure we have content
    if (!result || result.trim() === '') {
      console.error('No content received from AI');
      return new Response(
        JSON.stringify({ error: 'No rewritten content received' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Clean and process the response
    let cleanedResult = result.trim();
    let newTitle = null;

    // Handle title extraction for rewrite actions
    if (action === 'rewrite' && cleanedResult.includes('TITLE:')) {
      const lines = cleanedResult.split('\n');
      const titleLineIndex = lines.findIndex((line: string) => line.trim().startsWith('TITLE:'));
      
      if (titleLineIndex !== -1) {
        const titleLine = lines[titleLineIndex];
        newTitle = titleLine.replace(/^TITLE:\s*/, '').trim();
        
        // Remove the title line and any empty lines after it
        lines.splice(titleLineIndex, 1);
        while (lines[titleLineIndex] && lines[titleLineIndex].trim() === '') {
          lines.splice(titleLineIndex, 1);
        }
        
        cleanedResult = lines.join('\n').trim();
      }
    }

    // Build response data
    const responseData: any = {
      correctedContent: cleanedResult,
      hasChanges: cleanedResult !== content.trim()
    };

    // Add title only if it was extracted
    if (newTitle) {
      responseData.newTitle = newTitle;
    }

    console.log('Sending response:', responseData);

    return new Response(
      JSON.stringify(responseData), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in spell-check function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getSystemPrompt(action: string): string {
  switch (action) {
    case 'spell':
      return `You are a spell checker that works with HTML content. Your ONLY task is to fix spelling errors.

CRITICAL RULES:
- Input will be HTML content - PRESERVE ALL HTML STRUCTURE 
- ONLY fix spelling errors within text content
- Do NOT fix grammar, punctuation, or style
- Do NOT rewrite, rephrase, or change the meaning
- Keep ALL HTML tags, attributes, and structure EXACTLY the same
- Preserve headings (<h1>, <h2>, etc.), paragraphs (<p>), line breaks, formatting
- If there are no spelling errors, return the HTML exactly as provided
- Return ONLY the corrected HTML content, no explanations
- Maintain exact HTML structure and tag positioning

EXAMPLE:
Input: <h1>My Grat Title</h1><p>This is a sentance with erors.</p>
Output: <h1>My Great Title</h1><p>This is a sentence with errors.</p>`;

    case 'grammar':
      return `You are a grammar checker that works with HTML content. Your task is to fix grammar and punctuation errors.

CRITICAL RULES:
- Input will be HTML content - PRESERVE ALL HTML STRUCTURE
- Fix grammar mistakes and punctuation errors within text content
- Do NOT fix spelling (assume it's correct)
- Do NOT rewrite, rephrase, or change the meaning
- Keep ALL HTML tags, attributes, and structure EXACTLY the same
- Preserve headings (<h1>, <h2>, etc.), paragraphs (<p>), line breaks, formatting
- Keep the original style, tone, and voice
- If there are no grammar errors, return the HTML exactly as provided
- Return ONLY the corrected HTML content, no explanations
- Maintain exact HTML structure and tag positioning

EXAMPLE:
Input: <h1>My Title</h1><p>This are a sentence that need fix.</p>
Output: <h1>My Title</h1><p>This is a sentence that needs fixing.</p>`;

    case 'rewrite':
      return `You are a professional writer and editor. Your task is to rewrite content according to user instructions.

CRITICAL FORMATTING RULES:
- Wrap ALL content in <p> tags (paragraph blocks)
- If the original content had headers/titles, convert them to paragraphs but keep them on separate lines
- Use line breaks between different concepts/sections by creating separate <p> tags
- Do NOT use header tags like <h1>, <h2>, etc. - everything becomes body text in <p> tags

CONTENT RULES:
- Follow user instructions precisely for the rewrite
- Convert any headers/titles to regular paragraph text
- If main title should be changed, format as: TITLE: [new title]
- Ensure content flows naturally and maintains consistency
- Return clean HTML with only <p> tags for structure`;

    default:
      return `You are a text processor. Process the provided text according to the specified action.`;
  }
}

function getUserPrompt(action: string, content: string, instructions?: string, title?: string, originalHTML?: string, isSelectedText?: boolean): string {
  switch (action) {
    case 'rewrite':
      let prompt = `REWRITE INSTRUCTIONS: ${instructions || 'Improve and enhance the content'}\n\n`;
      
      // Check if this is a tone change (preserve length) vs expand/shorten (allow length change)
      const isToneChange = instructions && (
        instructions.includes('professional') || 
        instructions.includes('casual') || 
        instructions.includes('formal') || 
        instructions.includes('friendly') ||
        instructions.includes('upbeat') ||
        instructions.includes('positive') ||
        instructions.includes('happier')
      ) && !instructions.includes('expand') && !instructions.includes('shorten') && !instructions.includes('concise');
      
      if (isToneChange) {
        prompt += `LENGTH REQUIREMENT: Keep the text approximately the same length as the original. This is a tone change, not a length change.\n\n`;
      }
      
      // Provide clear context about the document structure
      if (title) {
        prompt += `DOCUMENT TITLE: "${title}"\n`;
        prompt += `(Only change the title if the instructions specifically ask for a title change)\n\n`;
      }
      
      // Analyze existing content structure to inform the AI
      const hasHeaders = originalHTML && (originalHTML.includes('<h1>') || originalHTML.includes('<h2>') || originalHTML.includes('<h3>'));
      const hasParagraphs = originalHTML && originalHTML.includes('<p>');
      
      if (originalHTML && originalHTML.trim()) {
        prompt += `CURRENT DOCUMENT STRUCTURE ANALYSIS:\n`;
        if (hasHeaders) {
          const headers = originalHTML.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
          prompt += `- Document currently has ${headers.length} headers: ${headers.slice(0,2).map(h => h.replace(/<[^>]*>/g, '')).join(', ')}${headers.length > 2 ? '...' : ''}\n`;
        } else {
          prompt += `- Document currently has NO headers (you can add them if needed)\n`;
        }
        if (hasParagraphs) {
          prompt += `- Document has paragraph structure\n`;
        }
        prompt += `- You CAN create headers (<h1>, <h2>, etc.) and paragraphs (<p>) as needed\n`;
        prompt += `- You have FULL AUTHORITY to add structure with headers if the content needs organization\n\n`;
      }
      
      if (isSelectedText) {
        prompt += `TASK: Rewrite the selected text below. Analyze the content structure and respond appropriately:\n\n`;
        prompt += `SELECTED TEXT TO REWRITE:\n${content}\n\n`;
        
        // Analyze if the selected content contains headers or body text
        const hasHeaderText = content.match(/^[A-Z][^.!?]*$/m) || content.length < 100; // Short text might be a header
        const hasBodyText = content.includes('.') || content.length > 50; // Longer text with sentences is likely body
        
        prompt += `CONTENT ANALYSIS:\n`;
        if (hasHeaderText && !hasBodyText) {
          prompt += `- Selected text appears to be a HEADER/TITLE - respond with appropriate header tags\n`;
        } else if (hasBodyText && !hasHeaderText) {
          prompt += `- Selected text appears to be BODY TEXT - respond with paragraph tags\n`;
        } else {
          prompt += `- Selected text contains both HEADER and BODY elements - structure appropriately\n`;
        }
        
        prompt += `\nSELECTED TEXT INSTRUCTIONS: 
- Return ONLY the rewritten selected text in proper HTML format
- If content is clearly a title/header, use <h1>, <h2>, or <h3> tags as appropriate
- If content is body text, use <p> tags for paragraphs
- If content has both, create proper structure with headers and paragraphs
- Do NOT use markdown syntax (no **, #, etc.)
- Match the formatting intent: titles become headers, body becomes paragraphs
- Example: "My Title" + body text → <h2>Enhanced Title</h2><p>Enhanced body content</p>
- Clean HTML output, no extra spacing elements needed for selected text`;
      } else {
        prompt += `TASK: Rewrite the entire content below. You have full HTML formatting capabilities:\n\n`;
        prompt += `CONTENT TO REWRITE:\n${content}\n\n`;
        prompt += `FULL CONTENT INSTRUCTIONS:
- Return content in proper HTML format (not markdown)
- You CAN and SHOULD create headers (<h1>, <h2>, <h3>) when appropriate
- You CAN and SHOULD create paragraphs (<p>) for body text
- Use <h1> for main titles, <h2> for section headers, <h3> for subsections
- Use <strong> for bold, <em> for italics
- If instructions mention "title", "header", "sections" - CREATE THEM with proper HTML tags
- If user asks to "break up" content or "organize" it - USE HEADERS to structure it
- Headers help organize content and you should use them liberally when it makes sense
- Each paragraph should be wrapped in <p> tags
- Clean HTML structure without unnecessary empty elements`;
      }
      
      return prompt;
    
    case 'spell':
    case 'grammar':
      return `CURRENT HTML CONTENT:\n${originalHTML || content}\n\nINSTRUCTIONS: Fix ${action} issues in the text content while preserving ALL HTML structure, tags, and formatting exactly as they are. Return the corrected HTML.`;
    
    default:
      return content;
  }
}

function extractFormatContext(html: string): string {
  if (!html) return "No formatting context available.";
  
  // Extract heading structure and formatting patterns
  const headings = html.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
  const hasLists = html.includes('<ul>') || html.includes('<ol>');
  const hasBlockquotes = html.includes('<blockquote>');
  const hasBold = html.includes('<strong>') || html.includes('<b>');
  const hasItalic = html.includes('<em>') || html.includes('<i>');
  
  let context = "Document formatting patterns:\n";
  
  if (headings.length > 0) {
    context += `- Uses headings: ${headings.slice(0, 3).map(h => h.replace(/<[^>]*>/g, '')).join(', ')}${headings.length > 3 ? '...' : ''}\n`;
  }
  
  if (hasLists) context += "- Contains lists (maintain list formatting)\n";
  if (hasBlockquotes) context += "- Uses blockquotes\n";
  if (hasBold) context += "- Uses bold text for emphasis\n";
  if (hasItalic) context += "- Uses italic text for emphasis\n";
  
  // Check for line break patterns
  const lineBreaks = (html.match(/<br\s*\/?>/gi) || []).length;
  if (lineBreaks > 0) {
    context += `- Uses line breaks as semantic separators (${lineBreaks} breaks found)\n`;
  }
  
  context += "- Maintain consistent formatting with these patterns";
  
  return context;
}