import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createHash, HmacSha256 } from 'https://deno.land/std@0.177.0/hash/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate AWS v4 signature for presigned URL
function generatePresignedUrl(
  accountId: string,
  bucketName: string,
  accessKeyId: string,
  secretAccessKey: string,
  objectKey: string,
  expiresIn: number = 600
): string {
  const region = 'auto';
  const service = 's3';
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucketName}/${objectKey}`;
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  
  // Create canonical request
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': algorithm,
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': expiresIn.toString(),
    'X-Amz-SignedHeaders': 'host',
  });
  
  const canonicalRequest = [
    'PUT',
    `/${bucketName}/${objectKey}`,
    queryParams.toString(),
    `host:${host}`,
    '',
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');
  
  // Create string to sign
  const encoder = new TextEncoder();
  const hash = createHash('sha256');
  hash.update(encoder.encode(canonicalRequest));
  const canonicalRequestHash = hash.toString();
  
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');
  
  // Calculate signature
  const kDate = new HmacSha256(encoder.encode('AWS4' + secretAccessKey)).update(dateStamp).arrayBuffer();
  const kRegion = new HmacSha256(new Uint8Array(kDate)).update(region).arrayBuffer();
  const kService = new HmacSha256(new Uint8Array(kRegion)).update(service).arrayBuffer();
  const kSigning = new HmacSha256(new Uint8Array(kService)).update('aws4_request').arrayBuffer();
  const signature = new HmacSha256(new Uint8Array(kSigning)).update(stringToSign).hex();
  
  queryParams.set('X-Amz-Signature', signature);
  
  return `${endpoint}?${queryParams.toString()}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME') || 'social-pwa-storage';
    const publicUrl = Deno.env.get('R2_PUBLIC_URL');

    if (!accountId || !accessKeyId || !secretAccessKey || !publicUrl) {
      throw new Error('R2 credentials not configured');
    }

    // Parse request body
    const { fileName, fileType, folder = 'uploads' } = await req.json();

    if (!fileName) {
      throw new Error('fileName is required');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${timestamp}-${randomStr}.${fileExtension}`;

    // Generate presigned URL (valid for 10 minutes)
    const presignedUrl = generatePresignedUrl(
      accountId,
      bucketName,
      accessKeyId,
      secretAccessKey,
      uniqueFileName,
      600
    );

    // Generate public URL
    const fileUrl = `${publicUrl}/${uniqueFileName}`;

    return new Response(
      JSON.stringify({
        success: true,
        presignedUrl: presignedUrl,
        publicUrl: fileUrl,
        fileName: uniqueFileName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating presigned URL:', error);
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
