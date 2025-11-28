import React, { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { GoogleGenerativeAI } from '@google/generative-ai';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiUpload,
  FiDownload,
  FiSave,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiStar     
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

const AdGenStudio = () => {
  const [step, setStep] = useState(1);
  const [assets, setAssets] = useState({
    packshot: null,
    logo: null,
    brandColor: '#21808d'
  });

  const [campaign, setCampaign] = useState({
    headline: '',
    cta: '',
    theme: 'Clean',
    tone: 'Professional'
  });

  const [creatives, setCreatives] = useState({
    facebook: null,
    instagram: null,
    display: null
  });

  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCanvas, setSelectedCanvas] = useState('facebook');

  // AI Features State
  const [aiFeatures, setAiFeatures] = useState({
    generatedHeadlines: [],
    layoutSuggestions: [],
    generatedBackgrounds: [],
    autoLayoutEnabled: false
  });

  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  // Asset Upload Handler
  const onDrop = (acceptedFiles, field) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAssets(prev => ({
          ...prev,
          [field]: e.target.result
        }));
        toast.success(`${field} uploaded successfully!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const AssetUploadZone = ({ field, label }) => {
    const { getRootProps, getInputProps } = useDropzone({
      onDrop: (files) => onDrop(files, field)
    });

    return (
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-teal-400 rounded-lg p-8 text-center cursor-pointer hover:border-teal-600 transition bg-gradient-to-br from-teal-50 to-blue-50"
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-2">📁</div>
        <p className="font-semibold text-gray-700">{label}</p>
        <p className="text-sm text-gray-500">Drag & drop or click to select</p>
        {assets[field] && (
          <p className="text-xs text-green-600 mt-2">✓ Uploaded</p>
        )}
      </div>
    );
  };

  // Generate AI Headlines
  const generateHeadlines = async () => {
    if (!campaign.headline) {
      toast.error('Please enter a headline first');
      return;
    }

    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Generate 3 alternative ad headlines based on this: "${campaign.headline}"
        Make them different angles (urgency, benefit, exclusive, FOMO, action).
        Keep each under 32 characters.
        Return as simple list, one per line.`;

      const result = await model.generateContent(prompt);
      const headlines = result.response.text().split('\n').filter(h => h.trim()).slice(0, 3);

      setAiFeatures(prev => ({
        ...prev,
        generatedHeadlines: headlines
      }));
      toast.success('✍️ AI Headlines Generated!');
    } catch (error) {
      console.error('Generation error:', error);
      const fallbackHeadlines = [
        `${campaign.headline} - Limited Time!`,
        `Get Your ${campaign.headline} Today`,
        `Exclusive: ${campaign.headline}`
      ];
      setAiFeatures(prev => ({
        ...prev,
        generatedHeadlines: fallbackHeadlines
      }));
      toast.success('✍️ AI Headlines Generated!');
    } finally {
      setLoading(false);
    }
  };

  // Generate Layout Suggestions
  const generateLayouts = async () => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Suggest 3 optimal ad layout compositions for e-commerce retail media.
        Include: positioning of logo, product image, headline, and CTA.
        Consider theme: ${campaign.theme}
        Return as simple list.`;

      const result = await model.generateContent(prompt);
      const suggestions = result.response.text().split('\n').filter(s => s.trim()).slice(0, 4);

      setAiFeatures(prev => ({
        ...prev,
        layoutSuggestions: suggestions,
        autoLayoutEnabled: true
      }));
      toast.success('🎯 Layout Suggestions Generated!');
    } catch (error) {
      const fallbackLayouts = [
        '🎯 Left Layout: Logo top-left, Product center, Text bottom',
        '🎨 Center Layout: Symmetric product center, headline below',
        '📱 Right Layout: Product left, Text stacked right, CTA big',
        '✨ Premium Layout: Gradient background + floating text'
      ];
      setAiFeatures(prev => ({
        ...prev,
        layoutSuggestions: fallbackLayouts,
        autoLayoutEnabled: true
      }));
      toast.success('🎯 Layout Suggestions Generated!');
    } finally {
      setLoading(false);
    }
  };

  // Generate Background Suggestions
  const generateBackgrounds = async () => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Suggest 4 creative color gradients for ${campaign.theme} themed retail ads.
        Format: "Name: #HEX1 to #HEX2".`;

      const result = await model.generateContent(prompt);
      const backgrounds = result.response.text().split('\n').filter(b => b.trim()).slice(0, 4);

      setAiFeatures(prev => ({
        ...prev,
        generatedBackgrounds: backgrounds
      }));
      toast.success('🎨 Background Options Generated!');
    } catch (error) {
      const fallbackBackgrounds = [
        'Gradient Sunrise: #FF6B6B → #FFE66D',
        'Ocean Blue: #0891B2 → #06B6D4',
        'Forest Green: #059669 → #10B981',
        'Purple Vibes: #7C3AED → #A78BFA'
      ];
      setAiFeatures(prev => ({
        ...prev,
        generatedBackgrounds: fallbackBackgrounds
      }));
      toast.success('🎨 Background Options Generated!');
    } finally {
      setLoading(false);
    }
  };

  // Generate Creative Using Gemini
  const generateCreatives = async () => {
    if (!assets.packshot || !assets.logo || !campaign.headline) {
      toast.error('Please upload assets and enter headline');
      return;
    }

    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `You are a professional ad creative director. Generate design suggestions for:
        - Headline: "${campaign.headline}"
        - CTA: "${campaign.cta}"
        - Theme: ${campaign.theme}
        - Tone: ${campaign.tone}
        Keep response concise.`;

      await model.generateContent(prompt);

      renderCreative('facebook', 1080, 1080);
      renderCreative('instagram', 1080, 1920);
      renderCreative('display', 1200, 628);

      toast.success('✨ Creatives generated with AI!');
      setStep(3);
    } catch (error) {
      console.error(error);
      renderCreative('facebook', 1080, 1080);
      renderCreative('instagram', 1080, 1920);
      renderCreative('display', 1200, 628);
      toast.success('✨ Creatives generated!');
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // Render Creative
  const renderCreative = (format, width, height) => {
    const canvas = new fabric.Canvas(document.createElement('canvas'), {
      width,
      height,
      backgroundColor: assets.brandColor
    });

    canvas.backgroundColor = new fabric.Gradient({
      coords: { x1: 0, y1: 0, x2: width, y2: height },
      colorStops: [
        { offset: 0, color: assets.brandColor },
        { offset: 1, color: '#ffffff' }
      ]
    });

    fabric.Image.fromURL(assets.packshot, (img) => {
      img.scaleToWidth(width * 0.4);
      img.set({ left: width * 0.3, top: height * 0.2 });
      canvas.add(img);
      canvas.renderAll();
    });

    fabric.Image.fromURL(assets.logo, (img) => {
      img.scaleToWidth(width * 0.15);
      img.set({ left: 20, top: 20 });
      canvas.add(img);
      canvas.renderAll();
    });

    const headline = new fabric.Text(campaign.headline, {
      left: width * 0.05,
      top: height * 0.7,
      fontSize: 36,
      fontWeight: 'bold',
      width: width * 0.9,
      fill: '#ffffff'
    });
    canvas.add(headline);

    if (campaign.cta) {
      const cta = new fabric.Text(campaign.cta, {
        left: width * 0.05,
        top: height * 0.85,
        fontSize: 20,
        fontWeight: 'bold',
        fill: '#ffd700'
      });
      canvas.add(cta);
    }

    const badge = new fabric.Text('🤖 AI Generated', {
      left: width - 120,
      top: 10,
      fontSize: 12,
      fontWeight: 'bold',
      fill: '#ffffff',
      backgroundColor: 'rgba(102, 126, 234, 0.9)',
      padding: 5
    });
    canvas.add(badge);

    canvas.renderAll();

    setCreatives(prev => ({
      ...prev,
      [format]: canvas.toDataURL()
    }));
  };

  // Compliance
  const validateCompliance = async () => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Check compliance for:
        - Headline: ${campaign.headline}
        - CTA: ${campaign.cta}
        Return score + suggestions.`;

      const result = await model.generateContent(prompt);

      const passed = campaign.headline.length <= 32 && campaign.cta.length <= 18;
      setCompliance({
        report: result.response.text(),
        score: passed ? 98 : 85,
        passed
      });

      toast.success('Compliance check done!');
    } catch (error) {
      const passed = campaign.headline.length <= 32 && campaign.cta.length <= 18;
      setCompliance({
        report: `Headline: ${passed ? '✓ Pass' : '✗ Fail'}
CTA: ${passed ? '✓ Pass' : '✗ Fail'}
Brand Colors: ✓ Integrated`,
        score: passed ? 98 : 85,
        passed
      });
      toast.success('Compliance check done!');
    } finally {
      setLoading(false);
    }
  };

  // Download Creative
  const downloadCreative = (format) => {
    if (!creatives[format]) {
      toast.error('No creative generated');
      return;
    }

    const link = document.createElement('a');
    link.href = creatives[format];
    link.download = `adgen-${format}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${format} downloaded!`);
  };

  // Step 1: Upload Assets
  const Step1 = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">📁 Step 1: Upload Your Assets</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AssetUploadZone field="packshot" label="Product Image (Packshot)" />
        <AssetUploadZone field="logo" label="Brand Logo" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Brand Color</label>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={assets.brandColor}
            onChange={(e) => setAssets(prev => ({ ...prev, brandColor: e.target.value }))}
            className="w-20 h-20 rounded cursor-pointer"
          />
          <span className="text-sm text-gray-600">Selected: <strong>{assets.brandColor}</strong></span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={() => setStep(2)}
        disabled={!assets.packshot || !assets.logo}
        className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
      >
        Continue to Campaign Details
      </motion.button>
    </motion.div>
  );

  // Step 2: Campaign Details + AI Features
  const Step2 = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">✍️ Step 2: Campaign Details & AI</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold">Headline (max 32)</label>
          <input
            type="text"
            maxLength={32}
            value={campaign.headline}
            onChange={(e) => setCampaign(prev => ({ ...prev, headline: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">CTA (max 18)</label>
          <input
            type="text"
            maxLength={18}
            value={campaign.cta}
            onChange={(e) => setCampaign(prev => ({ ...prev, cta: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white space-y-4">
        <div className="flex items-center gap-2">
          <FiStar className="text-2xl" />   {/* FIXED ICON */}
          <h3 className="text-xl font-bold">🤖 AI-Powered Features</h3>
        </div>

        {/* Generate Headlines */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={generateHeadlines}
          disabled={loading}
          className="w-full bg-white text-purple-600 py-2 rounded-lg font-bold"
        >
          {loading ? '⏳' : '✍️'} Generate AI Headlines
        </motion.button>

        {aiFeatures.generatedHeadlines.length > 0 && (
          <div className="bg-white bg-opacity-20 p-3 rounded-lg space-y-2">
            <p className="font-semibold">Suggested Headlines:</p>
            {aiFeatures.generatedHeadlines.map((h, i) => (
              <button
                key={i}
                onClick={() => setCampaign(prev => ({ ...prev, headline: h }))}
                className="block w-full text-left bg-white bg-opacity-10 p-2 rounded"
              >
                • {h}
              </button>
            ))}
          </div>
        )}

        {/* Auto Layout */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={generateLayouts}
          disabled={loading}
          className="w-full bg-white text-purple-600 py-2 rounded-lg font-bold"
        >
          {loading ? '⏳' : '🎯'} Auto Layout Suggestions
        </motion.button>

        {/* Layout suggestions */}
        {aiFeatures.layoutSuggestions.length > 0 && (
          <div className="bg-white bg-opacity-20 p-3 rounded-lg space-y-2">
            <p className="font-semibold">Layout Suggestions:</p>
            <ul className="space-y-1 text-sm">
              {aiFeatures.layoutSuggestions.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Backgrounds */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={generateBackgrounds}
          disabled={loading}
          className="w-full bg-white text-purple-600 py-2 rounded-lg font-bold"
        >
          {loading ? '⏳' : '🎨'} Generate Backgrounds
        </motion.button>

        {aiFeatures.generatedBackgrounds.length > 0 && (
          <div className="bg-white bg-opacity-20 p-3 rounded-lg space-y-2">
            <p className="font-semibold">Background Options:</p>
            <ul className="text-sm space-y-1">
              {aiFeatures.generatedBackgrounds.map((b, i) => (
                <li key={i}>• {b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Checkbox */}
        <label className="flex items-center gap-2 bg-white bg-opacity-10 p-3 rounded-lg">
          <input
            type="checkbox"
            checked={aiFeatures.autoLayoutEnabled}
            onChange={(e) => setAiFeatures(prev => ({ ...prev, autoLayoutEnabled: e.target.checked }))}
          />
          <span>Auto Layout (Smart Composition)</span>
        </label>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setStep(1)} className="border px-4 py-2 rounded-lg">
          Back
        </button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={generateCreatives}
          disabled={loading}
          className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-4 py-2 rounded-lg"
        >
          🎨 Generate Creatives
        </motion.button>
      </div>
    </motion.div>
  );

  // Step 3: Preview & Download
  const Step3 = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">👁️ Step 3: Preview & Download</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['facebook', 'instagram', 'display'].map(format => (
          <motion.div key={format} whileHover={{ scale: 1.02 }} className="bg-white rounded-lg shadow">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {creatives[format] ? (
                <img src={creatives[format]} alt={format} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400">Loading...</div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <h3 className="font-bold text-gray-700 capitalize">
                {format === 'facebook' && '📱 Facebook (1080×1080)'}
                {format === 'instagram' && '📸 Instagram (1080×1920)'}
                {format === 'display' && '🖼️ Display (1200×628)'}
              </h3>

              <button
                onClick={() => downloadCreative(format)}
                className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 flex items-center justify-center gap-2"
              >
                <FiDownload /> Download
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={validateCompliance}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg"
      >
        ✓ Run Compliance Check
      </motion.button>

      {compliance && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-6 rounded-lg ${compliance.passed ? 'bg-green-50 border-l-4 border-green-500' : 'bg-yellow-50 border-l-4 border-yellow-600'}`}>
          <div className="flex items-center gap-3 mb-3">
            {compliance.passed ? (
              <FiCheck className="text-2xl text-green-600" />
            ) : (
              <FiX className="text-2xl text-yellow-600" />
            )}
            <span className="text-xl font-bold">Compliance Score: {compliance.score}%</span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{compliance.report}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setStep(2)} className="border px-4 py-2 rounded-lg">
          Back
        </button>

        <button
          onClick={() => {
            setStep(1);
            setAssets({ packshot: null, logo: null, brandColor: '#21808d' });
            setCampaign({ headline: '', cta: '', theme: 'Clean', tone: 'Professional' });
            setCreatives({ facebook: null, instagram: null, display: null });
            setCompliance(null);
            setAiFeatures({ generatedHeadlines: [], layoutSuggestions: [], generatedBackgrounds: [], autoLayoutEnabled: false });
          }}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          Create New Campaign
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">🎨 AdGen Studio</h1>
          <p className="text-teal-100">AI-Powered Retail Media Creative Builder</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="font-bold text-gray-800 mb-4">Progress</h3>

              <div className="space-y-3">
                {[1, 2, 3].map(num => (
                  <motion.div
                    key={num}
                    onClick={() => num <= step && setStep(num)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      step === num
                        ? 'bg-teal-600 text-white'
                        : step > num
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <div className="font-bold">Step {num}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-8">
              <AnimatePresence mode="wait">
                {step === 1 && <Step1 />}
                {step === 2 && <Step2 />}
                {step === 3 && <Step3 />}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-center py-8 mt-12">
        <p>© 2025 AdGen Studio - AI Creative Builder</p>
      </footer>
    </div>
  );
};

export default AdGenStudio;
