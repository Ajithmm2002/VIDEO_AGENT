import { ImageResponse } from "next/og";

const SIZES: Record<string, { size: number; maskable: boolean }> = {
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  "512-maskable": { size: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: key } = await params;
  const spec = SIZES[key];
  if (!spec) return new Response("Not found", { status: 404 });
  const { size, maskable } = spec;
  // Maskable icons keep the mark inside the central safe zone (80%), on a full-bleed background.
  const mark = Math.round(size * (maskable ? 0.5 : 0.62));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: maskable ? "#7c3aed" : "transparent",
        }}
      >
        <div
          style={{
            width: maskable ? mark : size,
            height: maskable ? mark : size,
            borderRadius: maskable ? 0 : Math.round(size * 0.22),
            background: "#7c3aed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: Math.round(mark * 0.46),
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          CS
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
