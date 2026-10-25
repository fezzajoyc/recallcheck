import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-[13px] font-semibold uppercase tracking-widest text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Record not found</h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] text-ink/65">
        We only publish pages for real official recall records — this URL isn&rsquo;t one of them.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/latest" className="rounded-lg border border-ink/15 bg-white px-4 py-2 text-[14px] font-semibold hover:border-ink/40">Latest recalls</Link>
        <Link href="/" className="rounded-lg bg-ink px-4 py-2 text-[14px] font-semibold text-white hover:bg-ink/85">Home</Link>
      </div>
    </div>
  )
}
