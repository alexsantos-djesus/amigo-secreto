// pages/api/groups/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { generateToken } from "../../../lib/tokens";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { name, adminParticipates } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    const adminToken = generateToken("adm_");
    const group = await prisma.group.create({
      data: {
        name,
        adminToken,
        adminParticipates: !!adminParticipates
      }
    });
    await prisma.log.create({ data: { groupId: group.id, action: "group_created", payload: JSON.stringify({ adminParticipates }) } });
    return res.status(201).json({
      id: group.id,
      adminToken,
      adminUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/${adminToken}`
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
