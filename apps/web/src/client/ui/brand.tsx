import Link from 'next/link';

export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link className="c-brand" href={href}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo.svg" alt="" width={40} height={40} />
      <span>
        My <b>Baby</b> Shower
      </span>
    </Link>
  );
}
