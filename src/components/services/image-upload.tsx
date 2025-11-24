'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, Loader2, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  initialImageUrl?: string | null;
}

export function ImageUpload({ onUploadSuccess, initialImageUrl }: ImageUploadProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImageUrl || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Stop camera stream when component unmounts
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getCameraPermission = async () => {
    if (hasCameraPermission === false) {
        toast({
            variant: 'destructive',
            title: 'Câmera não disponível',
            description: 'Por favor, habilite o acesso à câmera nas configurações do seu navegador.',
        });
        return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      setIsCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Acesso à câmera negado',
        description: 'Por favor, habilite o acesso à câmera nas configurações do seu navegador.',
      });
    }
  };

  const turnOffCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOn(false);
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      turnOffCamera();
      uploadImage(dataUrl);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setCapturedImage(dataUrl);
        uploadImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (dataUrl: string) => {
    setUploading(true);
    const blob = await fetch(dataUrl).then(res => res.blob());
    const file = new File([blob], `service-${Date.now()}.jpg`, { type: 'image/jpeg' });

    try {
      const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        throw new Error('Falha no upload da imagem.');
      }

      const newBlob = await response.json();
      onUploadSuccess(newBlob.url);
      toast({
        title: 'Sucesso!',
        description: 'Imagem enviada.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro de Upload',
        description: (error as Error).message || 'Não foi possível enviar a imagem.',
      });
      // Rollback UI on failure
      setCapturedImage(initialImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setIsCameraOn(false);
    onUploadSuccess(''); // Notify parent that image is removed
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const retake = () => {
    setCapturedImage(null);
    getCameraPermission();
  }


  return (
    <div className="space-y-4">
      <div className="p-4 border-2 border-dashed rounded-lg text-center bg-card/80">
        {isCameraOn ? (
          <div className="space-y-4">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
            <div className="flex justify-center gap-2">
              <Button onClick={takePicture} disabled={uploading}>
                <Camera className="mr-2" />
                Tirar Foto
              </Button>
              <Button variant="outline" onClick={turnOffCamera}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : capturedImage ? (
          <div className="space-y-4 relative">
            <Image
              src={capturedImage}
              alt="Foto do serviço"
              width={400}
              height={300}
              className="rounded-md mx-auto object-cover"
            />
             {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
            )}
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={retake} disabled={uploading}>
                <RotateCcw className="mr-2" />
                Tirar Outra
              </Button>
              <Button variant="destructive" onClick={reset} disabled={uploading}>
                <X className="mr-2" />
                Remover
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 p-6">
             <p className="text-muted-foreground">Anexe uma foto do resultado do serviço.</p>
            <div className="flex gap-4">
              <Button onClick={getCameraPermission} disabled={uploading}>
                <Camera className="mr-2" />
                Usar Câmera
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="mr-2" />
                Enviar Arquivo
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
             {hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-4 text-left">
                  <Camera className="h-4 w-4" />
                  <AlertTitle>Câmera não encontrada ou bloqueada</AlertTitle>
                  <AlertDescription>
                    Não foi possível acessar sua câmera. Verifique as permissões no seu navegador.
                  </AlertDescription>
                </Alert>
            )}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
