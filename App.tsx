import React, { useState, useCallback, useMemo } from 'react';
import { removeBackground } from './services/geminiService';
import { Spinner } from './components/Spinner';

// Helper components defined outside the main App component to prevent re-creation on every render.
const UploadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const DownloadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const processFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('الرجاء اختيار ملف صورة صالح.');
      return;
    }
    resetState(); // Reset previous state for the new file
    setOriginalFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!originalFile) {
      setError('الرجاء اختيار صورة أولاً.');
      return;
    }
    setIsLoading(true);
    setResultImageUrl(null);
    setError(null);
    try {
      const resultDataUrl = await removeBackground(originalFile);
      setResultImageUrl(resultDataUrl);
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء إزالة الخلفية. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [originalFile]);

  const resetState = () => {
    setOriginalFile(null);
    setOriginalImageUrl(null);
    setResultImageUrl(null);
    setIsLoading(false);
    setError(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleDownload = () => {
    if (!resultImageUrl) return;
    const link = document.createElement('a');
    link.href = resultImageUrl;
    
    const name = originalFile?.name.split('.').slice(0, -1).join('.') || 'image';
    link.download = `${name}-no-bg.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const canSubmit = useMemo(() => originalFile && !isLoading, [originalFile, isLoading]);
  const canDownload = useMemo(() => resultImageUrl && !isLoading, [resultImageUrl, isLoading]);
  
  return (
    <div className="h-[100dvh] bg-gray-900 text-gray-100 flex flex-col font-sans select-none touch-manipulation">
      <header className="w-full max-w-2xl mx-auto text-center p-4 flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          مزيل الخلفية بالذكاء الاصطناعي
        </h1>
      </header>

      <main className="w-full max-w-2xl mx-auto flex-grow overflow-y-auto p-4 space-y-6">
        {!originalImageUrl ? (
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className="h-full flex flex-col justify-center">
            <label htmlFor="file-upload" className={`cursor-pointer w-full flex-grow min-h-[300px] flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 border-dashed transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-600 hover:border-indigo-500 hover:bg-gray-800/50'}`}>
              <UploadIcon className="w-16 h-16 mb-4 text-gray-500" />
              <span className="font-semibold text-lg text-gray-300">ارفع صورة</span>
              <span className="text-sm mt-1 text-gray-400">أو اسحبها وأفلتها هنا</span>
              <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2 px-1">الأصلية</h3>
              <div className="bg-gray-800/50 rounded-xl p-2">
                <img src={originalImageUrl} alt="Original" className="object-contain w-full h-auto max-h-64 rounded-lg" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2 px-1">النتيجة</h3>
              <div className="relative w-full min-h-[250px] flex items-center justify-center transparent-bg rounded-xl overflow-hidden p-2">
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-10">
                    <Spinner />
                    <p className="mt-4 text-gray-300 animate-pulse">جاري المعالجة...</p>
                  </div>
                )}
                {resultImageUrl ? (
                  <img src={resultImageUrl} alt="Result" className="object-contain max-w-full max-h-full" />
                ) : !isLoading && (
                  <div className="text-center text-gray-500">
                    <p>ستظهر الصورة المعالجة هنا</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative text-center" role="alert">
                <span className="block sm:inline">{error}</span>
            </div>
        )}
      </main>

      {originalFile && (
        <footer className="w-full bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-4 flex-shrink-0 z-10">
          <div className="max-w-2xl mx-auto">
            {!resultImageUrl ? (
              <div className="flex items-center gap-4">
                <button onClick={resetState} className="p-3 font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50" aria-label="البدء من جديد">
                  <TrashIcon className="w-6 h-6" />
                </button>
                <button onClick={handleSubmit} disabled={!canSubmit} className="w-full px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {isLoading ? '...جاري المعالجة' : 'إزالة الخلفية'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={resetState} className="px-5 py-3 font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 bg-gray-600 text-white hover:bg-gray-500">
                  <TrashIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">البدء من جديد</span>
                </button>
                <button onClick={handleDownload} disabled={!canDownload} className="w-full px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50 bg-green-600 text-white hover:bg-green-500">
                  <DownloadIcon className="w-5 h-5" />
                  تحميل
                </button>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
