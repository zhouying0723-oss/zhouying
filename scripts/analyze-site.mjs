import { chromium } from "playwright-core"
import { mkdir, writeFile } from "node:fs/promises"

const targetURL =
  process.env.TARGET_URL ?? "https://jubilant-library-370712.framer.app/"
const outputDirectory = new URL("../analysis/", import.meta.url)
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
})

const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
})
const page = await context.newPage()
const consoleMessages = []
const failedRequests = []
const responses = new Map()

page.on("console", (message) => {
  consoleMessages.push({
    type: message.type(),
    text: message.text(),
  })
})

page.on("requestfailed", (request) => {
  failedRequests.push({
    url: request.url(),
    resourceType: request.resourceType(),
    error: request.failure()?.errorText ?? "未知错误",
  })
})

page.on("response", (response) => {
  const request = response.request()
  responses.set(response.url(), {
    url: response.url(),
    status: response.status(),
    resourceType: request.resourceType(),
    contentType: response.headers()["content-type"] ?? "",
  })
})

await page.goto(targetURL, {
  waitUntil: "networkidle",
  timeout: 90_000,
})
await page.waitForTimeout(3_000)

const analysis = await page.evaluate((origin) => {
  const absolute = (value) => {
    try {
      return new URL(value, document.baseURI).href
    } catch {
      return value
    }
  }

  const links = [...document.querySelectorAll("a[href]")].map((anchor) => ({
    text: anchor.textContent?.replace(/\s+/g, " ").trim() ?? "",
    href: absolute(anchor.getAttribute("href")),
    internal: new URL(anchor.href).origin === origin,
  }))

  const resources = performance.getEntriesByType("resource").map((entry) => ({
    url: entry.name,
    initiatorType: entry.initiatorType,
    transferSize: entry.transferSize,
  }))

  return {
    title: document.title,
    language: document.documentElement.lang,
    bodyTextPreview: document.body.innerText.slice(0, 3_000),
    elementCount: document.querySelectorAll("*").length,
    links,
    images: [...document.images].map((image) => ({
      src: image.currentSrc || image.src,
      width: image.naturalWidth,
      height: image.naturalHeight,
      alt: image.alt,
    })),
    scripts: [...document.scripts].map((script) => absolute(script.src)).filter(Boolean),
    stylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map(
      (link) => absolute(link.href),
    ),
    resources,
  }
}, new URL(targetURL).origin)

await writeFile(new URL("rendered.html", outputDirectory), await page.content())
await writeFile(
  new URL("site-analysis.json", outputDirectory),
  JSON.stringify(analysis, null, 2),
)
await writeFile(
  new URL("network-responses.json", outputDirectory),
  JSON.stringify([...responses.values()], null, 2),
)
await writeFile(
  new URL("console.json", outputDirectory),
  JSON.stringify({ consoleMessages, failedRequests }, null, 2),
)
await page.screenshot({
  path: new URL("homepage.png", outputDirectory).pathname,
  fullPage: true,
})

await browser.close()

console.log(
  JSON.stringify(
    {
      title: analysis.title,
      elementCount: analysis.elementCount,
      links: analysis.links.length,
      images: analysis.images.length,
      resources: analysis.resources.length,
      failedRequests: failedRequests.length,
      consoleMessages: consoleMessages.length,
    },
    null,
    2,
  ),
)
