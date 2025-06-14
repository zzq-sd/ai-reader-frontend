// AI阅读器项目图标配置
// 基于原型页面分析，统一管理所有图标

export const ICONS = {
  // === 核心导航图标 ===
  BRAND: {
    LOGO: 'fas fa-brain',
    ICON: 'fas fa-brain'
  },

  // === 主导航标签图标 ===
  NAVIGATION: {
    HOME: 'fas fa-home',
    DASHBOARD: 'fas fa-tachometer-alt',
    BACK: 'fas fa-arrow-left',
    FORWARD: 'fas fa-arrow-right',
    UP: 'fas fa-arrow-up',
    DOWN: 'fas fa-arrow-down',
    CLOSE: 'fas fa-times',
    MENU: 'fas fa-bars',
    SEARCH: 'fas fa-search'
  },

  // === 侧边栏功能图标 ===
  SIDEBAR: {
    // 概览部分
    DASHBOARD: 'fas fa-home',
    ALL_ARTICLES: 'fas fa-list',
    
    // RSS源部分
    RSS_MANAGEMENT: 'fas fa-rss',
    TECH_CATEGORY: 'fas fa-code',
    NEWS_CATEGORY: 'fas fa-newspaper',
    DESIGN_CATEGORY: 'fas fa-palette',
    BUSINESS_CATEGORY: 'fas fa-briefcase',
    
    // 智能功能部分
    KNOWLEDGE_GRAPH: 'fas fa-project-diagram',
    AI_ASSISTANT: 'fas fa-robot',
    
    // 工具部分
    NOTES: 'fas fa-sticky-note',
    COLLECTIONS: 'fas fa-bookmark',
    
    // 系统部分
    SETTINGS: 'fas fa-cog',
    HELP: 'fas fa-question-circle',
  },

  // === 用户相关图标 ===
  USER: {
    AVATAR: 'fas fa-user',
    PROFILE: 'fas fa-user-circle',
    LOGIN: 'fas fa-sign-in-alt',
    LOGOUT: 'fas fa-sign-out-alt',
    SETTINGS: 'fas fa-user-cog',
    REGISTER: 'fas fa-user-plus',
    NOTIFICATIONS: 'fas fa-bell'
  },

  // === 文章相关图标 ===
  ARTICLE: {
    READ: 'fas fa-eye',
    UNREAD: 'far fa-eye',
    FAVORITE: 'fas fa-heart',
    UNFAVORITE: 'far fa-heart',
    BOOKMARK: 'fas fa-bookmark',
    UNBOOKMARK: 'far fa-bookmark',
    SHARE: 'fas fa-share-alt',
    COMMENT: 'fas fa-comment',
    TAG: 'fas fa-tag',
    TIME: 'fas fa-clock',
    SOURCE: 'fas fa-external-link-alt',
    FULL_ARTICLE: 'fas fa-expand-arrows-alt',
    SUMMARY: 'fas fa-compress-arrows-alt',
  },

  // === RSS管理图标 ===
  RSS: {
    ADD: 'fas fa-plus',
    REFRESH: 'fas fa-sync-alt',
    EDIT: 'fas fa-pen',
    DELETE: 'fas fa-trash-alt',
    IMPORT: 'fas fa-upload',
    EXPORT: 'fas fa-download',
    CATEGORY: 'fas fa-folder',
    STATUS_ACTIVE: 'fas fa-check-circle',
    STATUS_ERROR: 'fas fa-exclamation-triangle',
    STATUS_LOADING: 'fas fa-spinner',
    // RSSHub相关图标
    RSSHUB: 'fas fa-rss',
    POPULAR: 'fas fa-fire',
    HEALTH: 'fas fa-heartbeat',
    INSTANCE: 'fas fa-server',
    ROUTE: 'fas fa-route',
    BROWSE: 'fas fa-search',
    VALIDATE: 'fas fa-check',
    CONFIG: 'fas fa-cog',
    PARAMS: 'fas fa-sliders-h',
  },

  // === 文章阅读器工具栏图标 ===
  READER: {
    BACK: 'fas fa-arrow-left',
    FORWARD: 'fas fa-arrow-right',
    BOOKMARK: 'fas fa-bookmark',
    NOTE: 'fas fa-sticky-note',
    HIGHLIGHT: 'fas fa-highlighter',
    FONT_SIZE_UP: 'fas fa-plus',
    FONT_SIZE_DOWN: 'fas fa-minus',
    THEME_LIGHT: 'fas fa-sun',
    THEME_DARK: 'fas fa-moon',
    FULLSCREEN: 'fas fa-expand',
    EXIT_FULLSCREEN: 'fas fa-compress',
    PRINT: 'fas fa-print',
    READING_MODE: 'fas fa-book-open',
  },

  // === 笔记相关图标 ===
  NOTES: {
    CREATE: 'fas fa-plus',
    EDIT: 'fas fa-pen',
    DELETE: 'fas fa-trash-alt',
    SAVE: 'fas fa-save',
    BOLD: 'fas fa-bold',
    ITALIC: 'fas fa-italic',
    UNDERLINE: 'fas fa-underline',
    LIST: 'fas fa-list',
    ORDERED_LIST: 'fas fa-list-ol',
    LINK: 'fas fa-link',
    IMAGE: 'fas fa-image',
    CODE: 'fas fa-code',
    QUOTE: 'fas fa-quote-right',
    TAG: 'fas fa-tag',
  },

  // === 收藏管理图标 ===
  COLLECTIONS: {
    FOLDER: 'fas fa-folder',
    FOLDER_OPEN: 'fas fa-folder-open',
    CREATE_FOLDER: 'fas fa-plus',
    EDIT_FOLDER: 'fas fa-pen',
    DELETE_FOLDER: 'fas fa-trash-alt',
    MOVE: 'fas fa-arrows-alt',
    GRID_VIEW: 'fas fa-th-large',
    LIST_VIEW: 'fas fa-list',
    ARTICLE_TYPE: 'fas fa-newspaper',
    NOTE_TYPE: 'fas fa-sticky-note',
    LINK_TYPE: 'fas fa-link',
  },

  // === 知识图谱图标 ===
  KNOWLEDGE_GRAPH: {
    NODE_ARTICLE: 'fas fa-newspaper',
    NODE_NOTE: 'fas fa-sticky-note',
    NODE_TOPIC: 'fas fa-circle',
    NODE_AUTHOR: 'fas fa-user',
    NODE_SOURCE: 'fas fa-rss',
    LAYOUT_FORCE: 'fas fa-project-diagram',
    LAYOUT_TREE: 'fas fa-sitemap',
    LAYOUT_CIRCULAR: 'fas fa-circle-notch',
    RESET: 'fas fa-undo',
    ZOOM_IN: 'fas fa-search-plus',
    ZOOM_OUT: 'fas fa-search-minus',
    CENTER: 'fas fa-crosshairs',
    FULLSCREEN: 'fas fa-expand',
  },

  // === 通知与状态图标 ===
  NOTIFICATION: {
    BELL: 'fas fa-bell',
    SUCCESS: 'fas fa-check-circle',
    ERROR: 'fas fa-exclamation-circle',
    WARNING: 'fas fa-exclamation-triangle',
    INFO: 'fas fa-info-circle',
    LOADING: 'fas fa-spinner',
    NEW_ARTICLE: 'fas fa-newspaper',
    RSS_UPDATE: 'fas fa-rss',
    SYSTEM: 'fas fa-cog',
  },

  // === 操作相关图标 ===
  ACTION: {
    CLOSE: 'fas fa-times',
    CONFIRM: 'fas fa-check',
    CANCEL: 'fas fa-times',
    SAVE: 'fas fa-save',
    RESET: 'fas fa-undo',
    CLEAR: 'fas fa-eraser',
    COPY: 'fas fa-copy',
    PASTE: 'fas fa-paste',
    CUT: 'fas fa-cut',
    UPLOAD: 'fas fa-upload',
    DOWNLOAD: 'fas fa-download',
    MORE: 'fas fa-ellipsis-h',
    FILTER: 'fas fa-filter',
    SORT: 'fas fa-sort',
    EXPAND: 'fas fa-chevron-down',
    PLUS: 'fas fa-plus',
    MINUS: 'fas fa-minus',
  },

  // === 设置页面图标 ===
  SETTINGS: {
    ACCOUNT: 'fas fa-user-circle',
    APPEARANCE: 'fas fa-palette',
    READING: 'fas fa-book-reader',
    NOTIFICATION: 'fas fa-bell',
    DATA_SYNC: 'fas fa-database',
    PRIVACY: 'fas fa-shield-alt',
    LANGUAGE: 'fas fa-globe',
    THEME: 'fas fa-adjust',
    FONT: 'fas fa-font',
    BACKUP: 'fas fa-cloud-upload-alt',
    RESTORE: 'fas fa-cloud-download-alt',
    EXPORT: 'fas fa-file-export',
    IMPORT: 'fas fa-file-import',
  },

  // === 统计与分析图标 ===
  ANALYTICS: {
    CHART_LINE: 'fas fa-chart-line',
    CHART_BAR: 'fas fa-chart-bar',
    CHART_PIE: 'fas fa-chart-pie',
    TREND_UP: 'fas fa-arrow-up',
    TREND_DOWN: 'fas fa-arrow-down',
    READING_TIME: 'fas fa-clock',
    TOTAL_ARTICLES: 'fas fa-book-open',
    ACTIVE_TIME: 'fas fa-fire',
    POPULAR_CATEGORY: 'fas fa-star',
    WEEK_STATS: 'fas fa-calendar-week',
    MONTH_STATS: 'fas fa-calendar-month',
  },

  // === AI助手图标 ===
  AI: {
    ROBOT: 'fas fa-robot',
    CHAT: 'fas fa-comments',
    SEND: 'fas fa-paper-plane',
    THINKING: 'fas fa-brain',
    SUGGESTION: 'fas fa-lightbulb',
    SUMMARY: 'fas fa-compress-arrows-alt',
    TRANSLATE: 'fas fa-language',
    ANALYZE: 'fas fa-chart-line',
    QUESTION: 'fas fa-question',
    ANSWER: 'fas fa-comment-dots',
  },

  // === 空状态图标 ===
  EMPTY: {
    NO_ARTICLES: 'fas fa-newspaper',
    NO_NOTES: 'fas fa-sticky-note',
    NO_COLLECTIONS: 'fas fa-folder-open',
    NO_RSS: 'fas fa-rss',
    NO_RESULTS: 'fas fa-search',
    NO_NOTIFICATIONS: 'fas fa-bell-slash',
    ERROR: 'fas fa-exclamation-triangle',
  },

  // === 文件类型图标 ===
  FILE: {
    TEXT: 'fas fa-file-alt',
    IMAGE: 'fas fa-file-image',
    VIDEO: 'fas fa-file-video',
    AUDIO: 'fas fa-file-audio',
    PDF: 'fas fa-file-pdf',
    DOCUMENT: 'fas fa-file-word',
    SPREADSHEET: 'fas fa-file-excel',
    ARCHIVE: 'fas fa-file-archive',
    LINK: 'fas fa-link',
  },

  // === 社交与分享图标 ===
  SOCIAL: {
    SHARE: 'fas fa-share-alt',
    TWITTER: 'fab fa-twitter',
    FACEBOOK: 'fab fa-facebook',
    LINKEDIN: 'fab fa-linkedin',
    REDDIT: 'fab fa-reddit',
    EMAIL: 'fas fa-envelope',
    COPY_LINK: 'fas fa-copy',
    QR_CODE: 'fas fa-qrcode',
  },

  // === 日期时间图标 ===
  TIME: {
    CLOCK: 'fas fa-clock',
    CALENDAR: 'fas fa-calendar',
    TODAY: 'fas fa-calendar-day',
    WEEK: 'fas fa-calendar-week',
    MONTH: 'fas fa-calendar-month',
    HISTORY: 'fas fa-history',
    SCHEDULE: 'fas fa-calendar-check',
  }
} as const

