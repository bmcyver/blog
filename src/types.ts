export type Site = {
  title: string
  description: string
  href: string
  author: string
  locale: string
  postsPerPage: number
  featuredPostCount: number
  githubUserName: string
  githubLicenseLink: string
}

export type SocialLink = {
  href: string
  label: string
}

export type IconMap = {
  [key: string]: string
}

export type Award = {
  year: number
  place: string
  event: string
  team: string
}
