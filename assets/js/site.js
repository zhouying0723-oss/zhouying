const windows = new Map(
  [...document.querySelectorAll(".window")].map((element) => [
    element.dataset.window,
    element,
  ]),
)

const openWindow = (name) => {
  for (const windowElement of windows.values()) {
    windowElement.classList.toggle(
      "is-open",
      windowElement.dataset.window === name,
    )
  }
}

document.querySelectorAll("[data-open-window]").forEach((button) => {
  button.addEventListener("click", () => openWindow(button.dataset.openWindow))
})

document.querySelectorAll("[data-close-window]").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest(".window")?.classList.remove("is-open")
  })
})

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    windows.forEach((windowElement) =>
      windowElement.classList.remove("is-open"),
    )
  }
})

document.querySelectorAll(".window").forEach((windowElement) => {
  const handle = windowElement.querySelector(".window-bar")
  if (!handle) return

  let dragOffset = null
  handle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return
    const bounds = windowElement.getBoundingClientRect()
    dragOffset = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }
    handle.setPointerCapture(event.pointerId)
  })

  handle.addEventListener("pointermove", (event) => {
    if (!dragOffset) return
    windowElement.style.left = `${event.clientX - dragOffset.x}px`
    windowElement.style.top = `${event.clientY - dragOffset.y}px`
    windowElement.style.transform = "none"
  })

  handle.addEventListener("pointerup", (event) => {
    dragOffset = null
    handle.releasePointerCapture(event.pointerId)
  })
})

const desktopDragMedia = window.matchMedia("(min-width: 721px)")

document.querySelectorAll(".desktop-project").forEach((project) => {
  let dragState = null
  let suppressNextClick = false

  project.draggable = false
  project.querySelectorAll("img").forEach((image) => {
    image.draggable = false
  })
  project.addEventListener("dragstart", (event) => event.preventDefault())

  project.addEventListener("pointerdown", (event) => {
    if (!desktopDragMedia.matches || event.button !== 0) return

    const grid = project.closest(".project-grid")
    if (!grid) return

    const bounds = project.getBoundingClientRect()
    const gridBounds = grid.getBoundingClientRect()
    const left = bounds.left - gridBounds.left
    const top = bounds.top - gridBounds.top

    project.style.animation = "none"
    project.style.opacity = "1"
    project.style.left = `${left}px`
    project.style.top = `${top}px`
    project.style.transform = "none"
    project.classList.add("is-dragging")
    project.setPointerCapture(event.pointerId)

    dragState = {
      grid,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    }
    event.preventDefault()
  })

  project.addEventListener("pointermove", (event) => {
    if (!dragState) return

    const gridBounds = dragState.grid.getBoundingClientRect()
    const projectBounds = project.getBoundingClientRect()
    const nextLeft = Math.min(
      Math.max(event.clientX - gridBounds.left - dragState.offsetX, 0),
      gridBounds.width - projectBounds.width,
    )
    const nextTop = Math.min(
      Math.max(event.clientY - gridBounds.top - dragState.offsetY, 0),
      gridBounds.height - projectBounds.height,
    )

    if (
      Math.hypot(
        event.clientX - dragState.startX,
        event.clientY - dragState.startY,
      ) > 5
    ) {
      dragState.moved = true
    }

    project.style.left = `${nextLeft}px`
    project.style.top = `${nextTop}px`
  })

  const finishDrag = (event) => {
    if (!dragState) return
    suppressNextClick = dragState.moved
    dragState = null
    project.classList.remove("is-dragging")
    if (project.hasPointerCapture(event.pointerId)) {
      project.releasePointerCapture(event.pointerId)
    }
  }

  project.addEventListener("pointerup", finishDrag)
  project.addEventListener("pointercancel", finishDrag)
  project.addEventListener("click", (event) => {
    if (!suppressNextClick) return
    event.preventDefault()
    suppressNextClick = false
  })
})

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible")
        revealObserver.unobserve(entry.target)
      }
    }
  },
  { rootMargin: "80px 0px", threshold: 0.08 },
)

document
  .querySelectorAll(".gallery img, .next-project")
  .forEach((element) => revealObserver.observe(element))

const visitCount = document.querySelector("[data-visit-count]")

if (visitCount) {
  fetch("/api/visit", {
    method: "POST",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Visit counter returned ${response.status}`)
      return response.json()
    })
    .then(({ count }) => {
      visitCount.textContent = String(count).padStart(6, "0")
      visitCount.closest(".visitor-counter")?.classList.add("is-counted")
    })
    .catch(() => {
      visitCount.textContent = "OFFLINE"
      visitCount.closest(".visitor-counter")?.classList.add("is-offline")
    })
}

document.querySelectorAll("[data-journal-target]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const journal = tab.closest(".journal-layout")
    if (!journal) return

    journal.querySelectorAll("[data-journal-target]").forEach((item) => {
      const isActive = item === tab
      item.classList.toggle("is-active", isActive)
      item.setAttribute("aria-selected", String(isActive))
    })

    journal.querySelectorAll(".journal-entry").forEach((entry) => {
      const isActive = entry.id === tab.dataset.journalTarget
      entry.classList.toggle("is-active", isActive)
      entry.hidden = !isActive
    })
  })
})

const guestbookMessages = document.querySelector("[data-guestbook-messages]")

const formatMessageDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date)
}

const renderGuestbook = (messages) => {
  if (!guestbookMessages) return
  guestbookMessages.replaceChildren()
  if (!messages.length) {
    const empty = document.createElement("p")
    empty.className = "guestbook-empty"
    empty.textContent = "还没有公开留言，来做第一个留下脚印的人吧 ✦"
    guestbookMessages.append(empty)
    return
  }

  messages.forEach((message) => {
    const card = document.createElement("article")
    card.className = "guestbook-message"
    const header = document.createElement("header")
    const name = document.createElement("strong")
    const time = document.createElement("time")
    const content = document.createElement("p")
    name.textContent = message.name
    time.dateTime = message.createdAt
    time.textContent = formatMessageDate(message.createdAt)
    content.textContent = message.content
    header.append(name, time)
    card.append(header, content)
    guestbookMessages.append(card)
  })
}

const loadGuestbook = () => {
  if (!guestbookMessages) return
  fetch("/api/messages", { headers: { Accept: "application/json" }, cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Guestbook returned ${response.status}`)
      return response.json()
    })
    .then(({ messages }) => renderGuestbook(messages))
    .catch(() => {
      guestbookMessages.innerHTML = '<p class="guestbook-empty">留言簿暂时没有打开，请稍后再试。</p>'
    })
}

loadGuestbook()

document.querySelector("[data-guestbook-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault()
  const form = event.currentTarget
  const button = form.querySelector('button[type="submit"]')
  const status = form.querySelector("[data-guestbook-status]")
  const data = Object.fromEntries(new FormData(form))
  button.disabled = true
  status.textContent = "正在送出……"

  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message)
    form.reset()
    status.textContent = result.message
  } catch (error) {
    status.textContent = error.message || "提交失败，请稍后再试。"
  } finally {
    button.disabled = false
  }
})
