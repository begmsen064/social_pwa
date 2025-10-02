import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3Client } from 'https://deno.land/x/s3_lite_client@0.5.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables (set in Supabase Dashboard)
    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME') || 'social-pwa-storage';
    const publicUrl = Deno.env.get('R2_PUBLIC_URL');

    if (!accountId || !accessKeyId || !secretAccessKey || !publicUrl) {
      throw new Error('R2 credentials not configured');
    }

    // Parse request body
    const { file, fileName, fileType, folder = 'uploads' } = await req.json();

    if (!file || !fileName) {
      throw new Error('File and fileName are required');
    }

    // Convert base64 to Uint8Array
    const base64Data = file.includes(',') ? file.split(',')[1] : file;
    const fileData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Initialize R2 client
    const s3Client = new S3Client({
      endPoint: `${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      accessKey: accessKeyId,
      secretKey: secretAccessKey,
      bucket: bucketName,
      useSSL: true,
    });

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${timestamp}-${randomStr}.${fileExtension}`;

    // Upload to R2
    await s3Client.putObject(uniqueFileName, fileData, {
      metadata: {
        'Content-Type': fileType || 'application/octet-stream',
      },
    });

    // Generate public URL
    const fileUrl = `${publicUrl}/${uniqueFileName}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: fileUrl,
        fileName: uniqueFileName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
