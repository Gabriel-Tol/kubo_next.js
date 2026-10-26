"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { daftar } from "@/app/actions";

export function FormDaftar({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(daftar, undefined);
  const [pw, setPw] = useState("");
  const [lihat, setLihat] = useState(false);
  const pendek = pw.length > 0 && pw.length < 8;

  return (
    <form action={formAction} className="bg-permukaan border border-kakao/10 rounded-xl p-6 space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">Buat akun</h1>
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-1">
          Nama lengkap
        </label>
        <input id="fullName" name="fullName" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Nomor HP (10–15 digit)
        </label>
        <input id="phone" name="phone" inputMode="numeric" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input id="email" name="email" type="email" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Kata sandi (min. 8 karakter)
        </label>
        <div className="flex gap-2">
          <input
            id="password"
            name="password"
            type={lihat ? "text" : "password"}
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2"
            aria-describedby="pw-bantu"
          />
          <button
            type="button"
            onClick={() => setLihat((x) => !x)}
            className="min-h-11 rounded-lg border border-kakao/25 px-3 text-sm"
          >
            {lihat ? "Sembunyi" : "Tampil"}
          </button>
        </div>
        <p id="pw-bantu" className={`text-sm mt-1 ${pendek ? "text-error" : "text-teks2"}`}>
          {pendek ? "Kata sandi minimal 8 karakter" : `${pw.length} karakter`}
        </p>
      </div>
      <label className="flex items-start gap-2 text-sm min-h-11">
        <input type="checkbox" name="setuju" value="ya" required className="mt-3" />
        <span className="py-2">
          Saya setuju data nama, HP, email, dan alamat dipakai untuk memproses pesanan saya.
        </span>
      </label>
      <button
        disabled={pending || pendek}
        className="w-full min-h-11 rounded-lg bg-aksen text-white font-medium py-3 disabled:opacity-50"
      >
        {pending ? "Membuat akun…" : "Buat akun"}
      </button>
      <p className="text-sm text-teks2">
        Sudah punya akun?{" "}
        <Link href={`/masuk${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline text-aksen">
          Masuk
        </Link>
      </p>
    </form>
  );
}
