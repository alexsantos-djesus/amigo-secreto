// pages/api/groups/[adminToken].ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { runDraw } from "../../../lib/draw";
import { generateToken } from "../../../lib/tokens";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { adminToken } = req.query;
  if (!adminToken || typeof adminToken !== "string") return res.status(400).json({ error: "adminToken required" });

  if (req.method === "GET") {
    // admin panel
    const group = await prisma.group.findUnique({ where: { adminToken } });
    if (!group) return res.status(404).json({ error: "Group not found" });
    const participants = await prisma.participant.findMany({ where: { groupId: group.id }, select: { id: true, name: true, whatsapp: true, participantToken: true, createdAt: true } });
    return res.json({
      id: group.id,
      name: group.name,
      adminParticipates: group.adminParticipates,
      drawDone: group.drawDone,
      drawAt: group.drawAt,
      participants: participants.map((p) => ({ id: p.id, name: p.name, whatsapp: p.whatsapp ? "hidden" : null, participantToken: p.participantToken, createdAt: p.createdAt }))
    });
  }

  if (req.method === "POST") {
    const action = req.query.action || (req.body && req.body.action);
    const group = await prisma.group.findUnique({ where: { adminToken } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (action === "send-link") {
      // body: participantId OR send to all
      const { participantId } = req.body;
      if (participantId === "all") {
        const participants = await prisma.participant.findMany({ where: { groupId: group.id } });
        return res.json({ message: "ok", urls: participants.map((p) => `${process.env.NEXT_PUBLIC_BASE_URL}/p/${p.participantToken}`) });
      } else if (participantId) {
        const p = await prisma.participant.findUnique({ where: { id: participantId } });
        if (!p) return res.status(404).json({ error: "Participant not found" });
        return res.json({ url: `${process.env.NEXT_PUBLIC_BASE_URL}/p/${p.participantToken}` });
      } else {
        return res.status(400).json({ error: "participantId required or 'all'" });
      }
    }

    if (action === "draw") {
      if (group.drawDone) return res.status(400).json({ error: "Already drawn" });
      const participantsCount = await prisma.participant.count({ where: { groupId: group.id } });
      if (participantsCount < 2) return res.status(400).json({ error: "Not enough participants" });
      try {
        const result = await runDraw(group.id);
        return res.json({ ok: true, ...result });
      } catch (err: any) {
        console.error(err);
        await prisma.log.create({ data: { groupId: group.id, action: "draw_failed", payload: err.message } });
        return res.status(500).json({ error: "Draw failed", detail: err.message });
      }
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
