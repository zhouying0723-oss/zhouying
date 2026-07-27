import { mkdir, writeFile } from "node:fs/promises"

const root = new URL("../", import.meta.url)

const projects = [
  {
    slug: "la-ou-dort-l-eau",
    title: "Là où dort l’eau",
    description:
      "Somewhere between mountains, the water sleeps. No wind, no sound—only soft light and the memory of curves. This series is a quiet contemplation, an ode to places where silence is finally audible. Minimal, atmospheric, and slow.",
    client: "Sonoran National Park",
    year: "2023",
    type: "Landscape",
    credits: "cottonbro studio",
    thumb: "InDSsIwaET4Hzo7U3wbzyYhxKW0.png",
    images: [
      "InDSsIwaET4Hzo7U3wbzyYhxKW0.png",
      "ewK0gpowDHagcSTLh9n5ZmRUAw.png",
      "lssmRLbGdaGb3jDOF6174i87vo.png",
    ],
    position: ["45%", "44%"],
  },
  {
    slug: "champ-silencieux",
    title: "Champ Silencieux",
    description:
      "Paintings series capturing the timeless essence of the Sonoran Desert through its shifting landscapes. This project explores the subtle relationship between light, iconic geological formations, and the plant life that defines this unique ecosystem. Through a soft and contemplative palette, the series invites reflection on the silent beauty and resilience of these arid lands.",
    client: "Sonoran National Park",
    year: "2025",
    type: "Portrait / Artistic",
    credits: "cottonbro studio",
    thumb: "Lz0GkqBvVyg6iQGL0CbdlqB6hyU.png",
    images: [
      "Lz0GkqBvVyg6iQGL0CbdlqB6hyU.png",
      "62787JApw9Y1sczRHVIzu0zPCc8.png",
      "tI2D5O862GyU5e4Mak2DOby9O3g.png",
    ],
    position: ["27%", "25%"],
  },
  {
    slug: "lisiere",
    title: "Lisière",
    description:
      "Between the lake and the trees, between yesterday and tomorrow. A fleeting memory of childhood, sunlit laughter, and the hush of water.",
    client: "Sonoran National Park",
    year: "2023",
    type: "Painting / Photography",
    credits: "AI generated Images",
    thumb: "E30cz4kMGSKm4LXMkcs72jQU.png",
    images: [
      "E30cz4kMGSKm4LXMkcs72jQU.png",
      "YUPoeAcGRWkcEOWcxTbRDyOjJU.png",
    ],
    position: ["24%", "58%"],
  },
  {
    slug: "elan-brut",
    title: "Élan Brut",
    description:
      "Beneath the towers, six women stand with grace and defiance. Concrete and harsh angles become the stage for bold presence. This series places raw urbanism in contrast with a modern, plural femininity. A celebration of collective elegance, structure, and power.",
    client: "",
    year: "2024",
    type: "Portrait / Artistic",
    credits: "cottonbro studio",
    thumb: "qMTvU6ulbA1BVHM473KDQ1vt4U.png",
    images: [
      "qMTvU6ulbA1BVHM473KDQ1vt4U.png",
      "UUwULhpiMgL0G7F16SBPJu8VVbM.png",
      "BL7EQmyvzBUMDBEgLKWmrN5Y6m0.png",
    ],
    position: ["68%", "59%"],
  },
  {
    slug: "les-silences-miroirs",
    title: "Les Silences Miroirs",
    description:
      "In this mineral desert, every pose becomes a quiet question. Two figures, nearly symmetrical, search for each other without meeting. This series explores the idea of inner mirroring, voiceless echoes, and shared solitude—a visual meditation on duality and the resonance of stillness.",
    client: "",
    year: "2024",
    type: "Portrait / Artistic",
    credits: "cottonbro studio",
    thumb: "gcWvM6xq68ZqMzdzlAH3uEvM.png",
    images: [
      "gcWvM6xq68ZqMzdzlAH3uEvM.png",
      "83wFrKseVdWswbAoCSDg22vmg.png",
      "feOkkzTz1ZHYT7mD3Bd9mxsGnw.png",
      "OrqS24AsNygaDVo0A0FiR15cOfo.png",
    ],
    position: ["66%", "16%"],
  },
  {
    slug: "revolte-douce",
    title: "Révolte douce",
    description:
      "They sit at the edge, wind in their hair, dressed in light tones. Skateboards in hand, gazes steady—neither posing, nor pretending. Révolte Douce is about refusing to choose between attitude and softness. It’s grace in the street, poetry in motion, and style in resistance.",
    client: "Aube Studio (fictional – ethical fashion brand)",
    year: "2024",
    type: "Lookbook / Lifestyle",
    credits: "cottonbro studio",
    thumb: "qMRSv7LxvGO1X9FuBYNgiOjNtU.png",
    images: [
      "qMRSv7LxvGO1X9FuBYNgiOjNtU.png",
      "dUc8IJXnC9Cc85ICHjAivIvwcow.png",
      "LI5KKNXwGq7ssYINIcQuzpLmOk.png",
      "DVv2JXh7HZmMpze4U5TrXfQLMh4.png",
      "UDqVbRE8kUrvtby5EaQ1BgsPC8.png",
    ],
    position: ["75%", "38%"],
  },
]

