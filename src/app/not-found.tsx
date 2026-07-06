import Link from 'next/link';

export default function RootNotFound() {
  return (
    <html lang="en"><body style={{ fontFamily: 'system-ui', padding: '4rem', textAlign: 'center' }}>
      <h1>404 — Page not found</h1>
      <Link href="/en">Back home</Link>
    </body></html>
  );
}
