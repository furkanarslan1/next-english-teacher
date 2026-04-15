import cloudinary from "./client";

type UploadResult = {
  url: string;
  publicId: string;
};

export async function uploadToCloudinary(
  file: File,
  folder: string = "next-english-teacher",
  maxWidth: number = 800,
): Promise<UploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          transformation: [
            { width: maxWidth, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error);
          const deliveryUrl = result.secure_url.replace(
            "/upload/",
            "/upload/f_auto,q_auto/",
          );
          resolve({ url: deliveryUrl, publicId: result.public_id });
        },
      )
      .end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
