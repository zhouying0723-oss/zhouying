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
