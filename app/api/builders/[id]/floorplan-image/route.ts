import { Binary, ObjectId } from "mongodb";

import { getDb } from "@/app/mongodb";

type StoredImage = {
  data: Binary | Uint8Array;
  contentType: string;
  size: number;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return new Response("Image not found", { status: 404 });
  }

  const db = await getDb();
  const listing = await db
    .collection<{ floorplanImage?: StoredImage }>("builders")
    .findOne(
      { _id: new ObjectId(id) },
      { projection: { floorplanImage: 1 } },
    );

  const image = listing?.floorplanImage;

  if (!image) {
    return new Response("Image not found", { status: 404 });
  }

  const bytes = image.data instanceof Binary ? image.data.buffer : image.data;
  const body = Uint8Array.from(bytes).buffer;

  return new Response(body, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
