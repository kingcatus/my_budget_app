import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { income, needs, wants, savings } = req.body;
    const incomeNum = parseFloat(income);

    try {
      // Calculate suggested budget using 50/30/20 rule
      const suggested = {
        needs: {
          total: incomeNum * 0.5,
          breakdown: {
            food: incomeNum * 0.15,      // 15% of income
            rent: incomeNum * 0.25,      // 25% of income
            utilities: incomeNum * 0.10   // 10% of income
          }
        },
        wants: {
          total: incomeNum * 0.3,
          breakdown: {
            uber: incomeNum * 0.10,      // 10% of income
            clothes: incomeNum * 0.10,    // 10% of income
            entertainment: incomeNum * 0.10 // 10% of income
          }
        },
        savings: {
          total: incomeNum * 0.2,
          breakdown: {
            invest: incomeNum * 0.10,     // 10% of income
            emergency: incomeNum * 0.05,  // 5% of income
            goals: incomeNum * 0.05       // 5% of income
          }
        }
      };

      // Calculate actual values
      const actual = {
        needs: {
          total: parseFloat(needs),
          breakdown: {
            food: parseFloat(req.body.food),
            rent: parseFloat(req.body.rent),
            utilities: parseFloat(req.body.utilities)
          }
        },
        wants: {
          total: parseFloat(wants),
          breakdown: {
            uber: parseFloat(req.body.uber),
            clothes: parseFloat(req.body.clothes),
            entertainment: parseFloat(req.body.entertainment)
          }
        },
        savings: {
          total: parseFloat(savings),
          breakdown: {
            invest: parseFloat(req.body.invest),
            emergency: parseFloat(req.body.emergency),
            goals: parseFloat(req.body.goals)
          }
        }
      };

      // Calculate differences
      const comparison = {
        needsDiff: actual.needs.total - suggested.needs.total,
        wantsDiff: actual.wants.total - suggested.wants.total,
        savingsDiff: actual.savings.total - suggested.savings.total
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