// 图标尺寸预设
export const ICON_SIZES = {
  XS: '12px',
  SM: '14px',
  MD: '16px',
  LG: '18px',
  XL: '20px',
  XXL: '24px',
  XXXL: '32px',
} as const

// 图标颜色预设（基于CSS变量）
export const ICON_COLORS = {
  PRIMARY: 'var(--color-text-primary)',
  SECONDARY: 'var(--color-text-secondary)',
  DISABLED: 'var(--color-text-disabled)',
  ACCENT: 'var(--color-accent-primary)',
  SUCCESS: 'var(--color-success)',
  WARNING: 'var(--color-warning)',
  DANGER: 'var(--color-danger)',
  INFO: 'var(--color-info)',
} as const

// 常用图标组合
export const ICON_COMBINATIONS = {
  // 文章状态组合
  ARTICLE_READ: ICONS.ARTICLE.READ,
  ARTICLE_UNREAD: ICONS.ARTICLE.UNREAD,
  ARTICLE_FAVORITED: ICONS.ARTICLE.FAVORITE,
  ARTICLE_BOOKMARKED: ICONS.ARTICLE.BOOKMARK,
  
  // 加载状态组合
  LOADING_SPIN: ICONS.NOTIFICATION.LOADING,
  REFRESH_SPIN: ICONS.RSS.REFRESH,
  
  // 成功/错误状态组合
  SUCCESS_CHECK: ICONS.NOTIFICATION.SUCCESS,
  ERROR_ALERT: ICONS.NOTIFICATION.ERROR,
  WARNING_ALERT: ICONS.NOTIFICATION.WARNING,
} as const

// 导出类型定义
export type IconName = typeof ICONS[keyof typeof ICONS][keyof typeof ICONS[keyof typeof ICONS]]
export type IconSize = typeof ICON_SIZES[keyof typeof ICON_SIZES]
export type IconColor = typeof ICON_COLORS[keyof typeof ICON_COLORS] 