const documentShell = ({ title, description, assetPrefix, body }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
  <title>${title}</title>
  <link rel="icon" href="${assetPrefix}assets/images/Q0Z0p8LOZhN2hJ2arLjEtkqQD0.png">
  <link rel="stylesheet" href="${assetPrefix}assets/css/site.css">
</head>
<body>
${body}
  <script src="${assetPrefix}assets/js/site.js" defer></script>
</body>
</html>
`

const dockIcon = ({ label, content, attributes = "", className = "" }) => `
      <button class="dock-item ${className}" ${attributes} aria-label="${label}">
        ${content}
        <span class="dock-label">${label}</span>
      </button>`

const homeBody = `<main class="desktop">
  <section class="project-grid" aria-label="Selected projects">
${projects
  .map(
    (project, index) => `    <a
      class="desktop-project"
      href="works/${project.slug}/"
      style="--x:${project.position[0]};--y:${project.position[1]};--delay:${index * 70}ms"
    >
      <img src="assets/images/${project.thumb}" alt="" width="80" height="80">
      <span>${project.title}</span>
    </a>`,
  )
  .join("\n")}
  </section>

  <nav class="dock" aria-label="Quick links">
${dockIcon({
  label: "About Me",
  attributes: 'data-open-window="about"',
  content:
    '<img src="assets/images/kDcQjTOqVphBNghgFUi9K754s.jpg" alt="">',
})}
${dockIcon({
  label: "Notes",
  attributes: 'data-open-window="notes"',
  content:
    '<img src="assets/images/4ar8CL6aUtjymV8jTsXrcPzXCM.svg" alt="">',
})}
${dockIcon({
  label: "Instagram",
  attributes:
    'onclick="window.open(\'https://www.instagram.com/\', \'_blank\', \'noopener\')"',
  className: "dock-social instagram",
  content:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/></svg>',
})}
${dockIcon({
  label: "X",
  attributes:
    'onclick="window.open(\'https://www.x.com/\', \'_blank\', \'noopener\')"',
  className: "dock-social x",
  content:
    '<svg viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M5 4h4.2l3.5 4.7L16.8 4H19l-5.3 6.2L20 20h-4.2l-4-5.4L7.2 20H5l5.8-6.9L5 4Zm3.1 1.6 8.5 12.8h1.3L9.4 5.6H8.1Z"/></svg>',
})}
${dockIcon({
  label: "Behance",
  attributes:
    'onclick="window.open(\'https://www.behance.net/\', \'_blank\', \'noopener\')"',
  className: "dock-social behance",
  content:
    '<svg viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M3 5h7c3 0 4.6 1.5 4.6 3.7 0 1.5-.7 2.6-1.9 3.1 1.7.5 2.6 1.8 2.6 3.6 0 2.7-2 4.6-5.5 4.6H3V5Zm6.4 6c1.5 0 2.3-.6 2.3-1.8 0-1.1-.8-1.7-2.3-1.7H6V11h3.4Zm.3 6.4c1.7 0 2.6-.7 2.6-2.1 0-1.3-.9-2-2.7-2H6v4.1h3.7ZM16 6h5v1.5h-5V6Zm2.7 3c3.1 0 5.3 2.4 5.3 5.8v.7h-7.8c.2 1.5 1.2 2.4 2.7 2.4 1.1 0 1.9-.4 2.5-1.3h2.3c-.7 2.3-2.5 3.7-4.9 3.7-3.1 0-5.2-2.3-5.2-5.6 0-3.4 2-5.7 5.1-5.7Zm2.7 4.4c-.2-1.4-1.2-2.2-2.6-2.2-1.3 0-2.3.8-2.6 2.2h5.2Z"/></svg>',
})}
  </nav>

  <section class="window" data-window="about" role="dialog" aria-label="About Me">
    <header class="window-bar">
      <button class="window-close" aria-label="Close"></button>
      <span class="window-title">About Me</span>
    </header>
    <div class="window-content">
      <h2>Creative direction with a quiet point of view.</h2>
      <p>I build visual stories across photography, art direction and digital experiences.</p>
      <p>This self-hosted portfolio keeps the original macOS-inspired rhythm while running without Framer services.</p>
    </div>
  </section>

  <section class="window" data-window="notes" role="dialog" aria-label="Notes">
    <header class="window-bar">
      <button class="window-close" aria-label="Close"></button>
      <span class="window-title">Notes</span>
    </header>
    <div class="window-content note-lines">
      <h2>Notes</h2>
      <p>Selected observations, references and unfinished thoughts.</p>
      <p>Available for collaborations and thoughtful commissions.</p>
    </div>
  </section>
</main>`

await writeFile(
  new URL("index.html", root),
  documentShell({
    title: "MakOS — Creative Portfolio",
    description: "A macOS-inspired creative portfolio.",
    assetPrefix: "",
    body: homeBody,
  }),
)

for (const [index, project] of projects.entries()) {
  const nextProject = projects[(index + 1) % projects.length]
  const metadata = [
    ["Client", project.client],
    ["Year", project.year],
    ["Project type", project.type],
    ["Credits", project.credits],
  ].filter(([, value]) => value)

  const body = `<main class="work-page">
  <article class="work-shell">
    <a class="back-link" href="../../" aria-label="Back to home">←</a>
    <header class="work-header">
      <h1>${project.title}</h1>
      <p class="work-description">${project.description}</p>
      <dl class="work-meta">
${metadata
  .map(
    ([label, value]) => `        <div>
          <dt>${label}</dt>
          <dd>${value}</dd>
        </div>`,
  )
  .join("\n")}
      </dl>
    </header>
    <section class="gallery" aria-label="${project.title} gallery">
${project.images
  .map(
    (image, imageIndex) =>
      `      <img src="../../assets/images/${image}" alt="${project.title}, image ${imageIndex + 1}" loading="${imageIndex === 0 ? "eager" : "lazy"}">`,
  )
  .join("\n")}
    </section>
    <section class="next-wrap">
      <h2>Next project</h2>
      <a class="next-project" href="../${nextProject.slug}/">
        <img src="../../assets/images/${nextProject.thumb}" alt="">
        <strong>${nextProject.title}</strong>
      </a>
    </section>
  </article>
</main>`

  const outputDirectory = new URL(`works/${project.slug}/`, root)
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(
    new URL("index.html", outputDirectory),
    documentShell({
      title: `${project.title} — MakOS`,
      description: project.description,
      assetPrefix: "../../",
      body,
    }),
  )
}

console.log(`已生成首页和 ${projects.length} 个本地作品页面。`)
