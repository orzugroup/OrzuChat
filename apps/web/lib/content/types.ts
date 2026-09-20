import type { Locale } from '@/lib/i18n';

export type Meta = {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
};

export type FeatureIcon =
  | 'lock'
  | 'phone'
  | 'users'
  | 'media'
  | 'palette'
  | 'globe'
  | 'shield'
  | 'eye';

export type Feature = {
  icon: FeatureIcon;
  title: string;
  text: string;
};

export type Step = {
  title: string;
  text: string;
};

export type QA = {
  q: string;
  a: string;
};

export type ArticleSection = {
  h2: string;
  paragraphs?: string[];
  list?: string[];
};

export type Article = {
  meta: Meta;
  h1: string;
  intro: string[];
  updated: string;
  sections: ArticleSection[];
};

export type Showcase = {
  src: string;
  alt: string;
  title: string;
  text: string;
  wide?: boolean;
};

export type Dict = {
  locale: Locale;
  /** Native name of this locale, shown in the language switcher. */
  name: string;
  /** Native name of the other locale. */
  switchTo: string;
  common: {
    skipToContent: string;
    menu: string;
    close: string;
    languageLabel: string;
    themeLabel: string;
    comingSoon: string;
    comingSoonPlay: string;
    comingSoonApp: string;
    getOnPlay: string;
    getOnAppStore: string;
    downloadApk: string;
    apkComingSoon: string;
    notPublishedYet: string;
    learnMore: string;
    readMore: string;
    free: string;
    android: string;
    iosSoon: string;
    updated: string;
    contactUs: string;
  };
  nav: {
    features: string;
    security: string;
    rooms: string;
    faq: string;
    download: string;
    support: string;
  };
  home: {
    meta: Meta;
    hero: {
      badge: string;
      h1: string;
      sub: string;
      secondary: string;
      imageAlt: string;
      note: string;
      stats: { value: string; label: string }[];
    };
    trust: { title: string; text: string }[];
    features: {
      h2: string;
      sub: string;
      items: Feature[];
    };
    security: {
      h2: string;
      sub: string;
      paragraphs: string[];
      steps: Step[];
      imageAlt: string;
      cta: string;
    };
    rooms: {
      h2: string;
      sub: string;
      paragraphs: string[];
      bullets: string[];
      imageAlt: string;
    };
    languages: {
      h2: string;
      sub: string;
      themesTitle: string;
      themesText: string;
      imageAlt: string;
    };
    showcase: {
      h2: string;
      sub: string;
      items: Showcase[];
    };
    faq: {
      h2: string;
      sub: string;
      items: QA[];
    };
    cta: {
      h2: string;
      text: string;
      note: string;
    };
  };
  download: {
    meta: Meta;
    h1: string;
    intro: string[];
    playTitle: string;
    playText: string;
    apkTitle: string;
    apkText: string;
    iosTitle: string;
    iosText: string;
    stepsTitle: string;
    steps: Step[];
    requirementsTitle: string;
    requirements: string[];
    imageAlt: string;
  };
  securityPage: {
    meta: Meta;
    h1: string;
    intro: string[];
    imageAlt: string;
    sections: ArticleSection[];
    tableTitle: string;
    table: { label: string; value: string }[];
  };
  support: {
    meta: Meta;
    h1: string;
    intro: string[];
    emailTitle: string;
    emailText: string;
    telegramTitle: string;
    telegramText: string;
    faqTitle: string;
    faq: QA[];
  };
  privacy: Article;
  terms: Article;
  footer: {
    tagline: string;
    productTitle: string;
    legalTitle: string;
    companyTitle: string;
    languagesTitle: string;
    madeBy: string;
    orzuxText: string;
    rights: string;
    availability: string;
  };
  notFound: {
    title: string;
    text: string;
    cta: string;
  };
};
