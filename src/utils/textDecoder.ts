/**
 * 文本解码工具函数
 * 用于处理Unicode转义序列和字符编码问题
 */

/**
 * 解码Unicode转义序列
 * @param text 包含Unicode转义序列的文本
 * @returns 解码后的文本
 */
export function decodeUnicodeEscapes(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  try {
    // 处理 \x 格式的Unicode转义序列
    return text.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
  } catch (error) {
    console.warn('Unicode decode failed:', error);
    return text;
  }
}

/**
 * 解码可能包含各种编码问题的文本
 * @param text 原始文本
 * @returns 解码后的文本
 */
export function decodeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let decodedText = text;

  try {
    // 1. 处理Unicode转义序列
    decodedText = decodeUnicodeEscapes(decodedText);

    // 2. 处理可能的URL编码
    try {
      decodedText = decodeURIComponent(decodedText);
    } catch {
      // 如果不是URL编码，忽略错误
    }

    // 3. 处理可能的HTML实体
    decodedText = decodedText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    return decodedText;
  } catch (error) {
    console.warn('Text decode failed:', error);
    return text;
  }
}

/**
 * 确保文本使用UTF-8编码
 * @param text 原始文本
 * @returns UTF-8编码的文本
 */
export function ensureUTF8(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  try {
    // 检查是否已经是正确的UTF-8
    if (!/[\x80-\xFF]/.test(text)) {
      // 只包含ASCII字符，直接返回
      return text;
    }

    // 尝试使用TextDecoder处理
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const bytes = encoder.encode(text);
    return decoder.decode(bytes);
  } catch (error) {
    console.warn('UTF-8 encoding failed:', error);
    return text;
  }
}

/**
 * 完整的文本处理流水线
 * @param text 原始文本
 * @returns 处理后的可显示文本
 */
export function processText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  // 应用所有解码步骤
  let processed = text;
  processed = decodeText(processed);
  processed = ensureUTF8(processed);
  
  return processed;
}

/**
 * 处理文章内容对象
 * @param articleContent 文章内容对象
 * @returns 处理后的文章内容对象
 */
export function processArticleContent(articleContent: any): any {
  if (!articleContent || typeof articleContent !== 'object') {
    return articleContent;
  }

  const processed = { ...articleContent };

  // 处理常见的文本字段
  const textFields = ['title', 'content', 'summary', 'author', 'description'];
  
  textFields.forEach(field => {
    if (processed[field] && typeof processed[field] === 'string') {
      processed[field] = processText(processed[field]);
    }
  });

  return processed;
} 