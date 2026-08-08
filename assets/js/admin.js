const loginSection = document.querySelector("[data-login]")
const loginForm = document.querySelector("[data-login-form]")
const loginStatus = document.querySelector("[data-login-status]")
const panel = document.querySelector("[data-panel]")
const messageList = document.querySelector("[data-admin-messages]")
const logoutButton = document.querySelector("[data-logout]")
const pendingCount = document.querySelector("[data-pending-count]")
let password = sessionStorage.getItem("guestbookAdminPassword") || ""
let messages = []
let filter = "pending"

const authHeader = () => `Basic ${btoa(`admin:${password}`)}`
const formatDate = (value) => new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Shanghai",
}).format(new Date(value))

const render = () => {
  const pending = messages.filter((item) => item.status === "pending").length
  if (pendingCount) {
    pendingCount.textContent = String(pending)
    pendingCount.hidden = pending === 0
  }
  messageList.replaceChildren()
  const visible = filter === "all" ? messages : messages.filter((item) => item.status === filter)
  if (!visible.length) {
    const empty = document.createElement("p")
    empty.className = "empty"
    empty.textContent = filter === "pending" ? "现在没有待审核留言 ✦" : "这里还没有留言"
    messageList.append(empty)
    return
  }

  visible.forEach((message) => {
    const card = document.createElement("article")
    card.className = "admin-message"
    const header = document.createElement("header")
    const name = document.createElement("strong")
    const meta = document.createElement("span")
    const content = document.createElement("p")
    const actions = document.createElement("div")
    name.textContent = message.name
    meta.className = "status-pill"
    meta.textContent = `${formatDate(message.createdAt)} · ${message.status}`
    content.textContent = message.content
    actions.className = "review-actions"
    if (message.status !== "approved") actions.append(makeAction("approve", "通过", message.id))
    if (message.status !== "rejected") actions.append(makeAction("reject", "拒绝", message.id))
    header.append(name, meta)
    card.append(header, content, actions)
    messageList.append(card)
  })
}

const makeAction = (action, label, id) => {
  const button = document.createElement("button")
  button.type = "button"
  button.dataset.action = action
  button.dataset.id = id
  button.textContent = label
  return button
}

const loadMessages = async () => {
  const response = await fetch("/api/admin/messages", {
    headers: { Authorization: authHeader(), Accept: "application/json" },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(response.status === 401 ? "密码不正确" : "后台暂时无法连接")
  const result = await response.json()
  messages = result.messages
  sessionStorage.setItem("guestbookAdminPassword", password)
  loginSection.hidden = true
  panel.hidden = false
  logoutButton.hidden = false
  render()
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault()
  password = new FormData(loginForm).get("password")
  loginStatus.textContent = "正在登录……"
  try {
    await loadMessages()
  } catch (error) {
    loginStatus.textContent = error.message
  }
})

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button))
    render()
  })
})

messageList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]")
  if (!button) return
  button.disabled = true
  try {
    const response = await fetch(`/api/admin/messages/${button.dataset.id}/${button.dataset.action}`, {
      method: "POST",
      headers: { Authorization: authHeader(), Accept: "application/json" },
    })
    if (!response.ok) throw new Error("操作失败")
    await loadMessages()
  } catch (error) {
    button.disabled = false
    window.alert(error.message)
  }
})

logoutButton.addEventListener("click", () => {
  password = ""
  sessionStorage.removeItem("guestbookAdminPassword")
  panel.hidden = true
  logoutButton.hidden = true
  loginSection.hidden = false
  loginForm.reset()
  loginStatus.textContent = "密码仅保存在当前浏览器标签页中。"
})

if (password) loadMessages().catch(() => sessionStorage.removeItem("guestbookAdminPassword"))
