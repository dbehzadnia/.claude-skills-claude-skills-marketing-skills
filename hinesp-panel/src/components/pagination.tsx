import Link from "next/link";
import { toFaDigits } from "@/lib/digits";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pageCount: number;
  /** Current search params; `page` is replaced in each link. */
  searchParams: Record<string, string | string[] | undefined>;
  basePath: string;
  paramName?: string;
};

export function Pagination({ page, pageCount, searchParams, basePath, paramName = "page" }: Props) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === paramName || v === undefined) continue;
      if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
      else sp.set(k, v);
    }
    sp.set(paramName, String(p));
    return `${basePath}?${sp.toString()}`;
  };
  const linkCls = "rounded-md border px-3 py-1 text-sm hover:bg-muted";
  return (
    <nav className="mt-4 flex items-center justify-center gap-2" aria-label="صفحه‌بندی">
      {page > 1 ? (
        <Link className={linkCls} href={href(page - 1)}>
          قبلی
        </Link>
      ) : (
        <span className={cn(linkCls, "opacity-40")}>قبلی</span>
      )}
      <span className="text-sm text-muted-foreground">
        صفحه {toFaDigits(page)} از {toFaDigits(pageCount)}
      </span>
      {page < pageCount ? (
        <Link className={linkCls} href={href(page + 1)}>
          بعدی
        </Link>
      ) : (
        <span className={cn(linkCls, "opacity-40")}>بعدی</span>
      )}
    </nav>
  );
}
