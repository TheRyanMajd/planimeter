import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3Client({
  region: "us-east-1", // your bucket region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = "planimetergenz";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileType = searchParams.get("fileType");

  const fileName = `${nanoid()}.jpg`; // you can use fileType to set .png etc

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    ContentType: fileType || "image/jpeg",
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 }); // 1 min expiry

  const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

  return NextResponse.json({ signedUrl, publicUrl });
}
