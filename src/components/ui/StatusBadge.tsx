import { STATUS } from "@/lib/services/order-status";

const WARNA: Record<string, string> = {
  [STATUS.MENUNGGU]: "bg-amber-100 text-amber-900 border-amber-300",
  [STATUS.DIKONFIRMASI]: "bg-blue-100 text-blue-900 border-blue-300",
  [STATUS.DIPROSES]: "bg-kakao/10 text-kakao border-kakao/30",
  [STATUS.SIAP]: "bg-emerald-100 text-emerald-900 border-emerald-300",
  [STATUS.DIANTAR]: "bg-emerald-100 text-emerald-900 border-emerald-300",
  [STATUS.SELESAI]: "bg-sukses/15 text-sukses border-sukses/40",
  [STATUS.BATAL]: "bg-error/10 text-error border-error/40",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        WARNA[status] ?? "bg-kanvas text-teks2 border-kakao/20"
      }`}
    >
      {status}
    </span>
  );
}
