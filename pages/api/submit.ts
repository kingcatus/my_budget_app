import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { income, needs, wants, savings } = req.body;
    const incomeNum = parseFloat(income);

    try {
      // Calculate suggested budget using 50/30/20 rule
      const suggested = {
        needs: incomeNum * 0.5,
        wants: incomeNum * 0.3,
        savings: incomeNum * 0.2
      };

      // Calculate actual values
      const actual = {
        needs: parseFloat(needs),
        wants: parseFloat(wants),
        savings: parseFloat(savings)
      };

      // Calculate differences
      const comparison = {
        needsDiff: actual.needs - suggested.needs,
        wantsDiff: actual.wants - suggested.wants,
        savingsDiff: actual.savings - suggested.savings
      };

      res.status(200).json({
        suggested,
        actual,
        comparison
      });
    } catch (error) {
      console.error("❌ Error processing budget:", error);
      res.status(500).json({ error: "Failed to process budget" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
