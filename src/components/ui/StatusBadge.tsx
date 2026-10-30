import { STATUS } from "@/lib/services/order-status";

const WARNA: Record<string, string> = {
  [STATUS.MENUNGGU]: "bg-kanvas text-teks2 border-kakao/30",
  [STATUS.DIKONFIRMASI]: "bg-kakao text-kanvas border-kakao",
  [STATUS.DIPROSES]: "bg-kakao/10 text-kakao border-kakao/30",
  [STATUS.SIAP]: "bg-aksen/10 text-aksen border-aksen/40",
  [STATUS.DIANTAR]: "bg-aksen/10 text-aksen border-aksen/40",
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
