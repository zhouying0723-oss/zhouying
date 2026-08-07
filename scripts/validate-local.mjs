import { chromium } from "playwright-core"
import { mkdir } from "node:fs/promises"

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:8000"
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const routes = [
  "/",
  "/works/champ-silencieux/",
  "/works/elan-brut/",
  "/works/la-ou-dort-l-eau/",
  "/works/les-silences-miroirs/",
  "/works/textbuddy/",
  "/works/revolte-douce/",
]

await mkdir(new URL("../analysis/", import.meta.url), { recursive: true })

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
})

const failures = []

for (const route of routes) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const pageErrors = []
  const failedRequests = []
  const framerRequests = []

  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text())
  })
  page.on("pageerror", (error) => pageErrors.push(error.message))
  page.on("requestfailed", (request) =>
    failedRequests.push(`${request.failure()?.errorText}: ${request.url()}`),
  )
  page.on("request", (request) => {
    if (
      /framer(?:usercontent|static)?\.com|events\.framer\.com/.test(
        request.url(),
      )
    ) {
      framerRequests.push(request.url())
    }
  })

  const response = await page.goto(`${baseURL}${route}`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  })

  if (!response?.ok()) {
    failures.push(`${route}: HTTP ${response?.status() ?? "无响应"}`)
  }
  if (pageErrors.length) {
    failures.push(`${route}: 控制台错误 ${pageErrors.join(" | ")}`)
  }
  if (failedRequests.length) {
    failures.push(`${route}: 资源失败 ${failedRequests.join(" | ")}`)
  }
  if (framerRequests.length) {
    failures.push(`${route}: 仍请求 Framer ${framerRequests.join(" | ")}`)
  }

  if (route === "/") {
    const draggableProject = page.locator(".desktop-project").first()
    const nativeDragPrevented = await draggableProject.evaluate((project) => {
      const image = project.querySelector("img")
      const event = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      })
      project.dispatchEvent(event)
      return (
        event.defaultPrevented &&
        project.draggable === false &&
        image?.draggable === false
      )
    })
    if (!nativeDragPrevented) {
      failures.push("/: 作品图标仍可能触发浏览器原生图片拖动")
    }
    const beforeDrag = await draggableProject.boundingBox()
    if (!beforeDrag) {
      failures.push("/: 找不到可拖动的作品图标")
    } else {
      await page.mouse.move(
        beforeDrag.x + beforeDrag.width / 2,
        beforeDrag.y + beforeDrag.height / 2,
      )
      await page.mouse.down()
      await page.mouse.move(
        beforeDrag.x + beforeDrag.width / 2 + 100,
        beforeDrag.y + beforeDrag.height / 2 + 60,
        { steps: 6 },
      )
      await page.mouse.up()
      const afterDrag = await draggableProject.boundingBox()
      const opacityAfterDrag = await draggableProject.evaluate(
        (project) => getComputedStyle(project).opacity,
      )
      if (
        !afterDrag ||
        Math.abs(afterDrag.x - beforeDrag.x) < 80 ||
        Math.abs(afterDrag.y - beforeDrag.y) < 40
      ) {
        failures.push("/: 作品图标拖动后位置没有改变")
      }
      if (Number(opacityAfterDrag) < 0.99) {
        failures.push("/: 作品图标拖动后变为不可见")
      }
      if (new URL(page.url()).pathname !== "/") {
        failures.push("/: 拖动作品图标时意外打开了详情页")
      }
    }

    await page.locator(".desktop-project").nth(1).click()
    if (!new URL(page.url()).pathname.startsWith("/works/")) {
      failures.push("/: 轻点作品图标没有进入详情页")
    }
    await page.goBack({ waitUntil: "networkidle" })

    await page.locator('[data-open-window="about"]').click()
    if (!(await page.locator('[data-window="about"]').isVisible())) {
      failures.push("/: About 窗口没有打开")
    }
    const controls = page.locator(
      '[data-window="about"] [data-close-window]',
    )
    if ((await controls.count()) !== 3) {
      failures.push("/: About 窗口没有显示红黄绿三个控制按钮")
    }
    await controls.nth(1).click()
    await page.waitForTimeout(300)
    if (
      await page
        .locator('[data-window="about"]')
        .evaluate((element) => element.classList.contains("is-open"))
    ) {
      failures.push("/: 黄色窗口按钮没有关闭 About 窗口")
    }
    await page.locator('[data-open-window="about"]').click()
    await page
      .locator('[data-window="about"] [data-close-window]')
      .nth(2)
      .click()
    await page.waitForTimeout(300)
    if (
      await page
        .locator('[data-window="about"]')
        .evaluate((element) => element.classList.contains("is-open"))
    ) {
      failures.push("/: 绿色窗口按钮没有关闭 About 窗口")
    }
    await page.keyboard.press("Escape")
    await page.locator('[data-open-window="notes"]').click()
    if (!(await page.locator('[data-window="notes"]').isVisible())) {
      failures.push("/: Notes 窗口没有打开")
    }
  }

  await page.close()
}

const mobilePage = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
})
await mobilePage.goto(`${baseURL}/`, { waitUntil: "networkidle" })
await mobilePage.screenshot({
  path: new URL("../analysis/mobile-homepage.png", import.meta.url).pathname,
  fullPage: true,
})

const horizontalOverflow = await mobilePage.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth,
)
if (horizontalOverflow) {
  failures.push("/: 移动端存在横向溢出")
}

const clippedCards = await mobilePage.locator(".desktop-project").evaluateAll(
  (cards) =>
    cards
      .map((card) => card.getBoundingClientRect())
      .filter(
        (bounds) =>
          bounds.left < 0 ||
          bounds.right > window.innerWidth ||
          bounds.top < 0,
      ).length,
)
if (clippedCards) {
  failures.push(`/: 移动端有 ${clippedCards} 个项目卡片超出视口`)
}

await browser.close()

if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(
  `验收通过：${routes.length} 个页面、桌面窗口交互和移动端布局均正常，未请求 Framer 服务。`,
)
