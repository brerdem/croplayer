// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import { promises as fs } from "fs";
import { spawn } from "child_process";
const sharp = require("sharp");
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: false,
  },
};

type Data = {
  message: string;
  data?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const id = uuidv4();

  const data: any = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  const removeBg = (readPath: string, writePath: string) => {
    return new Promise((resolve, reject) => {
      const remove = spawn(
        "/Users/burak/Library/Python/3.7/bin/backgroundremover",
        ["-i", readPath, "-wn", "5", "-gb", "5", "-o", writePath]
      );

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
    const imageFile = data.files.image; // .image because I named it in client side by that name: // pictureData.append('image', pictureFile);
    const imagePath = imageFile.filepath;
    const tempImage = `temp/${id}.png`; // include name and .extention, you can get the name from data.files.image object
    const tempImageRemoved = `temp/${id}_removed.png`; // include name and .extention, you can get the name from data.files.image object
    await sharp(imagePath)
      .resize({
        width: 380,
        height: 380,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFile(tempImage);
    const cwd = process.cwd();
    const readPath = cwd + "/" + tempImage;
    const writePath = cwd + "/" + tempImageRemoved;
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

  //res.status(200).json({ message: "John Doe" });
}
