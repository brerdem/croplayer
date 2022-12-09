// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { spawn } from "child_process";
import { promises as fs } from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
const sharp = require("sharp");

type Data = {
  message: string;
  data?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const id = uuidv4();

  const model = req.body.model ?? "u2net";

  //console.log("process.env.PATH :>> ", process.env.PATH);

  const removeBg = (readPath: string, writePath: string) => {
    return new Promise((resolve, reject) => {
      const remove = spawn("rembg", ["i", "-m", model, readPath, writePath]);

      remove.on("error", (error) => {
        console.log(`error: ${error.message}`);
        reject(error);
      });

      remove.on("close", async (code) => {
        console.log(`child process exited with code ${code}`);
        resolve(code);
      });
    });
  };

  try {
    const imageStr = req.body.str;
    const tempImage = `public/${id}.png`; // include name and .extention, you can get the name from data.files.image object
    const tempImageRemoved = `public/${id}_removed.png`; // include name and .extention, you can get the name from data.files.image object
    await sharp(Buffer.from(imageStr, "base64"))
      .resize({
        width: 380,
        height: 380,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFile(tempImage);
    const cwd = process.cwd();
    const readPath = tempImage;
    const writePath = tempImageRemoved;
    console.log("cwd :>> ", cwd);

    try {
      const code = await removeBg(readPath, writePath);
      const data = await fs.readFile(tempImageRemoved, {
        encoding: "base64",
      });

      if (data) {
        await fs.unlink(tempImage);
        await fs.unlink(tempImageRemoved);
      }

      res.status(200).json({
        message: "ok",
        data,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
    return;
  }
}
