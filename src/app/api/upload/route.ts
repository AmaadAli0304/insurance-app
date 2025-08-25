
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

async function uploadFileToS3(file: Buffer, fileName: string, contentType: string): Promise<string> {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: `${Date.now()}-${fileName}`,
        Body: file,
        ContentType: contentType,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: "File is required." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadFileToS3(buffer, file.name, file.type);

        return NextResponse.json({ success: true, url });

    } catch (error) {
        console.error("Upload API error:", error);
        return NextResponse.json({ error: "Error uploading file." }, { status: 500 });
    }
}
