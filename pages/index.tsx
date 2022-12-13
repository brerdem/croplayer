import Head from "next/head";
import styles from "../styles/Home.module.css";
import { FileUploader } from "react-drag-drop-files";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Lottie from "lottie-react";
import loadingAnimation from "../public/loading.json";
import { toast } from "react-toastify";

export default function Home() {
  const fileTypes = ["JPG", "PNG"];
  const [original, setOriginal] = useState("");
  const [model, setModel] = useState("u2net");
  const [removed, setRemoved] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [secs, setSecs] = useState(0);
  const timerInterval: { current: NodeJS.Timer | number | null } = useRef(null);

  const readFileAsync = (blob: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = function () {
        resolve(reader.result);
      };
      reader.onerror = reject;
    });
  };

  const handleChange = async (modelVal: string, file?: File) => {
    setSecs(0);
    timerInterval.current = setInterval(() => setSecs((s) => s + 1), 1000);
    let base64Data = "";

    if (file) {
      const buffer = await file.arrayBuffer();
      var arrayBufferView = new Uint8Array(buffer);
      var blob = new Blob([arrayBufferView], { type: "image/png" });
      base64Data = (await readFileAsync(blob)) as string;
      base64Data = base64Data.replace("data:image/png;base64,", "");

      setOriginal(base64Data);
    } else {
      base64Data = original;
    }

    setRemoved(null);
    setLoading(true);

    try {
      const res = await axios({
        method: "post",
        url: "/api/remove",
        data: {
          str: base64Data,
          model: modelVal,
        },
      });
      setRemoved(res.data.data);
    } catch (error: any) {
      console.log("error :>> ", error);
      toast.error(error.response.data ? error.response.data : error.message);
    }
    setLoading(false);
    clearInterval(timerInterval.current as NodeJS.Timeout);
  };

  const changeModel = (val: string) => {
    setModel(val);
    if (original != "") {
      handleChange(val);
    }
  };

  useEffect(() => {
    return () => clearInterval(timerInterval.current as NodeJS.Timeout);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Crop Layer Alternatif Test</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h2 className={styles.heading}>Crop Layer Alternatif Test</h2>
        <h3>{secs}s</h3>
        <div className={styles.model}>
          <span style={{ fontWeight: "bold", marginRight: 10 }}>Model: </span>
          <select title="Model" onChange={(e) => changeModel(e.target.value)}>
            <option value={"u2net"}>u2net</option>
            <option value={"u2netp"}>u2netp</option>
          </select>
        </div>

        <div className={styles.row}>
          <div>
            <h4>Orjinal</h4>
            <div className={styles.card}>
              {original !== "" && (
                <img
                  src={`data:image/png;base64,${original}`}
                  width={380}
                  height={380}
                  style={{
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          </div>

          <div>
            <h4>Arkaplansız</h4>
            <div className={styles.card}>
              {loading && (
                <Lottie
                  animationData={loadingAnimation}
                  style={{
                    width: 200,
                    height: 200,
                  }}
                />
              )}

              {removed && (
                <img
                  width={380}
                  height={380}
                  src={`data:image/png;base64,${removed}`}
                  style={{
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <FileUploader
          label="Buraya tıklayıp fotoğraf seçin ya da sürükleyip bırakın"
          hoverTitle="Buraya sürükleyin"
          handleChange={(file: File) => handleChange(model, file)}
          name="file"
          types={fileTypes}
          classes={styles.dropZone}
        />
      </main>
    </div>
  );
}
