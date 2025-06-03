import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
// 需要安装 xml2js: npm install xml2js
import { parseStringPromise } from 'xml2js';

// RSS Feed统一数据结构定义
export interface RssFeedItem {
  title: string;
  link: string;
  pubDate?: string;
  author?: string;
  description?: string;
  content?: string;
  guid?: string;
  [key: string]: any;
}

export interface RssFeed {
  title: string;
  link: string;
  description?: string;
  items: RssFeedItem[];
  [key: string]: any;
}

export interface RsshubServiceOptions {
  instanceBaseUrl?: string; // RSSHub实例地址
  authToken?: string; // 鉴权token（如有）
  disableCache?: boolean;
}

/**
 * 构建RSSHub路由URL
 */
export function buildRsshubUrl(route: string, params?: Record<string, string>, options?: RsshubServiceOptions): string {
  let url = (options?.instanceBaseUrl || 'https://rsshub.app') + route;
  const query: Record<string, string> = {};
  if (options?.disableCache) query['disableCache'] = '1';
  if (params) Object.assign(query, params);
  const queryString = Object.keys(query)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join('&');
  if (queryString) url += (url.includes('?') ? '&' : '?') + queryString;
  return url;
}

/**
 * 拉取并解析RSSHub Feed
 */
export async function fetchRsshubFeed(route: string, params?: Record<string, string>, options?: RsshubServiceOptions): Promise<RssFeed> {
  const url = buildRsshubUrl(route, params, options);
  const axiosConfig: AxiosRequestConfig = {
    headers: {},
    timeout: 10000,
  };
  if (options?.authToken) {
    axiosConfig.headers!['Authorization'] = `Bearer ${options.authToken}`;
  }
  try {
    const res = await axios.get(url, axiosConfig);
    // 解析XML为JS对象
    const feedObj = await parseStringPromise(res.data, { explicitArray: false, mergeAttrs: true });
    // 兼容RSS2.0/Atom
    let feed: RssFeed;
    if (feedObj.rss && feedObj.rss.channel) {
      const channel = feedObj.rss.channel;
      feed = {
        title: channel.title,
        link: channel.link,
        description: channel.description,
        items: Array.isArray(channel.item) ? channel.item : (channel.item ? [channel.item] : []),
      };
    } else if (feedObj.feed && feedObj.feed.entry) {
      // Atom格式
      feed = {
        title: feedObj.feed.title,
        link: feedObj.feed.link && feedObj.feed.link.href ? feedObj.feed.link.href : '',
        description: feedObj.feed.subtitle || '',
        items: Array.isArray(feedObj.feed.entry) ? feedObj.feed.entry : [feedObj.feed.entry],
      };
    } else {
      throw new Error('无法识别的Feed格式');
    }
    // 标准化item字段
    feed.items = feed.items.map((item: any) => ({
      title: item.title?._ || item.title || '',
      link: item.link?.href || item.link || '',
      pubDate: item.pubDate || item.published || item.updated || '',
      author: item.author?.name || item.author || '',
      description: item.description || item.summary || '',
      content: item['content:encoded'] || item.content || '',
      guid: item.guid || '',
      ...item,
    }));
    return feed;
  } catch (err: any) {
    // 错误处理
    throw new Error(`RSSHub Feed 拉取失败: ${err.message || err}`);
  }
} 