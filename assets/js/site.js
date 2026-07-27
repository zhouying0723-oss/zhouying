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
