//file path: src/app/services/uploadApi.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export type UploadType = 'logo' | 'product' | 'document'

export interface UploadResponse {
  success: boolean
  url: string
  filename: string
  uploadType: string
}

export interface BulkUploadResponse {
  success: boolean
  totalFiles: number
  successCount: number
  results: Array<{
    success: boolean
    url?: string
    filename?: string
    originalName: string
    error?: string
  }>
}

export class UploadAPI {
  /**
   * Upload a logo image (max 2MB)
   */
  static async uploadLogo(file: File): Promise<UploadResponse> {
    return this.uploadFile(file, 'logo', 'logo')
  }

  /**
   * Upload a product image (max 5MB)
   */
  static async uploadProductImage(file: File): Promise<UploadResponse> {
    return this.uploadFile(file, 'product', 'image')
  }

  /**
   * Upload multiple product images (max 10 files, 5MB each)
   */
  static async uploadProductImagesBulk(files: File[]): Promise<BulkUploadResponse> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images', file)
    })

    const response = await fetch(`${API_BASE}/upload/product/bulk`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload images')
    }

    return response.json()
  }

  /**
   * Upload a document (PDF, CSV - max 10MB)
   */
  static async uploadDocument(file: File): Promise<UploadResponse> {
    return this.uploadFile(file, 'document', 'document')
  }

  /**
   * Delete a file
   */
  static async deleteFile(filename: string, uploadType: 'logos' | 'products' | 'documents'): Promise<void> {
    const response = await fetch(`${API_BASE}/upload/file`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        uploadType
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete file')
    }
  }

  /**
   * Get account storage statistics
   */
  static async getAccountStats(): Promise<any> {
    const response = await fetch(`${API_BASE}/upload/account-stats`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get account stats')
    }

    return response.json()
  }

  /**
   * Private helper method to upload a single file
   */
  private static async uploadFile(
    file: File,
    uploadType: UploadType,
    fieldName: string
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append(fieldName, file)

    const response = await fetch(`${API_BASE}/upload/${uploadType}`, {
      method: 'POST',
      credentials: 'include',
      body: formData // Don't set Content-Type - browser will set it with boundary
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to upload ${uploadType}`)
    }

    return response.json()
  }
}
