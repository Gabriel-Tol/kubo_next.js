"use client";

import { useActionState } from "react";
import Link from "next/link";
import { masuk } from "@/app/actions";

export function FormMasuk({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(masuk, undefined);
  return (
    <form action={formAction} className="bg-permukaan border border-kakao/10 rounded-xl p-6 space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">Masuk</h1>
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2"
        />
      </div>
      <button
        disabled={pending}
        className="w-full min-h-11 rounded-lg bg-aksen text-atas font-medium py-3 disabled:opacity-50"
      >
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
      <p className="text-sm text-teks2">
        Belum punya akun?{" "}
        <Link href={`/daftar${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline text-aksen">
          Daftar di sini
        </Link>
        . Admin masuk lewat{" "}
        <Link href="/admin/masuk" className="underline">
          halaman admin
        </Link>
        .
      </p>
    </form>
  );
}
