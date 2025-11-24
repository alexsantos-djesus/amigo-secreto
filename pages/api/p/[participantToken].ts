// pages/api/p/[participantToken].ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { participantToken } = req.query;
  if (!participantToken || typeof participantToken !== "string") return res.status(400).json({ error: "participantToken required" });

  if (req.method === "GET") {
    const me = await prisma.participant.findUnique({ where: { participantToken }, include: { group: true } });
    if (!me) return res.status(404).json({ error: "Not found" });
    const group = me.group;
    if (!group) return res.status(404).json({ error: "Group not found" });

    const response: any = {
      drawDone: group.drawDone,
      me: {
        id: me.id,
        name: me.name,
        whatsapp: me.whatsapp,
        gift1: me.gift1,
        gift2: me.gift2,
        gift3: me.gift3
      }
    };
    if (group.drawDone && me.drawnTargetId) {
      const target = await prisma.participant.findUnique({ where: { id: me.drawnTargetId } });
      response.me.drawnTarget = target ? { name: target.name, whatsapp: target.whatsapp, gift1: target.gift1, gift2: target.gift2, gift3: target.gift3 } : null;
    }
    return res.json(response);
  }
  return res.status(405).json({ error: "Method not allowed" });
}
