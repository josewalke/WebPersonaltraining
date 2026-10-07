function scrollProgress(scrollTop: number, scrollHeight: number, clientHeight: number) {
  const max = scrollHeight - clientHeight
  return max <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / max))
}

function setScrollP(el: HTMLElement, p: number) {
  el.style.setProperty('--scroll-p', p.toFixed(3))
}

/** Tinte ember → volt en barras de panel y en el scroll principal. */
export function bindPanelScrollTint(root: ParentNode = document): () => void {
  let panelFrame = 0
  let pending: HTMLElement | null = null
  let pageFrame = 0

  const syncPanel = (el: HTMLElement) => {
    setScrollP(el, scrollProgress(el.scrollTop, el.scrollHeight, el.clientHeight))
  }

  const syncPage = () => {
    const el = document.documentElement
    setScrollP(el, scrollProgress(window.scrollY, el.scrollHeight, el.clientHeight))
  }

  const onPanelScroll = (event: Event) => {
    const target = event.target
    if (!(target instanceof HTMLElement) || !target.classList.contains('panel-scroll')) return
    pending = target
    if (panelFrame) return
    panelFrame = requestAnimationFrame(() => {
      panelFrame = 0
      if (pending) syncPanel(pending)
      pending = null
    })
  }

  const onPageScroll = () => {
    if (pageFrame) return
    pageFrame = requestAnimationFrame(() => {
      pageFrame = 0
      syncPage()
    })
  }

  root.addEventListener('scroll', onPanelScroll, { capture: true, passive: true })
  window.addEventListener('scroll', onPageScroll, { passive: true })
  window.addEventListener('resize', onPageScroll, { passive: true })
  syncPage()

  return () => {
    root.removeEventListener('scroll', onPanelScroll, true)
    window.removeEventListener('scroll', onPageScroll)
    window.removeEventListener('resize', onPageScroll)
    if (panelFrame) cancelAnimationFrame(panelFrame)
    if (pageFrame) cancelAnimationFrame(pageFrame)
  }
}
