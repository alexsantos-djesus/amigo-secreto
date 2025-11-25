// pages/api/participants/index.ts  (adicione logs e erro JSON)
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { generateToken } from "../../../lib/tokens";

function normalizeWhatsapp(w: string) {
  const digits = (w || "").replace(/\D/g, "");
  return digits;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const {
      participantToken,
      adminToken,
      name,
      whatsapp,
      gift1,
      gift2,
      gift3,
      groupId,
    } = req.body;
    // debug log
    console.info("[api/participants] body:", {
      participantToken,
      adminToken,
      name,
      whatsapp,
      gift1,
      gift2,
      gift3,
      groupId,
    });

    if (participantToken) {
      const existing = await prisma.participant.findUnique({
        where: { participantToken },
      });
      if (!existing)
        return res.status(404).json({ error: "Invalid participant token" });

      const wNormalized = normalizeWhatsapp(
        whatsapp || existing.whatsapp || ""
      );
      const updated = await prisma.participant.update({
        where: { participantToken },
        data: { name, whatsapp: wNormalized, gift1, gift2, gift3 },
      });
      await prisma.log.create({
        data: {
          groupId: updated.groupId,
          action: "participant_updated",
          payload: JSON.stringify({ id: updated.id }),
        },
      });
      return res.json({ ok: true, participant: { id: updated.id } });
    } else {
      if (!groupId)
        return res
          .status(400)
          .json({ error: "groupId required to create participant" });
      const participantTokenNew = generateToken("p_");
      const newP = await prisma.participant.create({
        data: {
          groupId,
          name: name ?? "",
          whatsapp: whatsapp ? normalizeWhatsapp(whatsapp) : "",
          participantToken: participantTokenNew,
        },
      });
      await prisma.log.create({
        data: {
          groupId,
          action: "participant_created",
          payload: JSON.stringify({ id: newP.id }),
        },
      });
      return res
        .status(201)
        .json({
          participantToken: participantTokenNew,
          url: `${
            process.env.NEXT_PUBLIC_BASE_URL || ""
          }/p/${participantTokenNew}`,
        });
    }
  } catch (err: any) {
    console.error("[api/participants] ERROR:", err);
    // Return the message (safe for local debugging). In production consider hiding details.
    return res
      .status(500)
      .json({ error: err?.message || "Internal Server Error" });
  }
}
