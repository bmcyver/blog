import type {
  LicenseConfig,
  NavBarConfig,
  ProfileConfig,
  SiteConfig,
  ExpressiveCodeConfig,
} from './types/config';
import { LinkPreset } from './types/config';

export const siteConfig: SiteConfig = {
  title: 'bmcyver',
  subtitle: 'blog',
  lang: 'en', // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'es', 'th'
  themeColor: {
    hue: 230, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
    fixed: false, // Hide the theme color picker for visitors
  },
  banner: {
    enable: false,
    src: '', // Relative to the /src directory. Relative to the /public directory if it starts with '/'
    position: 'center', // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
    credit: {
      enable: false, // Display the credit text of the banner image
      text: '', // Credit text to be displayed
      url: '', // (Optional) URL link to the original artwork or artist's page
    },
  },
  toc: {
    enable: true, // Display the table of contents on the right side of the post
    depth: 2, // Maximum heading depth to show in the table, from 1 to 3
  },
  favicon: [
    // Leave this array empty to use the default favicon
    {
      src: '/logo.webp', // Path of the favicon, relative to the /public directory
    },
  ],
};

export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    LinkPreset.About,
    // {
    //   name: 'GitHub',
    //   url: 'https://github.com/bmcyver',     // Internal links should not include the base path, as it is automatically added
    //   external: true,                               // Show an external link icon and will open in a new tab
    // },
  ],
};

export const profileConfig: ProfileConfig = {
  avatar: '/logo.webp', // Relative to the /src directory. Relative to the /public directory if it starts with '/'
  name: 'bmcyver',
  bio: '._.',
  links: [
    // Visit https://icones.js.org/ for icon codes
    // You will need to install the corresponding icon set if it's not already included
    // `pnpm add @iconify-json/<icon-set-name>`
    {
      name: 'GitHub',
      icon: 'fa6-brands:github',
      url: 'https://github.com/bmcyver',
    },
    {
      name: 'Discord',
      icon: 'fa6-brands:discord',
      url: 'https://discord.com/users/967304143981117450',
    },
  ],
};

export const licenseConfig: LicenseConfig = {
  enable: true,
  name: 'CC BY-NC-SA 4.0',
  url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
  themes: ['one-light', 'one-dark-pro'],
};
