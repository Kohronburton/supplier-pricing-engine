import { z } from "zod";

export const quoteRequestSchema = z.object({
  supplier: z.enum(["alpha", "beta", "gamma"]),
  product: z.enum([
    "roller-shade",
    "solar-shade",
    "roman-shade",
    "cellular-shade",
    "zebra-shade",
  ]),
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  fabric: z.enum(["standard", "premium", "blackout"]),
  controlType: z.enum(["manual", "motorized", "smart"]),
  options: z
    .array(z.enum(["cassette", "valance", "side-channel"]))
    .default([]),
  targetMargin: z.coerce.number().gt(0).lt(1).optional(),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
