"use client";

import { useActionState } from "react";
import { masukAdmin } from "@/app/admin/actions";

export function FormMasukAdmin() {
  const [state, formAction, pending] = useActionState(masukAdmin, undefined);
  return (
    <form action={formAction} className="bg-permukaan border border-kakao/10 rounded-xl p-6 space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">Login admin</h1>
      <p className="text-sm text-teks2">
        Ruang admin terpisah dari akun pelanggan. Akun pelanggan ditolak di sini.
      </p>
      {state?.error && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 text-error px-4 py-3 text-sm">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email admin</label>
        <input id="email" name="email" type="email" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">Kata sandi</label>
        <input id="password" name="password" type="password" required className="w-full min-h-11 rounded-lg border border-kakao/25 px-3 py-2" />
      </div>
      <button disabled={pending} className="w-full min-h-11 rounded-lg bg-kakao text-kanvas font-medium py-3 disabled:opacity-50">
        {pending ? "Memeriksa…" : "Masuk admin"}
      </button>
    </form>
  );
}
