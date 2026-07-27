import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { basename, extname } from "node:path"

const root = new URL("../", import.meta.url)
const analysisDirectory = new URL("analysis/", root)
const imageDirectory = new URL("assets/images/", root)
const fontDirectory = new URL("assets/fonts/", root)

await mkdir(imageDirectory, { recursive: true })
await mkdir(fontDirectory, { recursive: true })

const files = await readdir(analysisDirectory)
const analysisFiles = files.filter(
  (file) => file.endsWith("-analysis.json") || file === "site-analysis.json",
)

const imageURLs = new Set()
for (const file of analysisFiles) {
  const analysis = JSON.parse(
    await readFile(new URL(file, analysisDirectory), "utf8"),
  )
  for (const image of analysis.images ?? []) {
    imageURLs.add(image.src)
  }
}

const fontURLs = new Set([
  "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2",
  "https://framerusercontent.com/assets/UjlFhCnUjxhNfep4oYBPqnEssyo.woff2",
])

const manifest = {}

const extensionFor = (contentType, url) => {
  const normalized = contentType.split(";")[0].trim()
  const byType = {
    "image/avif": ".avif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
    "font/woff2": ".woff2",
  }
  return byType[normalized] ?? extname(new URL(url).pathname) ?? ".bin"
}

const download = async (url, directory, publicPrefix) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载失败 ${response.status}: ${url}`)
  }

  const contentType = response.headers.get("content-type") ?? ""
  const sourceName = basename(new URL(url).pathname).replace(/\.[^.]+$/, "")
  const extension = extensionFor(contentType, url)
  const fileName = `${sourceName}${extension}`
  const bytes = new Uint8Array(await response.arrayBuffer())
  await writeFile(new URL(fileName, directory), bytes)

  const localPath = `${publicPrefix}/${fileName}`
  manifest[url] = localPath
  const normalizedURL = new URL(url)
  normalizedURL.search = ""
  manifest[normalizedURL.href] = localPath
}

for (const url of [...imageURLs].sort()) {
  await download(url, imageDirectory, "assets/images")
}

for (const url of [...fontURLs].sort()) {
  await download(url, fontDirectory, "assets/fonts")
}

await writeFile(
  new URL("assets/manifest.json", root),
  `${JSON.stringify(manifest, null, 2)}\n`,
)

console.log(`已下载 ${imageURLs.size} 个图片资源和 ${fontURLs.size} 个字体资源。`)
