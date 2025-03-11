---
title: tree
author: Patrick Hall
tags: ["utility"]
url: 
---


A simple implementation of [tree](https://en.wikipedia.org/wiki/Tree_(command)) just because I wanted one in deno.


```
Usage: tree [options] [directory]

Options:
  --help          Show this help message
  --files-only    Show files only (default: true)
  --version       Show version
  --dirs-only     Show directories only
  --depth <n>     Set the depth limit for directory traversal
  --exclude <pat> Exclude files matching the given pattern (comma-separated)

Configuration:
  The script can read a configuration file named `.tree.json` in the current directory.
  This file allows specifying directories or files to exclude globally.

  Example .tree.json format:
  {
    "exclude": [
      "node_modules",
      "dist",
      "*.log"
    ]
  }

  - The "exclude" field is an array of glob patterns.
  - These patterns will be applied every time the script runs.
  - New exclusions added via `--exclude` will be merged into this file.

Examples:
  tree --depth 2
  tree --dirs-only
  tree --exclude node_modules,dist
  tree some/directory --depth 3
  ```