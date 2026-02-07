import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface VehicleImageUploadProps {
  vehicleId: number;
  imageType: "exterior" | "interior";
  onUploadComplete?: () => void;
}

export function VehicleImageUpload({ vehicleId, imageType, onUploadComplete }: VehicleImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const addImageMutation = trpc.fleet.addImage.useMutation({
    onSuccess: () => {
      utils.fleet.getImages.invalidate({ vehicleId });
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      onUploadComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      await uploadImages(imageFiles);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload image files only",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadImages(files);
    }
  };

  const uploadImages = async (files: File[]) => {
    setUploading(true);

    try {
      for (const file of files) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 5MB limit`,
            variant: "destructive",
          });
          continue;
        }

        // Convert to base64 for upload
        const base64 = await fileToBase64(file);
        
        // Upload to S3 via backend
        const response = await fetch("/api/upload-vehicle-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64,
            fileName: file.name,
            vehicleId,
            imageType,
          }),
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const { url } = await response.json();

        // Save image URL to database
        await addImageMutation.mutateAsync({
          vehicleId,
          imageUrl: url,
          imageType,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload one or more images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <Card
      className={`p-6 border-2 border-dashed transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        {uploading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading images...</p>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                Upload {imageType === "exterior" ? "Exterior" : "Interior"} Photos
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop images here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max file size: 5MB per image
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Select Images
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

interface VehicleImageGalleryProps {
  vehicleId: number;
  imageType?: "exterior" | "interior";
}

export function VehicleImageGallery({ vehicleId, imageType }: VehicleImageGalleryProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: images, isLoading } = imageType
    ? trpc.fleet.getImagesByType.useQuery({ vehicleId, imageType })
    : trpc.fleet.getImages.useQuery({ vehicleId });

  const deleteImageMutation = trpc.fleet.deleteImage.useMutation({
    onSuccess: () => {
      utils.fleet.getImages.invalidate({ vehicleId });
      if (imageType) {
        utils.fleet.getImagesByType.invalidate({ vehicleId, imageType });
      }
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (imageId: number) => {
    if (confirm("Are you sure you want to delete this image?")) {
      await deleteImageMutation.mutateAsync({ imageId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <div key={image.id} className="relative group">
          <img
            src={image.imageUrl}
            alt={`Vehicle ${image.imageType}`}
            className="w-full h-48 object-cover rounded-lg border border-border"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDelete(image.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
