import React, { useState } from "react";
import { fabric } from "fabric";
import { GoogleGenerativeAI } from "@google/generative-ai";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { FiDownload, FiStar } from "react-icons/fi";

// ------------------------------------------------------
// GEMINI API INIT
// ------------------------------------------------------
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const safeSplit = (txt) =>
  txt
    .replace(/\*/g, "")
    .replace(/-/g, "")
    .split(/\n|,/)
    .map((x) => x.trim())
    .filter(Boolean);

// ------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------
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

  const [creatives, setCreatives] = useState({
    facebook: null,
    instagram: null,
    display: null,
  });

  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------
  // UPLOAD HANDLER
  // ------------------------------------------------------
  const onDrop = (files, field) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setAssets((p) => ({ ...p, [field]: e.target.result }));
      toast.success(`${field} uploaded`);
    };
    reader.readAsDataURL(files[0]);
  };

  const UploadBox = ({ field, label }) => {
    const { getRootProps, getInputProps } = useDropzone({
      onDrop: (f) => onDrop(f, field),
    });

    return (
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-teal-500 p-6 rounded-lg bg-teal-50 hover:bg-teal-100 cursor-pointer text-center transition"
      >
        <input {...getInputProps()} />
        <div className="text-3xl mb-2">📁</div>
        <p className="font-semibold">{label}</p>
        {assets[field] && <p className="text-green-600 text-sm">✓ Uploaded</p>}
      </div>
    );
  };

  // ------------------------------------------------------
  // AI GENERATION FUNCTIONS
  // ------------------------------------------------------

  const generateHeadlines = async () => {
    if (!campaign.headline) return toast.error("Enter a headline first!");
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const output = await model.generateContent(
        `Write 3 short ad headlines under 32 characters for: "${campaign.headline}".`
      );

      const lines = safeSplit(output.response.text());
      setAi((p) => ({ ...p, headlines: lines.slice(0, 3) }));
    } catch {
      setAi((p) => ({
        ...p,
        headlines: [
          `${campaign.headline} — Limited Time`,
          `Get ${campaign.headline} Today`,
          `Exclusive: ${campaign.headline}`,
        ],
      }));
    }

    toast.success("Generated!");
    setLoading(false);
  };

  const generateLayouts = async () => {
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const output = await model.generateContent(
        `Suggest 4 clean retail ad layouts.`
      );

      const lines = safeSplit(output.response.text());
      setAi((p) => ({ ...p, layouts: lines.slice(0, 4) }));
    } catch {
      setAi((p) => ({
        ...p,
        layouts: [
          "Logo top-left, product center",
          "Centered layout, text bottom",
          "Product left, text right",
          "Premium floating layout",
        ],
      }));
    }

    toast.success("Layouts ready!");
    setLoading(false);
  };

  const generateBackgrounds = async () => {
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const output = await model.generateContent(
        `Give 4 professional gradient color combos.`
      );

      const lines = safeSplit(output.response.text());
      setAi((p) => ({ ...p, backgrounds: lines.slice(0, 4) }));
    } catch {
      setAi((p) => ({
        ...p,
        backgrounds: [
          "Sunset: #ff6b6b → #ffe66d",
          "Ocean: #0891B2 → #06B6D4",
          "Forest: #059669 → #10B981",
          "Purple: #7C3AED → #A78BFA",
        ],
      }));
    }

    toast.success("Backgrounds generated!");
    setLoading(false);
  };

  // ------------------------------------------------------
  // CANVAS RENDER FIXED
  // ------------------------------------------------------
  const renderCreative = (format, width, height) =>
    new Promise((resolve) => {
      const c = new fabric.Canvas(document.createElement("canvas"), {
        width,
        height,
      });

      c.setBackgroundColor(
        new fabric.Gradient({
          coords: { x1: 0, y1: 0, x2: width, y2: height },
          colorStops: [
            { offset: 0, color: assets.brandColor },
            { offset: 1, color: "#ffffff" },
          ],
        }),
        c.renderAll.bind(c)
      );

      let loaded = 0;
      const done = () => {
        loaded++;
        if (loaded === 2) {
          setCreatives((p) => ({
            ...p,
            [format]: c.toDataURL("image/png"),
          }));
          resolve();
        }
      };

      // PRODUCT
      fabric.Image.fromURL(
        assets.packshot,
        (img) => {
          img.scaleToWidth(width * 0.45);
          img.set({ left: width * 0.28, top: height * 0.22 });
          c.add(img);
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
          c.add(img);
          done();
        },
        { crossOrigin: "anonymous" }
      );

      // Headline
      const head = new fabric.Text(campaign.headline, {
        top: height * 0.72,
        left: width * 0.05,
        fontSize: 40,
        fill: "white",
        fontWeight: "bold",
      });
      c.add(head);

      // CTA
      if (campaign.cta.trim() !== "") {
        c.add(
          new fabric.Text(campaign.cta, {
            top: height * 0.84,
            left: width * 0.05,
            fill: "#ffd700",
            fontWeight: "bold",
            fontSize: 24,
          })
        );
      }
    });

  // ------------------------------------------------------
  // GENERATE ALL CREATIVES
  // ------------------------------------------------------
  const generateCreatives = async () => {
    if (!assets.packshot || !assets.logo)
      return toast.error("Upload packshot and logo.");
    if (!campaign.headline) return toast.error("Enter a headline.");

    setLoading(true);

    await Promise.all([
      renderCreative("facebook", 1080, 1080),
      renderCreative("instagram", 1080, 1920),
      renderCreative("display", 1200, 628),
    ]);

    setStep(3);
    setLoading(false);
  };

  // ------------------------------------------------------
  // UI STEP COMPONENTS
  // ------------------------------------------------------

  const Step1 = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">
        📁 Step 1 — Upload Assets
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <UploadBox field="packshot" label="Product Image (Packshot)" />
        <UploadBox field="logo" label="Brand Logo" />
      </div>

      <div className="bg-white p-4 rounded shadow">
        <label className="font-semibold">Brand Color</label>
        <div className="flex items-center gap-4 mt-2">
          <input
            type="color"
            value={assets.brandColor}
            onChange={(e) =>
              setAssets((p) => ({ ...p, brandColor: e.target.value }))
            }
            className="w-16 h-16 rounded"
          />
          <span className="text-gray-700">{assets.brandColor}</span>
        </div>
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!assets.packshot || !assets.logo}
        className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold"
      >
        Continue →
      </button>
    </div>
  );

  const Step2 = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">
        ✍️ Step 2 — Campaign Details & AI
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <input
          placeholder="Headline (max 32)"
          maxLength={32}
          value={campaign.headline}
          onChange={(e) =>
            setCampaign((p) => ({ ...p, headline: e.target.value }))
          }
          className="border p-3 rounded"
        />
        <input
          placeholder="CTA (max 18)"
          maxLength={18}
          value={campaign.cta}
          onChange={(e) =>
            setCampaign((p) => ({ ...p, cta: e.target.value }))
          }
          className="border p-3 rounded"
        />
      </div>

      {/* AI Tools */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl text-white space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FiStar /> AI Tools
        </h3>

        <button
          onClick={generateHeadlines}
          className="w-full bg-white text-purple-700 py-2 rounded font-bold"
        >
          ✍️ Generate Headlines
        </button>

        {ai.headlines.length > 0 && (
          <div className="bg-white bg-opacity-20 p-3 rounded space-y-1">
            {ai.headlines.map((h, i) => (
              <p
                key={i}
                className="cursor-pointer hover:bg-white hover:bg-opacity-20 p-2 rounded"
                onClick={() =>
                  setCampaign((p) => ({ ...p, headline: h }))
                }
              >
                • {h}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={generateLayouts}
          className="w-full bg-white text-purple-700 py-2 rounded font-bold"
        >
          🎯 Auto Layout Suggestions
        </button>

        {ai.layouts.length > 0 && (
          <div className="bg-white bg-opacity-20 p-3 rounded space-y-1">
            {ai.layouts.map((l, i) => (
              <p key={i}>• {l}</p>
            ))}
          </div>
        )}

        <button
          onClick={generateBackgrounds}
          className="w-full bg-white text-purple-700 py-2 rounded font-bold"
        >
          🎨 Generate Backgrounds
        </button>

        {ai.backgrounds.length > 0 && (
          <div className="bg-white bg-opacity-20 p-3 rounded space-y-1">
            {ai.backgrounds.map((b, i) => (
              <p key={i}>• {b}</p>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={generateCreatives}
        className="w-full bg-gradient-to-r from-teal-600 to-blue-600 py-3 text-white rounded-lg font-bold"
      >
        🎨 Generate Creatives
      </button>

      <button onClick={() => setStep(1)} className="border p-3 rounded w-full">
        ← Back
      </button>
    </div>
  );

  const Step3 = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">
        👁️ Step 3 — Preview & Download
      </h2>

      <div className="grid grid-cols-3 gap-6">
        {["facebook", "instagram", "display"].map((f) => (
          <div key={f} className="bg-white shadow rounded overflow-hidden">
            <div className="aspect-square bg-gray-100">
              {creatives[f] && (
                <img
                  src={creatives[f]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <button
              className="w-full bg-teal-600 text-white py-3 font-bold flex items-center justify-center gap-2 hover:bg-teal-700"
              onClick={() => {
                const a = document.createElement("a");
                a.href = creatives[f];
                a.download = f + ".png";
                a.click();
              }}
            >
              <FiDownload /> Download
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => setStep(2)} className="border p-3 rounded w-full">
        ← Back
      </button>
    </div>
  );

  // ------------------------------------------------------
  // MAIN LAYOUT
  // ------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto p-10 grid grid-cols-4 gap-8">
        {/* LEFT SIDEBAR */}
        <div className="bg-white p-6 rounded shadow h-fit">
          <h3 className="font-bold text-xl mb-4 text-gray-800">Progress</h3>

          {[1, 2, 3].map((n) => (
            <div
              key={n}
              onClick={() => setStep(n)}
              className={`p-3 mb-2 rounded cursor-pointer font-semibold ${
                step === n
                  ? "bg-teal-600 text-white"
                  : step > n
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Step {n}
            </div>
          ))}
        </div>

        {/* MAIN PANEL */}
        <div className="col-span-3 bg-white p-8 rounded-lg shadow-lg">
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
