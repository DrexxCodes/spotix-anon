// Function to upload an image to Cloudinary
export const uploadToCloudinary = async (
  file: File,
  fileName: string,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Get Cloudinary credentials from environment variables
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      reject(new Error("Cloudinary configuration is missing. Please check your environment variables."))
      return
    }

    // Create a FormData object to send the file
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)
    formData.append("folder", "spotix-anonymous")
    formData.append("public_id", fileName)

    // Create an XMLHttpRequest to track upload progress
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true)

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    }

    // Handle response
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText)
        resolve(response.secure_url)
      } else {
        reject(new Error("Upload failed. Please try again."))
      }
    }

    // Handle errors
    xhr.onerror = () => {
      reject(new Error("Upload failed. Please check your connection and try again."))
    }

    // Send the request
    xhr.send(formData)
  })
}
