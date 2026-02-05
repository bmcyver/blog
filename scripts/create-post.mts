import { writeFileSync } from 'fs'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

const template = `---
title: 
description: 
date: ${new Date().toISOString()}
tags:
    - CTF
    - Writeup
    - Web
draft: false
---

import Callout from "@/components/Callout.astro"

# Web/<Challenge-Name> (x Solves, x Points)
`

const filename = `src/content/blog/writeup/placeholder/index.mdx`
const directory = dirname(filename)

// Ensure the directory exists
mkdirSync(directory, { recursive: true })

writeFileSync(filename, template)
console.log(`Created new post at ${filename}`)
