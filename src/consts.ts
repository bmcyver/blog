import type { IconMap, SocialLink, Site, Award } from '@/types'

export const SITE: Site = {
  title: 'bmcyver',
  description: "bmcyver's blog - A place to share my thoughts and ideas",
  href: 'https://blog.bmcyver.dev',
  author: 'bmcyver',
  locale: 'ko-KR',
  postsPerPage: 5,
  featuredPostCount: 3,
  githubUserName: 'bmcyver',
  githubLicenseLink: 'https://github.com/bmcyver/blog?tab=readme-ov-file#licenses'
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/blog',
    label: 'blog',
  },
  {
    href: '/tags',
    label: 'tags',
  },
  {
    href: '/about',
    label: 'about',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/bmcyver',
    label: 'GitHub',
  },
  {
    href: 'mailto:me@bmcyver.dev',
    label: 'Email',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}

export const Awards: Award[] = [
  { year: 2025, place: '2nd', team: '1010110', event: 'ELECCON Junior' },
  {
    year: 2025,
    place: '3rd',
    team: '2h2u',
    event: 'CCE Junior',
  },
  {
    year: 2025,
    place: '1st',
    team: '._.',
    event: 'YISF',
  },
  {
    year: 2024,
    place: '3rd',
    team: '상은 제비뽑기로 정하시는건',
    event: 'WaRP CTF',
  },
]

export const CVEs: { id: string }[] = [{ id: 'CVE-2025-61385' }]
