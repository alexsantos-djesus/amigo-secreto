// lib/draw.ts
import prisma from "./prisma";
import crypto from "crypto";

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.randomInt(0, i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export async function runDraw(groupId: string, maxAttempts = 1000) {
  const participants = await prisma.participant.findMany({ where: { groupId }, select: { id: true } });
  const n = participants.length;
  if (n === 0) throw new Error("No participants");
  if (n === 1) throw new Error("Need at least 2 participants");
  const ids = participants.map((p) => p.id);

  // Special: if n === 2 allow swap (but warn caller). We'll allow.
  let attempts = 0;
  let success = false;
  let perm: string[] = [];

  while (attempts < maxAttempts && !success) {
    perm = [...ids];
    shuffle(perm);
    success = true;
    for (let i = 0; i < n; i++) {
      if (perm[i] === ids[i]) {
        success = false;
        break;
      }
    }
    attempts++;
  }

  if (!success) throw new Error("Failed to find valid draw after attempts");

  // persist in transaction
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < n; i++) {
      const participantId = ids[i];
      const targetId = perm[i];
      await tx.participant.update({
        where: { id: participantId },
        data: { drawnTargetId: targetId }
      });
    }
    await tx.group.update({ where: { id: groupId }, data: { drawDone: true, drawAt: new Date() } });
    await tx.log.createMany({
      data: [{ groupId, action: "draw_executed", payload: `attempts=${attempts}` }]
    });
  });
  return { attempts, n };
}
