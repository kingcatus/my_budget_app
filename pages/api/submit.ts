import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { income, needs, wants, savings } = req.body;

    try {
      const entry = await prisma.budgetEntry.create({
        data: {
          income: parseFloat(income),
          needs: parseFloat(needs),
          wants: parseFloat(wants),
          savings: parseFloat(savings),
        },
      });

      res.status(200).json(entry);
    } catch (error) {
      console.error("❌ Error saving budget:", error);
      res.status(500).json({ error: "Failed to save budget entry" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
