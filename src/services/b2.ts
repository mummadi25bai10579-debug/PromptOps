/**
 * Backblaze B2 Service Integration
 * 
 * Note: In a production app, this would use the @backblaze/b2-sdk-node or AWS S3 SDK (since B2 is S3 compatible)
 * on a server-side route. Since this is a client-heavy application with Firebase, we would normally
 * proxy this through a Cloud Function or a custom backend to avoid exposing B2 credentials to the client.
 */

// import B2 from 'backblaze-b2';
// const b2 = new B2({
//   applicationKeyId: process.env.B2_APP_KEY_ID,
//   applicationKey: process.env.B2_APP_KEY
// });

export interface B2Asset {
  id: string;
  fileName: string;
  url: string;
  size: number;
  uploadTimestamp: number;
  type: string;
}

export const b2Service = {
  /**
   * Uploads an asset (image, video) to Backblaze B2
   * In a real implementation, this would either get a presigned URL from the backend
   * and upload directly, or send the file to the backend which then uploads to B2.
   */
  async uploadAsset(file: File, prefix: string = ''): Promise<B2Asset> {
    console.log(`[B2 Mock] Uploading ${file.name} to B2 bucket...`);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const id = Math.random().toString(36).substring(7);
    const fileName = `${prefix}${id}-${file.name}`;
    
    // Mock successful response
    return {
      id,
      fileName,
      url: `https://f000.backblazeb2.com/file/promptops-assets/${fileName}`,
      size: file.size,
      uploadTimestamp: Date.now(),
      type: file.type
    };
  },
  
  /**
   * Lists assets from a specific prefix in the B2 bucket
   */
  async listAssets(prefix: string = ''): Promise<B2Asset[]> {
    console.log(`[B2 Mock] Listing assets with prefix: ${prefix}`);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        id: '1',
        fileName: 'img-generated-1.jpg',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
        size: 1024 * 1024 * 2.5,
        uploadTimestamp: Date.now() - 1000 * 60 * 60,
        type: 'image/jpeg'
      }
    ];
  }
};
