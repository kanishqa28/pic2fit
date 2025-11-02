import { useState, useRef } from 'react';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary } from '../lib/cloudinary';
import { supabase, getSessionId } from '../lib/supabase';
import { Garment } from '../lib/types';
import RecommendationsPanel from './RecommendationsPanel';

interface VirtualTryOnProps {}

export default function VirtualTryOn({}: VirtualTryOnProps) {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [uploadingUser, setUploadingUser] = useState(false);
  const [uploadingGarment, setUploadingGarment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  const handleUserImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUserImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGarmentImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingGarment(true);
    try {
      const garmentUrl = await uploadToCloudinary(file);
      const tempGarment: Garment = {
        id: crypto.randomUUID(),
        name: 'Custom Garment',
        category: 'custom',
        image_url: garmentUrl,
        description: 'User uploaded garment',
        tags: [],
        created_at: new Date().toISOString(),
      };
      setSelectedGarment(tempGarment);
    } catch (error) {
      console.error('Error uploading garment:', error);
      alert('Failed to upload garment image. Please try again.');
    } finally {
      setUploadingGarment(false);
    }
  };

  const handleTryOn = async () => {
    if (!userImage || !selectedGarment) {
      alert('Please select both your photo and a garment');
      return;
    }

    setIsProcessing(true);
    setResultImage(null);

    try {
      setUploadingUser(true);
      const userImageUrl = await uploadToCloudinary(userImage);
      setUploadingUser(false);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/virtual-tryon`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userImageUrl,
          garmentImageUrl: selectedGarment.image_url,
        }),
      });

      if (!response.ok) {
        throw new Error('Virtual try-on failed');
      }

      const data = await response.json();
      setResultImage(data.output);

      const sessionId = getSessionId();
      await supabase.from('tryon_history').insert({
        user_image_url: userImageUrl,
        garment_id: selectedGarment.id,
        result_image_url: data.output,
        session_id: sessionId,
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process virtual try-on. Please check your API configuration and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Photo</h3>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
          >
            {userImagePreview ? (
              <img
                src={userImagePreview}
                alt="User preview"
                className="max-h-64 mx-auto rounded-lg"
              />
            ) : (
              <div className="space-y-3">
                <Upload className="w-12 h-12 mx-auto text-slate-400" />
                <p className="text-slate-600">Click to upload your photo</p>
                <p className="text-sm text-slate-500">JPG, PNG up to 10MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUserImageSelect}
            className="hidden"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Garment</h3>
          <div
            onClick={() => garmentInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
          >
            {uploadingGarment ? (
              <div className="space-y-3">
                <Loader2 className="w-12 h-12 mx-auto text-slate-400 animate-spin" />
                <p className="text-slate-600">Uploading garment...</p>
              </div>
            ) : selectedGarment ? (
              <div className="space-y-3">
                <img
                  src={selectedGarment.image_url}
                  alt={selectedGarment.name}
                  className="max-h-64 mx-auto rounded-lg"
                />
                <p className="text-slate-700 font-medium">{selectedGarment.name}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <ImageIcon className="w-12 h-12 mx-auto text-slate-400" />
                <p className="text-slate-600">Click to upload garment or select from catalog</p>
                <p className="text-sm text-slate-500">JPG, PNG up to 10MB</p>
              </div>
            )}
          </div>
          <input
            ref={garmentInputRef}
            type="file"
            accept="image/*"
            onChange={handleGarmentImageSelect}
            className="hidden"
          />
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleTryOn}
          disabled={!userImage || !selectedGarment || isProcessing || uploadingUser || uploadingGarment}
          className="px-8 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors inline-flex items-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>Try On Virtual</span>
          )}
        </button>
      </div>

      {resultImage && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Virtual Try-On Result</h3>
            <img
              src={resultImage}
              alt="Try-on result"
              className="max-w-full mx-auto rounded-lg shadow-md"
            />
          </div>

          {selectedGarment && <RecommendationsPanel garmentId={selectedGarment.id} onSelectGarment={setSelectedGarment} />}
        </div>
      )}
    </div>
  );
}
