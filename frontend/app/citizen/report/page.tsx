'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { reportsApi, aiApi, getErrorMessage } from '@/lib/api';
import { POLLUTION_CATEGORIES } from '@/lib/constants';
import TopNav from '@/components/layout/TopNav';
import { LoadingSpinner } from '@/components/ui/Badges';
import {
  Upload, MapPin, Brain, Send, X, Image as ImageIcon,
  AlertCircle, CheckCircle, Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Dynamically import map to avoid SSR issues
const MapPicker = dynamic(() => import('@/components/maps/MapPicker'), { ssr: false });

export default function NewReportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    address: '',
    latitude: '',
    longitude: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'analyzing' | 'done'>('form');
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleImage = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP or GIF images allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success('Location captured!');
      },
      () => toast.error('Could not get location. Please enter manually or click on the map.')
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    setForm((f) => ({
      ...f,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { toast.error('Please select a pollution category'); return; }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('category', form.category);
    if (form.address) fd.append('address', form.address);
    if (form.latitude) fd.append('latitude', form.latitude);
    if (form.longitude) fd.append('longitude', form.longitude);
    if (imageFile) fd.append('image', imageFile);

    try {
      const res = await reportsApi.create(fd);
      const reportId = res.data.id;
      setSubmittedId(reportId);
      setStep('analyzing');
      toast.success('Report submitted! AI is analyzing...');

      // Trigger AI analysis
      await aiApi.analyze(reportId);
      setStep('done');
      toast.success('AI analysis complete!');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (step === 'analyzing') {
    return (
      <div className="flex flex-col min-h-screen">
        <TopNav title="New Report" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
              <Brain className="w-10 h-10 text-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white">AI Analyzing Report...</h2>
            <p className="text-gray-400 text-sm">Identifying pollution type, severity, and recommended action</p>
            <LoadingSpinner size="md" />
          </div>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col min-h-screen">
        <TopNav title="New Report" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Report Submitted!</h2>
            <p className="text-gray-400 text-sm">AI analysis is complete. View your report for full details.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push(`/citizen/reports/${submittedId}`)}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
              >
                View Report & AI Analysis
              </button>
              <button
                onClick={() => { setStep('form'); setSubmitting(false); setForm({ title: '', description: '', category: '', address: '', latitude: '', longitude: '' }); setImageFile(null); setImagePreview(''); }}
                className="bg-gray-800 border border-gray-700 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-gray-700 transition-colors"
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="New Report" subtitle="Report urban pollution in your area" />
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">

          {/* Image Upload */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" /> Upload Photo
            </h3>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(''); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
              >
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP — Max 10MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
            />
          </div>

          {/* Report Details */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-white">Report Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
              <input
                id="report-title"
                required
                value={form.title}
                onChange={setField('title')}
                placeholder="e.g., Large garbage pile near park entrance"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Category *</label>
              <select
                id="report-category"
                required
                value={form.category}
                onChange={setField('category')}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              >
                <option value="">Select pollution type...</option>
                {POLLUTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description *</label>
              <textarea
                id="report-description"
                required
                rows={4}
                value={form.description}
                onChange={setField('description')}
                placeholder="Describe the pollution in detail — type, quantity, location specifics, any hazards..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">More detail → better AI analysis</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" /> Location
              </h3>
              <button
                type="button"
                onClick={handleLocation}
                className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors"
              >
                <Navigation className="w-3 h-3" /> Use My GPS
              </button>
            </div>

            {/* Lat/Lng inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={setField('latitude')}
                  placeholder="e.g., 28.6139"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={setField('longitude')}
                  placeholder="e.g., 77.2090"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Address / Landmark (optional)</label>
              <input
                value={form.address}
                onChange={setField('address')}
                placeholder="e.g., Near Gate 2, Central Park, Delhi"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Map picker */}
            <div className="rounded-xl overflow-hidden border border-gray-700" style={{ height: 280 }}>
              <MapPicker
                lat={form.latitude ? parseFloat(form.latitude) : undefined}
                lng={form.longitude ? parseFloat(form.longitude) : undefined}
                onMapClick={handleMapClick}
              />
            </div>
            <p className="text-xs text-gray-500">Click on the map to pin the pollution location</p>
          </div>

          {/* AI note */}
          <div className="flex items-start gap-3 px-4 py-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
            <Brain className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-cyan-300">
              After submission, AI will automatically analyze your report — identifying pollution type, severity level, and recommended municipal action.
            </p>
          </div>

          <button
            id="report-submit"
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {submitting ? <LoadingSpinner size="sm" /> : <><Send className="w-4 h-4" /> Submit Report</>}
          </button>
        </form>
      </div>
    </div>
  );
}
