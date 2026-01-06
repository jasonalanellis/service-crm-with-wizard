import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, X, Loader2, Image } from 'lucide-react';

interface JobPhotosProps {
  appointmentId: string;
  readOnly?: boolean;
}

interface Photo {
  id: string;
  photo_url: string;
  photo_type: 'before' | 'after';
  caption: string;
  created_at: string;
}

export default function JobPhotos({ appointmentId, readOnly = false }: JobPhotosProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [appointmentId]);

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from('job_photos')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at');
    setPhotos(data || []);
    setLoading(false);
  };

  const handleUpload = async (type: 'before' | 'after', file: File) => {
    setUploading(true);
    
    // Upload to storage
    const fileName = `${appointmentId}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('job-photos').getPublicUrl(fileName);

    // Save to database
    await supabase.from('job_photos').insert({
      appointment_id: appointmentId,
      photo_url: publicUrl,
      photo_type: type,
    });

    fetchPhotos();
    setUploading(false);
  };

  const deletePhoto = async (id: string) => {
    await supabase.from('job_photos').delete().eq('id', id);
    fetchPhotos();
  };

  const beforePhotos = photos.filter(p => p.photo_type === 'before');
  const afterPhotos = photos.filter(p => p.photo_type === 'after');

  if (loading) {
    return <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Before Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-700">Before Photos</h4>
          {!readOnly && (
            <label className="flex items-center gap-1 text-sm text-blue-600 cursor-pointer hover:text-blue-700">
              <Camera size={16} />
              Add Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload('before', e.target.files[0])}
              />
            </label>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {beforePhotos.length === 0 ? (
            <div className="col-span-3 bg-gray-50 rounded-lg p-4 text-center text-gray-400 text-sm">
              <Image className="mx-auto mb-1" size={24} />
              No before photos
            </div>
          ) : (
            beforePhotos.map(photo => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.photo_url}
                  alt="Before"
                  className="w-full h-24 object-cover rounded-lg"
                />
                {!readOnly && (
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* After Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-700">After Photos</h4>
          {!readOnly && (
            <label className="flex items-center gap-1 text-sm text-green-600 cursor-pointer hover:text-green-700">
              <Camera size={16} />
              Add Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload('after', e.target.files[0])}
              />
            </label>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {afterPhotos.length === 0 ? (
            <div className="col-span-3 bg-gray-50 rounded-lg p-4 text-center text-gray-400 text-sm">
              <Image className="mx-auto mb-1" size={24} />
              No after photos
            </div>
          ) : (
            afterPhotos.map(photo => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.photo_url}
                  alt="After"
                  className="w-full h-24 object-cover rounded-lg"
                />
                {!readOnly && (
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {uploading && (
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="animate-spin" size={18} />
          Uploading...
        </div>
      )}
    </div>
  );
}
