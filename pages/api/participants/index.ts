// pages/api/participants/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { generateToken } from "../../../lib/tokens";

function normalizeWhatsapp(w: string) {
  // naive normalization: remove non-digits, ensure starts with country code
  const digits = w.replace(/\D/g, "");
  return digits;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { participantToken, adminToken, name, whatsapp, gift1, gift2, gift3 } = req.body;
  try {
    if (participantToken) {
      // participant accesses by token => find group automatically
      const existing = await prisma.participant.findUnique({ where: { participantToken } });
      if (!existing) return res.status(404).json({ error: "Invalid participant token" });
      // update details
      const wNormalized = normalizeWhatsapp(whatsapp || "");
      const updated = await prisma.participant.update({
        where: { participantToken },
        data: { name, whatsapp: wNormalized, gift1, gift2, gift3 }
      });
      await prisma.log.create({ data: { groupId: updated.groupId, action: "participant_updated", payload: JSON.stringify({ id: updated.id }) } });
      return res.json({ ok: true });
    } else if (adminToken && req.body.groupId) {
      // alternative flows (not used)...
      return res.status(400).json({ error: "Use participantToken to register" });
    } else {
      // join via group admin token (create placeholder)
      const { groupId } = req.body;
      if (!groupId) return res.status(400).json({ error: "groupId required" });
      // create participant and generate token to send via admin
      const participantToken = generateToken("p_");
      const newP = await prisma.participant.create({
        data: { groupId, name: name ?? "Convidado", whatsapp: whatsapp ? normalizeWhatsapp(whatsapp) : "", participantToken }
      });
      await prisma.log.create({ data: { groupId, action: "participant_created", payload: JSON.stringify({ id: newP.id }) } });
      return res.status(201).json({ participantToken, url: `${process.env.NEXT_PUBLIC_BASE_URL}/p/${participantToken}` });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
