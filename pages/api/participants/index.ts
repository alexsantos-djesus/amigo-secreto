// pages/api/participants/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { generateToken } from "../../../lib/tokens";
import { v4 as uuidv4 } from "uuid";

function normalizeWhatsapp(w?: string | null) {
  if (!w) return "";
  return String(w).replace(/\D/g, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    } = req.body as {
      participantToken?: string;
      adminToken?: string;
      name?: string;
      whatsapp?: string | null;
      gift1?: string | null;
      gift2?: string | null;
      gift3?: string | null;
      groupId?: string;
    };

    // Debug log for request body (useful in dev)
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

    // ----- UPDATE FLOW (participant opens unique link and submits form) -----
    if (participantToken) {
      const existing = await prisma.participant.findUnique({
        where: { participantToken },
      });

      if (!existing) {
        return res.status(404).json({ error: "Invalid participant token" });
      }

      // Normalize incoming whatsapp (if any)
      const wNormalized = normalizeWhatsapp(whatsapp ?? existing.whatsapp);

      // If there's a non-empty whatsapp being set, check conflict with other participants in same group
      if (wNormalized) {
        const conflict = await prisma.participant.findFirst({
          where: {
            groupId: existing.groupId,
            whatsapp: wNormalized,
            NOT: { id: existing.id },
          },
        });
        if (conflict) {
          return res.status(409).json({
            error:
              "Número de WhatsApp já cadastrado por outro participante neste grupo. Use outro número ou peça ao admin para remover o cadastro duplicado.",
          });
        }
      }

      const updated = await prisma.participant.update({
        where: { participantToken },
        data: {
          name: name ?? existing.name,
          whatsapp: wNormalized ?? existing.whatsapp,
          gift1: gift1 ?? existing.gift1,
          gift2: gift2 ?? existing.gift2,
          gift3: gift3 ?? existing.gift3,
        },
      });

      // minimal audit log
      try {
        await prisma.log.create({
          data: {
            groupId: updated.groupId,
            action: "participant_updated",
            payload: JSON.stringify({ id: updated.id }),
          },
        });
      } catch (logErr) {
        console.warn("[api/participants] failed to create log:", logErr);
      }

      return res.json({ ok: true, participant: { id: updated.id } });
    }

    // ----- CREATE PLACEHOLDER FLOW (admin requests generation of participant link) -----
    // require groupId to create placeholder
    if (!groupId) {
      return res.status(400).json({ error: "groupId required to create participant" });
    }

    // generate a token prefixed with p_
    const participantTokenNew = generateToken ? generateToken("p_") : `p_${uuidv4().replace(/-/g, "")}`;

    // Use a unique placeholder for whatsapp so UNIQUE(groupId, whatsapp) won't conflict
    const placeholderWhatsapp = `placeholder_${participantTokenNew}`;

    // If caller provided a whatsapp in the creation request and it's valid, normalize and check for conflicts
    const providedWhatsappNormalized = normalizeWhatsapp(whatsapp);
    if (providedWhatsappNormalized) {
      const conflictOnCreate = await prisma.participant.findFirst({
        where: { groupId, whatsapp: providedWhatsappNormalized },
      });
      if (conflictOnCreate) {
        return res.status(409).json({
          error:
            "O número de WhatsApp fornecido já pertence a outro participante deste grupo. Não foi possível criar link com esse número.",
        });
      }
    }

    // Create placeholder participant row. Use placeholder whatsapp to avoid unique index collisions.
    const newP = await prisma.participant.create({
      data: {
        groupId,
        name: name ?? "",
        whatsapp: providedWhatsappNormalized || placeholderWhatsapp,
        participantToken: participantTokenNew,
      },
    });

    try {
      await prisma.log.create({
        data: {
          groupId,
          action: "participant_created",
          payload: JSON.stringify({ id: newP.id }),
        },
      });
    } catch (logErr) {
      console.warn("[api/participants] failed to create log:", logErr);
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    return res.status(201).json({
      participantToken: participantTokenNew,
      url: `${base}/p/${participantTokenNew}`,
    });
  } catch (err: any) {
    console.error("[api/participants] ERROR:", err);
    // In production you may want to hide err.message
    return res.status(500).json({ error: err?.message || "Internal Server Error" });
  }
}