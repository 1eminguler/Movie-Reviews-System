// VITE_USE_MOCK=true iken istekleri tarayıcıda yakalayıp demo verisiyle yanıtlar.
// Demo verisi ve MSW yalnızca bu modda yüklenir; normal derlemede ana pakete girmez.
export async function startMockWorker(): Promise<void> {
  const [{ setupWorker }, { createHandlers }, data] = await Promise.all([
    import('msw/browser'),
    import('./handlers.ts'),
    import('./demo-data.json'),
  ])
  const worker = setupWorker(...createHandlers(data.default as Parameters<typeof createHandlers>[0]))
  await worker.start({ quiet: true })
}
