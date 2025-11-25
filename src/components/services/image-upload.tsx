'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, Loader2, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface ImageUploadProps {
  onImageChange: (dataUrl: string | null) => void;
  initialImageUrl?: string | null;
  isSubmitting: boolean;
}

export function ImageUpload({ onImageChange, initialImageUrl, isSubmitting }: ImageUploadProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImageUrl || null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup function to stop camera stream when component unmounts or camera is turned off
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  useEffect(() => {
    onImageChange(capturedImage);
  }, [capturedImage, onImageChange]);

  const getCameraPermission = async () => {
    if (isCameraOn) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      setIsCameraOn(true);
      setStream(stream);
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
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOn(false);
    setStream(null);
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      
      if (video.readyState < video.HAVE_CURRENT_DATA) {
        toast({ variant: 'destructive', title: 'Câmera não pronta', description: 'Aguarde um momento e tente novamente.' });
        return;
      }

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      turnOffCamera();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setCapturedImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    turnOffCamera();
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
              <Button type="button" onClick={takePicture}>
                <Camera className="mr-2" />
                Tirar Foto
              </Button>
              <Button type="button" variant="outline" onClick={turnOffCamera}>
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
             {isSubmitting && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                    <span className="text-white ml-2">Enviando...</span>
                </div>
            )}
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={retake} disabled={isSubmitting}>
                <RotateCcw className="mr-2" />
                Tirar Outra
              </Button>
              <Button type="button" variant="destructive" onClick={reset} disabled={isSubmitting}>
                <X className="mr-2" />
                Remover
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 p-6">
             <p className="text-muted-foreground">Anexe uma foto do resultado do serviço.</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button type="button" onClick={getCameraPermission} disabled={isSubmitting} className="w-full">
                <Camera className="mr-2" />
                Usar Câmera
              </Button>
              <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting} className="w-full">
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
