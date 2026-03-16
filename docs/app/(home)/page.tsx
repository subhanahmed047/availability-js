import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-3xl font-bold mb-4">availability-js</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
        Client-side calendar availability with weekly schedules, date overrides, and bookings.
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/docs"
          className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:opacity-90"
        >
          Documentation
        </Link>
        <Link
          href="https://www.npmjs.com/package/availability-js"
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          View on npm
        </Link>
      </div>
    </div>
  );
}
