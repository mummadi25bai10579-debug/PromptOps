/**
 * Backblaze B2 Storage Integration Service
 * Interfaces with Express backend S3/B2 routes (/api/media/*)
 */

export interface B2UploadResponse {
  fileId: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export const backblazeService = {
  /**
   * Uploads a File object to Backblaze B2 via backend /api/media/upload
   */
  async uploadFile(file: File): Promise<B2UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.details || `Failed to upload file to Backblaze B2 (${res.status})`);
    }

    return await res.json();
  },

  /**
   * Deletes a file from Backblaze B2 bucket by fileId / key
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!fileId) return;
    try {
      const res = await fetch(`/api/media/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        console.warn(`Failed to delete B2 file ${fileId}: status ${res.status}`);
      }
    } catch (err) {
      console.error('Error calling B2 delete endpoint:', err);
    }
  },

  /**
   * Trigger browser download for a media file URL
   */
  async downloadFile(url: string, fileName: string): Promise<void> {
    if (!url) return;
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'promptops-asset';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: open in new window
      window.open(url, '_blank');
    }
  }
};
