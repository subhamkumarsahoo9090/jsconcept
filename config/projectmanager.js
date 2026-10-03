import "server-only";

export const projectManager = {
  app: {
    name: "JsExport",
    logo: "/favicon.ico",
    description:
      "Short lessons for JavaScript, Node.js, React, Next.js, React Native, MongoDB, and Mongoose. Every lesson is in English and in Hindi written with English letters.",
  },
  theme: {
    colors: {
      primary: "#0f766e",
      primaryHover: "#115e59",
      background: "#fffdf8",
      surface: "#f3eee6",
      text: "#1c1917",
      muted: "#78716c",
      border: "#e6dfd2",
      danger: "#dc2626",
    },
    components: {
      button: {
        background: "#0f766e",
        color: "#ffffff",
        hover: "#115e59",
      },
      secondaryButton: {
        background: "#fffdf8",
        color: "#1c1917",
        border: "#e6dfd2",
        hover: "#f3eee6",
      },
    },
    fontFamily: {
      options: {
        inter: "Inter, system-ui, sans-serif",
        arial: "Arial, Helvetica, sans-serif",
        verdana: "Verdana, Geneva, sans-serif",
        tahoma: "Tahoma, Geneva, sans-serif",
        trebuchet: "'Trebuchet MS', sans-serif",
        georgia: "Georgia, serif",
        times: "'Times New Roman', Times, serif",
        courier: "'Courier New', Courier, monospace",
        system: "system-ui, sans-serif",
      },
      default: "inter",
    },
    fontSize: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "30px",
    },
  },
  company: {
    name: "Masterweb",
    address: "123 Market Street, Suite 100, San Francisco, CA 94105",
    email: "hello@masterweb.example",
    phone: "15550102000",
  },
  analytics: {
    // GA4 measurement id, for example G-XXXXXXXX. Leave empty to skip the tag.
    measurementId: "",
  },
  seo: {
    // Full site URL, for example https://example.com. Leave empty to skip canonical links.
    siteUrl: "",
  },
  // Per route. showTopNav defaults to true. showSidebar defaults to false.
  // A route missing from this list shows the top nav and footer, and hides the sidebar.
  pages: {
    "/": {
      showTopNav: true,
      showSidebar: false,
      showFooter: false,
      seo: {
        title: "JsExport",
        description:
          "Short coding lessons in English and Hindi, opened from your dashboard.",
        keywords: ["Masterweb", "web app", "dashboard"],
        noIndex: false,
      },
    },
    "/login": {
      showTopNav: true,
      showSidebar: false,
      showFooter: false,
      seo: {
        title: "Log in",
        description: "Log in to your Masterweb account.",
        keywords: ["log in", "Masterweb account"],
        noIndex: true,
      },
    },
    "/dashboard": {
      showTopNav: false,
      showSidebar: true,
      showFooter: false,
      seo: {
        title: "Dashboard",
        description: "Your Masterweb account dashboard.",
        keywords: ["dashboard"],
        noIndex: true,
      },
    },
    "/dashboard/settings": {
      showTopNav: false,
      showSidebar: true,
      showFooter: false,
      seo: {
        title: "Settings",
        description: "Study agent and browser settings.",
        keywords: ["settings"],
        noIndex: true,
      },
    },
  },
  // Values come from .env.local. Do not paste live secrets into this file.
  secrets: {
    mail: {
      clientId: process.env.MAIL_CLIENT_ID ?? "",
      clientSecret: process.env.MAIL_CLIENT_SECRET ?? "",
    },
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY ?? "",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? "",
      projectId: process.env.FIREBASE_PROJECT_ID ?? "",
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "",
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? "",
      appId: process.env.FIREBASE_APP_ID ?? "",
      privateKey: process.env.FIREBASE_PRIVATE_KEY ?? "",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    },
  },
};

export const secrets = projectManager.secrets;

export function pageMetadata(path) {
  const page = projectManager.pages[path] ?? {};
  const seo = page.seo ?? {};
  const title = seo.title || projectManager.app.name;
  const description = seo.description || projectManager.app.description;
  const isHome = path === "/";
  const metadata = {
    title: isHome ? { absolute: title } : title,
    description,
    openGraph: {
      title,
      description,
      siteName: projectManager.app.name,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };

  if (Array.isArray(seo.keywords) && seo.keywords.length > 0) {
    metadata.keywords = seo.keywords;
  }

  if (seo.noIndex) {
    metadata.robots = { index: false, follow: false };
  }

  if (projectManager.seo.siteUrl) {
    metadata.alternates = { canonical: path };
    metadata.openGraph.url = path;
  }

  return metadata;
}

export function pageChrome() {
  return Object.fromEntries(
    Object.entries(projectManager.pages).map(([path, page]) => [
      path,
      {
        showTopNav: page.showTopNav !== false,
        showSidebar: page.showSidebar === true,
        showFooter: page.showFooter !== false,
      },
    ]),
  );
}

export function themeVariablesCss() {
  const { colors, components, fontFamily, fontSize } = projectManager.theme;
  const { button, secondaryButton } = components;
  const fontSans =
    fontFamily.options[fontFamily.default] ?? fontFamily.options.inter;

  return `:root {
  --pm-primary: ${colors.primary};
  --pm-primary-hover: ${colors.primaryHover};
  --pm-background: ${colors.background};
  --pm-surface: ${colors.surface};
  --pm-text: ${colors.text};
  --pm-muted: ${colors.muted};
  --pm-border: ${colors.border};
  --pm-danger: ${colors.danger};
  --pm-button-bg: ${button.background};
  --pm-button-color: ${button.color};
  --pm-button-hover: ${button.hover};
  --pm-button-secondary-bg: ${secondaryButton.background};
  --pm-button-secondary-color: ${secondaryButton.color};
  --pm-button-secondary-border: ${secondaryButton.border};
  --pm-button-secondary-hover: ${secondaryButton.hover};
  --pm-font-sans: ${fontSans};
  --pm-text-xs: ${fontSize.xs};
  --pm-text-sm: ${fontSize.sm};
  --pm-text-base: ${fontSize.base};
  --pm-text-lg: ${fontSize.lg};
  --pm-text-xl: ${fontSize.xl};
  --pm-text-2xl: ${fontSize["2xl"]};
  --pm-text-3xl: ${fontSize["3xl"]};
}`;
}

