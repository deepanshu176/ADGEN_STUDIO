import React, { useState, useRef } from "react";
import { fabric } from "fabric";
import { GoogleGenerativeAI } from "@google/generative-ai";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  FiDownload,
  FiCheck,
  FiX,
  FiStar
} from "react-icons/fi";

// -----------------------------
// GEMINI INITIALIZATION FIXED
// -----------------------------
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

const safeSplit = (text) => {
  return text
    .replace(/\*/g, "")
    .replace(/-/g, "")
    .split(/\n|,/)
    .map((l) => l.trim())
    .filter(Boolean);
};

const AdGenStudio = () => {
  const [step, setStep] = useState(1);

  const [assets, setAssets] = useState({
    packshot: null,
    logo: null,
    brandColor: "#21808d",
  });

  const [campaign, setCampaign] = useState({
    headline: "",
    cta: "",
    theme: "Clean",
    tone: "Professional",
  });

  const [ai, setAi] = useState({
    headlines: [],
    layouts: [],
    backgrounds: [],
  });

  const [loading, setLoading] = useState(false);

  const [creatives, setCreatives] = useState({
    facebook: null,
    instagram: null,
    display: null,
  });

  const [compliance, setCompliance] = useState(null);

  // -----------------------------
  // FILE UPLOAD HANDLER
  // -----------------------------
  const onDrop = (files, field) => {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setAssets((prev) => ({ ...prev, [field]: e.target.result }));
      toast.success(`${field} uploaded!`);
    };
    reader.readAsDataURL(file);
  };

  const UploadBox = ({ label, field }) => {
    const { getRootProps, getInputProps } = useDropzone({
      onDrop: (f) => onDrop(f, field),
    });

    return (
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-teal-500 rounded-lg bg-teal-50 p-6 cursor-pointer hover:bg-teal-100 transition text-center"
      >
        <input {...getInputProps()} />
        <div className="text-3xl mb-2">📁</div>
        <p className="font-semibold">{label}</p>
        {assets[field] && (
          <p className="text-green-600 text-sm mt-1">✓ Uploaded</p>
        )}
      </div>
    );
  };

  // -----------------------------
  // AI GENERATION FUNCTIONS
  // -----------------------------

  const generateHeadlines = async () => {
    if (!campaign.headline) return toast.error("Enter a headline first!");
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(
        `Write 3 ad headlines under 32 characters for: "${campaign.headline}".`
      );

      const lines = safeSplit(result.response.text());
      setAi((p) => ({ ...p, headlines: lines.slice(0, 3) }));
      toast.success("Headlines ready!");
    } catch {
      setAi((p) => ({
        ...p,
        headlines: [
          `${campaign.headline} - Limited Time`,
          `Get Your ${campaign.headline} Today`,
          `Exclusive: ${campaign.headline}`,
        ],
      }));
      toast.success("Headlines ready!");
    }
    setLoading(false);
  };

  const generateLayouts = async () => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent(
        `Suggest 4 retail ad layouts for theme ${campaign.theme}.`
      );

      const lines = safeSplit(result.response.text());
      setAi((p) => ({ ...p, layouts: lines.slice(0, 4) }));
      toast.success("Layouts ready!");
    } catch {
      setAi((p) => ({
        ...p,
        layouts: [
          "Logo top-left, product center",
          "Product center, title bottom",
          "Product left, text right",
          "Premium floating layout",
        ],
      }));
    }
    setLoading(false);
  };

  const generateBackgrounds = async () => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent(
        `Give 4 creative gradient colors for theme ${campaign.theme}.`
      );

      const lines = safeSplit(result.response.text());
      setAi((p) => ({ ...p, backgrounds: lines.slice(0, 4) }));
      toast.success("Background ideas ready!");
    } catch {
      setAi((p) => ({
        ...p,
        backgrounds: [
          "Sunset: #ff6b6b → #ffe66d",
          "Ocean: #0891B2 → #06B6D4",
          "Forest: #059669 → #10B981",
          "Purple Glow: #7C3AED → #A78BFA",
        ],
      }));
    }
    setLoading(false);
  };

  // -----------------------------
  // CANVAS RENDER FIXED VERSION
  // -----------------------------

  const renderCreative = (format, width, height) => {
    return new Promise((resolve) => {
      const canvas = new fabric.Canvas(document.createElement("canvas"), {
        width,
        height,
      });

      // Background gradient
      canvas.setBackgroundColor(
        new fabric.Gradient({
          coords: { x1: 0, y1: 0, x2: width, y2: height },
          colorStops: [
            { offset: 0, color: assets.brandColor },
            { offset: 1, color: "#ffffff" },
          ],
        }),
        canvas.renderAll.bind(canvas)
      );

      let loaded = 0;
      const done = () => {
        loaded++;
        if (loaded === 2) {
          setCreatives((p) => ({
            ...p,
            [format]: canvas.toDataURL("image/png"),
          }));
          resolve();
        }
      };

      // PRODUCT
      fabric.Image.fromURL(
        assets.packshot,
        (img) => {
          img.scaleToWidth(width * 0.45);
          img.set({ left: width * 0.27, top: height * 0.22 });
          canvas.add(img);
          done();
        },
        { crossOrigin: "anonymous" }
      );

      // LOGO
      fabric.Image.fromURL(
        assets.logo,
        (img) => {
          img.scaleToWidth(width * 0.15);
          img.set({ left: 20, top: 20 });
          canvas.add(img);
          done();
        },
        { crossOrigin: "anonymous" }
      );

      // 🎯 Headline
      const head = new fabric.Text(campaign.headline, {
        left: width * 0.05,
        top: height * 0.7,
        fontSize: 40,
        fontWeight: "bold",
        fill: "#fff",
      });
      canvas.add(head);

      // CTA
      if (campaign.cta) {
        const cta = new fabric.Text(campaign.cta, {
          left: width * 0.05,
          top: height * 0.82,
          fontSize: 22,
          fontWeight: "bold",
          fill: "#ffd700",
        });
        canvas.add(cta);
      }
    });
  };

  // -----------------------------
  // MAIN CREATIVE GENERATION
  // -----------------------------
  const generateCreatives = async () => {
    if (!assets.packshot || !assets.logo)
      return toast.error("Upload packshot & logo first!");
    if (!campaign.headline)
      return toast.error("Enter headline first!");

    setLoading(true);

    await Promise.all([
      renderCreative("facebook", 1080, 1080),
      renderCreative("instagram", 1080, 1920),
      renderCreative("display", 1200, 628),
    ]);

    setStep(3);
    setLoading(false);
    toast.success("Creatives ready!");
  };

  // -----------------------------
  // STEP SCREENS
  // -----------------------------

  const Step1 = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">📁 Step 1 — Upload Assets</h2>

      <div className="grid grid-cols-2 gap-6">
        <UploadBox label="Product Image (Packshot)" field="packshot" />
        <UploadBox label="Brand Logo" field="logo" />
      </div>

      <div className="bg-white p-4 rounded shadow">
        <label className="font-semibold">Brand Color</label>
        <div className="flex gap-4 items-center mt-2">
          <input
            type="color"
            value={assets.brandColor}
            onChange={(e) =>
              setAssets((p) => ({ ...p, brandColor: e.target.value }))
            }
            className="w-16 h-16"
          />
          <p>{assets.brandColor}</p>
        </div>
      </div>

      <button
        className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold"
        disabled={!assets.packshot || !assets.logo}
        onClick={() => setStep(2)}
      >
        Continue →
      </button>
    </div>
  );

  const Step2 = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">✍️ Step 2 — Campaign Details & AI</h2>

      <div className="grid grid-cols-2 gap-6">
        <input
          className="border p-3 rounded"
          placeholder="Headline (max 32)"
          maxLength={32}
          value={campaign.headline}
          onChange={(e) =>
            setCampaign((p) => ({ ...p, headline: e.target.value }))
          }
        />
        <input
          className="border p-3 rounded"
          placeholder="CTA (max 18)"
          maxLength={18}
          value={campaign.cta}
          onChange={(e) =>
            setCampaign((p) => ({ ...p, cta: e.target.value }))
          }
        />
      </div>

      {/* AI Tools */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl text-white space-y-6">

        <h3 className="text-xl font-bold flex items-center gap-2">
          <FiStar /> AI Tools
        </h3>

        <button
          onClick={generateHeadlines}
          className="w-full bg-white text-purple-700 py-3 rounded-lg font-bold shadow hover:bg-purple-50"
        >
          ✍️ Generate Headlines
        </button>

        {ai.headlines.length > 0 && (
          <div className="bg-white bg-opacity-20 rounded p-3">
            {ai.headlines.map((h, i) => (
              <div
                key={i}
                onClick={() =>
                  setCampaign((p) => ({ ...p, headline: h }))
                }
                className="cursor-pointer hover:bg-white hover:bg-opacity-20 p-2 rounded"
              >
                • {h}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={generateLayouts}
          className="w-full bg-white text-purple-700 py-3 rounded-lg font-bold shadow hover:bg-purple-50"
        >
          🎯 Auto Layout Suggestions
        </button>

        {ai.layouts.length > 0 && (
          <ul className="bg-white bg-opacity-20 rounded p-3 space-y-1">
            {ai.layouts.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        )}

        <button
          onClick={generateBackgrounds}
          className="w-full bg-white text-purple-700 py-3 rounded-lg font-bold shadow hover:bg-purple-50"
        >
          🎨 Generate Backgrounds
        </button>

        {ai.backgrounds.length > 0 && (
          <ul className="bg-white bg-opacity-20 rounded p-3 space-y-1">
            {ai.backgrounds.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        )}
      </div>

      <button
        className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 rounded-lg font-bold"
        onClick={generateCreatives}
      >
        🎨 Generate Creatives
      </button>

      <button
        className="border p-3 rounded w-full"
        onClick={() => setStep(1)}
      >
        ← Back
      </button>
    </div>
  );

  const Step3 = () => (
    <div className="space-y-6">

      <h2 className="text-3xl font-bold">👁️ Step 3 — Preview & Download</h2>

      <div className="grid grid-cols-3 gap-6">
        {["facebook", "instagram", "display"].map((f) => (
          <div key={f} className="bg-white rounded shadow overflow-hidden">
            <div className="aspect-square bg-gray-100">
              <img
                src={creatives[f]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = creatives[f];
                a.download = f + ".png";
                a.click();
              }}
              className="w-full bg-teal-600 text-white py-3 font-bold hover:bg-teal-700"
            >
              <FiDownload /> Download
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setStep(2)}
        className="border p-3 rounded w-full"
      >
        ← Back
      </button>
    </div>
  );

  // -----------------------------
  // RENDER MAIN UI
  // -----------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-gray-800">
      <Toaster />

      <div className="max-w-7xl mx-auto p-10 grid grid-cols-4 gap-8">

        {/* SIDEBAR */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h3 className="font-bold text-xl mb-4">Progress</h3>

          {[1, 2, 3].map((n) => (
            <div
              key={n}
              onClick={() => setStep(n)}
              className={`p-3 rounded-lg cursor-pointer mb-2 ${
                step === n
                  ? "bg-teal-600 text-white"
                  : step > n
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100"
              }`}
            >
              Step {n}
            </div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="col-span-3 bg-white rounded-lg shadow p-8">
          <AnimatePresence mode="wait">
            {step === 1 && <Step1 />}
            {step === 2 && <Step2 />}
            {step === 3 && <Step3 />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdGenStudio;
